# Demo verification

Updated: 2026-09-13 (UTC). These results concern the local implementation, not real user adoption or a production deployment. Historical results below apply to their recorded revisions.

## Mailbox targeting, planning music and submission preparation 0048–0051

The mailbox ray target is now a sphere centered on the existing stage-five mailbox, radius 0.82 world units. The 48px cursor remains a coin during valid presses and delivery; drag, cancel, leave and scene changes still clear the interaction. Accepted GLB files are unchanged.

The human-supplied Suno MP3 is imported as a local Vite asset. A single lazy HTMLAudioElement loops at volume 0.16 only on the planning screen, after trusted interaction. The shared speaker preference controls both music and effects. Planner rerenders retain the track; leaving resets it, and hidden/pagehide states pause it. Pending playback is checked against current route/mute/visibility state. A read-only review identified and corrected the first-Mute gesture starting a brief track before the click; that action now skips music unlock.

Executed checks on 2026-09-13 (UTC):

- The final `npm run build` workflow, invoked through the installed npm CLI after that correction, passed TypeScript, nine sample projects, three snapshots, all ten building fingerprints and Vite compilation of 56 modules. The existing Three.js chunk-size advisory remains. The music is emitted once as a 3,590,270-byte asset; default sample output generates zero named town routes.
- `node --test tests/data.test.mjs tests/api.test.mjs tests/landscape.test.mjs tests/player.test.mjs` passed all twelve tests after the mailbox/music integration and before the first-Mute-only correction. No data or server source was changed by that correction.
- Read-only Three.js ray checks found hits 0.6 world units from the mailbox center that the old target missed, without intercepting front-on door/sign centers. Browser interaction checks are recorded separately when completed.
- FFprobe measured the unchanged supplied track at 150 seconds, stereo 48 kHz MP3 with embedded cover art. Size and SHA-256 match [music provenance](../music/README.md). This is separate from the six verified Kenney CC0 effects; no independent Suno commercial-rights claim is made.
- `git diff --check` passed for project edits. Ignore checks confirmed both planned video outputs under `private/qa/submission-video/` and `.env` variants stay outside Git. This does not audit or remove previously published history.

- `tests/planner-music-check.cjs` passed seven groups in Chrome: actual MP3 decoding/time advancement; setup-only loop, gain, rerender continuity, mute persistence, visibility pause/resume and home/town cleanup; direct first-Mute with zero play attempts; and explicitly bounded rejection, delayed completion, failed request, missing Audio and HTMLAudio-only fallback fixtures. No page errors were reported.
- `tests/mailbox-cursor-check.cjs` passed five groups using the real stage-five GLB and exported scene API: pointer projection outside the old proxy, actual 48px cursor SVG/hotspot, coin continuity through press/release/flight, separate door/sign callbacks, drag, cancellation and snapshot/disposal cleanup. Pointer cancellation is an explicit fixture. Codex inspected the captured native coin-flight frame.
- `AUDIO_CASE=fallbacks node tests/ui-audio-check.cjs` passed five existing UI-audio fallback fixtures with zero page errors. The two old speaker-label expectations now reflect the shared audio control; the unrelated full UI-audio suite was not repeated.
- Prepared and visually inspected the square logo, 16:9 cover and three current project screenshots in [submission media](../hackathon/media/README.md). PNG dimensions match the listed sizes. The capture included only an English guest project page, with explicitly fixed guest/empty-deployment responses, zero page errors and zero write or external requests. The planning screenshot is an unsubmitted draft. The cover and SVG-derived logo are labeled presentation compositions.

Planning audio and its tests were saved in local commit `7fcac00`, mailbox refinement in `7321d4d`, and submission images in `7fd162b`. No human listening review or submission confirmation is claimed.

### Final video exports

Both completed MP4s are **187.04 seconds**, **1280×720**, **25 fps**, H.264/yuv420p with fast-start metadata. `buildergame-demo-no-music.mp4` is 15,367,370 bytes and contains one AAC interface-audio stream; `buildergame-demo-silent.mp4` is 14,964,201 bytes and contains only video. The artifacts and raw capture evidence remain in the ignored local QA directory for separate submission upload.

