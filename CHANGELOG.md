# Changelog

## v0.5.0-local.1 (2026-09-09)

> Local fork (multi-level folders), built on upstream v0.4.3 plus the unreleased amber pending-status fix.

### Added

- **Nested folders**: a folder can contain folders (folder context menu → "New subfolder"); the tree renders with per-level indentation and collapsing a parent hides its whole branch. Identity is the folder id, so **duplicate folder names are now allowed** — even among siblings — and the old workspace-wide uniqueness rule is gone
- **Move folders**: the folder context menu gains "Move to folder…", sharing one picker with the session menu; "Up one level" re-parents a folder to its grandparent
- **Level-scoped move submenu**: the old flat "all folders" submenu now only lists the neighbourhood of the item's own level — the subfolders of the item's container (picking one moves it down one level), the position one level up, and the root — so a deep tree never becomes an endless menu. The submenu is capped at five rows (384px overall) and scrolls with the wheel beyond that; it still opens on hover, as before nesting, and now carries a trailing chevron (the Menu primitive draws no affordance for submenus)
- **Two deletion modes**: deleting a folder now asks whether to delete only that folder (its subfolders and its own sessions move up one level, into the folder's own position) or the whole subtree (every session below moves up to that same position). Sessions are never deleted
- **Restored folder flag**: the virtual "Restored" folder is identified by a record flag instead of its name; records written before nesting are still recognized by name at root level
- Folder paths in the move-submenu tooltips and in the Recent origin card, so identically named folders stay distinguishable

### Changed

- Folder drag-and-drop reorders siblings only; nesting is done through the context menu
- **Storage unit renamed to `dsh_session_folders_v050`**: the nested-folder shape is a breaking change, so it lives in its own unit file (`~/.dsh/storages/dsh_session_folders_v050.json`, seeded from the v0.4.x file) instead of migrating in place. The v0.4.x file stays untouched, and a stale build that only knows the old unit can neither read nor flatten the new tree

### Fixed

- Clicking a session in Recent (origin card) expands every ancestor folder, not just the leaf, so a nested session is actually revealed

### Notes for maintainers

- `parentId` and `restored` stay **optional** and the unit version stays 1: a required field would make the seeded copy unreadable (records written before nesting carry no parentId), and a plug-in that fails to open its domain fails activation, which aborts DSH startup (`assertEntriesActivated`)
- The version-suffixed unit name is what makes the change safe to ship: the pre-nesting build keeps reading and writing `dsh_session_folders.json`, so it cannot reach the new tree. Seeding the new unit is the entire migration — copy the old file, rewrite the header's `name` to match the unit name; there is no migration code in the plug-in to maintain

## v0.4.3 (2026-08-21)

### Added

- **Session ID badge**: hovering a session row reveals a small `id` badge left of the quick-archive button; one click copies `session-<id>` of that row to the clipboard (clipboard API with an execCommand fallback), the badge flashes a check mark for a moment, and the row itself is not opened
- **Folder tree guides**: a semi-transparent dashed trunk drops from each folder icon through the icon column to its sessions, with a small tick toward every session title; the session status icon paints over the line, as intended. When a folder holds the open session, its whole guide tree paints business blue. Drawn with pure CSS pseudo-elements (no measuring — scrolling and layout changes are free). Toggled by a new header button (off by default, persisted per browser)
- **Recent origin card**: hovering a session in the Recent section pops a small card to the right of the row (outside the list, portaled to the page body) showing the workspace and folder the session lives in — no more guessing where a Recent session belongs. Hides with the hover; replaces the native time tooltip on those rows. Clicking such a session reveals its home: the workspace group and folder expand and the list scrolls to the original row
- **Workspace focus mode**: hovering a workspace row reveals a crosshair toggle (also in the row's context menu); when on, only that workspace is listed — Recent, other workspaces, the Ungrouped bucket and the end-of-list drop zone hide until the focus is toggled off. Ephemeral by design: a restart shows everything again; a focused workspace that disappears unfocuses safely

### Changed

- The open session is now highlighted with a firm blue tint everywhere (Recent and the main tree) instead of the pale gray hover color that was easy to miss

## v0.4.2 (2026-08-21)

### Fixed

- Sidebar layout: with enough expanded folders/sessions to scroll, workspace group rows overlapped the sessions above them — the scrolling flex column squeezed list items below their content (loose buckets collapsed to their 4px minimum, the end-of-list drop zone to zero) and the rows inside painted over the neighbouring groups; list children no longer shrink (`flex-shrink: 0`)

## v0.4.1 (2026-08-21)

### Added

- Auto rename: a second concurrent auto-rename of the same session gets an immediate localized "already running" notice instead of racing the first model stream
- Pure folder helpers (name parsing, conflict check, exact-id-set validation, auto-title normalization) extracted into `lib/folder-utils.js` with a minimal `node:test` suite (`npm test`)

### Fixed

- Route hardening: every plugin route rejects non-JSON content types (400), cross-site fetches (403), and browser requests whose Origin does not match the Host (403); same-origin UI flows and Origin-less clients (curl/scripts) are unaffected
- Unarchive: the read-filter-write-poke of the registry's archive set runs inside the workspace registry's operation queue, so a concurrent archive from another browser can no longer lose an update (logged direct-write fallback when the queue is unavailable); missing workspace internals now answer 500 `workspace-internals-changed` instead of failing mid-write
- Restore-by-click reuses an existing "restored" folder regardless of letter case, and case-variant "Restored" folders no longer appear in the move submenu
- READMEs: auto-rename wording corrected to the actual "at most 3 words" cap in all three languages

## v0.4.0 (2026-08-20)

### Added

- Drag-and-drop reordering: workspace rows and folder rows can be dragged to new positions (folders always stay above the loose sessions; session sorting by time is unchanged); the order is persisted server-side
- Row actions moved to right-click context menus on session, folder, and workspace rows (the per-row "…" buttons are gone); every menu item carries an icon
- **Pin / Unpin sessions**: a pinned session always sits first in its folder or in the loose bucket; pin state is persisted server-side and follows the session across moves
- A pinned session with no status badge shows a small pin icon in its status slot
- **Archive block**: an archive icon on the workspace row shows/hides a virtual Archive folder with every archived session of the workspace (struck icon while shown); dropping a session onto it archives it (same as the context-menu action), dropping an archived session onto a folder or the loose area restores it there
- **Restore from the Archive**: right-click an archived session → "Restore to original folder" (the session returns where it was); click an archived session to restore it into the workspace's **Restored** folder (created on demand, always listed first, hidden while empty) and open it in chat
- **Show more / Show less** in every folder and the Archive block: at most five sessions are shown until the overflow row is clicked (mirrors the original session browser)
- **New session buttons**: a plus on a workspace row starts a session in that workspace; a smaller plus on a folder row starts a session directly inside that folder
- **Quick archive on hover**: hovering a session row swaps the timestamp for a small archive icon; clicking it archives the session (the swap happens in place, so the layout never shifts)
- **Open workspace folder**: the first button on a workspace row (folder icon) opens the workspace root directory in the system file manager (host's native `openPath` API)
- Restoring a session with a click now expands the **Restored** folder automatically when it was collapsed, so the restored session is immediately visible
- **Recent section**: above the workspace list, the five most recent workspace sessions (folders + loose area); clicking one opens it and highlights it in Recent and in its workspace/folder; the header collapses the section (state persists, Collapse all / Expand all apply)
- **Inline rename**: double-click a session title to edit it in place (Enter commits, Esc cancels; folders keep the click-to-collapse behavior, renaming stays in the context menu)
- **Auto rename**: the session context menu gains "Auto rename" — the session's own model reads its first user message and derives a short 3-4 word title (a description of the process, feature, or task, in the message's language); the result is pinned exactly like a manual rename and never overwritten by automatic title generation. Live sessions only (closed ones show a clear notice); errors are localized

### Fixed

- New-workspace dialog: a double click (or a second click before the button re-renders) no longer opens a second native folder picker; a busy guard ignores repeat clicks while one pick is in flight
- New-workspace dialog: the "Couldn't create the workspace" error after a successful create is gone — the success check now matches the client service contract (it throws on failure and returns the workspace entity on success)
- "Move to folder → New folder…": the flow crashed (`confirmNewFolder is not defined`); the function is restored as its own top-level handler and the rename-folder handler no longer swallows it
- Auto rename: the model token budget is raised to 512 so reasoning-style models finish their chain of thought and still emit the title; the title wording is capped at 3 words (prepositions not counted), reasoning is explicitly forbidden in the prompt
- Open workspace folder: the button keeps using the standard harness `host.openPath` RPC (multiplatform); an earlier experiment with a plugin route spawning the file manager directly was reverted per review
- Workspace drag-reorder: a drop zone below the last workspace row lets a dragged workspace be placed at the end of the list (previously a drop into the empty space below was ignored)

## v0.3.0 (2026-08-19)

### Added

- "New folder…" inside the "Move to folder…" submenu: create a folder and move the session into it in one go
- "Expand all" header button next to "Collapse all"; both buttons now collapse/expand every workspace group and folder, including ones created after the last manual toggle

## v0.2.0 (2026-08-19)

### Added

- Initial public release: one level of named folders per workspace in the sidebar; sessions can be moved into/out of folders by drag-and-drop or context menu; server-side persistence; search and status badges mirror the built-in session browser
