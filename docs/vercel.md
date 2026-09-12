# Deploy Buildergame to Vercel

Vercel can host buildergame's built website and repository-backed town snapshots. The included [`vercel.json`](../vercel.json) configures a **static Vite deployment**. The browser token option reads GitHub identity, public repositories and manual snapshots directly from GitHub; it does not require buildergame's Node server. Confidential OAuth and immediate server-side publication remain optional backend features.

<!-- 静态部署可在浏览器内用令牌读取 GitHub；公开小镇需导出 JSON 后提交并重建。 -->

| Capability | Included static deployment |
| --- | --- |
| Home, sample towns, 3D exploration and project cards | Available |
| View exported towns and their recorded snapshot history | Available after adding their public JSON to the repository and rebuilding |
| Open a generated `/towns/<slug>/` address directly or refresh it | Available for towns included in that build |
| Save exploration progress | This browser only; it is not synchronized through GitHub |
| Connect a GitHub token, show an avatar and list public repositories | Browser requests directly to `api.github.com`; token kept only in page memory |
| Manually capture a snapshot and create a local town | Browser requests directly to GitHub, subject to network availability and API limits |
| Confidential GitHub OAuth redirect/cookie sign-in | Requires the optional backend; a client secret must not enter the static build |
| Publish new towns immediately for other visitors without a rebuild | Requires a server deployment and durable storage |

## Publish the static version

1. Prepare a public town backup in a local or already deployed buildergame instance. Choose **Connect GitHub**, supply a personal access token, select public repositories and capture a snapshot. Export the resulting town; this is a public bundle. Do not copy private server storage envelopes, OAuth state or credentials into `public/`.
2. Add a separate exported bundle for each town to `public/data/towns/<slug>.json`. Preserve the bundle's `event.deployment.slug` in the filename and retain `event.deployment.createdAt` when adding later snapshots. `public/data/town.json` remains the optional legacy default-town file.
3. Run `npm ci` and `npm run build`. The build generates a static town directory and a physical `dist/towns/<slug>/index.html` for each included town. Generated HTML uses the application base so scripts, models and JSON resolve from a deep town URL.
4. Review and commit the public bundles and source changes. Push them to the Git repository connected to Vercel when ready to publish. The application does not push snapshots into GitHub automatically.
5. In Vercel, import the Git repository. Select its buildergame project directory as **Root Directory**; for a repository containing this project at its root, keep the default. Use the **Vite** preset, **Build Command** `npm run build`, and **Output Directory** `dist`. Use a supported Node.js version compatible with the repository, such as Node.js 22.x.
6. Deploy, then check the home page and a town URL by pasting it into a fresh browser tab and refreshing it. A made-up `/towns/not-a-real-town/` address should return a missing-page response, rather than open a different town.

No OAuth secret, Blob store or paid asset is needed for this static path. Keep the checked-in Vite `base: './'` setting. Generated town pages use `<base href="../../">` to resolve assets at the application root, supporting both Vercel root domains and GitHub Pages repository subpaths without a base override. The client retains that resolved application base when navigating between screens and town URLs.

A newly created static-client town is initially a **local preview** at `/?preview=<slug>` (or `/buildergame/?preview=<slug>` on a repository-path deployment). This reuses the existing application page so refreshing can restore the saved preview without asking the static host for a page that does not exist. Export its JSON, commit it under `public/data/towns/` and rebuild before sharing the published `/towns/<slug>/` address. A preview query or client-side URL change alone does not publish data to Vercel.

If a public town has a newer saved draft in this browser, the app restores that draft only when its identity matches and it extends the public history without rewriting existing snapshots. It remains an unpublished preview and shows a reminder to export/publish it. Older, rewritten or mismatched local data cannot replace a valid public bundle. Keep the JSON backup: browser storage can be cleared and is not the deployment's permanent town store.

The configuration deliberately has no catch-all SPA rewrite. The generated town files provide deep links, while unknown paths retain a 404. `trailingSlash: true` canonicalizes extensionless paths to directory-style URLs. Do not add Vercel's generic `/(.*) → /index.html` SPA example: that would make unknown town addresses load the homepage.

To publish another snapshot, replace that town's public bundle with its complete updated history and rebuild. The existing slug, town name, landscape and plots stay fixed under the town's history contract. Vercel's GitHub integration can rebuild after an authorized repository push. Viewing a snapshot does not itself capture fresh repository metrics.

## Browser GitHub connection

