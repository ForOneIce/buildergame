# Run and deploy Buildergame

## Run the complete local Demo

Use Node.js 22.12 or newer (Node 22 recommended) and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Choose **Explore sample town → Tour landscapes** for flat, valley or cloud scenery with the same fictional projects and three snapshots. Choose **Create town → Personal** or **Community** to start planning. English is the default; use the language button to switch to Chinese.

The Vite development server includes the Node API. No credentials are needed to explore, import/export backups or try a small public-repository capture. Unauthenticated GitHub requests share a low rate limit (usually 60/hour per IP); public previews are limited to 20 projects and one capture/minute per client. Authenticated collections support up to 200 projects.

## Enable deployer GitHub login

1. Create a [GitHub OAuth App](https://github.com/settings/developers).
2. For local development, set homepage to `http://127.0.0.1:5173` and authorization callback to `http://127.0.0.1:5173/api/auth/callback`.
3. Copy `.env.example` to `.env` and set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_ALLOWED_LOGIN` to the deployer's account. Keep `PUBLIC_ORIGIN=http://127.0.0.1:5173`.
4. Restart `npm run dev`. Choose **Create town → Personal → Sign in**.

The confidential OAuth flow requests no repository-write scope. Tokens remain in expiring in-memory server sessions, with an HttpOnly cookie in the browser. Only the configured deployer may publish. A restart requires signing in again; the published town remains on disk. Never use a `VITE_` variable for a secret or commit `.env`.

The town's **Sign in with GitHub** control uses the same OAuth app for ordinary players. Any GitHub account can use player login; this does not grant publication permission. The interface displays the account's GitHub avatar. Real OAuth has not been configured for the local Demo; provider responses in automated tests are mocked.

## Choose a landscape and save exploration

Town creation offers **Flat**, **Valley** and **Clouds**. File configurations accept `"landscape": "flat"`, `"valley"` or `"clouds"`; older files without this field use flat mode. The landscape cannot change when appending snapshots to the same town. Each new collection receives stable plots; snapshots reuse them. See [landscape details and generation limits](landscape-deployment.md).

Opening project cards records explored project IDs. Guest progress is stored in this browser. Signed-in players synchronize progress for the town currently published by the deployment. Imports and alternative local samples retain local progress. The status message indicates whether progress is local or synchronized.

Use persistent private storage for `PLAYER_DATA_DIR` (default `private/players`) to preserve account progress across restarts. The directory contains account-scoped project visits and is separate from the public town bundle. Guest and account progress are stored separately; signing in does not automatically migrate guest visits.

## Personal repository mode

Choose **Personal**, sign in or enter a public username, select **Find repositories**, choose projects and name the town. Additional pages can be loaded. Set growth weights, then select **Create town**, or **Create & publish town** when publishing is enabled for the deployer.

Without OAuth configured, enter a public GitHub username for a smaller preview. This does not grant publishing authority. A successful preview is stored only in that browser and can be exported.

## Community and hackathon mode

Choose **Community** and paste one public repository URL per line; owners may differ. Alternatively use **Not ready yet? → Load a plan** to import [examples/hackathon.config.json](../examples/hackathon.config.json) after editing its name, repository list, stable project IDs and plots. Example repositories are public libraries, not verified hackathon entries.

Configuration supports `weighted`, `commits`, `stars` or `custom` growth. Custom mode needs a complete `customScores` object mapping repository URLs to numeric scores. A configuration import preserves its custom rule until weights are edited in the UI.

After a successful capture, enter the town. For another observation of the same collection, choose **Town settings** and capture again. Existing snapshots stay intact. Editing the repository selection starts a distinct town; the Demo does not splice a changed roster into old snapshots.

In either mode, **Not ready yet? → Save draft** downloads `town.plan.json`, including unfinished fields and selected repositories. **Load a plan** restores it for later editing. Drafts contain no captured snapshots and are not CLI input. **Export deployment configuration** validates the complete form and downloads `town.config.json` for configuration import or CLI capture. The full town-history backup remains `town.json`.

## Publish for ordinary visitors

An authenticated deployer can select **Publish for everyone to explore** when capturing. The Node service writes a public-data-only bundle atomically to `TOWN_DATA_FILE` (default `private/town.json`). This selects the active town for the deployment; export the previous town before replacing it with a different collection if you want to retain it.

Visitors can open the deployment and enter the published town without signing in. Viewing does not fetch GitHub on each visit. `mode: "live"` checks for newly published snapshots at `refreshSeconds`; it does not schedule GitHub captures by itself. Each snapshot records its own data time, separately from the app build version.

Production with Node:

```sh
npm run build
npm start
```

Set `PUBLIC_ORIGIN` to the exact public HTTPS origin, update the GitHub OAuth callback to that origin plus `/api/auth/callback`, and put the Node service behind an HTTPS reverse proxy. Set `PORT` as needed (default 3000). Use persistent storage for `TOWN_DATA_FILE` and `PLAYER_DATA_DIR`. The Demo uses a single Node process and in-memory sessions; multi-instance session coordination is not implemented.

## Export, back up and deploy a static town

1. Choose **Save town** in the town, or **Export backup** after capture. The download is `town.json`.
2. Add that file to `public/data/town.json` in your deployment repository.
3. Run `npm run validate`, then commit the data change and rebuild with `npm run build`.
4. Deploy `dist/` to a static host such as GitHub Pages. The relative asset base supports a repository subpath.

The export includes public project metadata, stable plots, recorded metrics/rules and all snapshots. It excludes tokens, OAuth sessions and unknown import fields. Importing the full backup restores the town locally. The app never automatically writes to or pushes your GitHub deployment repository.

Static hosting supports public viewing, history, language switching, guest progress and backup import/export. GitHub login, account progress synchronization, repository listing and new data capture require the Node service. A static site's deployer can generate data with the CLI instead:

```sh
npm run snapshot -- examples/hackathon.config.json new-town.json
# Or append to an exported backup, writing to a different new file:
npm run snapshot -- town.json updated-town.json
```

The CLI optionally reads a local `GITHUB_TOKEN` environment variable, never stores it, and refuses to overwrite the output file. Do not use a preview command as the production API server: `npm run preview` serves static assets only.

## Checks

```sh
npm test
npm run build
```

The current landscape/HUD browser script is `tests/map-ui-check.cjs`; the earlier capture/backup journey is `tests/browser-check.cjs`. They need Playwright (module resolvable normally, or via `PLAYWRIGHT_MODULE_PATH`) and Chrome with the dev server running. Screenshots are written only under ignored `private/qa/`. Browser capture flows use mocked responses; API tests separately exercise authorization and persistence. See [verification](verification.md) for the checks actually run against each revision.
