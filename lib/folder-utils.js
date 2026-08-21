// dsh-session-folders host half: pure validation/normalization helpers,
// extracted verbatim from lib/index.js so they can be unit-tested without
// booting a cordis context. No behavior change; no dependency beyond node's
// Buffer.

/** Maximum folder name length after trimming (client mirrors this cap). */
const MAX_FOLDER_NAME_LENGTH = 80;

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
 * Exact-id-set validation for the reorder routes: the submitted list must
 * contain every allowed id exactly once and nothing else (a Set-based
 * dedupe; no comma-operator side effects inside a predicate).
 * @param ids - submitted id list.
 * @param allowed - the exact id set the client must submit.
 * @returns true when ids is a permutation of allowed without repeats.
 */
function isExactIdSet(ids, allowed) {
	if (ids.length !== allowed.size) return false;
	const seen = new Set();
	for (const id of ids) {
		if (!allowed.has(id) || seen.has(id)) return false;
		seen.add(id);
	}
	return true;
}

/** Title limits mirroring dsh-session-title's maxTitleBytes (80). */
const AUTO_TITLE_MAX_BYTES = 80;

/** Strip terminal/control noise, collapse whitespace, cap to the byte budget. */
const normalizeAutoTitle = (input) => {
	const cleaned = input
		.replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)?/g, "")
		.replace(/[\u0000-\u001F\u007F-\u009F\u200B\uFEFF]/g, "")
		.replace(/\s+/g, " ").trim();
	if (Buffer.byteLength(cleaned, "utf8") <= AUTO_TITLE_MAX_BYTES) return cleaned;
	let used = 0;
	let out = "";
	for (const character of cleaned) {
		const bytes = Buffer.byteLength(character, "utf8");
		if (used + bytes > AUTO_TITLE_MAX_BYTES) break;
		out += character;
		used += bytes;
	}
	return out;
};

export { hasNameConflict, isExactIdSet, normalizeAutoTitle, parseFolderName };
