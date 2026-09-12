# Demo verification

Updated: 2026-09-12 (UTC). These results concern the local implementation, not real user adoption or a production deployment. Historical results below apply to their recorded revisions.

## Silent automatic showcase 0032

The [0032 revision](../prompts/0032-silent-automatic-building-showcase.md) is implemented: larger automatic building presentation, no stage/pause controls or loading copy, and a static stage 5 on reduced-motion entry. It preloads and caches the five GLBs as file bytes, parsing an incoming stage on demand. One live WebGL scene renders the current building; a temporary 2D copy of the outgoing frame fades over it. Hiding the page cancels future transition timers; an in-flight request or parse may finish. Disposal aborts requests and clears resources. Initial reduced-motion load failures have up to two silent retries.

Executed checks on 2026-09-12 (UTC):

- `node node_modules/typescript/bin/tsc --noEmit` passed.
- `node scripts/validate.mjs` passed: nine sample projects, three snapshots and all ten unchanged locked GLBs.
- `node node_modules/vite/bin/vite.js build` passed with the existing shared Three.js chunk-size advisory.
- The final extended `tests/unified-ui-check.cjs` run passed without page errors. It observed stage 1–5 playback and loopback, retained stage 1 during a delayed next-model request, no controls/status text, a nonempty outgoing 2D frame and incoming canvas opacity 1 during the dissolve. A reduced-motion HTTP 503 fixture recovered silently on the second request and remained at stage 5. Existing English/Chinese, 1440/768/360px, planning, capture, card, backup and shared-screen journeys also passed.
- Desktop enlarged stage-5 and mobile stage-5 screenshots were inspected. Narrow-screen camera framing was adjusted to avoid clipping before the final run.

The Node unit tests, `tests/map-ui-check.cjs` and `tests/browser-check.cjs` were not rerun for 0032; their earlier results below remain historical. GitHub transports and the failure case use fixtures. These checks do not establish real OAuth, remote publication, physical-device performance or final human visual acceptance.

## Homepage refinement 0031

The [eleven-point homepage revision](../prompts/0031-refine-homepage-and-building-showcase.md) is implemented. The homepage presents concise builder copy, a level logo, labeled icon actions, noninteractive hand illustrations and one building cycling through the five accepted stages. Terrain tours and thumbnails appear in the planner, and returning from a tour preserves the draft, publication opt-out and active town. The showcase canvas reserves space for its stage controls.

Executed checks on 2026-09-12 (UTC):

- `node node_modules/typescript/bin/tsc --noEmit` passed.
- `node scripts/validate.mjs` passed: nine sample projects, three snapshots and all ten locked building fingerprints.
- `node node_modules/vite/bin/vite.js build` passed with the existing shared Three.js chunk-size advisory.
- `node --test tests/data.test.mjs tests/api.test.mjs tests/landscape.test.mjs tests/player.test.mjs` passed all twelve tracked tests.
- Extended `tests/unified-ui-check.cjs` passed without page errors, including concise English/Chinese homepage content, icon hover/focus hints, noninteractive audiences, stage 1–5 autoplay and loopback, manual keyboard selection, reduced-motion pause/play, selected-terrain thumbnails, and sample-tour return preserving personal and hackathon drafts. Its existing shared-screen, loading, capture, backup, card, player and responsive journeys also passed.
- `tests/map-ui-check.cjs` passed without page errors: three landscapes, cards, guest progress, language/mobile controls, legacy imports, minimap selection and queued player synchronization.
- `tests/browser-check.cjs` passed without page errors, including the added mocked-deployer publication opt-out and active-town preservation regressions as well as its existing creation, capture, import/export and reload journeys.
- Actual desktop/mobile English/Chinese homepage and Chinese mobile planning screenshots were inspected. The three terrain PNG dimensions and output hashes, plus all five source hashes in their [manifest](../public/ui/landscapes/manifest.json), matched.
- After the full browser runs, a final cursor attribute correction kept footprint cursors on the relocated terrain-tour buttons. TypeScript and production build passed again; a focused Chrome check confirmed all three tour cursors and the planner's axe cursor. The equivalent assertion was added to the shared-interface script and its syntax checked; the full runs above preceded this final attribute-only correction.

