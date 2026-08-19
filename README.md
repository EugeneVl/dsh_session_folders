# dsh-session-folders

A session-folders plugin for the DeepSeek Harness web UI: the sidebar workspace browser is replaced with a browser that adds **session folders** — one level of named folders per workspace. Sessions can be dragged into folders or moved via the context menu; folder data is persisted server-side and survives page reloads. Status badges mirror the built-in session browser. No harness changes.

## Features

- **Session folders**: one level of named folders per workspace; sessions outside folders live in the "inbox" (loose) bucket
- **Move sessions**: drag-and-drop a session onto a folder, or use the row context menu — "Move to folder…"; "Move to inbox" returns a session from a folder to the loose bucket
- **Folder management**: create, rename, delete (with confirmation); names are unique per workspace (case-insensitive)
- **Session search** with match highlighting — by title and content
- **Status badges** Running / Completed — mirroring the built-in session browser
- **Server-side persistence**: folders live in a DSH storage domain and survive page reloads; view state (collapsed folders, etc.) lives in browser localStorage
- **The server is the source of truth**: every action is validated server-side (workspace existence, session membership, name conflicts); the client only mirrors the rules
- **Bilingual UI**: adapts to the page language (zh / en)

## Installation

### From GitHub

```sh
dsh plugin --profile web add 'github:EugeneVl/dsh_session_folders#v0.2.0'
```

### From a local directory

```sh
dsh plugin --profile web add /absolute/path/to/dsh-session-folders
```

### From a tarball

```sh
pnpm pack
dsh plugin --profile web add /absolute/path/to/dsh-session-folders-0.2.0.tgz
```

**Restart** `dsh web` after installing (the host plugin and the client bundle are loaded at startup).

## Usage

1. Open the sidebar: in each workspace, folders are shown above the loose sessions
2. **Create a folder** — workspace context menu or the "New folder" button; the name must be unique within the workspace
3. **Move a session** — drag the session row onto a folder (only into a folder of the same workspace), or context menu → "Move to folder…"
4. **Move back to the inbox** — context menu → "Move to inbox"
5. **Rename / delete a folder** — folder context menu; deletion asks for confirmation and the folder's sessions become loose
6. **Search** — the field at the top of the browser; matches are highlighted and clickable

## How it works

| Layer | Implementation |
|---|---|
| Host | `lib/index.js` — a cordis plug-in: 5 POST routes `/dsh-session-folders/{list,create,rename,delete,move}`; its own storage domain `dsh_session_folders` (one global record holding the folder list); mutations are serialized through a promise tail so two browsers cannot overwrite each other; workspace and session membership are validated via `ctx.workspaceRegistry` |
| Client | `lib/client.js` — a bundle loaded via `window.__ModuleLoader__.load`, registered in the `sidebar.workspaces` slot (priority -1); services `slots / locale / sessions / workspaces`; view state in localStorage (`dsh.session-folders.view.v1`) |

- Folders do not touch session accounting: the workspace owns sessions, folders are only grouping. A session listed in no folder is loose by definition
- Deleting a workspace does not delete folder records: they stop being served (filtered by live workspace ids) and stay harmlessly in storage
- DSH domains guarantee durability-first writes; the storage file is `~/.dsh/storages/dsh_session_folders.json`
- No system-prompt changes, no new model tools — zero token impact

## Limitations

- One folder level only: nested folders are not supported
- A session can only be moved into a folder of the workspace that owns it; a session outside every workspace (unaccounted) cannot enter a folder
- Folder names are capped at 80 characters; duplicate names are rejected (case-insensitive)

## Compatibility

Current version targets DSH `0.1.0-rc.6` (the `sidebar.workspaces` slot, `webServer / storageDomain / workspaceRegistry` services, `@deepseek-ai/dsh-storage-domain`, `@deepseek-ai/dsh-workspace`, `zod`). A DSH upgrade that changes slot/service APIs may require adaptation.

## Development

There is no build step: `lib/` is the committed bundle (host + client). Edit the files directly and syntax-check:

```sh
node --check lib/index.js
node --check lib/client.js
```