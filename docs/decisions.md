# Decision log

## D-018 — Use a large automatic showcase with silent transitions

- 2026-09-12 (UTC): the human requested a larger homepage building showcase with automatic stage cycling, no five-stage/pause buttons and no loading text. [Exact instruction](../prompts/0032-silent-automatic-building-showcase.md). This replaces the corresponding 0031 presentation and D-017's manual showcase controls.
- Implemented with cached GLB bytes, on-demand incoming-model parsing, one live WebGL scene and a temporary outgoing 2D frame. Enlarged framing retains the locked models. Reduced-motion entry shows static stage 5 with up to two quiet initial-load retries. Page visibility cancels future timers; in-flight work may finish until disposal.
- TypeScript, sample/asset validation, production build and the final extended shared-interface check passed, including cycle/delayed-frame continuity and a mocked first-load failure recovered on the second request. Stage-5 desktop/mobile screenshots were inspected. Other suites were not rerun for 0032. No new assets or scoring changes; final human visual acceptance remains pending. [Acceptance criteria](../specs/0011-shared-game-interface.md#silent-automatic-showcase-refinement-0032), [verification](verification.md).

## D-017 — Focus the homepage on builders and one building's growth

- 2026-09-12 (UTC): the human specified eleven homepage changes, including a level logo, icon login and hover action labels, concise builder copy, noninteractive individual/community illustrations and a single building cycling through the five accepted stages. [Exact instruction](../prompts/0031-refine-homepage-and-building-showcase.md).
- Move terrain tours into creation and show the selected terrain thumbnail on the plan. Remove the homepage backup button while preserving the existing backup workflows. Returning from a sample preview must retain the creation draft.
- Implemented under D-016; keyboard names/focus hints, stage pause/manual controls and reduced motion support the requested presentation. Existing building assets and scoring remain unchanged. Revision-specific TypeScript, sample/asset validation, production build, twelve tracked Node tests and three browser scripts passed, including draft/active-town retention and publication opt-out. Final human visual acceptance, real OAuth, remote publication and physical-device verification remain outstanding. [Acceptance criteria](../specs/0011-shared-game-interface.md#homepage-refinement-0031), [executed checks](verification.md).

## D-016 — Implement the shared interface across the application

- 2026-09-12 (UTC): the human instructed “正式开发改造项目”, authorizing application-wide implementation of the refined visual direction. [Instruction and translation](../prompts/0030-implement-shared-game-interface.md).
- This supersedes the preview-only restriction in D-013 through D-015. It is implementation authorization, not a claim of separate approval for every prototype detail or completed runtime QA.
- Implemented with free-asset provenance, locked buildings, organizer growth rules, existing data/account/backup behavior and English/Chinese support preserved. Production build, twelve tracked Node tests and extended interface/landscape/player browser checks passed; mocked-provider, physical-device and human-review limits remain explicit. [Specification](../specs/0011-shared-game-interface.md), [verification](verification.md).

## D-015 — Give key actions recognizable game-object forms

- 2026-09-12 (UTC): the human requested research into game design language and specified a kraft-paper planning drawing for creating a town, plus a map-or-globe exploration entry with a map-unfolding transition. [Instructions](../prompts/0029-object-based-game-interface.md).
- Preview choice: use a folded map for exploration, a physical planning sheet for setup and the existing doorway for project discovery. Concise labels support these objects instead of carrying their entire meaning. The researched games supply design references, not reused artwork.
- Scope remains the standalone proposal, with free selected assets and original layout/illustrations. No global integration is authorized before human visual confirmation. [Research and mappings](game-interaction-language.md), [specification](../specs/0011-shared-game-interface.md).

## D-014 — Reserve cream buttons for persistent selection

- 2026-09-12 (UTC): the human specified brown unselected buttons and cream selected buttons, to make control state and click targets understandable.
- Preview interpretation: brown surfaces with light labels are the default, including single-action buttons; persistent selected navigation uses cream with dark labels. Hover and keyboard focus use separate feedback without implying selection. Teal remains a panel material.
- Scope: revise the standalone proposal with the existing free asset selection. No new artwork or global integration; D-013's human-review gate remains in force. [Instruction](../prompts/0024-button-selection-language.md), [control contract](../specs/0011-shared-game-interface.md).

## D-013 — Review free wood, paper and teal materials before global application

- 2026-09-12 (UTC): the human selected wooden identity, cream paper and highly transparent teal floating panels, with free Kenney Adventure UI assets and no paid resources.
- Sequence is explicit: first revise the interactive visual proposal; apply the result globally only after the human confirms its appearance. This approves a material direction, not the finished layout or runtime migration.
- Preview implementation choice: embed six unchanged SVG originals from the verified Kenney Adventure UI 1.1 archive (CC0-1.0), with CSS sizing and a transparent teal surface. The standalone proposal remains outside the repository; the application and locked building models remain untouched.
- Source/verification boundaries: [project instructions](../prompts/0023-preview-material-direction.md), [selected files and license](ui-kit-research.md), [review criteria](../specs/0011-shared-game-interface.md). Human acceptance of the revised preview is pending.

## D-012 — Unify the interface across the complete town journey

- Human requirement: the homepage and town preview must share a consistent game visual language appropriate to Buildergame, with no abrupt visual boundary.
- Research scope: assess reusable management-game UI components before the next visual implementation. Existing five building assets remain locked.
- At the research stage, wood/paper/blue material variants, an icon family and component extraction were AI proposals in [0011](../specs/0011-shared-game-interface.md). D-013 records the subsequent human material selection and preview-only scope; broader component integration is still pending. [Source assessment](ui-kit-research.md).

## D-011 — Preserve accepted buildings while revising landscapes and player UI

- Human direction: lock the five accepted building appearances; choose flat, valley or cloud terrain at town creation; follow the supplied map/card references; allow GitHub players to retain exploration progress. Sources: [0020](../prompts/0020-landscapes-and-player-ui.md) and [0021](../prompts/0021-automatic-town-generation.md).
- Implemented contract: the landscape is fixed for a town's snapshot history, with missing legacy values treated as flat. New collections receive stable spiral plot assignments; existing imported coordinates are retained. Six stored scoring labels continue to map to five visuals, with townhouse/decorated sharing the final asset.
- AI implementation: original Three.js landscape assembly, reusable locked GLBs with SHA-256 verification, floating HUD/cards/minimap and local/account-scoped visit storage. Ordinary player login does not grant deployer publication authority.
- Placement update: flat/valley scenery currently uses 16-unit logical spacing and cloud districts have separate deterministic transforms; this supersedes D-009's earlier 12-unit render spacing without changing stored logical plot identities.
- Generation scope: different initial roster sizes are supported. Adding/removing membership inside existing history requires a separate versioned migration. Authored district modules are a researched follow-up proposal, not a completed framework.
- Walking, interiors, list sorting and the resident world-map UI stay deferred while the current town composition is reviewed. Real OAuth remains unconfigured; current build/browser checks passed with exact scope in [verification](verification.md). [Implementation record](../collaboration/landscapes-player-ui.md).

## D-010 — Deliver a playable bilingual, portable snapshot town

- Human requirements: use supplied visual references, implement personal GitHub and multi-owner hackathon modes, support UI/file configuration, export backups and public visitor exploration after capture.
- AI implementation: procedural merged 3D geometry, Vite/Node API, deployer-allowlisted GitHub OAuth, public REST metadata/history counts, append-only snapshots and JSON backup schema. Static viewing and full Node deployment are documented separately.
- Reference: [Input](../prompts/0012-playable-demo.md), [implementation specification](../specs/0005-playable-demo.md), [verification](verification.md).

## D-009 — Separate product onboarding and hackathon review

- Human direction: a conventional user-facing root README and a dedicated directory for judges.
- Implementation: hackathon/ contains the reviewer overview, rules, checklist and video outline. Root README explains the experience and usage workflow, with explicit incomplete status.
- Development records stay at their existing paths and are linked from the reviewer guide.
- Reference: [Project prompt](../prompts/0011-user-readme.md).

## D-008 — Extend the audience to individual developers

- Date: 2026-09-11.
- Human proposal: developer-owned towns for showcasing and interacting with public GitHub repositories, alongside event towns.
- AI recommendation: reuse the same engine and curated manifest, generalize branding, and retain the current ETHOnline pilot. Automated imports and account systems are deferred recommendations, not user-requested features.
- Evidence boundary: exponential repository growth, stronger product fit and adoption remain unverified hypotheses.
- References: [Project prompt](../prompts/0010-developer-towns.md), [scope](../specs/0004-developer-towns.md).

Record dates, decisions, attribution, rationale, impact, and references. Unconfirmed AI proposals belong in the brief.

## D-000 — Create a separate workspace

- Date: 2026-09-11.
- User instruction: create `buildergame`, organize collaboration around competition requirements, and record subsequent ideation.
- Implementation: documentation, specs, prompts, collaboration, implementation, tests, and submission directories.
- Attribution: the user specified the name and recording objective; AI implemented the directory structure within that scope.
- Boundary: no product selected, no old code copied, no earlier discussion treated as a final specification.
- Reference: [Original instruction](../prompts/0000-workspace-setup.md).
- Initial commit: `0b573c4`.

## D-002 — Assess the user-originated town proposal

- Date: 2026-09-11.
- User instruction: assess a Three.js hackathon town, preparation, partner fit, costs, and user acceptance.
- Confirmed scope of this session: research and assessment only.
- Attribution: the user originated the town, house-growth, metric-selection, and sign interaction concept; AI supplied technical/product critique and recorded proposals.
- No confirmation: the suggested MVP size, metric policy, blockchain layer, ENS integration, and competition route are not implementation decisions.
- Evidence: existing showcase README and GitHub REST limits retrieved on September 11; partner rules from earlier official-page reading.
- References: [Original idea](../prompts/0002-hackathon-town.md), [review](ideation/0002-hackathon-town-review.md).

## D-003 — Record organizer deployment and two presentation modes

- Date: 2026-09-11.
- User-specified direction: event-branded organizer deployments; deployment-time game version; static snapshot or live monitoring; visually recognizable building evolution.
- Scope: conceptual refinement, not authorization to build or deploy.
- AI proposals: separate data timestamp, stable plots, persisted snapshots, last-visit comparison, and skippable opening.
- Sponsor and competition route: still undecided.
- Reference: [Input](../prompts/0003-town-deployment-modes.md).

## D-004 — Fixed plots and timeline transitions

- Date: 2026-09-11.
- User-defined direction: stable land positions per project, whole-town timeline selection, and visible scene transitions between versions.
- AI elaboration: snapshot semantics, stable camera, missing-data behavior, display-policy consistency, and accessible transition options.
- Status: interaction direction supplied by the user; implementation details remain a draft.
- References: [Input](../prompts/0004-town-timeline.md), [draft](../specs/0001-town-timeline.md).

## D-005 — Organizer-selected scoring governs house growth

- Date: 2026-09-11.
- User decision: organizers choose commits, stars, or their own complete repository-to-score table; the app renders according to that choice.
- Supersedes: AI recommendations to mandate attention/development separation or additional platform-selected adjustments.
- AI work: document configurable sources, direct score-to-stage mapping, complete-table validation, and snapshot behavior.
- Scope: accepted product principle; no implementation or deployment authorization.
- References: [Input](../prompts/0005-organizer-growth-rules.md), [specification](../specs/0002-organizer-growth-rules.md).

## D-006 — Use cumulative commits without inactivity decay

- Date: 2026-09-11.
- User clarification: historical commit totals remain recorded; stopping new commits does not imply abandonment or a smaller house.
- Behavior: unchanged total and mapping → unchanged building; confirmed zero-commit repository → empty-land stage.
- Supersedes: AI's recent-activity interpretation and related decay concern.
- Technical details still pending: repository/reference count definition, handling changed Git history, and stage boundaries.
- Reference: [Input](../prompts/0006-cumulative-commit-growth.md).

## D-007 — Build the Web2-first pilot Demo

- Human decision: ETHOnline 2026 pilot; lower weight for cumulative commits, medium for stars, higher for forks; reusable Web2 base and deferred ENS.
- AI implementation choices: TypeScript, Vite, Three.js, provisional weights 1/3/6, replaceable procedural buildings and sample snapshots.
- Status: initial implementation; actual project list, final art and verification remain pending.
- References: [Input](../prompts/0007-web2-demo.md), [Demo specification](../specs/0003-web2-demo.md).

## D-008 — Prioritize visual validation before feature expansion

- Human instruction: evaluate the visual technology against the new design sheets and achieve the expected visuals before other work.
- Work sequence: pause expanded exploration/map functionality and first validate a complete-house visual sample.
- AI recommendation, not a final human technology choice: authored Blender/GLB assets rendered with the existing Three.js runtime.
- References: [Input](../prompts/0014-visual-pipeline.md), [evaluation](../specs/0007-visual-pipeline.md), [research record](../collaboration/visual-research.md).

## D-009 — Integrate accepted building direction into fixed town plots

- AI implementation choice following the instruction to continue: render the five authored GLBs at 12 world units per existing logical plot. The 9.4-unit final courtyard fits without moving projects between snapshots.
- Use instanced distant assets and at most six nearby full-detail buildings. Preserve the studio and defer walking/maps until visual review.
- [Scope and acceptance](../specs/0009-town-visual-integration.md); [verification and reuse](../collaboration/town-visuals.md). This is not new human approval of the entire town composition.