Account, repository and capture transports use fictional fixtures and mocked responses. These checks do not establish real OAuth, remote publication, physical-device verification or final human visual acceptance. Earlier sections below retain results for their own revisions.

## Shared game interface

The application now uses the same wooden header and controls, cream reading surfaces and transparent teal world panels across its entrance, planning desk, capture result and town. Creation opens a kraft-paper plan with native repository fields and illustrated landscape choices. Town entry unfolds a map while the actual building assets load, with an option to explore during loading. Project cards are concise; the separate opening-door dialog offers a deliberate external link. The five accepted building appearances are unchanged.

Checks for this revision:

- `node node_modules/typescript/bin/tsc --noEmit` passed.
- `node scripts/validate.mjs` passed sample validation and all ten building fingerprints.
- `node node_modules/vite/bin/vite.js build` passed. The existing shared Three.js chunk still triggers the size advisory. CSS asset paths are rewritten relative to the build for subdirectory hosting.
- `node --test tests/data.test.mjs tests/api.test.mjs tests/landscape.test.mjs tests/player.test.mjs` passed all twelve existing tests. A separate working-tree run also passed six deferred local exploration tests; those experiments are not included in this interface change.
- `tests/unified-ui-check.cjs` passed the extended shared-header, actual WebGL readiness, 1440/768/360px layouts, card/focus, English/Chinese, both setup modes, capture/success and backup restoration journeys without page errors. Added checks covered delayed model loading with background controls inactive, restoration after loading, explicit external door links with safe `target`/`rel`, Escape/close returning to the card, reduced motion, a signed-in 360px header and 844×390 controls/timeline. Contextual cursors were checked through computed CSS, not pointer screenshots. GitHub account, repository and capture transports use fictional fixtures; no real OAuth or publication is claimed.
- `tests/map-ui-check.cjs` passed all three landscapes, concise cards, guest progress, language switching, mobile controls, legacy imports, minimap selection and queued player synchronization with mocked account transport. Transition waits now follow actual readiness; the obsolete building-thumbnail assertion was replaced with the concise-card contract.
- Actual entrance, planning-sheet and mobile town screenshots were inspected. Mobile exploration now opens on demand so the panel leaves more of the town visible. Asset/license hashes match their original sources.
- A later short-height screenshot exposed a long player name wrapping into the town metrics. After a CSS-only `white-space: nowrap` correction, a targeted Chrome recheck confirmed that the profile ends above the metrics (83px versus 109px). The equivalent geometry assertion was added to the regression script; the full extended run above preceded this final CSS correction, and the focused recheck followed it.

The doorway is a brief interface animation, followed by a link to a new tab. It is not a walkable interior or an embedded third-party browser. Custom mouse cursors supplement keyboard-accessible controls; physical mobile-device/GPU testing and final human visual review remain outstanding.

## Earlier landscape and player interface

The implementation now uses the five accepted building appearances, three creation-time landscape modes, a floating HUD, project cards with building previews, a minimap, and local/account exploration progress. The ten full/distant GLBs are fingerprinted in `public/models/buildings.lock.json`; validation fails if an accepted file changes.

The [landscape/player record](../collaboration/landscapes-player-ui.md) records the previous iteration's successful TypeScript, eleven data/API/landscape/player tests and targeted Chrome checks. These checks exercised all three landscapes, cards, progress reload, language switching, mobile layout and landscape configuration export. Provider authorization was mocked. Road normals and cloud/base intersections were corrected during screenshot review.

Current integration checks on 2026-09-12 (UTC):

