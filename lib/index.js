// dsh-session-folders host half: a Cordis plug-in that persists feature
// folders (one level of named folders per workspace) in its own storage
// domain and serves the folder CRUD/move API to the web client over the
// dsh webServer. The workspace registry owns the durable workspace/session
// accounting; we hold only folder records and read the registry for every
// validation (workspace existence, session membership).
//
// Wire contract: requests and responses are JSON. Success payloads are
// route-specific ({ folders }, { id }, { ok: true }); failures always have
// the shape { error: <code> } with a non-2xx status. Routes are same-origin
// and unauthenticated (dsh-session-manager precedent), so every input is
// validated server-side.

import { defineDomain } from "@deepseek-ai/dsh-storage-domain";
import { z } from "zod";
import { randomUUID } from "node:crypto";

/** Plug-in identity used by the cordis loader. */
const name = "dsh-session-folders";
/**
* Host services this plug-in consumes. Note: 'logger' is NOT a service —
* ctx.logger is a built-in Context property and must never be injected;
* only these three real services are needed.
*/
const inject = ["webServer", "storageDomain", "workspaceRegistry"];

/** Route prefix; all routes live under it (duplicate (kind, path) registrations throw). */
const ROUTE_PREFIX = "/dsh-session-folders";
/** Cap on request body size, mirroring the dsh-session-manager wire discipline. */
const MAX_BODY_BYTES = 65536;
/** Maximum folder name length after trimming (client mirrors this cap). */
const MAX_FOLDER_NAME_LENGTH = 80;
/** Session ids arrive as bare UUIDs or with the 'session-' prefix. */
const SESSION_ID_RE = /^(session-)?[0-9a-fA-F-]+$/;
/** Folder ids are always server-issued UUIDs. */
const FOLDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const folderSchema = z.object({
	id: z.string(),
	workspaceId: z.string(),
	name: z.string(),
	sessionIds: z.array(z.string())
});

/**
* The plug-in's own storage domain: one global record holding every folder.
* Orphaned folder records (workspace deleted) are filtered at list time —
* there is no workspace-delete hook, so records are never proactively
* removed; they simply stop being served. Sessions are never stored here:
* membership rides the folder records only, and a session not listed in any
* folder is loose by definition.
*/
const foldersDomainSpec = defineDomain({
	name: "dsh_session_folders",
	version: 1,
	global: {
		schema: z.object({
			folders: z.array(folderSchema)
		}),
		initial: { folders: [] }
	},
	tables: {}
});

/** Accumulate the raw request body with a size guard. */
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
			if (data.length > MAX_BODY_BYTES) {
				req.destroy();
				reject(new Error("request body too large"));
			}
		});
		req.on("end", () => {
			if (data.length === 0) return resolve({});
			try {
				resolve(JSON.parse(data));
			} catch {
				reject(new Error("invalid JSON body"));
			}
		});
		req.on("error", reject);
	});
}

/** Write a JSON response with an explicit content-length. */
function respond(res, status, payload) {
	const body = JSON.stringify(payload);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": Buffer.byteLength(body)
	});
	res.end(body);
}

/**
* Normalize and validate a folder display name.
* @param body - parsed request.
* @returns the trimmed name, or undefined when invalid/missing.
*/
function parseFolderName(body) {
	const raw = body?.name;
	if (typeof raw !== "string") return void 0;
	const trimmed = raw.trim();
	if (trimmed.length === 0 || trimmed.length > MAX_FOLDER_NAME_LENGTH) return void 0;
	return trimmed;
}

/**
* Case-insensitive duplicate check within one workspace (the client enforces
* the same rule, the server is authoritative).
* @param folders - all stored folder records.
* @param workspaceId - owning workspace.
* @param name - already-trimmed candidate name.
* @param exceptId - folder record to exclude from the comparison (rename of itself).
* @returns true when another folder of the workspace already uses that name.
*/
function hasNameConflict(folders, workspaceId, name, exceptId) {
	const needle = name.toLowerCase();
	return folders.some((folder) =>
		folder.workspaceId === workspaceId &&
		folder.id !== exceptId &&
		folder.name.toLowerCase() === needle
	);
}

/**
* Resolve the workspace entity that currently owns a session, using the
* registry's canonical-cwd-filtered sessionIds view. A session whose path no
* longer canonicalizes to its workspace is unaccounted (lives in the
* Ungrouped bucket) — moving it into a folder is impossible by contract.
* @param ctx - cordis context (workspaceRegistry service).
* @param sessionId - session to look up.
* @returns the owning workspace entity, or undefined when unaccounted.
*/
function owningWorkspace(ctx, sessionId) {
	return ctx.workspaceRegistry.list().find((workspace) => workspace.sessionIds.includes(sessionId));
}

