# Human–AI collaboration log

## 0023 — Preview selected materials before global integration

- 2026-09-12 (UTC), visual-proposal iteration: the human selected free Kenney Adventure UI wood elements, cream paper and highly transparent teal floating panels. The human then specified that the revised proposal must be shown first and confirmed before application across the product.
- Codex inspected the selected archive/license and adapted the standalone three-screen English/Chinese proposal using six unchanged SVG originals from Adventure UI 1.1 (CC0-1.0), original CSS and the existing fictional town screenshot. A teal surface alpha of 0.24 is a preview design choice, with text opacity kept independent. No paid material is used.
- Outputs: [project instructions](../prompts/0023-preview-material-direction.md), revised [shared interface specification](../specs/0011-shared-game-interface.md), [exact source register](../docs/ui-kit-research.md) and contribution/decision records. The preview is stored outside the repository; no public link to local source or inspection artifacts is required.
- Boundary: the application, dependencies and locked five-stage building models remain unchanged. Preview controls remain illustrative, and do not perform real authentication, capture or publishing. Global migration and human acceptance of the revised appearance are pending.
- Verification: the local source manifest was read and its six selected filenames, version, license and archive checksum were reconciled with the reuse record. Scoped `git diff --check` passed, and all 114 local Markdown links across eight changed records resolved. Browser inspection confirmed all three preview screens, sample-card opening and the Chinese toggle; screenshots were reviewed for material rendering and desktop layout. The fragment contains six embedded SVGs, no unresolved asset placeholders and is below 1 MB. Runtime regression tests were not rerun for this preview-only iteration; responsive and full accessibility checks remain for global integration.

## 0022 — Research a shared game interface

- 2026-09-12 (UTC), visual research: the human identified a disconnect between the homepage and town controls, asked for a consistent game visual language and an evaluation of reusable management-game UI components.
- Codex reviewed current code/screenshots and supplied references, inspected official Kenney previews and source/license pages for game UI assets, icon sets and native web controls, and compared reuse costs. Produced [source research](../docs/ui-kit-research.md), [the shared interface proposal](../specs/0011-shared-game-interface.md) and an in-conversation concept with three screen states and material alternatives.
- Reuse/evidence: candidate packs were not downloaded or adopted. The concept uses original HTML/CSS and a crop from the project's fictional sample screenshot; supplied Lucide placeholders are part of the conversation preview only. No application code, model, dependency or external account was changed. Research is not final visual acceptance.
- Verification: official pages and local source/screenshots inspected; documentation links and whitespace checked before the local documentation commit. Runtime tests were not rerun for this research-only change. [Original instruction and translation](../prompts/0022-unified-game-ui.md).

## 0020–0021 — Landscapes, player interface and automatic layout

- 2026-09-11 (UTC): the human accepted and locked the five construction appearances, requested three immutable landscape modes, floating map controls, GitHub player avatars/progress and project cards, and asked how collection size can drive town generation.
- Codex researched available terrain/layout techniques, added landscape validation and stable placement, preserved the GLBs with fingerprint checks, and implemented original landscape assembly, HUD/cards/minimap, player OAuth and local/account visit storage. [Implementation and evidence](landscapes-player-ui.md) distinguish completed work from proposed district/membership extensions.
- Sources: [0020 — Landscapes and player UI](../prompts/0020-landscapes-and-player-ui.md), [0021 — Automatic town generation](../prompts/0021-automatic-town-generation.md). Real OAuth and final human review of town composition remain pending.
- 2026-09-12 (UTC): implementation continued with integration review and documentation reconciliation. Updated the product guide, deployment instructions, verification boundaries and development entry points. The current production build and full/targeted browser journeys passed; all ten locked GLBs remained unchanged. Checked three terrain modes, cards/minimap, guest progress, mocked player avatars/synchronization, delayed uploads, legacy configuration, languages and mobile controls. Inspected actual flat/cloud/mobile-card screenshots; human town-composition review remains pending. Geometry checks at 1, 9 and 50 projects do not establish large-town browser performance. [Exact results](../docs/verification.md) preserve the distinction between mocked OAuth and earlier real public GitHub reads.
- Final targeted Node run: all twelve data/API/landscape/player tests passed, including stable configuration output at 1, 9, 50 and 200 projects. Documentation review: local Markdown targets resolved and scoped whitespace checks passed. Historical records below retain their original scope. Walking, interiors, list sorting and the resident world map remain deferred.

## 0019 — Complete the sample's stage coverage

- 2026-09-11 (UTC): human reported the missing second-stage example. Codex added First Bricks as a ninth fictional project, synchronized the public sample and checked the five-stage default view. [Evidence](sample-foundation.md).

## 0018 — Green land-stage correction

- 2026-09-11 (UTC): the human requested green lichen instead of yellow clearing, incomplete fencing and small saplings. Codex revised only stage 1, regenerated its two detail levels and verified the studio and town renders. [Iteration evidence](moss-land-stage.md).

## 0017 — Authored town integration

