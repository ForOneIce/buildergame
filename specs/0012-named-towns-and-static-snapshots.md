# Named towns and deliberate snapshot publication

Date: 2026-09-12 (UTC). Status: implemented and locally verified within the scope below; human visual acceptance and live-auth/remote-deployment verification remain pending. This record formalizes the accepted requirements during integration; acceptance targets are not themselves test results.

Sources: [0039](../prompts/0039-named-towns-and-static-snapshots.md), [Vercel question 0040](../prompts/0040-vercel-deployment.md), [license instruction 0041](../prompts/0041-noncommercial-attribution-source-license.md), [browser-token direction 0042](../prompts/0042-browser-github-token-access.md).

## User workflow

A builder signs in with GitHub, selects public repositories, names a town, chooses its fixed landscape and captures an observation. A published town opens at a stable name-and-timestamp path under the deployment's domain. An unpublished browser/imported town uses the existing application shell with `?preview=<slug>` until its public bundle is backed up into a GitHub deployment repository and rebuilt, or published by the optional Node server. Visitors browse saved snapshots without wallets or login; exploration progress remains in their browser. The builder may append a snapshot for a later occasion without replacing earlier history.

The sample interface offers Random explore instead of the duplicated progress panel, restores shared account access and places aggregate town statistics directly above the lower-left town name. Keep the approved five building models and shared wood, paper and teal visual language unchanged.

<!-- 起始空地是视觉基线，不是伪造的 GitHub 零值；浏览进度仅保存在浏览器。 -->

## Data and publication contract

- A town has at least one project and at most the existing 200-project limit. Reject whitespace-only names, duplicate repository entries and malformed configuration. Weighted growth must contain a positive weight; individual metric values and unused weights may legitimately be zero.
- The founding snapshot contains every project at the land stage and is marked as a baseline. Its metric, score, observation time and scoring-rule fields are null. A real capture follows it at a later recorded timestamp; one capture therefore supports playback from land to the first observation. Older imported histories retain their recorded data and can receive a display-only founding view without rewriting their history.
- A capture can carry a short occasion label. The label describes the capture; the system must not imply it observed GitHub at an earlier date. Stale or unknown fetches keep their existing explicit semantics, and an all-failed capture must not publish a fabricated observation.
- `event.deployment` carries the stable public slug and creation time. Address names derive from the human town name and a timestamp; non-Latin names need a safe deterministic representation. Name comparison normalizes whitespace and case within the deployment's known collection. Reject conflicting ownership, duplicate names and altered deployment identity. Slug validation prevents path traversal.
- Subsequent captures preserve town name, landscape, project membership, plots, existing snapshots and deployment identity. Changing the roster creates a different town. Parallel or stale publication must not silently overwrite a newer history.
- Public exports contain only the portable town bundle. Tokens, OAuth state, account sessions and the server's private ownership envelope are not public bundle fields.

## Runtime choices and access

Revision 0042 adds a browser-only GitHub personal access token option for static deployments, implemented separately from confidential OAuth. A token supplied by the user permits direct GitHub identity/avatar, public repository discovery and capture requests without requiring buildergame's Node API. It grants no automatic right to publish town files and is not a server OAuth session.

Keep the token only in browser memory. Do not persist it in browser storage, cookies, URLs, logs, exported plans/bundles, configuration or secret files. Disconnection/reload clears the credential; limit authenticated requests to the intended GitHub API origin. Handle network/CORS failures, aborts, timeouts, expired/invalid credentials and rate limits with actionable feedback and bounded retries. An all-failed capture must leave saved history intact. Repository read access does not request repository-write permissions merely to create a local town.

The optional Node deployment retains same-origin API routes, confidential GitHub OAuth, private persistent files for town ownership and snapshots, and explicit authorization before publication. Signed-in builders can create their own towns there; editing an existing town requires the recorded owner or the configured deployment administrator. Repository-deployed and legacy towns remain protected by deployment administration rather than being claimable by any user. An imported backup does not itself prove publishing authority.

Exploration progress is local browser state, including when a GitHub account is signed in. Do not request or advertise server progress synchronization. The account supplies identity/avatar and supported repository access; it does not authorize automatic writes into a GitHub repository.