/** Cordis plug-in entry: open the domain, register the five routes. */
function apply(ctx) {
	return ctx.storageDomain.open(foldersDomainSpec).then((foldersDomain) => {
		const getFolders = () => foldersDomain.global.get().folders;
		/**
		* Persist a new folder record set. The domain's write chain guarantees
		* durability-first ordering per write; the in-process tail below
		* additionally serializes the read-modify-write of the shared global
		* record across routes, so two browsers cannot lose each other's write.
		*/
		const setFolders = (folders) => foldersDomain.global.set({ folders });
		/** Serialize every folder mutation through one promise tail (F-04). */
		let mutationTail = Promise.resolve();
		const withMutationLock = (operation) => {
			const result = mutationTail.then(operation, operation);
			mutationTail = result.then(() => void 0, () => void 0);
			return result;
		};
		const ws = ctx.webServer;
		/** Serve one POST route: JSON body in, JSON response out, uniform error shape. */
		const route = (path, handler) => {
			ws.register({
				kind: "exact",
				path: ROUTE_PREFIX + "/" + path,
				handler: async (req, res) => {
					if (req.method !== "POST") return respond(res, 405, { error: "method-not-allowed" });
					try {
						const body = await readJsonBody(req);
						await handler(body, res);
					} catch (error) {
						ctx.logger.warn("[dsh-session-folders] route failed:", error);
						respond(res, 400, { error: "bad-request" });
					}
				}
			});
		};

		route("list", async (body, res) => {
			const alive = new Set(ctx.workspaceRegistry.list().map((workspace) => workspace.id));
			respond(res, 200, {
				folders: getFolders().filter((folder) => alive.has(folder.workspaceId))
			});
		});

		route("create", async (body, res) => {
			const workspaceId = body?.workspaceId;
			const folderName = parseFolderName(body);
			if (typeof workspaceId !== "string" || workspaceId.length === 0 || folderName === void 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			if (!ctx.workspaceRegistry.list().some((workspace) => workspace.id === workspaceId)) {
				return respond(res, 404, { error: "workspace-not-found" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				if (hasNameConflict(folders, workspaceId, folderName)) {
					return respond(res, 409, { error: "name-conflict" });
				}
				let id;
				do {
					id = randomUUID();
				} while (folders.some((folder) => folder.id === id));
				await setFolders([...folders, { id, workspaceId, name: folderName, sessionIds: [] }]);
				respond(res, 200, { id });
			});
		});

		route("rename", async (body, res) => {
			const folderId = body?.folderId;
			const folderName = parseFolderName(body);
			if (typeof folderId !== "string" || folderId.length === 0 || folderName === void 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				const folder = folders.find((candidate) => candidate.id === folderId);
				if (folder === void 0) return respond(res, 404, { error: "folder-not-found" });
				if (hasNameConflict(folders, folder.workspaceId, folderName, folderId)) {
					return respond(res, 409, { error: "name-conflict" });
				}
				await setFolders(folders.map((candidate) =>
					candidate.id === folderId ? { ...candidate, name: folderName } : candidate
				));
				respond(res, 200, { ok: true });
			});
		});

		route("delete", async (body, res) => {
			const folderId = body?.folderId;
			if (typeof folderId !== "string" || folderId.length === 0) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				if (!folders.some((folder) => folder.id === folderId)) {
					return respond(res, 404, { error: "folder-not-found" });
				}
				// Drop the record: its sessions become loose in that workspace.
				await setFolders(folders.filter((folder) => folder.id !== folderId));
				respond(res, 200, { ok: true });
			});
		});

		route("move", async (body, res) => {
			// Session ids are canonical in the "session-<uuid>" form: the
			// workspace registry keys sessions by the full prefixed id. Use the
			// id exactly as sent — any normalization would break membership.
			const sessionId = body?.sessionId;
			const folderId = body?.folderId;
			if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
				return respond(res, 400, { error: "bad-request" });
			}
			if (folderId !== null && (typeof folderId !== "string" || !FOLDER_ID_RE.test(folderId))) {
				return respond(res, 400, { error: "bad-request" });
			}
			return withMutationLock(async () => {
				const folders = getFolders();
				// The session is always removed from every folder first; the
				// inbox target (folderId null) is just that removal.
				const without = folders.map((folder) => folder.sessionIds.includes(sessionId)
					? { ...folder, sessionIds: folder.sessionIds.filter((id) => id !== sessionId) }
					: folder
				);
				if (folderId === null) {
					await setFolders(without);
					return respond(res, 200, { ok: true });
				}
				const target = without.find((folder) => folder.id === folderId);
				if (target === void 0) return respond(res, 404, { error: "folder-not-found" });
				// Cross-workspace moves are impossible: the target folder must
				// be the workspace that currently owns the session. A session
				// outside every workspace (canonical-cwd strays) can never
				// match any folder's workspace.
				const owner = owningWorkspace(ctx, sessionId);
				if (owner === void 0 || owner.id !== target.workspaceId) {
					return respond(res, 409, { error: "session-not-in-workspace" });
				}
				await setFolders(without.map((folder) =>
					folder.id === folderId
						? { ...folder, sessionIds: [sessionId, ...folder.sessionIds] }
						: folder
				));
				respond(res, 200, { ok: true });
			});
		});

		// Dispose the domain when the fiber unloading closes it; the routes die
		// with the webServer registrations (fiber-scoped), so no extra cleanup.
		return () => foldersDomain.close();
	});
}

export { apply, inject, name };