window.__ModuleLoader__.load({
	id: "dsh-session-folders",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
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
			"menu.newFolder": "新建文件夹",
			"menu.rename": "重命名",
			"menu.fork": "分叉会话",
			"menu.archiveSession": "归档会话",
			"menu.moveToFolder": "移动到文件夹…",
			"move.inbox": "Workspace",
			"newFolder.title": "新建文件夹",
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
			"menu.newFolder": "New folder",
			"menu.rename": "Rename",
			"menu.fork": "Fork session",
			"menu.archiveSession": "Archive session",
			"menu.moveToFolder": "Move to folder…",
			"move.inbox": "Workspace",
			"newFolder.title": "New folder",
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
.dsh-ff__session-row[draggable="true"] {
  cursor: grab;
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
					collapsedFolders: {}
				}),
				persist: VIEW_PERSIST_KEY,
				actions: {
					setGroupCollapsed: (d, key, collapsed) => {
						d.collapsedGroups[key] = collapsed;
					},
					setFolderCollapsed: (d, key, collapsed) => {
						d.collapsedFolders[key] = collapsed;
					},
					collapseAll: (d) => {
						for (const key of Object.keys(d.collapsedGroups)) d.collapsedGroups[key] = true;
						for (const key of Object.keys(d.collapsedFolders)) d.collapsedFolders[key] = true;
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
		* with alphabetical folders on top and the loose sessions below (both
		* newest-first), plus the Ungrouped bucket for sessions outside every
		* workspace (no folders there). Folder membership is resolved from the
		* folder records; a session in several folders (possible only via a stale
		* record) renders in the first one in alphabetical order.
		* @param list - sessions list snapshot.
		* @param workspaces - workspace items in stable Host order.
		* @param archived - archived id set.
		* @param folders - folder records from the host (null while loading).
		* @returns the derived view.
		*/
		function deriveView(list, workspaces, archived, folders) {
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
			for (const workspace of workspaces) {
				for (const id of workspace.sessionIds) {
					const summary = list.byId[id];
					if (summary !== void 0) {
						accounted.add(id);
						sessionWorkspace.set(id, workspace);
					}
				}
				const workspaceFolders = (foldersByWorkspace.get(workspace.workspaceId) ?? [])
					.slice()
					.sort(byFolderName)
					.map((folder) => ({
						id: folder.id,
						name: folder.name,
						sessions: folder.sessionIds
							.map((id) => list.byId[id])
							.filter(visible)
							.sort(byRecency)
					}));
				const inFolder = /* @__PURE__ */ new Set();
				for (const folder of workspaceFolders) {
					for (const session of folder.sessions) inFolder.add(session.id);
				}
				const loose = workspace.sessionIds
					.map((id) => list.byId[id])
					.filter(visible)
					.filter((summary) => !inFolder.has(summary.id))
					.sort(byRecency);
				groups.push({
					key: workspace.workspaceId,
					workspaceId: workspace.workspaceId,
					title: workspace.title,
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
				sessionWorkspace
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
				: code === "folder-load-failed" ? "folderLoadFailed"
				: "actionFailed");
			return t(key);
		}
		//#endregion
		//#region rows
		/**
		* The per-row ellipsis menu: anchor button + primitives Menu, owning its
		* open state. Submenu items are supported (the "Move to folder…" flow).
		*/
		function RowMenu({ items, onSelect, label }) {
			const [open, setOpen] = react.useState(false);
			return e(primitives.Menu, {
				open,
				onClose: () => setOpen(false),
				items,
				onSelect: (id) => {
					setOpen(false);
					onSelect(id);
				},
				portal: true,
				closeOnPointerLeave: true,
				anchor: e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": label,
					onClick: (event) => {
						event.stopPropagation();
						setOpen((value) => !value);
					}
				}, e(primitives.IconEllipsisOutline16, {}))
			});
		}
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
			const { open, searchSessions, searchResultLimit, renameSession, forkSession, renameWorkspace, deleteWorkspace, archiveSession, createWorkspace, pickDirectory } = props;
			const list = useSessions((state) => state);
			const workspaces = useWorkspaces((state) => state.items);
			const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
			const collapsedGroups = useStore((state) => state.collapsedGroups);
			const collapsedFolders = useStore((state) => state.collapsedFolders);
			//#region state
			const [folders, setFolders] = react.useState(null);
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
			const view = react.useMemo(() => deriveView(list, workspaces, archivedSet, folders), [list, workspaces, archivedSet, folders]);
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
			//#endregion
			//#region row factories
			/** Status dot with a stable-size placeholder slot for no-status rows. */
			const renderStatusDot = (status) => e("span", { className: "dsh-ff__dot" },
				e(primitives.StateDot, { state: status === "warning" ? "warning" : status === "done" ? "done" : status === "ongoing" ? "ongoing" : "idle", size: 10 }));
			const groupMenuItems = (group) => [
				{ id: "rename", label: t("menu.rename") },
				{ id: "delete", label: t("delete.workspace") },
				{ id: "new-folder", label: t("menu.newFolder") }
			];
			const folderMenuItems = () => [
				{ id: "rename", label: t("menu.rename") },
				{ id: "delete", label: t("delete.folder") }
			];
			const sessionMenuItems = (summary) => {
				const workspace = view.sessionWorkspace.get(summary.id);
				const folder = view.folderOf.get(summary.id);
				const folderOptions = workspace === void 0 || folders === null
					? []
					: folders.filter((candidate) => candidate.workspaceId === workspace.workspaceId).sort(byFolderName);
				const moveDisabled = workspace === void 0 || (folder === void 0 && folderOptions.length === 0);
				return [
					{ id: "rename", label: t("menu.rename") },
					{ id: "fork", label: t("menu.fork") },
					{
						id: "move",
						label: t("menu.moveToFolder"),
						disabled: moveDisabled,
						submenu: [
							{ id: "move-inbox", label: t("move.inbox") },
							...folderOptions.map((candidate) => ({ id: "move-folder:" + candidate.id, label: candidate.name }))
						]
					},
					{ id: "archive", label: t("menu.archiveSession") }
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
				else if (id === "move-inbox") moveSessionToFolder(summary.id, null);
				else if (id.startsWith("move-folder:")) moveSessionToFolder(summary.id, id.slice("move-folder:".length));
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
			/** Drop guards: only sessions of the same workspace may land here. */
			const dropGuard = (workspaceId, event) => {
				const info = dragInfo.current;
				if (info === null || info.workspaceId !== workspaceId) return false;
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
						dragInfo.current = { sessionId: summary.id, workspaceId };
					},
					onDragEnd: clearDrag
				},
					e("span", { className: "dsh-ff__slot" }, status !== null ? e(primitives.StateDot, { state: status, size: 10 }) : null),
					e("span", { className: "dsh-ff__title" }, summary.displayTitle),
					e("span", { className: "dsh-ff__time" }, timeText),
					e(RowMenu, { items: sessionMenuItems(summary), onSelect: (id) => handleSessionMenu(summary, id), label: t("row.menu.aria") })
				);
			};
			const renderSearchRow = (row) => {
				const status = row.running === true ? "ongoing" : row.pendingInteraction !== void 0 ? "warning" : row.completed === true ? "done" : null;
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
			const renderFolderRow = (group, folder) => {
				const expanded = collapsedFolders[folder.id] !== true;
				const targetKey = "folder:" + folder.id;
				const isTarget = dragOver === targetKey;
				return e("div", {
					key: folder.id,
					className: "dsh-ff__folder",
					onDragOver: (event) => { if (dropGuard(group.workspaceId, event)) setDragOver(targetKey); },
					onDragLeave: () => { if (dragOver === targetKey) setDragOver(null); },
					onDrop: (event) => {
						const info = dragInfo.current;
						event.preventDefault();
						setDragOver(null);
						if (info !== null && info.workspaceId === group.workspaceId) moveSessionToFolder(info.sessionId, folder.id);
					}
				},
					e("div", {
						role: "treeitem",
						"aria-expanded": expanded,
						className: "dsh-ff__folder-row" + (isTarget ? " dsh-ff__folder-row--target" : ""),
						onClick: () => actions.setFolderCollapsed(folder.id, expanded)
					},
						e("span", { className: "dsh-ff__folder-icon" }, expanded ? e(primitives.IconFolderOpen16, {}) : e(primitives.IconFolderClose16, {})),
						e("span", { className: "dsh-ff__title" }, folder.name),
						e("span", { className: "dsh-ff__folder-count" }, String(folder.sessions.length)),
						e(RowMenu, { items: folderMenuItems(), onSelect: (id) => handleFolderMenu(folder, id), label: t("row.menu.aria") })
					),
					expanded && folder.sessions.map((summary) => renderSessionRow(summary))
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
						if (info !== null && info.workspaceId === workspaceId) moveSessionToFolder(info.sessionId, null);
					}
				}, group.loose.map((summary) => renderSessionRow(summary)));
			};
			const renderGroupRow = (group) => {
				const isUngrouped = group.workspaceId === void 0;
				const expanded = collapsedGroups[group.key] !== true;
				return e("div", {
					key: group.key,
					role: "treeitem",
					"aria-expanded": expanded,
					className: "dsh-ff__group-row",
					onClick: () => actions.setGroupCollapsed(group.key, expanded)
				},
					e("span", { className: "dsh-ff__folder-icon" }, expanded ? e(primitives.IconFolderOpen16, {}) : e(primitives.IconFolderClose16, {})),
					e("span", { className: "dsh-ff__title" }, group.title),
					!isUngrouped && e(RowMenu, { items: groupMenuItems(group), onSelect: (id) => handleGroupMenu(group, id), label: t("row.menu.aria") })
				);
			};
			const renderGroup = (group) => {
				const expanded = collapsedGroups[group.key] !== true;
				const body = [];
				if (expanded) {
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
			const header = e("div", { className: "dsh-ff__header" },
				wide && e("span", { className: "dsh-ff__header-title" }, t("section.workspaces")),
				e("button", {
					type: "button",
					className: "dsh-ff__icon-button",
					"aria-label": t("action.collapseAll"),
					title: t("action.collapseAll"),
					onClick: () => actions.collapseAll()
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
		const renderRenameDialog = (titleKey, fieldLabel, value, error, pending, onChange, onConfirm) => e(primitives.Modal, {
			open: true,
			onClose: pending === true ? () => {} : () => setDialog(null),
			title: t(titleKey),
			closeLabel: t("close"),
			footer: e(react.Fragment, {},
				e(primitives.Button, { variant: "outline", onClick: () => setDialog(null), disabled: pending === true }, t("cancel")),
				e(primitives.Button, { variant: "primary", onClick: onConfirm, disabled: pending === true || value.trim() === "" }, t("rename"))
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
			setDialog((current) => ({ ...current, pending: true }));
			callFolderRoute(CREATE_ROUTE, { workspaceId: dialog.workspaceId, name: folderName }).then(() => {
				setDialog(null);
				setNotice(null);
				fetchFolders();
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
					confirmRenameSession);
			}
			if (dialog.kind === "rename-workspace") {
				return renderRenameDialog("rename.workspace.title", "field.workspaceName", dialog.draft, dialog.error, dialog.pending,
					(event) => setDialog({ ...dialog, draft: event.target.value }),
					confirmRenameWorkspace);
			}
			if (dialog.kind === "rename-folder") {
				return renderRenameDialog("rename.folder.title", "field.folderName", dialog.draft, dialog.error, dialog.pending,
					(event) => setDialog({ ...dialog, draft: event.target.value }),
					confirmRenameFolder);
			}
			if (dialog.kind === "new-folder") {
				return renderRenameDialog("newFolder.title", "field.folderName", dialog.draft, dialog.error, dialog.pending,
					(event) => setDialog({ ...dialog, draft: event.target.value }),
					confirmNewFolder);
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
			return e("div", { "data-dsh-session-folders": "" },
				header,
				noticeBar,
				e("div", { className: "dsh-ff__list" }, trimmedQuery !== "" && wide ? searchList : browserList),
				renderDialog()
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
				createWorkspace: (input) => ctx.workspaces.create(input),
				pickDirectory: () => ctx.workspaces.pickDirectory()
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