- The recording contains only a fresh English guest project viewport. A 1600×900 browser viewport is scaled proportionally to 1280×720. Two real-time segments are joined after 73 seconds; the incomplete cloud-loading tail of the first take is omitted, and the second starts with the cloud town loaded. No action was sped up, and no successful feature state or repository data was fabricated.
- The footage shows the five-stage homepage, sample exploration, cards, timeline, three landscapes, mailbox prototype, both planning modes, actual public repository capture, JSON backup, first-snapshot replay and the resulting two-project town. The local Node API supplied public GitHub data for `ForOneIce/buildergame` and `ForOneIce/web3-FTW`. The exported non-sample backup has two projects and two snapshots (a founding baseline plus the measured snapshot); nothing was published by the recording.
- A recorder guard classified the expected local `POST /api/capture` as an unexpected mutation after the second segment finished. Review of its request, completed workflow and exported backup confirmed it was the authorized local capture operation. The original guard report and raw footage were retained; its metadata was annotated rather than changing the captured application state. No application page error was recorded in that segment.
- Playwright records no system audio. The music-free export therefore mixes the six original Kenney CC0 clips at 72 instrumented native source start/stop timings and gain values. The Suno MP3 was blocked at playback in the capture browser and is absent from the mix. There is no narration or microphone/desktop audio. The measured pre-encode mix peak is 0.0842, below clipping. A raw pre-roll marker aligns each segment's audio and is removed from both deliverables.
- A recording-only cursor image follows the actual pointer position and computed CSS cursor/hotspot because native cursors are omitted from Playwright video. Short English editorial captions are burned in and an SRT sidecar is available. They do not modify product state or hit targets.
- FFprobe confirmed the duration, resolution, codecs and stream counts. Complete FFmpeg decoding of the audio version succeeded. Both demuxed video streams have SHA-256 `ac4daf5b8f9e87c2b3fb7ea5ebc63306e613aa9707d9b4072cc99376e04d67c5`, proving the silent export preserves the same video. Codex inspected the contact sheet and full-size mailbox-receipt and capture-success frames. Human playback/listening review and competition upload remain unverified.
- Recording at a 1280×720 **browser viewport** exposed a separate short-height layout overlap between Support builders and the lower-left totals; that layout issue remains. The delivered footage uses the unobstructed 1600×900 viewport. Higher-resolution recording combined with simultaneous screenshots also stalled the capture harness; final recording omitted those screenshot calls and reviewed decoded frames afterward.

The repository's public metadata listed [buildergame-two.vercel.app](https://buildergame-two.vercel.app/). An anonymous HTTP check returned 200 and title `Buildergame · Hackathon Town`; this does not establish the latest local commit's deployment or full hosted functionality. The submission sheet now includes the observed URL and its verification boundary.

## Interface sounds and closer sample entry 0046–0047

The [audio increment](../specs/0014-ui-interaction-sounds.md) uses six unchanged CC0 Kenney clips, served locally through a single gesture-unlocked Web Audio mixer. Buttons, paper/map transitions, eligible pointer/keyboard focus and virtual mailbox receipts have distinct cues. A shared speaker button remembers mute on this device; hover and overlapping voices are bounded. The [sample camera increment](../specs/0015-sample-town-default-camera.md) changes entry/reset to the previous fit followed by four zoom-in steps (`0.8 ** 4`, with existing limits), preserving the target/direction and normal non-sample framing.

Executed checks on 2026-09-13 (UTC):