- 2026-09-11 (UTC): continued the visual-first iteration, integrated five authored stages into fixed 12-unit plots and connected streets, added distant instancing and nearby detail, and retained project/timeline interactions.
- [Integration record](town-visuals.md) identifies the human direction, AI implementation, reuse, executed checks and performance limits. Human acceptance of the integrated street composition is pending.

## 0016 — Expanded courtyard and five appearances

- Human accepted the visual direction and requested more final-stage garden/sign space, followed by all other appearances. Codex generated the five assets and added stage selection, matching references, resource cleanup and retry handling to the studio.
- [Iteration record](five-stages.md) includes actual geometry checks, asset sizes, browser tests, build results, reuse and limits. The final courtyard is 76.6% larger; 262 architectural/attached-furnishing objects remained identical. No remote push.

## 0015 — Complete-house visual prototype

- Generated an original Blender GLB and bilingual standalone viewer at `/visual.html`, with visual revisions based on real browser captures. [Full record](house-prototype.md) includes human/AI contribution, source/license register, exact asset statistics, executed checks and remaining limits.
- Fourteen working-tree Node tests, TypeScript, targeted browser interaction checks and the multi-page production build passed. Final human visual review, real mobile GPU tests and large-town LOD remain pending. No remote push.

## 0014 — Visual pipeline evaluation

- Human redirected work to visual quality before feature expansion. Codex inspected the five new building sheets, the street reference and current rendering code, then researched primary-source technology and asset pages.
- [Research record](visual-research.md) documents actual tools, outputs, source limitations, candidate reuse and pending human review. [Evaluation](../specs/0007-visual-pipeline.md) proposes a complete-house sample before five stages and a street.
- No runtime changes, new render, asset installation, GPU benchmark or remote publication in this evaluation. Documentation whitespace checks passed.

## 0012 — Deployment documentation and final source checks

- Added local/Node/static deployment instructions, OAuth setup, JSON backup locations, capture CLI examples and an explicit verification record. Updated product and reviewer READMEs to describe the playable Demo accurately.
- Final source checks: TypeScript and sample-bundle validation passed; local Markdown links and whitespace checks passed; the targeted credential-pattern scan found no matches or private/.env files in publishable paths.
- Full build passed earlier in this session; production output has not been rebuilt after the final visual/mobile changes. Real OAuth and hosted production remain unverified.
- Local implementation stages: 774601d data/API and df1652d playable UI; no assistant push or remote deployment performed.

## 0012 — Playable island and UI verification

- AI: built reusable merged house geometry, blue shingle roofs, timber frames, island cliffs, greenery, signs, dock and cloud scenery; implemented bilingual welcome/setup/success/town screens, both collection modes, public viewing, capture, export/import, and deployment instructions.
- Browser verification: desktop 1440×1000 and mobile 390×844 journeys passed without page errors. Checked actual WebGL canvas, timeline, details, backup round trip, language switch, both setup/capture journeys (mocked capture transport), local reload and overflow. Fixed exposed hidden input, stretched avatars, cliff overlap and camera framing found during visual review.
- Real read-only GitHub smoke checks: public repository listing returned 36 repositories for the supplied account; a one-repository capture returned a fresh observation with cumulative count, default-branch reference and HEAD SHA. It was not published. OAuth with real credentials remains untested.
- TypeScript and eight data/API tests passed after these changes. Production build passed; a final build follows remaining documentation updates.

## 0012 — Data and authorization foundation

- Human: supplied visual references and requested personal/hackathon setup, bilingual UI, authorized public-repository capture, JSON backup and public visitor access.
- AI: implemented the Node API, GitHub OAuth state/session/allowlist, public REST metadata and cumulative history counts, snapshot capture, token-free bundle projection, import validation and CLI tools. Added fictional sample data and upgraded Vite after a dependency audit.
- Verification: eight Node tests passed, covering data/history integrity, stale observations, commit pagination, OAuth state, anonymous publication rejection, same-origin checks and public viewing. GitHub calls in these tests are mocked; real OAuth remains untested until deployment credentials are configured. TypeScript check passed before the pending browser pass.
- Local history: 05731c1 preserves completed product/reviewer documentation. Subsequent data and UI work is being committed in separate stages at the human's request.

## 0011 — Product README and reviewer guide

- Date: 2026-09-11.
- Human contribution: specified a user-facing project homepage and separate hackathon presentation directory.
- AI contribution: moved reviewer materials into hackathon/, wrote the root README around the town experience and usage, and updated links and documentation policy.
- Verification: relative-link and whitespace checks. Application tests not applicable to this documentation change; existing implementation limitations remain disclosed.

## 0010 — Developer portfolio use case

- Date: 2026-09-11.
- Human contribution: expanded the target audience to individual developers exhibiting public repositories.
- AI contribution: compared event/developer workflows, reviewed the existing data contract, drafted a shared-engine scope, and updated product positioning. Preserved the project-related prompt excerpt with a labeled translation.
- Outputs: prompt 0010, spec 0004, README, brief, decisions and AI disclosure.
- Verification: reviewed types and documentation links; no application code changed or new product acceptance tests performed. Developer-mode behavior remains unverified.

