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

/**
 * Normalize a stored parent pointer: undefined/null/self/missing-parent all
 * mean "root level". The self and missing-parent cases only occur with
 * damaged data; folding them into root keeps a broken pointer from hiding a
 * whole subtree (the client renders the same fallback).
 * @param folders - all folder records of one workspace.
 * @param parentId - raw parent pointer.
 * @returns the effective parent id, or null for root.
 */
function effectiveParentId(folders, parentId) {
	if (typeof parentId !== "string" || parentId.length === 0) return null;
	return folders.some((folder) => folder.id === parentId) ? parentId : null;
}

/**
 * Every id in the subtree rooted at one folder, the root included. Iterative
 * with a visited set: a parentId cycle in damaged data must not hang the
 * delete route.
 * @param folders - all folder records of one workspace.
 * @param rootId - subtree root.
 * @returns the subtree id set.
 */
function collectSubtreeIds(folders, rootId) {
	const childrenOf = new Map();
	for (const folder of folders) {
		const parentId = effectiveParentId(folders, folder.parentId);
		if (parentId === null) continue;
		const bucket = childrenOf.get(parentId) ?? [];
		bucket.push(folder.id);
		childrenOf.set(parentId, bucket);
	}
	const seen = new Set();
	const stack = [rootId];
	while (stack.length > 0) {
		const id = stack.pop();
		if (seen.has(id)) continue;
		seen.add(id);
		for (const childId of childrenOf.get(id) ?? []) stack.push(childId);
	}
	return seen;
}

/**
 * Whether one folder sits strictly below another (used to reject moving a
 * folder into its own subtree, which would create a cycle the tree renderer
 * and the delete route would both have to defend against).
 * @param folders - all folder records of one workspace.
 * @param candidateId - folder to test.
 * @param ancestorId - presumed ancestor.
 * @returns true when candidateId is a strict descendant of ancestorId.
 */
function isDescendant(folders, candidateId, ancestorId) {
	if (candidateId === ancestorId) return false;
	const byId = new Map(folders.map((folder) => [folder.id, folder]));
	const seen = new Set();
	let cursor = candidateId;
	while (typeof cursor === "string" && cursor.length > 0) {
		if (seen.has(cursor)) return false;
		seen.add(cursor);
		const folder = byId.get(cursor);
		if (folder === undefined) return false;
		const parentId = effectiveParentId(folders, folder.parentId);
		if (parentId === null) return false;
		if (parentId === ancestorId) return true;
		cursor = parentId;
	}
	return false;
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

export { collectSubtreeIds, effectiveParentId, isDescendant, isExactIdSet, normalizeAutoTitle, parseFolderName };