- Source research inspected official Kenney pages/archives and an OpenGameArt CC0 alternative. Six selected sounds (49,420 bytes) and both original licenses match their archive entries and [manifest](../public/audio/ui/manifest.json) SHA-256 values. FFprobe metadata and FFmpeg decode/volume checks passed. Original CRLF/whitespace in vendor licenses is retained under directory-specific Git attributes; project whitespace checks passed. Asset/research/notice commit: `d4f22f6`.
- Final `npm run build`, after the sample-camera and reduced-motion coin-cue fixes, passed TypeScript, nine fictional projects/three snapshots/all ten unchanged locked GLBs, and Vite compilation of 54 modules. No application dependency was added. The existing shared Three.js chunk advisory remains; the default sample emits zero named publication routes.
- `node tests/ui-audio-check.cjs` was exercised with Playwright/Chrome and focused `AUDIO_CASE` runs as corrections landed. The native lifecycle case verified real Ogg decoding, native source starts and output gains, no AudioContext before trusted activation, quiet master gain, no duplicate handlers across rerenders/dialogs, throttled hover, at most two voices, distinct map/panel/scene-hover/normal-coin feedback, silent automatic history, remembered mute, active-source stop and no autoplay on visibility return.
- Subsequent affected checks verified coin feedback in normal/reduced motion and silence while muted; cancellation of delayed audio after mute and recovery after a new gesture; missing API, blocked storage, failed fetch, invalid audio bytes and rejected resume fallbacks; and English/Chinese guest/signed-in headers at 360 px with no control overlap. Reduced-motion coin arrival bypasses the generic activation throttle, and Try demo coin leaves its single sound to the actual arrival callback. Muted settings are separate from town/snapshot data.
- `node tests/town-initial-view-check.cjs` passed camera projection comparisons for flat, valley and cloud entry/reset against the original fit plus four actual zoom calls. Default options retain the original fit, and resetting the sample does not compound its zoom factor. A separate distance calculation comparison covered nine distances including the minimum clamp. Camera setup emits no synthetic button clicks.
- Existing `node tests/map-ui-check.cjs` passed after the audio/camera changes, covering map navigation, all three landscapes, project cards, minimap, local progress and account controls. Both new browser scripts passed `node --check` on their final source.
- Codex inspected the actual closer desktop sample view and English/Chinese narrow guest/signed-in header screenshots in ignored `private/qa/`. Native audio methods were instrumented only in dedicated browser fixtures; no production debug globals were added. Active-stop tests briefly suspended a real AudioContext to hold short clips, visibility used a synthetic hidden event, and only the denied-autoplay fixture forced a suspended state/rejected resume. These boundaries do not claim physical speaker/headphone listening or OS-level background playback verification.

The unchanged native lifecycle passed before the final success-throttle exemption; affected coin, pending-load, fallback, responsive and camera checks passed after it. Final production compilation also followed that fix. Unrelated data/API tests and other full browser journeys were not repeated. Human listening/volume acceptance, visual acceptance, older-browser codec coverage and remote deployment remain unverified; unsupported audio leaves the interface usable silently. Background music and real Web3 remain outside this increment.

## Sample-mailbox coin Easter egg 0045

The [sample-only interaction](../specs/0013-sample-mailbox-coins.md) is implemented. Loaded stage-five mailboxes accept a decorative coin flight and show the selected fictional project's temporary receipt on arrival. Support builders opens the bilingual explanation and keyboard/touch alternatives. Counts stay in the mounted view, survive dialog reopening and clear on snapshot-ID changes or view replacement. Real Web3 remains paused.

Executed checks on 2026-09-13 (UTC):

- Final `npm run build`, after the compact receipt correction, passed TypeScript, nine-project/three-snapshot validation, all ten unchanged locked GLB fingerprints and Vite compilation of 52 modules. No dependencies were added. The existing shared Three.js chunk-size advisory remains; the default sample emits zero named publication routes.
- `node tests/mailbox-demo-check.cjs` was exercised with Playwright/Chrome, followed by targeted `MAILBOX_CASE` runs for changed behavior. The unchanged scene passed actual mailbox ray/hover/click, door/sign isolation, drag/right-click rejection, one active flight, stage-one-through-four exclusion, snapshot cancellation and disposal checks. The browser helper waits for the visible loading state to resolve instead of assuming model readiness means the growth transition has settled.
- After UI refinements, desktop English/Chinese and keyboard checks passed, including the actual `coin.svg` computed cursor, project-specific receipt, repeated count 1 → 2, reset to 1 after a snapshot change, and cancellation on snapshot/landscape/view changes. The final UI checks passed at 360 × 800 and 360 × 640 with touch/reduced motion. After the last short-wide CSS correction, the affected 844 × 390 and eligibility cases passed: reachable modal, receipt clear of navigation/overview/timeline, landscape menu toggle retained and Cloud town reachable by scrolling, no eligible mailbox at early stages, and no feature UI in a non-sample fixture. The valid early-stage fixture replaced an initially inconsistent score/stage fixture that the application correctly rejected.
- Wallet-provider spies and storage/request guards observed no provider calls/discovery, saved-data mutations, external requests, HTTP writes, downloads or popups from the mailbox interactions. Final scoped checks reported no page errors. Temporary scene APIs were exercised in an isolated project-page fixture; no production testing globals were introduced.
- `node tests/map-ui-check.cjs` passed on the final source: all three landscapes, random exploration, account header, mobile cards, legacy landscape lock/minimap, browser-only signed-in visits and authenticated personal setup. Authentication and data transports in these checks are fixtures.
- A final `MAILBOX_CASE=responsive`, `MAILBOX_VIEWPORT=844x390`, `MAILBOX_LANDSCAPE=clouds` mailbox check selected Cloud town and tapped the actual elevated mailbox after Find. Its settled receipt and layout checks passed, completing real coin interaction coverage in flat, valley and cloud sample landscapes. The final test script also passed `node --check`.
- Codex inspected actual project-only desktop modal, mid-flight coin, receipt, narrow dialog/receipt and short-wide menu screenshots. Checks prompted a snapshot-counter reset and compact receipt/menu corrections. QA images remain ignored under `private/qa/`; public documentation includes only project development evidence.