## 0007 — Demo scaffold

- Date: 2026-09-11.
- Human: chose ETHOnline 2026, commits/stars/forks weight ordering, deferred ENS, reusable Web2 base.
- AI: wrote Demo spec before initial code; generated Three.js renderer, timeline/directory UI, data validation, styling, configuration and English submission text. Updated README to disclose incomplete status.
- Verification: implementation tests and build remain pending.
- Pending: complete sample data and scripts, install dependencies, test/build and visual verification, actual event list/art, human review. No push, deployment or user validation performed.
- Tools: Codex shell and apply_patch. No other AI design tools used.

Record actual inputs, contributions, and verification; planned work is not completed work.

## 0000 — Create the workspace

- Date: 2026-09-11.
- Human contribution: specified the workspace name, competition-oriented structure, and recording of subsequent ideation.
- AI contribution: summarized prior background and previously read official rules; created collaboration instructions and submission templates.
- Outputs: initial workspace files; scopes listed in `AI_USAGE.md`.
- Topic status: undecided; no code copied from `web3-FTW` or other existing projects.
- Verification: checked 16 workspace files; local links in 13 Markdown files resolved; staged whitespace checks passed; working tree clean after commit. No product tests were applicable.
- Version record: local initial commit `0b573c4`; no remote publication.
- Open questions: topic, roles, track, partners, acceptance criteria, and user validation.
- Input: [0000-workspace-setup](../prompts/0000-workspace-setup.md).

## 0002 — Review Hackathon Town

- Date: 2026-09-11.
- Phase: ideation and assessment.
- Human contribution: conceived a Three.js town linking events, repositories, builder profiles, activity-driven house models, and viewer interactions.
- AI contribution: researched the existing showcase and GitHub REST limits; assessed feasibility, incentive risks, costs, chain boundaries, sponsor fit, and validation; produced a feasibility review.
- Sources: existing HackathonGalacticShowcase README and official GitHub rate-limit page retrieved today; partner pages reviewed earlier in this conversation.
- Outputs: prompt 0002, feasibility review, and updated project/AI/reuse/decision records.
- Verification: all local links in 16 Markdown files resolved and git diff --check passed. No implementation, performance test, pilot interview, or user retention measurement performed.
- Open questions: pilot, data mapping, display policy, reuse/track, assets, and partner choice.
- References: [Input](../prompts/0002-hackathon-town.md), [review](../docs/ideation/0002-hackathon-town-review.md).

## 0003 — Refine organizer deployments and presentation modes

- Date: 2026-09-11.
- Human contribution: specified self-deployed, event-branded towns, deployment-time game versions, fixed editions and live monitoring, and visual building evolution.
- AI contribution: recorded and translated the refinement; separated deployment versions from data snapshots; proposed persistence, stable plots, and clear change comparisons.
- Outputs: prompt 0003, review section 13, and updated status/decision/AI records.
- Verification: local links in all 17 Markdown files resolved and git diff --check passed. No product code, deployment, or user validation.
- Input: [0003-town-deployment-modes](../prompts/0003-town-deployment-modes.md).

## 0004 — Fixed plots and timeline transitions

- Date: 2026-09-11.
- Human contribution: specified permanent project plots and town-wide timeline transitions to make changes visible.
- AI contribution: drafted snapshot/version semantics, transitions, stable identity, policy consistency, accessibility, and proposed acceptance criteria.
- Outputs: original prompt with English translation, draft timeline specification, and updated cross-references.
- Verification: local links in all 19 Markdown files resolved and git diff --check passed. Product acceptance criteria remain untested.
- References: [Input](../prompts/0004-town-timeline.md), [draft](../specs/0001-town-timeline.md).

## 0005 — Organizer-defined growth rules

- Date: 2026-09-11.
- Human contribution: clarified that each organizer's values determine growth; custom scores require complete repository mapping before deployment.
- AI contribution: corrected prior assumptions, specified commits/stars/custom sources and validation, and removed conflicting current recommendations.
- Outputs: prompt 0005, growth-rule specification, reconciled review/timeline, and updated records.
- Verification: all local links in 21 Markdown files resolved; git diff --check passed; conflicting current metric-separation recommendations were reconciled. No product code or acceptance tests.
- References: [Input](../prompts/0005-organizer-growth-rules.md), [specification](../specs/0002-organizer-growth-rules.md).

## 0006 — Cumulative commits preserve buildings

- Date: 2026-09-11.
- Human contribution: clarified historical total commits and rejected the implied inactivity/abandonment mechanic.
- AI contribution: corrected recent-window wording and recorded persistent cumulative growth with empty-versus-unavailable data handling.
- Outputs: prompt 0006 and updated specs, review, policy, and project records.
- Verification: local links in all 22 Markdown files resolved and git diff --check passed. No product code or acceptance tests.
- Input: [0006-cumulative-commit-growth](../prompts/0006-cumulative-commit-growth.md).
