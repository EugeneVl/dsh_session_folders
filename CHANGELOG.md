# Changelog

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
- Open workspace folder: the button now goes through a plugin route that spawns the system file manager directly (the harness `host.openPath` RPC returned success without opening for some paths); the route validates the path and only opens existing directories
- Workspace drag-reorder: a drop zone below the last workspace row lets a dragged workspace be placed at the end of the list (previously a drop into the empty space below was ignored)

## v0.3.0 (2026-08-19)

### Added

- "New folder…" inside the "Move to folder…" submenu: create a folder and move the session into it in one go
- "Expand all" header button next to "Collapse all"; both buttons now collapse/expand every workspace group and folder, including ones created after the last manual toggle

## v0.2.0 (2026-08-19)

### Added

- Initial public release: one level of named folders per workspace in the sidebar; sessions can be moved into/out of folders by drag-and-drop or context menu; server-side persistence; search and status badges mirror the built-in session browser