These checks were run incrementally: unchanged scene checks preceded the UI-only corrections; the affected desktop/narrow checks preceded the final short-wide-only positioning fix and its targeted recheck. The final production build and map regression followed that fix. The unrelated Node data/API suite and other browser journeys were not repeated. Human visual acceptance, physical-device GPU performance and remote deployment remain unverified. No actual wallet, financial value or partner integration is claimed.

## README homepage animation 0044

- 2026-09-13 (UTC): a dedicated Playwright/headless Chrome guest page captured only the actual English homepage viewport, including five automatic building stages and the return transition. Capture produced 145 timestamped source frames with no page errors. Browser chrome, desktop and other applications are outside the recording.
- Installed FFmpeg encoded `docs/images/homepage-showcase.gif` at 1080 × 946, 21.66 seconds, 260 frames and infinite looping, with a full palette and Sierra dithering. The final file is 1,317,614 bytes (about 1.26 MiB).
- Codex inspected source composition and decoded GIF stages 1, 3, 5 and a transition. The homepage text, controls, building and attribution fit the frame; the recorded page is an unsigned-in guest view. The README image path and caption were updated.
- This is documentation media only. Application tests/build were not repeated; application source and accepted building assets are unchanged. Final human review and GitHub's remote rendering remain unverified.

## Named towns, browser GitHub access and static deployment 0039–0042

The current implementation adds deployment-local town names and stable timestamp paths, owner-checked Node publication, repository-backed static town pages, a synthetic land-stage baseline and labeled manual snapshots. The sample HUD uses Random explore and lower-left statistics/name with shared account access. GitHub identity/public data can be requested directly with a browser-memory token; confidential OAuth remains optional. Exploration progress is now browser-only for guests and signed-in users: earlier sections describing server progress synchronization are historical, not the current contract.

Checks on 2026-09-12 (UTC), with their revision boundaries:

- `npm test` passed **42 of 42 tests**. An earlier 41-test run preceded the final static-export correction; after sanitizing the legacy default bundle and normalizing its derived creation time to canonical ISO, the three targeted static tests passed before the complete rerun. This unit-suite run preceded the final navigation/draft-restoration changes, which were verified by the affected browser journeys below.
- The final `npm run build`, after all source changes including preview-query and local-draft recovery, passed TypeScript, validation of nine fictional sample projects/three snapshots/ten unchanged locked GLBs and Vite compilation of **49 modules**. The default sample correctly generated zero named publication routes. Static fixture tests separately generated a physical town page and checked asset/data resolution under a GitHub Pages repository subpath. The existing shared Three.js chunk-size advisory remains.
- A read-only, **unauthenticated** public GitHub capture of `ForOneIce/buildergame` succeeded: one repository, zero capture failures, and two snapshots consisting of the synthetic land baseline followed by the measured foundation state. This verifies a public API read and the resulting data, not a real personal-access-token connection or OAuth login.
- All four browser scripts passed, with different final-run boundaries. `tests/map-ui-check.cjs` passed before late-listing/CSS refinements; `tests/unified-ui-check.cjs` and English/Chinese 844×390 checks passed after the CSS correction, with a 16.3px gap between navigation (ending at 261.5px) and the overview (starting at 277.8px) and hints inside the viewport. Map/unified were not repeated after the later route-only changes. The affected lifecycle and PAT scripts were rerun on that final source, as recorded next.
- Final `tests/browser-check.cjs` passed after preview-query/draft-restoration changes: a local town uses `?preview=<slug>`, explicit publication produces `/towns/<slug>/`, and a fresh anonymous visitor can reload the published town. No page errors were reported.
- Final `tests/browser-github-check.cjs` passed after all source changes: invalid-token retry, direct listing/capture, cumulative commit counting, baseline playback, token-free storage/exports, preserved history after a rate-limit failure, authorization cleared on reload/disconnect and discarded late listing results. Its static fixture models HTTP 404 for unbuilt town documents while the existing `?preview=<slug>` shell refreshes with HTTP 200. It restores an unchanged-prefix local snapshot 2 over public snapshot 1 as unpublished, and rejects rewritten, unrelated and older caches. The suite reported no page errors, backend writes or progress requests. Authentication and error responses are fixtures, not a real token connection.
- An isolated production-static browser check passed against actual emitted HTML at `/buildergame/towns/<slug>/`, served without a Node API or Vite fallback. A sanitized one-repository capture fixture loaded assets/GLBs and WebGL with zero page errors, played baseline-to-foundation, and preserved the application base through direct reload, Home/reentry and root reload. This preceded the final local-preview navigation refinement; the final build and affected browser regressions cover that refinement. No remote Pages or Vercel deployment was performed.
- Codex inspected the final English/Chinese screenshots at 1440px, 360px and 844×390, plus the creation-success screenshot. This is an AI visual check; final human visual acceptance remains pending.