The token connection checks `/user`, displays the returned public identity/avatar, lists public repositories and performs manual capture through `https://api.github.com`. The token stays in this page's memory and is cleared on reload or disconnect. It is not saved in browser storage, cookies, a configuration/secret file, a town backup or the deployment bundle. Grant only the read access needed for the selected repositories; publishing a static town through this workflow does not ask the application to write to GitHub.

Network failures, timeouts, invalid/expired credentials and GitHub rate-limit responses leave an error and retry path rather than a stuck loading state. A failed capture must not replace existing valid history. These direct requests are distinct from server OAuth; a token entered in the page does not create a backend publishing session. Local client/failure-path checks passed using provider fixtures; [verification](verification.md) records the exact scope, including the separate successful unauthenticated public read. No real token authentication is claimed.

## Why the existing Node server needs a different deployment

`npm start` runs one long-lived Node process. The current implementation keeps OAuth sessions, one-time login state and capture coordination in memory, and writes town ownership plus snapshot bundles into local private storage. The public site build does not execute this server.

Vercel Functions can run backend request handlers, but their local filesystem is ephemeral and is not shared across instances. Temporary files cannot serve as the town database. An in-memory login state map can also disappear or be missing when the OAuth callback reaches another instance. Setting `TOWN_DATA_DIR` to a temporary directory or adding `GITHUB_CLIENT_SECRET` in the Vercel dashboard does not solve either problem.

Use the optional [Node deployment](deployment.md) with persistent private storage when you need confidential OAuth and immediate server publication. Direct browser-token access and static viewing do not need it. A Vercel frontend connected to an external backend is another architecture, but the server flow uses same-origin `/api/` routes; API routing, cookies and `PUBLIC_ORIGIN` must be configured together. That integration is not included in the static configuration.

## A future Vercel OAuth and publishing backend

The following is a proposed upgrade, **not implemented by this deployment configuration**:

- Adapt `/api/*` to Vercel Functions or a supported server framework. Keep GitHub OAuth secrets and access tokens on the server, preserve state validation and ownership checks, and use the actual production callback origin.
- Put town ownership, unique names/slugs, snapshot version checks, OAuth state and expiring sessions in a shared durable database. Make publishing an atomic operation so concurrent captures cannot overwrite history. Rate limits and capture coordination also need shared state.
- Store public snapshot JSON in the same database initially, or add an object store such as Vercel Blob when separating large snapshot files is useful. Public Blob URLs are suitable only for the public bundle; OAuth tokens and private ownership/session records must not be included. Blob is file storage, so it does not replace transactional ownership and session storage.
- Use bounded capture jobs with retries for large collections, accounting for GitHub API quotas and function duration limits. Keep exploration progress in the browser; it needs no database.
- Define how newly created towns become reachable without a static rebuild. A backend town resolver must check that a slug exists and return an actual 404 for unknown towns; do not treat every path as a valid town.

GitHub can also remain the durable publication source: a maintainer reviews exported JSON, commits it and lets Vercel rebuild. This already fits the static approach and supplies repository history, at the cost of a deployment delay. Automated writes would require a separately configured GitHub App or equivalent repository-write permission, conflict handling and explicit publication authorization. The current identity-only OAuth flow does not provide that integration.

## Cost and availability

The static configuration adds no dependency or paid service. Vercel's Hobby plan is free within its limits and is restricted to **personal, non-commercial use**; an event organizer's or commercial service's eligibility must be evaluated against Vercel's current terms. Free assets do not imply unlimited free hosting.

Vercel Blob currently offers a Hobby allowance, but usage includes storage, operations and data transfer. Its documentation says exceeding Hobby limits blocks access until the allowance resets rather than charging for additional usage. Optional database providers have their own quotas and terms. No Blob store, database, paid plan or remote deployment was created as part of this configuration.

Official documentation checked on 2026-09-12 (UTC):

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) — static builds, backend options and SPA routing.
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json) — build/output settings and trailing slashes.
- [Local storage and serverless](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel) — ephemeral filesystems and separate instances.
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations) — invocation duration and runtime limits.
- [Vercel Blob](https://vercel.com/docs/vercel-blob) and [Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing) — storage access modes, usage and Hobby limits.
- [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github) — deployments triggered by repository pushes.
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) — plan scope and usage limits.

Remote Vercel deployment and real GitHub OAuth have not been verified by adding these files. Validate the deployed deep links, missing-town behavior and any future backend integration before describing it as production ready.