Static builds read reviewed public bundles from `public/data/towns/<slug>.json`, produce a town directory and physical `/towns/<slug>/index.html` pages, and retain the optional legacy default bundle. Deep links must load application assets from the deployment base on both root domains and GitHub Pages repository paths. Unknown towns return a missing-town response; they do not silently load the default or a fictional sample.

Unpublished local previews use `/?preview=<slug>` or the equivalent deployment-prefixed shell path. They must refresh through the existing static index, without relying on a nonexistent generated town page or a wildcard fallback. A matching cached draft may supersede a public bundle only if the event identity matches, the draft has strictly more snapshots and the complete public history is an unchanged prefix under `assertAppend`. The recovered draft stays `published: false`, uses the preview query and tells the builder to export/publish it. Reject stale, rewritten or identity/slug-mismatched overrides. Without a public bundle, an explicitly requested preview can restore only matching local data.

Vercel's included configuration supports that static output. Direct-token clients read GitHub/capture without Functions; publishing an exported town still requires repository-backed deployment or another persistent publication service. The checked-in relative Vite base and generated `<base href="../../">` support root domains and repository subpaths; client navigation retains the resolved application base. A full Vercel OAuth/publishing API requires a separate function adapter and shared durable state; its ephemeral filesystem and per-instance memory do not replace the Node store. Database ownership/session records plus optional public Blob snapshots remain a proposal. [Deployment guide and official sources](../docs/vercel.md).

No Web3 transaction, wallet, paid design asset, partner SDK or new backend storage service is required for this increment. Future automatic GitHub refresh, scheduled capture, multi-instance storage and automatic repository commits are outside its scope. Existing exploration/location primitives remain preserved and tested; walking, interior and resident-world-map interfaces are still deferred. The new source-available license preserves existing separately licensed resources; it does not relicense indexed projects.

## Observable acceptance criteria

1. Sample Random explore opens a project card; duplicate sample progress panels and badges are absent. Shared login/avatar access and lower-left statistics/name work in English and Chinese at desktop, narrow and short viewports.
2. An empty collection is rejected before capture; valid zero-valued repository metrics remain accepted. A first successful capture produces baseline-to-observation playback with fixed plots and an identifiable baseline.
3. Creating and publishing two different towns gives two distinct stable links. A duplicate normalized name fails clearly. Another account cannot overwrite either town, and a stale append cannot replace newer history.
4. Opening a published town directly and refreshing it selects that town through its generated path. A saved unpublished preview refreshes through the existing root/prefixed `?preview=<slug>` shell. Missing/invalid addresses show an error or HTTP 404 rather than another town.
5. Export and import preserve the full recorded history, occasion labels and deployment identity without credentials. Repository-backed bundles become viewable after rebuild; browser imports alone do not claim remote publication.
6. Exploration persists locally where browser storage is available, makes no progress API calls and degrades truthfully to session-only storage if persistence is unavailable.
7. Node/API tests cover names, ownership, baseline integrity, stale append and storage failure. Browser checks cover capture → town → timeline → backup and responsive HUD. Build and locked-asset checks pass. Provider mocks and local fixtures are distinguished from live OAuth and remote hosting.
8. On a static deployment, the token flow reads identity/repositories and captures through GitHub directly. Browser persistence, exports and URLs contain no credential. Disconnect/reload clears it; invalid tokens, rate limits, network errors and timeouts do not leave a stuck loading state or replace valid history. Late responses after navigation or disconnection must not reactivate an account or overwrite the active view.
9. Reloading a public town with a valid newer local draft restores that append-only draft as unpublished; older, tampered or mismatched local history cannot override public data. Restoring local data does not claim server publication or publishing ownership.

## Verification status

The combined suite passed 42 tests and the final production build after all source changes passed with 49 modules and all ten GLBs unchanged. All four browser scripts passed: map before late refinements, unified plus bilingual short-viewport checks after the CSS correction, and affected lifecycle/PAT reruns after final preview-query/draft-recovery changes. Those final tests cover static preview refresh, explicit publication, fresh guest reload and rejecting unsafe local overrides. An earlier isolated production-static check passed for emitted HTML under a repository subpath. A one-repository unauthenticated GitHub capture produced the founding view plus a measured snapshot. [Verification](../docs/verification.md) preserves exact timing, fixture boundaries and screenshot review. Real token/OAuth authentication, remote GitHub/Vercel deployment and human visual acceptance remain unverified.
