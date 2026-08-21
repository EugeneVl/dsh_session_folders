// Unit tests for the pure helpers of dsh-session-folders
// (lib/folder-utils.js). Run: npm test  (= node --test)

import test from "node:test";
import assert from "node:assert/strict";

import { hasNameConflict, isExactIdSet, normalizeAutoTitle, parseFolderName } from "../lib/folder-utils.js";

const folder = (id, workspaceId, name) => ({ id, workspaceId, name, sessionIds: [] });

test("isExactIdSet accepts a permutation without repeats", () => {
	assert.equal(isExactIdSet(["b", "c", "a"], new Set(["a", "b", "c"])), true);
});

test("isExactIdSet rejects duplicate ids", () => {
	assert.equal(isExactIdSet(["a", "a", "b"], new Set(["a", "b"])), false);
});

test("isExactIdSet rejects extra ids", () => {
	assert.equal(isExactIdSet(["a", "b", "x"], new Set(["a", "b"])), false);
});

test("isExactIdSet rejects missing ids", () => {
	assert.equal(isExactIdSet(["a"], new Set(["a", "b"])), false);
});

test("normalizeAutoTitle strips ANSI OSC sequences and control characters", () => {
	assert.equal(normalizeAutoTitle("\u001B]0;window title\u0007Fix bug"), "Fix bug");
	// Verbatim-helper quirk (pre-v0.4.1): an OSC terminated by ST instead of
	// BEL swallows the rest of the input — the greedy pattern has no reason
	// to stop. Documented here, not changed.
	assert.equal(normalizeAutoTitle("\u001B]8;;http://x\u001B\\Link"), "");
	assert.equal(normalizeAutoTitle("a\u0000b\u0007c\u001Fd"), "abcd");
});

test("normalizeAutoTitle collapses whitespace", () => {
	assert.equal(normalizeAutoTitle("  a \t\n b  "), "a b");
});

test("normalizeAutoTitle caps to the UTF-8 byte budget on a multi-byte boundary", () => {
	// Each Cyrillic letter is 2 bytes in UTF-8: 40 letters = exactly 80 bytes.
	const forty = "а".repeat(40);
	assert.equal(Buffer.byteLength(normalizeAutoTitle(forty), "utf8"), 80);
	// A letter that would exceed the budget is cut whole, never mid-character.
	const capped = normalizeAutoTitle(forty + "б");
	assert.equal(capped, forty);
	assert.ok(Buffer.byteLength(capped, "utf8") <= 80);
});

test("parseFolderName trims surrounding whitespace", () => {
	assert.equal(parseFolderName({ name: "  My folder  " }), "My folder");
});

test("parseFolderName rejects empty and over-long names", () => {
	assert.equal(parseFolderName({ name: "   " }), void 0);
	assert.equal(parseFolderName({ name: "x".repeat(81) }), void 0);
	assert.equal(parseFolderName({ name: "x".repeat(80) }), "x".repeat(80));
});

test("parseFolderName rejects missing or non-string names", () => {
	assert.equal(parseFolderName(void 0), void 0);
	assert.equal(parseFolderName({}), void 0);
	assert.equal(parseFolderName({ name: 42 }), void 0);
});

test("hasNameConflict is case-insensitive within a workspace", () => {
	const folders = [folder("1", "w1", "Restored")];
	assert.equal(hasNameConflict(folders, "w1", "restored"), true);
	assert.equal(hasNameConflict(folders, "w1", "RESTORED"), true);
	assert.equal(hasNameConflict(folders, "w1", "other"), false);
});

test("hasNameConflict honors exceptId (rename of itself)", () => {
	const folders = [folder("1", "w1", "Notes")];
	assert.equal(hasNameConflict(folders, "w1", "Notes", "1"), false);
	assert.equal(hasNameConflict(folders, "w1", "Notes", "2"), true);
});

test("hasNameConflict isolates workspaces", () => {
	const folders = [folder("1", "w1", "Notes")];
	assert.equal(hasNameConflict(folders, "w2", "Notes"), false);
});
