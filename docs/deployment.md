# Run and deploy Buildergame

Use Node.js 22.12 or newer. Run `npm install` and `npm run dev`, then open http://127.0.0.1:5173. The five approved buildings and three sample landscapes need no account.

## Browser-only GitHub connection

The upper-right profile button opens **Connect GitHub**. Enter a personal access token to validate your GitHub account, show its avatar and list public repositories. This works on static hosts, including Vercel and GitHub Pages; GitHub requests go directly from the browser to `api.github.com`.

Use a fine-grained token with only the access needed for the selected public repositories. Repository metadata and commit counts require read access, including Contents read where GitHub requires it. This application does not request repository write access. Review [GitHub's token guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

The token stays in the current page's memory. It is not saved in localStorage, sessionStorage, cookies, a URL, a draft or an exported town. Reloading or disconnecting clears it. Browser extensions and scripts running in the page can access page memory: connect only to deployments you trust.

Each request has a 20-second deadline. Invalid/expired tokens, network failures, cancellation, access restrictions and rate limits produce actionable errors. Captures stop on authentication, network and rate-limit failures; completed historical snapshots remain unchanged. GitHub's API limits still apply. Public usernames can be read without a token where limits permit.

## Create and revisit a town

1. Choose **Create town → Personal** or **Community**. Select at least one public repository; duplicate URLs and empty input are rejected.
2. Name the town and choose its landscape and growth weights. Published town names are unique within the deployment after normalization of case and whitespace. Names, landscape, project identities and plots stay fixed when appending history.
3. Optionally give this capture an occasion name, such as **Demo day**. The data time is the actual observation time; naming a past occasion does not fabricate historical metrics.
4. Capture. A new town stores a **Town founded** view with every project at stage one, followed by its first measured snapshot. Playback runs from **0 / 1** to **1 / 1**. The baseline has no GitHub measurements and is labeled as a visual starting point.
5. Enter the town, explore projects and export a backup. Each capture-generated town has `event.deployment {slug, createdAt}`; its URL is `/towns/<name-and-timestamp>/` and its backup is `<slug>.json`.

Older single-snapshot backups get a display-only starting view for playback. Their stored history is not rewritten. **Town settings** opens the same town for an explicit new capture. A changed repository collection creates a different town. There is no periodic GitHub data refresh or automatic snapshot polling in this version, including for older files marked live.

Exploration progress is only stored in the current browser, separately for each town. Signing in does not upload it or make it available on another device. If storage is unavailable, visits last for the current page session and the interface reports that limitation.

## Publish from GitHub files: lowest-maintenance option

A browser capture is initially a **local preview** at `/?preview=<slug>` (under the deployment's base path). Refreshing that address restores the town from this browser's saved data; it is not yet a public page for other visitors. If a newer saved draft extends a published town's exact history, it is restored as an unpublished preview until its JSON is deployed.

1. Export the town's `<slug>.json` backup.
2. In your Buildergame deployment repository, add it to `public/data/towns/<slug>.json`. The filename must match `event.deployment.slug`.
3. Run `npm run build`. The build validates town data and emits a directory manifest and a physical `dist/towns/<slug>/index.html` for each town.
4. Commit and push the public JSON when ready to publish. Connected Vercel deployments rebuild. For GitHub Pages, select **Settings → Pages → Source: GitHub Actions**, then run the included **Deploy static towns to GitHub Pages** workflow.
5. Open the generated town URL in a fresh browser session and refresh it. A nonexistent town path should be a missing page.

Each town keeps its own file. To add a snapshot, replace that file with the complete updated history, keeping its name/slug. Normalized duplicate town names, duplicate identities and filename/address mismatches fail the build. Keep the complete backup rather than exporting an isolated latest record.

The original `public/data/town.json` remains a compatible default-town source. A non-sample default also gets a generated address. The shared Vite relative asset base and generated HTML base tags support both a Vercel domain and a GitHub Pages repository subpath.

The app does not push files into GitHub automatically. Only public town bundles belong under `public/data/`; never copy an OAuth session or a private server ownership envelope there. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) provides static hosting from a repository; public repositories can use GitHub Free. See the [Vercel guide](vercel.md) for its free-plan conditions and deployment details.

## Plans, configuration and command-line capture

**Not ready yet? → Save draft** downloads an incomplete `town.plan.json`. **Load a plan** restores it. **Export deployment configuration** validates and downloads a complete `town.config.json` for file setup or the CLI. Drafts do not contain observations and cannot replace CLI input.

[examples/hackathon.config.json](../examples/hackathon.config.json) demonstrates a public multi-repository configuration. Growth supports cumulative commits, stars, weighted commits/stars/forks, or a complete custom score table. Earlier snapshots retain their original rules.

```sh
npm run snapshot -- examples/hackathon.config.json new-town.json
npm run snapshot -- town.json updated-town.json
```

The CLI optionally reads `GITHUB_TOKEN` from the process environment, never stores it, and refuses to overwrite its output file. Legacy output without deployment metadata can remain `public/data/town.json`; static build generates its stable route.

## Optional Node service: immediate publication

The existing Node service is an alternative when towns must become publicly accessible immediately without a repository rebuild. It uses persistent local disk and GitHub OAuth rather than the browser token session.

1. Create a GitHub OAuth App with callback `http://127.0.0.1:5173/api/auth/callback` for local development.
2. Copy `.env.example` to ignored `.env` and set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and the exact `PUBLIC_ORIGIN`. Do not use `VITE_` for secrets.
3. Restart the service. In **Connect GitHub**, choose the site's OAuth option.
4. Any OAuth-authenticated user can publish a new town and append only their own history. The optional `GITHUB_ALLOWED_LOGIN` can administer towns and choose the default-town file.
5. Run `npm run build` and `npm start` behind HTTPS for production. `PORT` defaults to 3000; set the OAuth callback to the public origin plus `/api/auth/callback`.

`TOWN_DATA_DIR` defaults to ignored `private/towns`. Each file contains a public bundle inside a private ownership envelope. Ownership uses GitHub's immutable account ID; ordinary visitors receive only the public bundle. Back up this private directory through your server's private backup system if ownership must survive migration. A public export omits ownership; repository-provided towns are managed by the destination deployment's administrator.

`TOWN_DATA_FILE` retains the legacy default-town behavior. Public APIs expose `/api/towns` and `/api/towns/<slug>`. Towns remain after a server restart if their disk volume persists. OAuth sessions are in memory and require another sign-in after restart. Retired exploration-sync endpoints return 410 and do not write visitor progress.

This is a single-process local-disk implementation. Vercel Functions have ephemeral filesystems and distributed instances, so this backend must not be deployed there unchanged. A future immediate-publishing Vercel backend needs durable ownership/data storage and shared or signed OAuth state. Browser-token capture plus GitHub files avoids that backend requirement.

## Verification and license

Run `npm test` and `npm run build`. Browser scripts need Playwright and Chrome; their fixtures, limits and executed results are in [verification](verification.md).

Preserve [LICENSE](../LICENSE) and [NOTICE](../NOTICE) when deploying or redistributing. Original Buildergame application material is noncommercial and requires attribution and corresponding source under the same license. Existing CC0/GPL and third-party materials retain their separate terms.
