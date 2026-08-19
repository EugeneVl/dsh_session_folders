window.__ModuleLoader__.load({
	id: "dsh-session-folders",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let reactDom = require("react-dom");
		let primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let runtimeClient = require("@deepseek-ai/dsh-client-runtime/client");
		//#region contract
		/** Wire contract shared with the host half: route names + error codes. */
		const ROUTE_PREFIX = "/dsh-session-folders";
		/** List all folders (orphan-filtered by the host). */
		const LIST_ROUTE = ROUTE_PREFIX + "/list";
		/** Create a folder in a workspace. */
		const CREATE_ROUTE = ROUTE_PREFIX + "/create";
		/** Rename a folder. */
		const RENAME_ROUTE = ROUTE_PREFIX + "/rename";
		/** Delete a folder (its sessions return to loose). */
		const DELETE_ROUTE = ROUTE_PREFIX + "/delete";
		/** Move a session into a folder or back to loose (folderId null). */
		const MOVE_ROUTE = ROUTE_PREFIX + "/move";
		const REORDER_FOLDERS_ROUTE = ROUTE_PREFIX + "/reorder-folders";
		const REORDER_WORKSPACES_ROUTE = ROUTE_PREFIX + "/reorder-workspaces";
		const PIN_ROUTE = ROUTE_PREFIX + "/pin";
		const UNARCHIVE_ROUTE = ROUTE_PREFIX + "/unarchive";
		/** How many archived sessions the Archive block shows before the "Show more" toggle (matches the original browser's collapsed limit). */
		const ARCHIVE_ROW_LIMIT = 5;
		//#endregion
		//#region client/index.ts
		/** Client plug-in identity. */
		const name = "dsh-session-folders/client";
		/** Client services consumed by the client half. */
		const inject = ["slots", "locale", "sessions", "workspaces"];
		/** Locale namespace registered under ctx.locale. */
		const NS = "dsh-session-folders";
		/** <style> tag id so the stylesheet injects once. */
		const STYLE_ID = "dsh-session-folders-style";
		/** View store persist key (collapsed groups + collapsed folders). */
		const VIEW_PERSIST_KEY = "dsh.session-folders.view.v1";
		/** Search debounce, mirroring the built-in browser. */
		const SEARCH_DEBOUNCE_MS = 250;
		/** Search query length cap, mirroring the built-in browser. */
		const SEARCH_QUERY_MAX_CODE_UNITS = 500;
		/** Folder name length cap, mirrored from the host. */
		const MAX_FOLDER_NAME_LENGTH = 80;
		/** Display label of the bucket for sessions outside every workspace. */
		const UNGROUPED_LABEL = "Ungrouped";
		/** Name of the folder that receives sessions restored by archive-row click. */
		const RESTORED_FOLDER_NAME = "Restored";
		/** React.createElement shorthand. */
		const e = react.createElement;
		/** The plug-in's dictionaries. zh is the key-set source of truth. */
		const zh = {
			"section.workspaces": "工作区",
			"empty.none": "暂无会话",
			"search.aria": "搜索会话",
			"search.placeholder": "搜索会话…",
			"search.clear": "清除搜索",
			"search.pending": "正在搜索会话历史…",
			"search.unavailable": "内容搜索暂不可用，仅显示名称匹配。",
			"search.noMatches": "无匹配会话",
			"search.hasMore": "仅显示前 {n} 条结果，请缩小搜索范围。",
			"row.menu.aria": "操作",
			"menu.newWorkspace": "新建工作区…",
			"action.collapseAll": "全部折叠",
			"action.expandAll": "全部展开",
			"menu.newFolder": "新建文件夹",
			"menu.rename": "重命名",
			"menu.fork": "分叉会话",
			"menu.archiveSession": "归档会话",
			"menu.moveToFolder": "移动到文件夹…",
			"menu.moveNewFolder": "新建文件夹…",
			"menu.pin": "置顶",
			"menu.unpin": "取消置顶",
			"archive.show": "显示归档",
			"archive.hide": "隐藏归档",
			"archive.folder": "归档",
			"menu.restore": "恢复",
			"sessions.expand": "展开其余 {n} 个会话",
			"sessions.collapse": "收起",
			"actions.newSession.aria": "在“{name}”中新建会话",
			"actions.openFolder.aria": "在文件管理器中打开文件夹",
			"move.inbox": "Workspace",
			"newFolder.title": "新建文件夹",
			"newFolder.confirm": "创建",
			"field.folderName": "文件夹名称",
			"rename.folder.title": "重命名文件夹",
			"rename": "重命名",
			"rename.workspace.title": "重命名工作区",
			"rename.session.title": "重命名会话",
			"field.workspaceName": "工作区名称",
			"field.sessionName": "会话名称",
			"delete": "删除",
			"delete.workspace": "删除工作区",
			"delete.folder": "删除文件夹",
			"delete.desc": "将把“{name}”从工作区列表中移除。文件夹与会话记录会保留，其会话将显示在“未分组”下。",
			"delete.folder.desc": "将删除文件夹“{name}”，其中的会话将回到工作区的未收纳区域。",
			"delete.acknowledge": "我了解此操作",
			"delete.pending": "正在删除…",
			"cancel": "取消",
			"close": "关闭",
			"notice.dismiss": "关闭提示",
			"newWorkspace.title": "新建工作区",
			"newWorkspace.desc": "选择此工作区根目录。会话将按此目录归入该工作区。",
			"newWorkspace.choose": "选择目录…",
			"newWorkspace.pending": "正在创建工作区…",
			"workspaceCreateFailed": "无法创建工作区",
			"error.requestFailed": "请求失败，请重试。",
			"error.folderLoadFailed": "无法加载文件夹列表。",
			"error.nameConflict": "此工作区已存在同名文件夹。",
			"error.folderNotFound": "文件夹不存在或已被删除。",
			"error.sessionNotInWorkspace": "会话不在该工作区中。",
			"error.workspaceNotFound": "工作区不存在。",
			"error.actionFailed": "操作失败，请重试。",
			"status.running": "进行中",
			"status.waitingApproval": "等待审批",
			"status.completed": "已完成",
			"time.now": "刚刚",
			"time.minutes": "{n}分钟",
			"time.hours": "{n}小时",
			"time.days": "{n}天",
			"time.months": "{n}个月",
			"time.years": "{n}年",
			"time.ago": "{t}前"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"section.workspaces": "Workspaces",
			"empty.none": "No sessions yet",
			"search.aria": "Search sessions",
			"search.placeholder": "Search sessions...",
			"search.clear": "Clear search",
			"search.pending": "Searching session history…",
			"search.unavailable": "Content search is temporarily unavailable. Showing name matches.",
			"search.noMatches": "No matching sessions",
			"search.hasMore": "Showing the first {n} results. Narrow your search.",
			"row.menu.aria": "Actions",
			"menu.newWorkspace": "New workspace…",
			"action.collapseAll": "Collapse all",
			"action.expandAll": "Expand all",
			"menu.newFolder": "New folder",
			"menu.rename": "Rename",
			"menu.fork": "Fork session",
			"menu.archiveSession": "Archive session",
			"menu.moveToFolder": "Move to folder…",
			"menu.moveNewFolder": "New folder…",
			"menu.pin": "Pin",
			"menu.unpin": "Unpin",
			"archive.show": "Show archive",
			"archive.hide": "Hide archive",
			"archive.folder": "Archive",
			"menu.restore": "Restore",
			"sessions.expand": "Show {n} more sessions",
			"sessions.collapse": "Show less",
			"actions.newSession.aria": "New session in {name}",
			"actions.openFolder.aria": "Open folder in file manager",
			"move.inbox": "Workspace",
			"newFolder.title": "New folder",
			"newFolder.confirm": "Create",
			"field.folderName": "Folder name",
			"rename.folder.title": "Rename folder",
			"rename": "Rename",
			"rename.workspace.title": "Rename workspace",
			"rename.session.title": "Rename session",
			"field.workspaceName": "Workspace name",
			"field.sessionName": "Session name",
			"delete": "Delete",
			"delete.workspace": "Delete workspace",
			"delete.folder": "Delete folder",
			"delete.desc": "This removes \"{name}\" from the workspace list. The folder and session logs will be kept. Its sessions will appear under Ungrouped.",
			"delete.folder.desc": "This removes the folder \"{name}\". Its sessions move back to the loose area of the workspace.",
			"delete.acknowledge": "I understand",
			"delete.pending": "Deleting…",
			"cancel": "Cancel",
			"close": "Close",
			"notice.dismiss": "Dismiss",
			"newWorkspace.title": "New workspace",
			"newWorkspace.desc": "Choose the root directory of this workspace. Sessions are grouped into it by their working directory.",
			"newWorkspace.choose": "Choose directory…",
			"newWorkspace.pending": "Creating workspace…",
			"workspaceCreateFailed": "Couldn’t create the workspace",
			"error.requestFailed": "The request failed. Try again.",
			"error.folderLoadFailed": "Couldn’t load the folder list.",
			"error.nameConflict": "A folder with this name already exists in this workspace.",
			"error.folderNotFound": "The folder is gone or was deleted.",
			"error.sessionNotInWorkspace": "The session is not in this workspace.",
			"error.workspaceNotFound": "The workspace does not exist.",
			"error.actionFailed": "The action failed. Try again.",
			"status.running": "Running",
			"status.waitingApproval": "Waiting for approval",
			"status.completed": "Completed",
			"time.now": "now",
			"time.minutes": "{n}min",
			"time.hours": "{n}h",
			"time.days": "{n}d",
			"time.months": "{n}mo",
			"time.years": "{n}y",
			"time.ago": "{t}"
		};
		/** The plug-in's stylesheet: sidebar browser columns, rows, and the notice bar. */
		const STYLE = `
[data-dsh-session-folders] {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 4px 0 8px;
  color: var(--dsw-alias-label-primary, #111827);
}
.dsh-ff__header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px 6px;
}
.dsh-ff__header-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-ff__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #374151);
  cursor: pointer;
  padding: 0;
  flex: none;
}
.dsh-ff__icon-button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.06));
}
/* Hover-reveal archive button on session rows: the button overlays the
   time column (the wrapper keeps the time's own width, so the time never
   shifts and the button costs no space while hidden). */
.dsh-ff__time-area {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
}
.dsh-ff__row-archive {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  cursor: pointer;
  padding: 0;
  flex: none;
  visibility: hidden;
}
.dsh-ff__session-row:hover .dsh-ff__row-archive,
.dsh-ff__row-archive:focus-visible,
.dsh-ff__row-archive:hover {
  visibility: visible;
}
.dsh-ff__session-row:hover .dsh-ff__time-area .dsh-ff__time {
  visibility: hidden;
}
.dsh-ff__row-archive:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.06));
  color: var(--dsw-alias-label-secondary, #374151);
}
.dsh-ff__search {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding: 2px 6px;
  border-radius: 8px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.06));
  color: var(--dsw-alias-label-secondary, #374151);
}
.dsh-ff__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #111827);
  font-size: 13px;
  line-height: 20px;
  padding: 0;
}
.dsh-ff__notice {
  margin: 0 12px 6px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsh-ff__notice-text {
  flex: 1;
  min-width: 0;
}
.dsh-ff__notice-dismiss {
  flex: none;
  display: inline-flex;
  margin: -2px -4px;
  padding: 2px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary, #374151);
}
.dsh-ff__notice--error {
  background: rgba(239, 68, 68, .12);
  color: var(--dsw-alias-label-primary, #111827);
}
.dsh-ff__list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
}
.dsh-ff__empty {
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 12px;
  padding: 8px 12px;
}
.dsh-ff__group,
.dsh-ff__folder {
  display: flex;
  flex-direction: column;
}
.dsh-ff__group-row,
.dsh-ff__folder-row,
.dsh-ff__session-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  color: var(--dsw-alias-label-primary, #111827);
  min-height: 36px;
  box-sizing: border-box;
}
.dsh-ff__group-row:hover,
.dsh-ff__folder-row:hover,
.dsh-ff__session-row:hover,
.dsh-ff__session-row--selected {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.06));
}
.dsh-ff__group-row {
  padding-left: 6px;
  font-size: 14px;
  font-weight: 500;
}
.dsh-ff__folder-row {
  padding-left: 16px;
  font-size: 13px;
}
.dsh-ff__session-row {
  padding-left: 0;
  font-size: 13px;
  animation: dsh-ff__row-in .15s var(--ds-ease-in-out, ease-in-out);
}
.dsh-ff__folder .dsh-ff__session-row {
  padding-left: 16px;
}
@keyframes dsh-ff__row-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.dsh-ff__slot {
  flex: none;
  width: 16px;
  height: 20px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.dsh-ff__folder-count {
  flex: none;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
  min-width: 20px;
  text-align: center;
  background: rgba(107, 114, 128, .16);
  color: var(--dsw-alias-label-secondary, #374151);
}
.dsh-ff__session-row[draggable="true"],
.dsh-ff__folder-row[draggable="true"],
.dsh-ff__group-row[draggable="true"] {
  cursor: grab;
}
.dsh-ff__folder-row--target-before,
.dsh-ff__group-row--target-before {
  box-shadow: inset 0 2px 0 rgba(59, 130, 246, .9);
}
.dsh-ff__folder-row--target-after,
.dsh-ff__group-row--target-after {
  box-shadow: inset 0 -2px 0 rgba(59, 130, 246, .9);
}
.dsh-ff__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 20px;
}
.dsh-ff__time {
  flex: none;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 12px;
  line-height: 17px;
}

.dsh-ff__folder-icon {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-secondary, #374151);
}
.dsh-ff__dot {
  flex: none;
}
.dsh-ff__slot svg {
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
/* Mirrors the original browser's session-overflow button: a full-width,
   left-aligned strip whose text starts at the session-title column. */
.dsh-ff__rows-more {
  cursor: pointer;
  text-align: left;
  width: 100%;
  height: 28px;
  box-sizing: border-box;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 0 12px 0 38px;
  font-size: 12px;
  line-height: 28px;
  user-select: none;
}
.dsh-ff__rows-more:hover {
  color: var(--dsw-alias-label-secondary, #374151);
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.06));
}

.dsh-ff__loose {
  display: flex;
  flex-direction: column;
  min-height: 4px;
  border-radius: 8px;
}
.dsh-ff__loose--target,
.dsh-ff__folder-row--target {
  background: rgba(59, 130, 246, .12);
  outline: 1px dashed rgba(59, 130, 246, .5);
  outline-offset: -2px;
}
.dsh-ff__search-meta {
  color: var(--dsw-alias-label-secondary, #374151);
  font-size: 12px;
  line-height: 17px;
  max-width: 40%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: none;
}
.dsh-ff__search-snippet {
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 12px;
  line-height: 17px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.dsh-ff__search-hint {
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 12px;
  padding: 6px 12px;
  line-height: 1.5;
}
.dsh-ff__results {
  display: flex;
  flex-direction: column;
  padding: 2px 0;
}
.dsh-ff__dialog-body {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 0 2px;
}
.dsh-ff__dialog-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary, #374151);
  margin-bottom: 10px;
}
.dsh-ff__dialog-input {
  width: 100%;
  box-sizing: border-box;
}
/* Context-menu host: neutralize the primitives Menu root span so the list
   positions itself against our fixed layer (exactly at the cursor). */
.dsh-ff__ctx-root {
  position: static !important;
  display: block !important;
}
`;
		/** Inject the stylesheet once per page load. */
		function injectStyle() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style#" + STYLE_ID) !== null) return;
			const tag = document.createElement("style");
			tag.id = STYLE_ID;
			tag.textContent = STYLE;
			document.head.appendChild(tag);
		}
		/**
		* Create the browser's view store handle: collapsed workspace groups and
		* collapsed folders, persisted per browser in localStorage.
		* @returns the defineStore handle (spec + identity + factory in one).
		*/
		function createFeatureFoldersViewStore() {
			return runtimeClient.defineStore({
				init: () => ({
					collapsedGroups: {},
					collapsedFolders: {},
					// Per-workspace "Show archive" toggle (workspaceId -> boolean).
					archiveShown: {}
				}),
				persist: VIEW_PERSIST_KEY,
				actions: {
					setGroupCollapsed: (d, key, collapsed) => {
						d.collapsedGroups[key] = collapsed;
					},
					setFolderCollapsed: (d, key, collapsed) => {
						d.collapsedFolders[key] = collapsed;
					},
					setArchiveShown: (d, key, shown) => {
						// The persisted state predating archiveShown has no key.
						if (d.archiveShown === void 0) d.archiveShown = {};
						d.archiveShown[key] = shown;
					},
					collapseAll: (d, groupKeys, folderIds) => {
						// Keys not yet present in the persisted view must be written too,
						// otherwise freshly added workspaces/folders survive a collapse-all.
						// The virtual Archive folder follows its workspace (archives are
						// "expanded" when the marker is true).
						for (const key of groupKeys) {
							d.collapsedGroups[key] = true;
							d.collapsedFolders["archive:" + key] = false;
						}
						for (const id of folderIds) d.collapsedFolders[id] = true;
					},
					expandAll: (d, groupKeys, folderIds) => {
						for (const key of groupKeys) {
							d.collapsedGroups[key] = false;
							d.collapsedFolders["archive:" + key] = true;
						}
						for (const id of folderIds) d.collapsedFolders[id] = false;
					}
				}
			});
		}
		//#region data model
		/**
		* Sanitize the search input: strip NULs and cap code units (mirrors the
		* built-in browser's policy, keeping both implementations hostile-input safe).
		* @param value - raw input value.
		* @returns the sanitized query.
		*/
		function sanitizeSearchQuery(value) {
			const withoutNul = value.replace(/\0/g, "");
			if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
			let end = SEARCH_QUERY_MAX_CODE_UNITS;
			while (end > 0 && (withoutNul.charCodeAt(end) & 0xFC00) === 0xDC00) end -= 1;
			return withoutNul.slice(0, end);
		}
		/**
		* Visibility parity with the built-in browser: subagent-origin sessions and
		* archived sessions are hidden everywhere; blank sessions are hidden too —
		* we do not render a provisional New Session row (the sidebar shell owns
		* the New Session button above the slot).
		* @param session - session summary.
		* @param archived - archived id set.
		* @returns whether the session participates in any list.
		*/
		function sessionVisible(session, archived) {
			return session.origin !== "subagent" && !archived.has(session.id) && !session.blank;
		}
		/** Recency comparator: newest first, id as the deterministic tiebreak. */
		function byRecency(a, b) {
			if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
			return a.id < b.id ? -1 : 1;
		}
		/** Folder comparator: alphabetical by name (case-insensitive), id tiebreak. */
		function byFolderName(a, b) {
			const x = a.name.toLowerCase();
			const y = b.name.toLowerCase();
			if (x !== y) return x < y ? -1 : 1;
			return a.id < b.id ? -1 : 1;
		}
		/** Folder comparator: manual order first (missing index sorts last), name tiebreak. */
		function byFolderOrder(a, b) {
			const x = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
			const y = b.sortIndex ?? Number.MAX_SAFE_INTEGER;
			if (x !== y) return x - y;
			return byFolderName(a, b);
		}
		/** View comparator: the "Restored" folder always sits first (right below
		 * the Archive block, or at the top when the archive is hidden), the rest
		 * follow the manual order. */
		function byViewFolderOrder(a, b) {
			const ra = a.name === RESTORED_FOLDER_NAME ? 0 : 1;
			const rb = b.name === RESTORED_FOLDER_NAME ? 0 : 1;
			if (ra !== rb) return ra - rb;
			return byFolderOrder(a, b);
		}
		/** Pinned sessions first (in pin order), the rest newest-first. */
		function deriveOrderedSessions(sessionIds, pinnedIds, list, visible) {
			const pinnedSet = /* @__PURE__ */ new Set(pinnedIds);
			return [
				...pinnedIds.map((id) => list.byId[id]).filter(visible),
				...sessionIds
					.map((id) => list.byId[id])
					.filter(visible)
					.filter((summary) => !pinnedSet.has(summary.id))
					.sort(byRecency)
			];
		}
		/**
		* Compact relative time bucket for rows ("now"/"5min"/"3h"/"2d"/"4mo"/"1y").
		* @param updatedAt - epoch ms of the session's last activity.
		* @param now - current epoch ms.
		* @returns the bucket unit and magnitude.
		*/
		function relativeTime(updatedAt, now) {
			const MIN = 6e4;
			const HOUR = 36e5;
			const DAY = 864e5;
			const diff = Math.max(0, now - updatedAt);
			if (diff < MIN) return { unit: "now", n: 0 };
			if (diff < HOUR) return { unit: "minutes", n: Math.floor(diff / MIN) };
			if (diff < DAY) return { unit: "hours", n: Math.floor(diff / HOUR) };
			if (diff < 30 * DAY) return { unit: "days", n: Math.floor(diff / DAY) };
			if (diff < 365 * DAY) return { unit: "months", n: Math.floor(diff / (30 * DAY)) };
			return { unit: "years", n: Math.floor(diff / (365 * DAY)) };
		}
		/** Localized relative-time label for session rows. */
		function timeLabel(updatedAt, now, t) {
			const bucket = relativeTime(updatedAt, now);
			if (bucket.unit === "now") return t("time.now");
			return t("time.ago", { t: t("time." + bucket.unit, { n: bucket.n }) });
		}
		/** Row status dot: running, pending interaction, or completed. */
		function rowStatusDot(session) {
			if (session.running === true) return "ongoing";
			if (session.pendingInteraction !== void 0) return "warning";
			if (session.completed === true) return "done";
			return null;
		}
		/** Status aria label for a dot state. */
		function statusAria(status, t) {
			if (status === "ongoing") return t("status.running");
			if (status === "warning") return t("status.waitingApproval");
			if (status === "done") return t("status.completed");
			return "";
		}
		/**
		* Derive the browser view from the live feeds: one section per workspace
		* with folders in the stored manual order on top (fallback alphabetical
		* for legacy records) and the loose sessions below (newest-first), plus
		* the Ungrouped bucket for sessions outside every workspace (no folders
		* there, always last). Folder membership is resolved from the folder
		* records; a session in several folders (possible only via a stale
		* record) renders in the first one in display order.
		* @param list - sessions list snapshot.
		* @param workspaces - workspace items in stable Host order.
		* @param archived - archived id set.
		* @param folders - folder records from the host (null while loading).
		* @param workspaceOrder - server-stored workspace id order ([] while unknown).
		* @param pinnedLoose - server-stored loose-bucket pin lists per workspace ({} while unknown).
		* @returns the derived view.
		*/
		function deriveView(list, workspaces, archived, folders, workspaceOrder, pinnedLoose) {
			const visible = (summary) => summary !== void 0 && sessionVisible(summary, archived);
			const folderOf = /* @__PURE__ */ new Map();
			const sessionWorkspace = /* @__PURE__ */ new Map();
			const foldersByWorkspace = /* @__PURE__ */ new Map();
			for (const folder of folders ?? []) {
				const bucket = foldersByWorkspace.get(folder.workspaceId) ?? [];
				bucket.push(folder);
				foldersByWorkspace.set(folder.workspaceId, bucket);
				for (const sessionId of folder.sessionIds) folderOf.set(sessionId, folder);
			}
			const groups = [];
			const accounted = /* @__PURE__ */ new Set();
			// Workspace rows follow the stored order; workspaces created after the
			// last reorder keep their host order after the known ones.
			const orderedWorkspaces = [];
			const seenWorkspaces = /* @__PURE__ */ new Set();
			for (const id of workspaceOrder ?? []) {
				const workspace = workspaces.find((candidate) => candidate.workspaceId === id);
				if (workspace === void 0) continue;
				orderedWorkspaces.push(workspace);
				seenWorkspaces.add(id);
			}
			for (const workspace of workspaces) {
				if (!seenWorkspaces.has(workspace.workspaceId)) orderedWorkspaces.push(workspace);
			}
			for (const workspace of orderedWorkspaces) {
				for (const id of workspace.sessionIds) {
					const summary = list.byId[id];
					if (summary !== void 0) {
						accounted.add(id);
						sessionWorkspace.set(id, workspace);
					}
				}
				const workspaceFolders = (foldersByWorkspace.get(workspace.workspaceId) ?? [])
					.slice()
					.sort(byViewFolderOrder)
					.map((folder) => ({
						id: folder.id,
						name: folder.name,
						pinnedSessionIds: folder.pinnedSessionIds ?? [],
						sessions: deriveOrderedSessions(folder.sessionIds, folder.pinnedSessionIds ?? [], list, visible)
					}))
					// The Restored folder hides itself while it has no visible
					// sessions (archived sessions keep folder membership, so the
					// raw sessionIds count is not enough).
					.filter((folder) => folder.name !== RESTORED_FOLDER_NAME || folder.sessions.length > 0);
				const inFolder = /* @__PURE__ */ new Set();
				for (const folder of workspaceFolders) {
					for (const session of folder.sessions) inFolder.add(session.id);
				}
				const loosePinnedIds = (pinnedLoose ?? {})[workspace.workspaceId] ?? [];
				const loose = [
					...loosePinnedIds.map((id) => list.byId[id]).filter(visible).filter((summary) => !inFolder.has(summary.id)),
					...workspace.sessionIds
						.map((id) => list.byId[id])
						.filter(visible)
						.filter((summary) => !inFolder.has(summary.id) && !loosePinnedIds.includes(summary.id))
						.sort(byRecency)
				];
				groups.push({
					key: workspace.workspaceId,
					workspaceId: workspace.workspaceId,
					title: workspace.title,
					path: workspace.path,
					folders: workspaceFolders,
					loose
				});
			}
			const visibleSessions = list.ids
				.map((id) => list.byId[id])
				.filter(visible);
			const stray = visibleSessions.filter((summary) => !accounted.has(summary.id)).sort(byRecency);
			return {
				groups,
				ungrouped: stray.length > 0
					? { key: "", workspaceId: void 0, title: UNGROUPED_LABEL, folders: [], loose: stray }
					: null,
				visibleSessions,
				folderOf,
				sessionWorkspace,
				loosePinnedByWorkspace: pinnedLoose ?? {}
			};
		}
		/**
		* Derive flat search results: local matches (session titles + folder names)
		* merged with the host content search, deduped, newest first, capped.
		* @param view - the derived browser view.
		* @param list - sessions list snapshot (summary lookups).
		* @param query - the raw query (empty returns null).
		* @param archived - archived id set.
		* @param remote - host content search state.
		* @param limit - result cap.
		* @returns the ordered result rows, or null when the query is empty.
		*/
		function deriveSearchResults(view, list, query, archived, remote, limit) {
			const q = query.trim().toLowerCase();
			if (q === "") return null;
			const ordered = [];
			const included = /* @__PURE__ */ new Set();
			const include = (summary) => {
				if (summary === void 0 || !sessionVisible(summary, archived) || included.has(summary.id)) return;
				included.add(summary.id);
				ordered.push(summary);
			};
			for (const summary of view.visibleSessions) {
				const folder = view.folderOf.get(summary.id);
				if (summary.displayTitle.toLowerCase().includes(q) || (folder !== void 0 && folder.name.toLowerCase().includes(q))) include(summary);
			}
			for (const item of remote.items) include(list.byId[item.sessionId]);
			const contentBySession = /* @__PURE__ */ new Map(remote.items.map((item) => [item.sessionId, item]));
			const labelOf = (summary) => view.sessionWorkspace.get(summary.id)?.title ?? UNGROUPED_LABEL;
			return {
				rows: ordered.slice(0, limit).map((summary) => ({
					id: summary.id,
					title: summary.displayTitle,
					workspace: labelOf(summary),
					running: summary.running,
					completed: summary.completed === true,
					...(summary.pendingInteraction === void 0 ? {} : { pendingInteraction: summary.pendingInteraction }),
					...(contentBySession.has(summary.id) ? { snippet: contentBySession.get(summary.id).snippet } : {})
				})),
				hasMore: remote.hasMore || ordered.length > limit
			};
		}
		//#endregion
		//#region wire
		/**
		* Call one folder route. Success = 2xx without an error code; the payload
		* resolves as-is. Failures reject with the host's error code string.
		* @param route - route path.
		* @param body - JSON body.
		* @returns the parsed success payload.
		*/
		async function callFolderRoute(route, body) {
			let response;
			try {
				response = await fetch(route, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
			} catch {
				throw new Error("request-failed");
			}
			const data = await response.json().catch(() => ({}));
			if (!response.ok || (data !== null && typeof data === "object" && data.error !== void 0)) {
				throw new Error(typeof data.error === "string" ? data.error : "request-failed");
			}
			return data;
		}
		/** Map a host error code to a localized message. */
		function folderErrorText(code, t) {
			const key = "error." + (code === "request-failed" ? "requestFailed"
				: code === "name-conflict" ? "nameConflict"
				: code === "folder-not-found" ? "folderNotFound"
				: code === "session-not-in-workspace" ? "sessionNotInWorkspace"
				: code === "workspace-not-found" ? "workspaceNotFound"
				: "actionFailed");
			return t(key);
		}
		//#endregion
		//#region rows
		// Row actions moved to right-click context menus (see renderContextMenu)
		// — the per-row ellipsis buttons were removed.
		//#endregion
		//#region browser
		/**
		* The sidebar workspace browser: one section per workspace, folders
		* (alphabetical) above the loose sessions (newest first), and a flat
		* Ungrouped bucket for sessions outside every workspace. Search merges
		* local title/folder-name matches with the host content search.
		* Props: kit (useSessions, useWorkspaces, useStore, actions, t) + entry
		* inject (open, searchSessions, searchResultLimit, renameSession,
		* forkSession, renameWorkspace, deleteWorkspace, archiveSession,
		* createWorkspace, pickDirectory) + sidebar slot inject (startSession,
		* toggleSidebar — unused here) + owner props (wide, expandSidebar).
		*/
		function FeatureFoldersBrowser(props) {
			injectStyle();
			const { wide, expandSidebar } = props;
			const { useSessions, useWorkspaces, useStore, actions, t } = props;
			const { open, searchSessions, searchResultLimit, renameSession, forkSession, renameWorkspace, deleteWorkspace, archiveSession, createWorkspace, pickDirectory, refreshWorkspaces, startSession, connectWorkspace, openWorkspaceFolder } = props;
			const list = useSessions((state) => state);
			const workspaces = useWorkspaces((state) => state.items);
			const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
			const collapsedGroups = useStore((state) => state.collapsedGroups);
			const collapsedFolders = useStore((state) => state.collapsedFolders);
			const archiveShown = useStore((state) => state.archiveShown ?? {});
			//#region state
			const [folders, setFolders] = react.useState(null);
			const [workspaceOrder, setWorkspaceOrder] = react.useState([]);
			const [pinnedLoose, setPinnedLoose] = react.useState({});
			const [contextMenu, setContextMenu] = react.useState(null);
			const [foldersError, setFoldersError] = react.useState(null);
			const [notice, setNotice] = react.useState(null);
			const [busy, setBusy] = react.useState(false);
			const [query, setQuery] = react.useState("");
			const [searchExpanded, setSearchExpanded] = react.useState(false);
			const [focusSearch, setFocusSearch] = react.useState(false);
			const [remoteSearch, setRemoteSearch] = react.useState({ status: "idle", query: "", items: [], hasMore: false });
			const [now, setNow] = react.useState(() => Date.now());
			const [dialog, setDialog] = react.useState(null);
			const [dragOver, setDragOver] = react.useState(null);
			const [moreShown, setMoreShown] = react.useState(() => /* @__PURE__ */ new Set());
			const dragInfo = react.useRef(null);
			const searchInput = react.useRef(null);
			//#endregion
			//#region effects
			/** Re-render rows once a minute so relative times age naturally. */
			react.useEffect(() => {
				const timer = window.setInterval(() => setNow(Date.now()), 60000);
				return () => window.clearInterval(timer);
			}, []);
			/** Fetch the folder list; refetch when the workspace set changes. */
			const fetchFolders = react.useCallback(() => {
				let cancelled = false;
				callFolderRoute(LIST_ROUTE, {}).then((data) => {
					if (cancelled) return;
					setFolders(data.folders);
					setWorkspaceOrder(Array.isArray(data.workspaceOrder) ? data.workspaceOrder : []);
					setPinnedLoose(data.pinnedLoose !== null && typeof data.pinnedLoose === "object" ? data.pinnedLoose : {});
					setFoldersError(null);
				}).catch((error) => {
					if (cancelled) return;
					setFoldersError(error.message ?? "request-failed");
				});
				return () => { cancelled = true; };
			}, []);
			react.useEffect(() => fetchFolders(), [fetchFolders, workspaces]);
			/** Focus the search input right after the sidebar expands into wide mode. */
			react.useEffect(() => {
				if (focusSearch && wide) {
					searchInput.current?.focus();
					setFocusSearch(false);
				}
			}, [focusSearch, wide]);
			const trimmedQuery = query.trim();
			/** Debounced host content search; aborted on every keystroke. */
			react.useEffect(() => {
				if (trimmedQuery === "") {
					setRemoteSearch({ status: "idle", query: "", items: [], hasMore: false });
					return;
				}
				const controller = new AbortController();
				setRemoteSearch({ status: "loading", query: trimmedQuery, items: [], hasMore: false });
				const timer = window.setTimeout(() => {
					searchSessions(trimmedQuery, controller.signal).then((value) => {
						if (controller.signal.aborted) return;
						setRemoteSearch({ status: "ready", query: trimmedQuery, items: value.items, hasMore: value.hasMore });
					}).catch(() => {
						if (controller.signal.aborted) return;
						setRemoteSearch({ status: "unavailable", query: trimmedQuery, items: [], hasMore: false });
					});
				}, SEARCH_DEBOUNCE_MS);
				return () => { controller.abort(); window.clearTimeout(timer); };
			}, [trimmedQuery, searchSessions]);
			//#endregion
			//#region derivation
			const archivedSet = react.useMemo(() => new Set(archivedSessionIds), [archivedSessionIds]);
			const view = react.useMemo(() => deriveView(list, workspaces, archivedSet, folders, workspaceOrder, pinnedLoose), [list, workspaces, archivedSet, folders, workspaceOrder, pinnedLoose]);
			/** Archived sessions grouped by owning workspace, newest first. */
			const archivedByWorkspace = react.useMemo(() => {
				const map = new Map();
				for (const id of archivedSet) {
					const summary = list.byId[id];
					if (summary === void 0 || summary.origin === "subagent" || summary.blank) continue;
					const workspace = view.sessionWorkspace.get(id);
					if (workspace === void 0) continue;
					const bucket = map.get(workspace.workspaceId) ?? [];
					bucket.push(summary);
					map.set(workspace.workspaceId, bucket);
				}
				for (const bucket of map.values()) bucket.sort(byRecency);
				return map;
			}, [archivedSet, list, view]);
			const results = react.useMemo(
				() => deriveSearchResults(view, list, trimmedQuery, archivedSet, remoteSearch, searchResultLimit),
				[view, list, trimmedQuery, archivedSet, remoteSearch, searchResultLimit]
			);
			//#endregion
			//#region actions
			const clearDrag = () => {
				dragInfo.current = null;
				setDragOver(null);
			};
			/** POST a folder mutation, then refetch the folder list. */
			const mutateFolders = (route, body) => {
				setBusy(true);
				callFolderRoute(route, body).then(() => {
					setNotice(null);
					fetchFolders();
				}).catch((error) => {
					setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
				}).finally(() => setBusy(false));
			};
			/** Move a session into a folder (or back to loose when null). */
			const moveSessionToFolder = (sessionId, folderId) => {
				mutateFolders(MOVE_ROUTE, { sessionId, folderId: folderId === null ? null : folderId });
			};
			/** Restore an archived session — one flow per entry point, selected
			 * by the destination: "original" — unarchive only, the session stays
			 * where it was archived (context menu); "target" — move it into the
			 * given folder first (null = loose area), then unarchive (drag
			 * drop); "restored" — land it in the workspace's "Restored" folder,
			 * created on demand, then unarchive (archive-row click). Every flow
			 * refreshes the workspace baseline so the session appears already
			 * in place. Resolves on success; the caller owns error reporting. */
			const restoreSession = (sessionId, destination) => {
				setBusy(true);
				const flow = destination.kind === "original"
					? callFolderRoute(UNARCHIVE_ROUTE, { sessionId })
					: destination.kind === "target"
					? callFolderRoute(MOVE_ROUTE, { sessionId, folderId: destination.folderId === null ? null : destination.folderId })
						.then(() => callFolderRoute(UNARCHIVE_ROUTE, { sessionId }))
					: (() => {
						// kind === "restored": ensure/resolve the folder first.
						const workspaceId = destination.workspaceId;
						const existing = (folders ?? []).find((folder) => folder.workspaceId === workspaceId && folder.name === RESTORED_FOLDER_NAME) ?? null;
						const ensureFolder = () => {
							if (existing !== null) return Promise.resolve(existing.id);
							return callFolderRoute(CREATE_ROUTE, { workspaceId, name: RESTORED_FOLDER_NAME }).then((payload) => {
								const folderId = payload?.id;
								if (typeof folderId !== "string") throw new Error("create failed");
								return folderId;
							});
						};
						return ensureFolder()
							.then((folderId) => callFolderRoute(MOVE_ROUTE, { sessionId, folderId }))
							.then(() => callFolderRoute(UNARCHIVE_ROUTE, { sessionId }));
					})();
				return flow
					.then(() => Promise.all([refreshWorkspaces(), fetchFolders()]))
					.finally(() => setBusy(false));
			};
			/** Create (or reuse the workspace's blank) session and land it in the
			 * given folder. Resolves with the session id; the caller navigates. */
			const createInFolder = (workspaceId, folderId) => {
				setBusy(true);
				return connectWorkspace(workspaceId)
					.then((sessionId) =>
						callFolderRoute(MOVE_ROUTE, { sessionId, folderId })
							.then(() => Promise.all([refreshWorkspaces(), fetchFolders()]))
							.then(() => sessionId))
					.finally(() => setBusy(false));
			};
			/** Drag a folder to a new position inside its workspace (folders always stay above the loose sessions). */
		/** Compute the id list after dragging one id before/after another:
		 * the dragged id leaves its current position and is spliced back in next to
		 * the target (shared by the folder and workspace reorder flows). Returns
		 * null when the target is not in the list (drop outside a reorder row). */
		const reorderIds = (ids, draggingId, targetId, before) => {
			const rest = ids.filter((id) => id !== draggingId);
			const anchor = rest.indexOf(targetId);
			if (anchor === -1) return null;
			rest.splice(before ? anchor : anchor + 1, 0, draggingId);
			return rest;
		};
		/** Drag a folder to a new position inside its workspace (folders always stay above the loose sessions). */
		const reorderFolders = (workspaceId, folderId, targetId, before) => {
			const ordered = (folders ?? [])
				.filter((folder) => folder.workspaceId === workspaceId)
				.slice()
				.sort(byFolderOrder);
			const next = reorderIds(ordered.map((folder) => folder.id), folderId, targetId, before);
			if (next === null) return;
			mutateFolders(REORDER_FOLDERS_ROUTE, { workspaceId, orderedIds: next });
		};
		/** Drag a workspace to a new position among the live workspace rows (Ungrouped stays last). */
		const reorderWorkspaces = (workspaceId, targetId, before) => {
			const next = reorderIds(view.groups.map((group) => group.key).filter((key) => key !== ""), workspaceId, targetId, before);
			if (next === null) return;
			mutateFolders(REORDER_WORKSPACES_ROUTE, { orderedIds: next });
		};
		/** Build the before/after drag-over and drop handlers shared by the folder
		 * and workspace (group) reorder rows. The caller supplies the row's key
		 * prefix ("folder:" / "group:"), the same-kind check, the workspace match
		 * (folders: only a folder row of the dragged folder's workspace; groups:
		 * only a real workspace row other than the dragged one), the not-self
		 * check, the target guard (the Ungrouped row is never a reorder target),
		 * whether the row stops event propagation (folder rows sit inside nested
		 * drop targets and must), and the reorder callback. */
		const reorderDragHandlers = (keyPrefix, rowId, options) => {
			const targetKey = keyPrefix + rowId;
			const canDrop = (info) => info !== null && options.sameKind(info) && options.workspaceMatch(info) && !options.notSelf(info) && !options.targetGuard();
			const dragOver = (event) => {
				const info = dragInfo.current;
				if (!canDrop(info)) return;
				if (options.stopPropagation) event.stopPropagation();
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				const rect = event.currentTarget.getBoundingClientRect();
				setDragOver(targetKey + ":" + (event.clientY < rect.top + rect.height / 2 ? "before" : "after"));
			};
			const drop = (event) => {
				const info = dragInfo.current;
				if (!canDrop(info)) return;
				if (options.stopPropagation) event.stopPropagation();
				event.preventDefault();
				const position = dragOver !== null && dragOver.startsWith(targetKey + ":") ? dragOver.slice(targetKey.length + 1) : "after";
				setDragOver(null);
				options.onReorder(info, position === "before");
			};
			return { dragOver, drop };
		};
		/** Pin or unpin a session: pinned sessions sit first in their folder or loose bucket. */
			const pinSession = (sessionId, pinned) => {
				mutateFolders(PIN_ROUTE, { sessionId, pinned });
			};
			/** Open the row context menu at the pointer position. */
			const openContextMenu = (event, menu) => {
				event.preventDefault();
				setContextMenu({ left: event.clientX, top: event.clientY, ...menu });
			};
			//#endregion
			//#region row factories
			/** Status dot with a stable-size placeholder slot for no-status rows. */
			const renderStatusDot = (status) => e("span", { className: "dsh-ff__dot" },
				e(primitives.StateDot, { state: status ?? "idle", size: 10 }));
			/** Pin icon (struck variant for Unpin); size defaults to the menu 14px. */
			const pinIcon = (struck, size = 14) => e("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true"
			},
				e("path", { key: "pin", d: "M13.5 8.5c0 4.4-5.5 6.5-5.5 6.5s-5.5-2.1-5.5-6.5a5.5 5.5 0 0 1 11 0Z" }),
				e("circle", { key: "dot", cx: "8", cy: "8.5", r: "2" }),
				struck ? e("line", { key: "strike", x1: "2.5", y1: "2.5", x2: "13.5", y2: "13.5" }) : null
			);
			/** Archive icon (struck variant while the archive block is shown). */
			const archiveIcon = (struck, size = 14) => e("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true"
			},
				e("path", { key: "lid", d: "M2.5 3.5h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" }),
				e("path", { key: "box", d: "M3 6.5h10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z" }),
				e("path", { key: "tuck", d: "M6.5 9.5h3" }),
				struck ? e("line", { key: "strike", x1: "2.5", y1: "2.5", x2: "13.5", y2: "13.5" }) : null
			);
			/** Restore-from-archive icon: box with an up arrow leaving it. */
			const restoreIcon = (size = 16) => e("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.4,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true"
			},
				e("path", { key: "lid", d: "M2.5 3.5h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" }),
				e("path", { key: "box", d: "M3 6.5h10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z" }),
				e("path", { key: "arrow", d: "M8 11.5v-4.5M5.75 9.25 8 6.75l2.25 2.25" })
			);
			const groupMenuItems = (group) => [
				{ id: "rename", label: t("menu.rename"), icon: e(primitives.IconEditOutline16, {}) },
				{ id: "delete", label: t("delete.workspace"), danger: true, icon: e(primitives.IconTrashOutline16, {}) },
				{ id: "new-folder", label: t("menu.newFolder"), icon: e(primitives.IconPlusOutline16, {}) }
			];
			const folderMenuItems = () => [
				{ id: "rename", label: t("menu.rename"), icon: e(primitives.IconEditOutline16, {}) },
				{ id: "delete", label: t("delete.folder"), danger: true, icon: e(primitives.IconTrashOutline16, {}) }
			];
			/** Whether a session sits in a pinned list (folder or loose bucket). */
			const isSessionPinned = (summary) => {
				const folder = view.folderOf.get(summary.id);
				if (folder !== void 0) return (folder.pinnedSessionIds ?? []).includes(summary.id);
				const workspace = view.sessionWorkspace.get(summary.id);
				return workspace !== void 0 && ((view.loosePinnedByWorkspace ?? {})[workspace.workspaceId] ?? []).includes(summary.id);
			};
			const sessionMenuItems = (summary) => {
				const workspace = view.sessionWorkspace.get(summary.id);
				const isPinned = isSessionPinned(summary);
				const folderOptions = workspace === void 0 || folders === null
					? []
					: folders
						.filter((candidate) => candidate.workspaceId === workspace.workspaceId && (candidate.name !== RESTORED_FOLDER_NAME || (candidate.sessionIds ?? []).some((id) => sessionVisible(list.byId[id], archivedSet))))
						.sort(byFolderName);
				// Creating a folder is always possible for a session of a known
				// workspace, so the move submenu stays enabled even with zero folders.
				const moveDisabled = workspace === void 0;
				return [
					{ id: "rename", label: t("menu.rename"), icon: e(primitives.IconEditOutline16, {}) },
					isPinned
						? { id: "unpin", label: t("menu.unpin"), icon: pinIcon(true) }
						: { id: "pin", label: t("menu.pin"), disabled: workspace === void 0, icon: pinIcon(false) },
					{ id: "fork", label: t("menu.fork"), icon: e(primitives.IconBranchOutline16, {}) },
					{
						id: "move",
						label: t("menu.moveToFolder"),
						disabled: moveDisabled,
						icon: e(primitives.IconFolderOpenOutline16, {}),
						submenu: [
							{ id: "move-inbox", label: t("move.inbox"), icon: e(primitives.IconPanelLeftOutline16, {}) },
							...folderOptions.map((candidate) => ({ id: "move-folder:" + candidate.id, label: candidate.name })),
							{ id: "move-new-folder", label: t("menu.moveNewFolder"), icon: e(primitives.IconPlusOutline16, {}) }
						]
					},
					{ id: "archive", label: t("menu.archiveSession"), icon: e(primitives.IconArchiveOutline20, {}) }
				];
			};
			//#endregion
			//#region handlers
			const handleGroupMenu = (group, id) => {
				if (id === "rename") setDialog({ kind: "rename-workspace", id: group.workspaceId, draft: group.title, error: null });
				else if (id === "delete") setDialog({ kind: "delete-workspace", id: group.workspaceId, name: group.title, acknowledged: false, pending: false, error: null });
				else if (id === "new-folder") setDialog({ kind: "new-folder", workspaceId: group.workspaceId, draft: "", error: null });
			};
			const handleFolderMenu = (folder, id) => {
				if (id === "rename") setDialog({ kind: "rename-folder", id: folder.id, draft: folder.name, error: null });
				else if (id === "delete") setDialog({ kind: "delete-folder", id: folder.id, name: folder.name, acknowledged: false, pending: false, error: null });
			};
			const handleSessionMenu = (summary, id) => {
				if (id === "rename") setDialog({ kind: "rename-session", id: summary.id, draft: summary.displayTitle, error: null });
				else if (id === "fork") forkSession(summary.id);
				else if (id === "pin" || id === "unpin") pinSession(summary.id, id === "pin");
				else if (id === "move-inbox") moveSessionToFolder(summary.id, null);
				else if (id.startsWith("move-folder:")) moveSessionToFolder(summary.id, id.slice("move-folder:".length));
				else if (id === "move-new-folder") {
					const workspace = view.sessionWorkspace.get(summary.id);
					if (workspace !== void 0) setDialog({ kind: "new-folder", workspaceId: workspace.workspaceId, draft: "", error: null, pendingSessionId: summary.id });
				}
				else if (id === "archive") {
					archiveSession(summary.id).catch((error) => {
						setNotice({ kind: "error", text: error.message ?? t("error.actionFailed") });
					});
				}
			};
			const handleNewWorkspace = () => {
				if (!wide) expandSidebar();
				setDialog({ kind: "new-workspace", error: null, pending: false });
			};
			//#endregion
			//#region session rows
			/** Session-drop guard: only sessions of the same workspace may land here. */
			const dropGuard = (workspaceId, event) => {
				const info = dragInfo.current;
				if (info === null || info.kind !== "session" || info.workspaceId !== workspaceId) return false;
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				return true;
			};
			const renderSessionRow = (summary) => {
				const status = rowStatusDot(summary);
				const statusText = statusAria(status, t);
				const timeText = timeLabel(summary.updatedAt, now, t);
				const selected = summary.id === list.current;
				const workspaceId = view.sessionWorkspace.get(summary.id)?.workspaceId;
				return e("div", {
					key: summary.id,
					role: "treeitem",
					className: "dsh-ff__session-row" + (selected ? " dsh-ff__session-row--selected" : ""),
					"aria-selected": selected ? true : void 0,
					title: statusText === "" ? timeText : statusText + " · " + timeText,
					onClick: () => open(summary.id),
					draggable: true,
					onDragStart: (event) => {
						event.dataTransfer.setData("text/plain", summary.id);
						event.dataTransfer.effectAllowed = "move";
						dragInfo.current = { kind: "session", sessionId: summary.id, workspaceId };
					},
					onDragEnd: clearDrag,
					onContextMenu: (event) => openContextMenu(event, { kind: "session", sessionId: summary.id })
				},
					e("span", { className: "dsh-ff__slot" }, status !== null
						? e(primitives.StateDot, { state: status, size: 10 })
						: isSessionPinned(summary) ? pinIcon(false, 10) : null),
					e("span", { className: "dsh-ff__title" }, summary.displayTitle),
					e("span", { className: "dsh-ff__time-area" },
						e("span", { className: "dsh-ff__time" }, timeText),
						e("button", {
							type: "button",
							className: "dsh-ff__row-archive",
							"aria-label": t("menu.archiveSession"),
							title: t("menu.archiveSession"),
							onClick: (event) => {
								event.stopPropagation();
								archiveSession(summary.id).catch((error) => {
									setNotice({ kind: "error", text: error.message ?? t("error.actionFailed") });
								});
							}
						}, e(primitives.IconArchiveOutline20, { size: 14 }))
					)
				);
			};
			const renderSearchRow = (row) => {
				const status = rowStatusDot(row);
				const statusText = statusAria(status, t);
				const selected = row.id === list.current;
				return e("div", {
					key: row.id,
					role: "treeitem",
					className: "dsh-ff__session-row" + (selected ? " dsh-ff__session-row--selected" : ""),
					"aria-selected": selected ? true : void 0,
					title: statusText === "" ? row.workspace : statusText + " · " + row.workspace,
					onClick: () => open(row.id)
				},
					renderStatusDot(status),
					e("span", { className: "dsh-ff__title" }, row.title),
					e("span", { className: "dsh-ff__search-meta" }, row.workspace),
					row.snippet !== void 0 && e("span", { className: "dsh-ff__search-snippet" }, row.snippet)
				);
			};
			//#endregion
			//#region folder/group rows
			/** "Show N more / Show less" row for a session list (folders and the
			 * Archive block). Key is unique per list; total counts visible rows. */
			const renderMoreToggle = (key, total) => total > ARCHIVE_ROW_LIMIT
				? e("div", {
					key: "more:" + key,
					role: "button",
					tabIndex: 0,
					className: "dsh-ff__rows-more",
					"aria-expanded": moreShown.has(key),
					onClick: () => {
						setMoreShown((prev) => {
							const next = /* @__PURE__ */ new Set(prev);
							if (next.has(key)) next.delete(key);
							else next.add(key);
							return next;
						});
					},
					onKeyDown: (event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							event.currentTarget.click();
						}
					}
				}, moreShown.has(key) ? t("sessions.collapse") : t("sessions.expand", { n: total - ARCHIVE_ROW_LIMIT }))
				: null;
			const renderFolderRow = (group, folder) => {
				const expanded = collapsedFolders[folder.id] !== true;
				const targetKey = "folder:" + folder.id;
				const isTarget = dragOver !== null && dragOver.startsWith(targetKey + ":");
				const targetPos = isTarget ? dragOver.slice(targetKey.length + 1) : "";
				const reorderHandlers = reorderDragHandlers("folder:", folder.id, {
					sameKind: (info) => info.kind === "folder",
					workspaceMatch: (info) => info.workspaceId === group.workspaceId,
					notSelf: (info) => info.folderId === folder.id,
					targetGuard: () => false,
					stopPropagation: true,
					onReorder: (info, before) => reorderFolders(group.workspaceId, info.folderId, folder.id, before)
				});
				return e("div", {
					key: folder.id,
					className: "dsh-ff__folder",
					onDragOver: (event) => {
						// A session that already lives in this folder cannot be
						// moved into it — never offer it as a drop target
						// (archived sessions are the exception: dropping them
						// here restores them in place).
						const info = dragInfo.current;
						if (info !== null && info.kind === "session" && info.fromArchive !== true && view.folderOf.get(info.sessionId)?.id === folder.id) return;
						if (dropGuard(group.workspaceId, event)) setDragOver(targetKey + ":into");
					},
					onDragLeave: (event) => {
						// Crossing child elements fires dragleave on the wrapper;
						// ignore those (the pointer is still inside the folder),
						// otherwise the highlight flickers with every child boundary.
						if (dragOver !== null && dragOver.startsWith(targetKey)) {
							const next = event.relatedTarget;
							if (next instanceof Node && event.currentTarget.contains(next)) return;
							setDragOver(null);
						}
					},
					onDrop: (event) => {
						const info = dragInfo.current;
						event.preventDefault();
						setDragOver(null);
						if (info !== null && info.kind === "session" && info.workspaceId === group.workspaceId && (info.fromArchive === true || view.folderOf.get(info.sessionId)?.id !== folder.id)) {
							if (info.fromArchive === true) {
								restoreSession(info.sessionId, { kind: "target", folderId: folder.id }).catch((error) => {
									setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
								});
							} else {
								moveSessionToFolder(info.sessionId, folder.id);
							}
						}
					}
				},
					e("div", {
						role: "treeitem",
						"aria-expanded": expanded,
						draggable: true,
						className: "dsh-ff__folder-row" + (isTarget
							? " dsh-ff__folder-row--" + (targetPos === "into" ? "target" : "target-" + targetPos)
							: ""),
						onClick: () => actions.setFolderCollapsed(folder.id, expanded),
						onContextMenu: (event) => openContextMenu(event, { kind: "folder", folderId: folder.id }),
						onDragStart: (event) => {
							event.dataTransfer.setData("text/plain", folder.id);
							event.dataTransfer.effectAllowed = "move";
							dragInfo.current = { kind: "folder", folderId: folder.id, workspaceId: group.workspaceId };
						},
						onDragEnd: clearDrag,
						onDragOver: reorderHandlers.dragOver,
						onDrop: reorderHandlers.drop
					},
						e("span", { className: "dsh-ff__folder-icon" }, expanded ? e(primitives.IconFolderOpen16, {}) : e(primitives.IconFolderClose16, {})),
						e("span", { className: "dsh-ff__title" }, folder.name),
						e("button", {
							type: "button",
							className: "dsh-ff__icon-button",
							"aria-label": t("actions.newSession.aria", { name: folder.name }),
							title: t("actions.newSession.aria", { name: folder.name }),
							onClick: (event) => {
								event.stopPropagation();
								createInFolder(group.workspaceId, folder.id)
									.then((sessionId) => open(sessionId))
									.catch((error) => {
										setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
									});
							}
						}, e(primitives.IconPlusOutline16, { size: 12 })),
						e("span", { className: "dsh-ff__folder-count" }, String(folder.sessions.length))
					),
					expanded && (moreShown.has(folder.id) ? folder.sessions : folder.sessions.slice(0, ARCHIVE_ROW_LIMIT)).map((summary) => renderSessionRow(summary)),
					expanded && renderMoreToggle(folder.id, folder.sessions.length)
				);
			};
			/** Row for a session inside the Archive block: dimmed, draggable to
			 * restore (the drop lands it in a folder or the loose area and
			 * un-archives it). No context menu — restore happens by dragging. */
			const renderArchiveRow = (summary) => {
				const status = rowStatusDot(summary);
				const statusText = statusAria(status, t);
				const timeText = timeLabel(summary.updatedAt, now, t);
				const selected = summary.id === list.current;
				return e("div", {
					key: summary.id,
					role: "treeitem",
					className: "dsh-ff__session-row dsh-ff__archive-row" + (selected ? " dsh-ff__session-row--selected" : ""),
					"aria-selected": selected ? true : void 0,
					title: (statusText === "" ? "" : statusText + " · ") + timeText,
					// Clicking restores the session first: the runtime clears an
					// archived current, so a session can only open after un-archiving.
					onClick: () => {
						restoreSession(summary.id, { kind: "restored", workspaceId: view.sessionWorkspace.get(summary.id)?.workspaceId })
							.then(() => open(summary.id))
							.catch((error) => {
								setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
							});
					},
					onContextMenu: (event) => openContextMenu(event, { kind: "session", sessionId: summary.id, workspaceId: view.sessionWorkspace.get(summary.id)?.workspaceId, fromArchive: true }),
					draggable: true,
					onDragStart: (event) => {
						event.dataTransfer.setData("text/plain", summary.id);
						event.dataTransfer.effectAllowed = "move";
						dragInfo.current = { kind: "session", sessionId: summary.id, workspaceId: view.sessionWorkspace.get(summary.id)?.workspaceId, fromArchive: true };
					},
					onDragEnd: clearDrag
				},
					e("span", { className: "dsh-ff__slot" }, status !== null ? e(primitives.StateDot, { state: status, size: 10 }) : null),
					e("span", { className: "dsh-ff__title" }, summary.displayTitle),
					e("span", { className: "dsh-ff__time" }, timeText)
				);
			};
			/** The virtual "Archive" folder: every archived session of the
			 * workspace, shown on demand via the workspace row's archive button.
			 * A drop here archives the session (same as the context-menu action);
			 * dropping an archived session elsewhere restores it. The block
			 * appears collapsed; the folder row expands/collapses the list. */
			const renderArchiveBlock = (group) => {
				const workspaceId = group.workspaceId;
				const targetKey = "archive:" + workspaceId;
				const isTarget = dragOver === targetKey;
				// Default collapsed: only the folder row until the user expands it.
				const expanded = collapsedFolders[targetKey] === true;
				const sessions = archivedByWorkspace.get(workspaceId) ?? [];
				return e("div", {
					key: targetKey,
					className: "dsh-ff__folder",
					onDragOver: (event) => {
						const info = dragInfo.current;
						// Archived sessions cannot be archived again.
						if (info !== null && info.kind === "session" && info.workspaceId === workspaceId && info.fromArchive === true) return;
						if (dropGuard(workspaceId, event)) setDragOver(targetKey);
					},
					onDragLeave: (event) => {
						if (dragOver === targetKey) {
							const next = event.relatedTarget;
							if (next instanceof Node && event.currentTarget.contains(next)) return;
							setDragOver(null);
						}
					},
					onDrop: (event) => {
						const info = dragInfo.current;
						event.preventDefault();
						setDragOver(null);
						if (info !== null && info.kind === "session" && info.workspaceId === workspaceId && info.fromArchive !== true) {
							archiveSession(info.sessionId).catch((error) => {
								setNotice({ kind: "error", text: error.message ?? t("error.actionFailed") });
							});
						}
					}
				},
					e("div", {
						role: "treeitem",
						"aria-expanded": expanded,
						className: "dsh-ff__folder-row" + (isTarget ? " dsh-ff__folder-row--target" : ""),
						// The virtual folder defaults collapsed (expanded === true
						// means open), so the toggle stores the inverted state.
						onClick: () => actions.setFolderCollapsed(targetKey, !expanded),
						onContextMenu: (event) => event.preventDefault()
					},
						e("span", { className: "dsh-ff__folder-icon" }, e(primitives.IconArchiveOutline20, { size: 16 })),
						e("span", { className: "dsh-ff__title" }, t("archive.folder")),
						e("span", { className: "dsh-ff__folder-count" }, String(sessions.length))
					),
					expanded && (moreShown.has("archive:" + workspaceId) ? sessions : sessions.slice(0, ARCHIVE_ROW_LIMIT)).map((summary) => renderArchiveRow(summary)),
					expanded && renderMoreToggle("archive:" + workspaceId, sessions.length)
				);
			};
			const renderLooseArea = (group) => {
				const workspaceId = group.workspaceId;
				const targetKey = "loose:" + workspaceId;
				return e("div", {
					key: "loose:" + workspaceId,
					className: "dsh-ff__loose" + (dragOver === targetKey ? " dsh-ff__loose--target" : ""),
					onDragOver: (event) => { if (dropGuard(workspaceId, event)) setDragOver(targetKey); },
					onDragLeave: () => { if (dragOver === targetKey) setDragOver(null); },
					onDrop: (event) => {
						const info = dragInfo.current;
						event.preventDefault();
						setDragOver(null);
						if (info !== null && info.kind === "session" && info.workspaceId === workspaceId) {
							if (info.fromArchive === true) {
								restoreSession(info.sessionId, { kind: "target", folderId: null }).catch((error) => {
									setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
								});
							} else {
								moveSessionToFolder(info.sessionId, null);
							}
						}
					}
				}, group.loose.map((summary) => renderSessionRow(summary)));
			};
			const renderGroupRow = (group) => {
				const isUngrouped = group.workspaceId === void 0;
				const expanded = collapsedGroups[group.key] !== true;
				const targetKey = "group:" + group.key;
				const isTarget = dragOver !== null && dragOver.startsWith(targetKey + ":");
				const targetPos = isTarget ? dragOver.slice(targetKey.length + 1) : "";
				const reorderHandlers = reorderDragHandlers("group:", group.key, {
					sameKind: (info) => info.kind === "workspace",
					workspaceMatch: (info) => info.workspaceId !== group.workspaceId,
					notSelf: () => false,
					targetGuard: () => isUngrouped,
					stopPropagation: false,
					onReorder: (info, before) => reorderWorkspaces(info.workspaceId, group.workspaceId, before)
				});
				return e("div", {
					key: group.key,
					role: "treeitem",
					"aria-expanded": expanded,
					draggable: !isUngrouped,
					className: "dsh-ff__group-row" + (isTarget
						? " dsh-ff__group-row--" + (targetPos === "into" ? "target" : "target-" + targetPos)
						: ""),
					onClick: () => actions.setGroupCollapsed(group.key, expanded),
					onContextMenu: !isUngrouped ? (event) => openContextMenu(event, { kind: "workspace", groupKey: group.key }) : void 0,
					onDragStart: (event) => {
						if (isUngrouped) { event.preventDefault(); return; }
						event.dataTransfer.setData("text/plain", group.key);
						event.dataTransfer.effectAllowed = "move";
						dragInfo.current = { kind: "workspace", workspaceId: group.workspaceId };
					},
					onDragEnd: clearDrag,
					onDragOver: reorderHandlers.dragOver,
					onDrop: reorderHandlers.drop
				},
					e("span", { className: "dsh-ff__folder-icon" }, expanded ? e(primitives.IconFolderOpen16, {}) : e(primitives.IconFolderClose16, {})),
					e("span", { className: "dsh-ff__title" }, group.title),
					!isUngrouped && group.path !== void 0 && e("button", {
						type: "button",
						className: "dsh-ff__icon-button",
						"aria-label": t("actions.openFolder.aria"),
						title: t("actions.openFolder.aria"),
						onClick: (event) => {
							event.stopPropagation();
							openWorkspaceFolder(group.path).catch((error) => {
								setNotice({ kind: "error", text: error.message ?? t("error.actionFailed") });
							});
						}
					}, e(primitives.IconFolderOpen16, { size: 14 })),
					!isUngrouped && e("button", {
						type: "button",
						className: "dsh-ff__icon-button",
						"aria-label": t("actions.newSession.aria", { name: group.title }),
						title: t("actions.newSession.aria", { name: group.title }),
						onClick: (event) => {
							event.stopPropagation();
							if (startSession !== void 0) startSession(group.workspaceId);
						}
					}, e(primitives.IconPlusOutline16, {})),
					!isUngrouped && e("button", {
						type: "button",
						className: "dsh-ff__icon-button",
						"aria-label": archiveShown[group.workspaceId] === true ? t("archive.hide") : t("archive.show"),
						title: archiveShown[group.workspaceId] === true ? t("archive.hide") : t("archive.show"),
						onClick: (event) => {
							event.stopPropagation();
							const show = archiveShown[group.workspaceId] !== true;
							actions.setArchiveShown(group.workspaceId, show);
							// Showing the archive also opens the folder (the
							// "archive:<workspaceId>" key stores the collapsed
							// state inverted: true = expanded).
							if (show) actions.setFolderCollapsed("archive:" + group.workspaceId, true);
						}
					}, archiveIcon(archiveShown[group.workspaceId] === true, 16))
				);
			};
			const renderGroup = (group) => {
				const expanded = collapsedGroups[group.key] !== true;
				const body = [];
				if (expanded) {
					if (group.workspaceId !== void 0 && archiveShown[group.workspaceId] === true) body.push(renderArchiveBlock(group));
					for (const folder of group.folders) body.push(renderFolderRow(group, folder));
					body.push(renderLooseArea(group));
				}
				return e(react.Fragment, { key: group.key },
					renderGroupRow(group),
					body.length > 0 ? body : null
				);
			};
			//#endregion
			//#region header
			const searchBox = e("div", { className: "dsh-ff__search" },
				e(primitives.IconSearchOutline16, {}),
				e("input", {
					ref: searchInput,
					className: "dsh-ff__search-input",
					value: query,
					placeholder: t("search.placeholder"),
					"aria-label": t("search.aria"),
					maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
					onChange: (event) => setQuery(sanitizeSearchQuery(event.target.value))
				}),
				query !== "" && e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("search.clear"),
					onClick: () => { setQuery(""); searchInput.current?.focus(); }
				}, e(primitives.IconCloseFill14, {}))
			);
			const openSearch = () => {
				if (!wide) {
					expandSidebar();
					setFocusSearch(true);
				}
				setSearchExpanded(true);
			};
			const allGroupKeys = view.groups.map((group) => group.key);
			const allFolderIds = folders === null ? [] : folders.map((folder) => folder.id);
			const header = e("div", { className: "dsh-ff__header" },
				wide && e("span", { className: "dsh-ff__header-title" }, t("section.workspaces")),
				e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("action.collapseAll"),
					title: t("action.collapseAll"),
					onClick: () => actions.collapseAll(allGroupKeys, allFolderIds)
				}, e("svg", {
					width: 14,
					height: 14,
					viewBox: "0 1 14 12",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.5,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true",
					children: [
						e("polyline", { key: "u", points: "3,2 7,6 11,2" }),
						e("polyline", { key: "d", points: "3,12 7,8 11,12" })
					]
				})),
				e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("action.expandAll"),
					title: t("action.expandAll"),
					onClick: () => actions.expandAll(allGroupKeys, allFolderIds)
				}, e("svg", {
					width: 14,
					height: 14,
					viewBox: "0 1 14 12",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.5,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true",
					children: [
						e("polyline", { key: "u", points: "3,6 7,2 11,6" }),
						e("polyline", { key: "d", points: "3,8 7,12 11,8" })
					]
				})),
				wide && (searchExpanded || trimmedQuery !== "" ? searchBox : e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("search.aria"),
					title: t("search.aria"),
					onClick: openSearch
				}, e(primitives.IconSearchOutline16, {}))),
				!wide && e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("search.aria"),
					title: t("search.aria"),
					onClick: openSearch
				}, e(primitives.IconSearchOutline16, {})),
				e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("menu.newWorkspace"),
					title: t("menu.newWorkspace"),
					onClick: handleNewWorkspace
				}, e(primitives.IconProjectAddOutline16, {}))
			);
			//#endregion
			//#region list
			const noticeBar = (notice !== null || foldersError !== null) && e("div", { className: "dsh-ff__notice dsh-ff__notice--error", role: "alert" },
				e("span", { className: "dsh-ff__notice-text" }, notice !== null ? notice.text : t("error.folderLoadFailed")),
				e("button", {
					type: "button",
					className: "dsh-ff__notice-dismiss",
					"aria-label": t("notice.dismiss"),
					title: t("notice.dismiss"),
					onClick: () => { setNotice(null); setFoldersError(null); }
				}, e(primitives.IconCloseFill14, {}))
			);
			const browserList = view.groups.length === 0 && view.ungrouped === null
				? e("div", { className: "dsh-ff__empty" }, t("empty.none"))
				: e(react.Fragment, {},
					view.groups.map(renderGroup),
					view.ungrouped !== null && renderGroup(view.ungrouped)
				);
			const searchList = results === null
				? null
				: remoteSearch.status === "loading"
				? e("div", { className: "dsh-ff__search-hint" }, t("search.pending"))
				: remoteSearch.status === "unavailable"
				? e("div", { className: "dsh-ff__search-hint" }, t("search.unavailable"))
				: results.rows.length === 0
				? e("div", { className: "dsh-ff__search-hint" }, t("search.noMatches"))
				: e("div", { className: "dsh-ff__results" },
					results.rows.map(renderSearchRow),
					results.hasMore && e("div", { className: "dsh-ff__search-hint" }, t("search.hasMore", { n: searchResultLimit }))
				);
			//#endregion
			//#region dialogs
			/** Shared footer + body for the rename modals. */
			const renderRenameDialog = (titleKey, fieldLabel, value, error, pending, onChange, onConfirm, confirmLabel) => e(primitives.Modal, {
				open: true,
				onClose: pending === true ? () => {} : () => setDialog(null),
				title: t(titleKey),
				closeLabel: t("close"),
				footer: e(react.Fragment, {},
					e(primitives.Button, { variant: "outline", onClick: () => setDialog(null), disabled: pending === true }, t("cancel")),
					e(primitives.Button, { variant: "primary", onClick: onConfirm, disabled: pending === true || value.trim() === "" }, confirmLabel)
				)
			},
				e("div", { className: "dsh-ff__dialog-body" },
					e(primitives.Input, {
						className: "dsh-ff__dialog-input",
						value,
						"aria-label": t(fieldLabel),
						autoFocus: true,
						onChange,
						onKeyDown: (event) => { if (event.key === "Enter") onConfirm(); }
					}),
					error !== null && error !== void 0 && e("div", { className: "dsh-ff__notice dsh-ff__notice--error" }, error)
				)
			);
			const renderRiskDialog = (titleKey, descKey, name, acknowledged, pending, onAcknowledgedChange, onConfirm) => e(primitives.RiskConfirmation, {
				open: true,
				title: t(titleKey),
				description: t(descKey, { name }),
				acknowledgeLabel: t("delete.acknowledge"),
				cancelLabel: t("cancel"),
				confirmLabel: t("delete"),
				acknowledged,
				disabled: pending === true,
				onAcknowledgedChange: onAcknowledgedChange,
				onCancel: () => setDialog(null),
				onConfirm
			});
			/** New-workspace: choose a directory via the host picker, then create. */
			const chooseDirectory = () => {
				setDialog((current) => (current === null ? current : { ...current, pending: true, error: null }));
				pickDirectory().then(async (path) => {
					if (path === null) {
						setDialog((current) => (current === null ? current : { ...current, pending: false }));
						return;
					}
					const result = await createWorkspace({ path });
					if (result == null || result.ok !== true) {
						const message = result?.error?.message ?? t("workspaceCreateFailed");
						throw new Error(message);
					}
					setDialog(null);
				}).catch((error) => {
					setDialog((current) => (current === null ? current : { ...current, pending: false, error: error.message ?? t("workspaceCreateFailed") }));
				});
			};
			const confirmRenameSession = () => {
				const title = dialog.draft.trim();
				if (title === "") return;
				setDialog((current) => ({ ...current, pending: true }));
				renameSession(dialog.id, title).then(() => setDialog(null)).catch((error) => {
					setDialog((current) => ({ ...current, pending: false, error: error.message ?? t("error.actionFailed") }));
				});
			};
			const confirmRenameWorkspace = () => {
				const title = dialog.draft.trim();
				if (title === "") return;
				setDialog((current) => ({ ...current, pending: true }));
				renameWorkspace(dialog.id, title).then(() => setDialog(null)).catch((error) => {
					setDialog((current) => ({ ...current, pending: false, error: error.message ?? t("error.actionFailed") }));
				});
			};
			const confirmRenameFolder = () => {
				const folderName = dialog.draft.trim();
				if (folderName === "" || folderName.length > MAX_FOLDER_NAME_LENGTH) return;
				setDialog((current) => ({ ...current, pending: true }));
				callFolderRoute(RENAME_ROUTE, { folderId: dialog.id, name: folderName }).then(() => {
					setDialog(null);
					setNotice(null);
					fetchFolders();
				}).catch((error) => {
					setDialog((current) => ({ ...current, pending: false, error: folderErrorText(error.message ?? "request-failed", t) }));
				});
			};
			const confirmNewFolder = () => {
				const folderName = dialog.draft.trim();
				if (folderName === "" || folderName.length > MAX_FOLDER_NAME_LENGTH) return;
				// The flow from "New folder…" (move submenu): create the folder first, then
				// move the pending session into it. A create failure keeps the dialog
				// open with its error; a move failure after a successful create closes
				// the dialog and surfaces the error in the notice bar (the folder
				// exists and is refetched into the list).
				const pendingSessionId = dialog.pendingSessionId ?? null;
				setDialog((current) => ({ ...current, pending: true }));
				callFolderRoute(CREATE_ROUTE, { workspaceId: dialog.workspaceId, name: folderName }).then((payload) => {
					const folderId = payload?.id;
					if (pendingSessionId === null || folderId === void 0) {
						setDialog(null);
						setNotice(null);
						fetchFolders();
						return;
					}
					return callFolderRoute(MOVE_ROUTE, { sessionId: pendingSessionId, folderId }).then(() => {
						setDialog(null);
						setNotice(null);
						fetchFolders();
					}).catch((error) => {
						setDialog(null);
						setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
						fetchFolders();
					});
				}).catch((error) => {
					setDialog((current) => ({ ...current, pending: false, error: folderErrorText(error.message ?? "request-failed", t) }));
				});
			};
			const confirmDeleteFolder = () => {
				setDialog((current) => ({ ...current, pending: true }));
				callFolderRoute(DELETE_ROUTE, { folderId: dialog.id }).then(() => {
					setDialog(null);
					setNotice(null);
					fetchFolders();
				}).catch((error) => {
					setDialog((current) => ({ ...current, pending: false }));
					setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
				});
			};
			const confirmDeleteWorkspace = () => {
				setDialog((current) => ({ ...current, pending: true }));
				deleteWorkspace(dialog.id).then(() => {
					setDialog(null);
					fetchFolders();
				}).catch((error) => {
					setDialog((current) => ({ ...current, pending: false }));
					setNotice({ kind: "error", text: error.message ?? t("error.actionFailed") });
				});
			};
			/** Render the active modal (one dialog at a time by construction). */
			const renderDialog = () => {
				if (dialog === null) return null;
				if (dialog.kind === "new-workspace") {
					return e(primitives.Modal, {
						open: true,
						onClose: dialog.pending === true ? () => {} : () => setDialog(null),
						title: t("newWorkspace.title"),
						closeLabel: t("close"),
						footer: e(react.Fragment, {},
							e(primitives.Button, { variant: "outline", onClick: () => setDialog(null), disabled: dialog.pending === true }, t("cancel")),
							e(primitives.Button, { variant: "primary", onClick: chooseDirectory, disabled: dialog.pending === true }, dialog.pending === true ? t("newWorkspace.pending") : t("newWorkspace.choose"))
						)
					},
						e("div", { className: "dsh-ff__dialog-body" },
							e("div", { className: "dsh-ff__dialog-desc" }, t("newWorkspace.desc")),
							dialog.error !== null && e("div", { className: "dsh-ff__notice dsh-ff__notice--error" }, dialog.error)
						)
					);
				}
				if (dialog.kind === "rename-session") {
					return renderRenameDialog("rename.session.title", "field.sessionName", dialog.draft, dialog.error, dialog.pending,
						(event) => setDialog({ ...dialog, draft: event.target.value }),
						confirmRenameSession, t("rename"));
				}
				if (dialog.kind === "rename-workspace") {
					return renderRenameDialog("rename.workspace.title", "field.workspaceName", dialog.draft, dialog.error, dialog.pending,
						(event) => setDialog({ ...dialog, draft: event.target.value }),
						confirmRenameWorkspace, t("rename"));
				}
				if (dialog.kind === "rename-folder") {
					return renderRenameDialog("rename.folder.title", "field.folderName", dialog.draft, dialog.error, dialog.pending,
						(event) => setDialog({ ...dialog, draft: event.target.value }),
						confirmRenameFolder, t("rename"));
				}
				if (dialog.kind === "new-folder") {
					return renderRenameDialog("newFolder.title", "field.folderName", dialog.draft, dialog.error, dialog.pending,
						(event) => setDialog({ ...dialog, draft: event.target.value }),
						confirmNewFolder, t("newFolder.confirm"));
				}
				if (dialog.kind === "delete-folder") {
					return renderRiskDialog("delete.folder", "delete.folder.desc", dialog.name, dialog.acknowledged, dialog.pending,
						(value) => setDialog({ ...dialog, acknowledged: value }),
						confirmDeleteFolder);
				}
				if (dialog.kind === "delete-workspace") {
					return renderRiskDialog("delete.workspace", "delete.desc", dialog.name, dialog.acknowledged, dialog.pending,
						(value) => setDialog({ ...dialog, acknowledged: value }),
						confirmDeleteWorkspace);
				}
				return null;
			};
			//#endregion
			/** Viewport clamp estimates for the context menu (its list is ~360x300 at most). */
			const CONTEXT_MENU_CLAMP_WIDTH = 372;
			const CONTEXT_MENU_CLAMP_HEIGHT = 320;
			/** Render the row context menu (right-click), positioned at the cursor. */
			const renderContextMenu = () => {
				if (contextMenu === null) return null;
				const cm = contextMenu;
				let items = null;
				let onSelect = null;
				if (cm.kind === "session" && cm.fromArchive === true) {
					// Archived sessions have exactly one action: restore.
					items = [{ id: "restore-archive", label: t("menu.restore"), icon: restoreIcon(16) }];
					onSelect = (id) => {
						setContextMenu(null);
						if (id === "restore-archive") {
							restoreSession(cm.sessionId, { kind: "original" }).catch((error) => {
								setNotice({ kind: "error", text: folderErrorText(error.message ?? "request-failed", t) });
							});
						}
					};
				} else if (cm.kind === "session") {
					const summary = list.byId[cm.sessionId];
					if (summary !== void 0) {
						items = sessionMenuItems(summary);
						onSelect = (id) => { setContextMenu(null); handleSessionMenu(summary, id); };
					}
				} else if (cm.kind === "folder") {
					const folder = (folders ?? []).find((candidate) => candidate.id === cm.folderId);
					if (folder !== void 0) {
						items = folderMenuItems();
						onSelect = (id) => { setContextMenu(null); handleFolderMenu(folder, id); };
					}
				} else if (cm.kind === "workspace") {
					const group = view.groups.find((candidate) => candidate.key === cm.groupKey);
					if (group !== void 0) {
						items = groupMenuItems(group);
						onSelect = (id) => { setContextMenu(null); handleGroupMenu(group, id); };
					}
				}
				if (items === null) return null;
				// Anchor the menu at the cursor deterministically: a fixed, 0x0
				// layer portaled to document.body carries the Menu; the Menu's
				// list positions itself absolutely at (0, 100% + 4px) against
				// the layer (its root span is neutralized via dsh-ff__ctx-root),
				// so the layer starts 4px above the cursor to place the list
				// exactly at it.
				const layerLeft = Math.min(cm.left, window.innerWidth - CONTEXT_MENU_CLAMP_WIDTH);
				const layerTop = Math.max(0, Math.min(cm.top - 4, window.innerHeight - CONTEXT_MENU_CLAMP_HEIGHT));
				return reactDom.createPortal(
					e("div", {
						style: { position: "fixed", left: layerLeft, top: layerTop, width: 0, height: 0, zIndex: 1100 }
					},
					e(primitives.Menu, {
						open: true,
						className: "dsh-ff__ctx-root",
						items,
						onSelect,
						onClose: () => setContextMenu(null)
					})
					),
					document.body
				);
			};
			return e("div", { "data-dsh-session-folders": "" },
				header,
				noticeBar,
				e("div", { className: "dsh-ff__list" }, trimmedQuery !== "" && wide ? searchList : browserList),
				renderDialog(),
				renderContextMenu()
			);
		}
		//#region registration
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-session-folders: dictionaries");
			/** Entry inject: session/workspace actions behind the kit surface. */
			const injected = () => ({
				open: (sessionId) => { ctx.sessions.open(sessionId); },
				searchSessions: async (query, signal) => {
					const result = await ctx.sessions.search(query, signal);
					if (result.ok !== true) throw new Error(result.error.message);
					return result.value;
				},
				searchResultLimit: ctx.sessions.searchResultLimit,
				renameSession: async (sessionId, title) => {
					const session = ctx.sessions.binding(sessionId)?.session;
					if (session === void 0) throw new Error("unknown session " + sessionId);
					const result = await session.rename(title);
					if (result.ok !== true) throw new Error(result.error.message);
				},
				forkSession: (sessionId) => {
					ctx.sessions.fork({ sessionId, increaseTitle: true }).then((result) => {
						const childId = typeof result === "string" ? result : result?.value?.sessionId;
						if (childId !== void 0) ctx.sessions.open(childId);
					}).catch(() => {});
				},
				renameWorkspace: async (workspaceId, title) => { await ctx.workspaces.rename(workspaceId, title); },
				deleteWorkspace: async (workspaceId) => { await ctx.workspaces.delete(workspaceId); },
				archiveSession: async (sessionId) => { await ctx.workspaces.archiveSession(sessionId); },
				refreshWorkspaces: () => ctx.workspaces.refresh(),
				createWorkspace: (input) => ctx.workspaces.create(input),
				pickDirectory: () => ctx.workspaces.pickDirectory(),
				startSession: (workspaceId) => ctx.workspaces.startSession(workspaceId),
				connectWorkspace: (workspaceId) => ctx.workspaces.connectWorkspace(workspaceId),
				openWorkspaceFolder: (workspacePath) => ctx.workspaces.openPath(workspacePath),
			});
			ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
				name: "sidebar.workspaces",
				priority: -1,
				locale: NS,
				store: createFeatureFoldersViewStore(),
				children: {},
				inject: injected
			}, FeatureFoldersBrowser));
		}
		//#endregion
		module.exports = { name, inject, apply };
		return module.exports;
	}
});