The existing `src/exploration.mjs` and `src/locations.mjs` primitives were preserved and tested. They do not establish that walking, interiors or resident-world-map interfaces have shipped; those interfaces remain deferred. New capture/account browser tests use provider fixtures unless explicitly identified above as the unauthenticated public read. No real token, confidential OAuth, public deployment, physical-device acceptance or adoption is claimed.

Local history separates license terms/notices in `0a4dd23`, data/backend/browser capture in `309d32b`, and final UI/static integration in `83e4a0f`. The last commit includes preview/draft routing, Vercel/Pages output, browser regressions and package license metadata. The custom license preserves prior CC0/GPL/dependency terms and describes the original application as noncommercial source-available. Vercel JSON and documentation whitespace checks passed; remote routing and any Functions backend remain unverified. [Requirements and acceptance](../specs/0012-named-towns-and-static-snapshots.md), [Vercel guide](vercel.md).

## Sample-town HUD refinement 0038

The [six requested sample-town HUD changes](../prompts/0038-refine-sample-town-hud.md) are implemented: removed sample account/save controls, relocated exploration and camera controls, name-only town identification and shared cream hints. Homepage/setup and real-town account/settings/export retain their existing scope. No new assets or dependencies were added.

Checks on 2026-09-12 (UTC):

- The updated existing `tests/browser-check.cjs`, `tests/map-ui-check.cjs` and `tests/unified-ui-check.cjs` all passed without page errors. These integration runs covered sample controls, project/history/progress behavior and real-town regression before the final CSS refinements.
- Focused English/Chinese layout and hint checks passed at 1440×1000, 768×1024, 360×800, 360×640 and 844×390. After the final CSS changes, English/Chinese checks repeated 844×390 and 360×640: keyboard-focused terrain hints stayed fully inside the viewport, the exploration panel sat at least 4px below its badge, and no page errors occurred. Final Chinese screenshots at both sizes were inspected without overlap.
- TypeScript without emit and sample/asset validation passed: nine projects, three snapshots and ten unchanged GLBs. The final post-CSS Vite production build passed after retry, processing 44 modules; only the existing shared Three.js chunk-size advisory remained.

The three integration scripts were not rerun after the last CSS refinements; final focused checks and the production build cover that final state. Unit tests were not rerun for 0038. Browser account/data transports use fixtures; live OAuth, publication and physical-device testing were not performed. Final human visual acceptance remains pending.

## Planning-page refinement 0037

The planner now uses compact header controls, a larger rendered terrain image, an aligned paper crease/page turn, expanded growth settings and optional backup tools. `town.plan.json` preserves incomplete input through `buildergame-plan/v1`; complete configuration and captured-town files retain their existing meanings. Three original terrain previews were regenerated at 1280×720. Sample towns expose terrain tours; real towns keep settings.

Checks on 2026-09-12 (UTC):