- `npm run build`: passed TypeScript, public sample validation, all ten building fingerprints and Vite production output. The shared Three.js chunk still produces a bundle-size warning.
- `node --test tests/data.test.mjs tests/api.test.mjs tests/landscape.test.mjs tests/player.test.mjs`: all twelve tests passed, including stable actual configuration output at 1, 9, 50 and 200 projects. Coverage also includes history/data integrity, immutable landscape, level pads, player/deployer authority, deduplication, account isolation and progress persistence.
- `tests/map-ui-check.cjs`: passed all three landscapes, guest progress, language switching, mobile accessible names, legacy flat import, minimap selection and mocked-player avatar/progress synchronization. Delayed queued uploads and reload were exercised.
- `tests/browser-check.cjs`: full UI journeys passed without page errors; both collection capture transports were mocked.
- Actual flat/cloud town and mobile project-card screenshots were inspected after corrections. They are ready for human review; this is not a claim of human acceptance.
- Geometry checks exercised all three landscape modes at 1, 9 and 50 projects. They do not establish browser performance for large collections.
- The committed source was independently exported and passed the production build and all twelve committed Node tests without the deferred local experiment files.

Human review of the new town composition remains pending. Real OAuth remains unconfigured. Walking, building interiors, project sorting and the resident world-map UI are deferred.

## Earlier Demo checks

- TypeScript `tsc --noEmit`: passed.
- `npm run build`: passed (data validation and Vite production build) before that iteration's final visual/mobile adjustments. Its final checkout had not been rebuilt in the original record. The initial bundle warning concerned the Three.js payload size, not a build failure.
- `node --test tests/*.test.mjs`: eight tests passed. Coverage includes cumulative growth, unknown/stale data, complete commit pagination, invalid/custom configuration, immutable history, sanitized backup round trips, OAuth state/cookies, anonymous publication rejection, cross-origin rejection and public snapshot reads.
- `tests/browser-check.cjs`: passed using headless Chrome and bundled Playwright, with no page errors. Desktop 1440×1000 and mobile 390×844 checked. Journeys cover real WebGL rendering, timeline, project detail, JSON backup/export/import, English/Chinese toggle, both setup modes and local reload. GitHub repository selection and capture transport are mocked in browser journeys.
- npm dependency audit after updating Vite to 7.3.6: zero reported vulnerabilities at installation time.

## Earlier real public GitHub smoke checks

The local API successfully listed 36 public repositories for the user-supplied account. A single-repository capture for this project's public GitHub URL returned a fresh default-branch observation with cumulative commit count and HEAD SHA. These requests were read-only and unauthenticated. The captured test town was not published or committed as event data.

## Earlier visual review

Reviewed desktop welcome/town and mobile town screenshots. Corrected cliff geometry extending above ground, avatar stretching, an exposed hidden file input and camera framing. The earlier house meshes merged by material to reduce draw calls; the current town uses authored GLBs with instanced distant assets and nearby detail. The mobile project panel can be opened on demand to leave the scene visible. Actual product screenshots contain clearly identified fictional sample data.

## Limits

- Real GitHub OAuth requires a configured app and client secret; publication also requires the allowed deployer login. Player login and deployer authorization have been exercised with mocked provider responses. No real account authorization is claimed.
- No production URL, HTTPS reverse proxy or external hosting has been verified.
- The Demo supports one active town per deployment, a fixed roster and landscape per history, and in-memory sessions in one Node process. Server restarts require login again. Persistent town and account-progress storage must be supplied by the host.
- Static deployments cannot perform server OAuth/capture or synchronize account progress. They display exported JSON and support local progress/backup workflows.
- Different initial collection sizes generate different town extents; this does not implement adding repositories to an existing town's history. The [generation assessment](procedural-town-plan.md) describes the separate migration required.
- Larger collections, accessibility beyond the tested keyboard/list routes, and physical mobile GPU performance need broader testing. A WebGL fallback keeps the project directory available.
- Walking/interiors, project sorting, the resident world map, ENS, on-chain storage, inventory, currencies, payments and leaderboards are not implemented in the application.
- Reference-image generation prompts/tool identity have not been supplied. The human accepted and locked the current five building assets; this does not establish acceptance of the new roads, terrain or HUD composition.