- The twelve existing data/API/landscape/player Node tests plus four planning-draft tests passed. The updated shared-interface and map browser scripts passed during integration; the broad browser journey passed after source/assets were frozen. Coverage includes mode/focus/reduced-motion and rapid-switch behavior, retained inputs, incomplete-plan save→fresh reload→file import, configuration export, both capture modes, backup/history, sample tours and real-town settings. Browser runs reported no page errors; a repository-refresh wait corrected a QA race, and the broad journey was rerun after a live asset reload.
- After all source/asset changes, TypeScript without emit, `node scripts/validate.mjs` (nine projects, three snapshots, ten unchanged GLBs) and Vite production build passed. The known shared Three.js chunk-size advisory remains.
- Final English/Chinese Chrome checks at 1440/760/360px found matching header tops at 28/20/18px, creation buttons taller than mode/terrain choices, 1280px source previews, no old Back/intro/line drawing, reduced-motion animation disabled, and no overflow/page errors. Terrain menus stayed within 1440×1000, 360×800 and 844×390 viewports. Desktop/mobile and mid-turn screenshots were inspected; the final sheet clipping keeps the turning paper below the header.

The shared-interface/map integration runs preceded final visual refinements; the broad run and targeted checks followed them. Account, repository and capture transports use fixtures. No live OAuth, public GitHub network verification, remote publication or physical-device testing was performed; final human visual acceptance remains pending.

## Balanced introduction and shared tooltip 0034

`src/main.ts` reuses `.control-hint` with `id="showcase-hint"` and `role="tooltip"`; `src/style.css` removes the introduction's character-width caps and positions the cream hint inside the illustration, 24px from its bottom. Focused Chrome checks in English/Chinese at 1440/768/360px passed: left/right introduction insets within 1px, hidden→hover-visible→hidden behavior, computed background/text/border/radius/shadow/font/padding/line-height matching the Create hint, and containment within the illustration/viewport without horizontal overflow or page errors. Desktop English/Chinese and mobile Chinese screenshots were inspected.

On 2026-09-12 (UTC), TypeScript without emit and validation of nine projects, three snapshots and ten unchanged GLBs passed before a final CSS-only tooltip-width adjustment. That adjustment lets the hint use the illustration's width; a targeted mobile Chinese check confirmed one-line text, and Vite production build passed again with the existing chunk-size advisory. The complete focused checks preceded this final width adjustment; no full suite was rerun and no tests or assets were added. Human visual acceptance remains pending.

## Hover tagline and framing 0033

This revision changes only `src/style.css`; no JavaScript, tests or assets changed. Focused headless Chrome checks at 1440/768/360px passed initial-hidden, hover-visible and pointer-exit-hidden caption behavior, exact Chinese wording, and no horizontal overflow or page errors. Desktop/tablet/mobile stage-5 screenshots were inspected: the full courtyard remained visible.

On 2026-09-12 (UTC), `tsc --noEmit`, `node scripts/validate.mjs` (nine projects, three snapshots, ten unchanged locked GLBs) and Vite production build passed. The existing Three.js chunk-size advisory remains. No full test suite was rerun for this CSS revision; human visual acceptance remains pending.

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

- Browser personal-access-token connection and confidential server OAuth were exercised with provider fixtures; no real token/OAuth authorization is claimed. Public unauthenticated GitHub reads are separately identified above. The optional OAuth flow requires a configured app/client secret. Server publication requires authentication and permits new towns owned by that account; updating an existing town requires its owner or the configured deployment administrator.
- No production URL, HTTPS reverse proxy or external hosting has been verified.
- A deployment supports multiple named towns with fixed rosters, landscapes and recorded histories. The optional Node server uses one process, in-memory OAuth sessions and private persistent town storage; server restarts require OAuth login again. Multi-instance session/storage coordination is not implemented. Exploration progress is browser-only and has no server synchronization.
- Static deployments support direct browser GitHub reads/manual capture, local progress and JSON backups. A local preview is not public server storage: exported `public/data/towns/<slug>.json` must be committed and rebuilt before other visitors can use its physical town route. Confidential OAuth and immediate host-side publication require a backend. Name uniqueness is checked against the deployment's known directory and build/server store, not unrelated hosts.
- Different initial collection sizes generate different town extents; this does not implement adding repositories to an existing town's history. The [generation assessment](procedural-town-plan.md) describes the separate migration required.
- Larger collections, accessibility beyond the tested keyboard/list routes, and physical mobile GPU performance need broader testing. A WebGL fallback keeps the project directory available.
- Walking/interiors, project sorting, the resident world map, ENS, on-chain storage, inventory, real currencies/payments and leaderboards are not implemented in the application. Sample mailboxes offer only the temporary visual coin demonstration recorded above.
- Reference-image generation prompts/tool identity have not been supplied. The human accepted and locked the current five building assets; this does not establish acceptance of the new roads, terrain or HUD composition.
