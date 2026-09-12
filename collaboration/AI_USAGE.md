# AI usage disclosure

Codex assisted with project planning, research, translations, specifications, implementation and tests. The current landscape/HUD revision passed production build and targeted/full browser journeys; exact checks and limits are in [verification](../docs/verification.md). Human-supplied reference images are recorded in design/; their generation tool and prompts have not been supplied. The human accepted the five building assets, while the revised town composition and adoption remain unvalidated.

## Human contributions

- Originated the hackathon town concept and the problem of projects losing visibility after events.
- Specified organizer deployments, event branding, permanent plots and whole-town history navigation.
- Defined organizer authority over growth, cumulative commits without inactivity decay, and complete custom score imports.
- Selected the ETHOnline 2026 pilot, commits/stars/forks weight ordering, Web2 portability and deferred ENS integration.
- Supplied visual references and specified bilingual interaction, personal/hackathon setup, deployer GitHub login, portable backups and public visitor access.
- Accepted and locked the five building appearances; specified flat, valley and cloud landscapes, map-style floating controls, player avatars/progress and project-card composition.

## AI contributions

Session 0025: the human requested more breathing room and easier reading. Codex revised the standalone proposal's typography, spacing, field/action grouping, responsive layout and project-card placement. The card uses separately labeled metrics and restores keyboard focus when closed. [Instruction](../prompts/0025-readable-preview-layout.md) and [specification](../specs/0011-shared-game-interface.md). Targeted browser checks and screenshots covered desktop/narrow layouts and the Chinese card; checked text and controls fit horizontally. The approved button-state rule and existing assets are retained. Human acceptance remains pending; no global application or runtime test result is claimed.

Session 0024: the human required brown unselected buttons and cream selected buttons. Codex revised the standalone preview with light labels on brown, dark labels on persistent cream selection and brown single-action buttons. Native keyboard focus and pressed depth remain separate from selection; teal remains a panel surface. [Instruction](../prompts/0024-button-selection-language.md) and [control contract](../specs/0011-shared-game-interface.md). Browser checks covered three-screen selection, with entrance and neighborhood screenshot review. The existing free asset selection is unchanged; no new import or runtime integration is part of this correction. Human confirmation remains pending.

Session 0023: the human selected free Kenney Adventure UI materials, cream reading surfaces and highly transparent teal panels, then explicitly required preview approval before global use. Codex adapted the standalone English/Chinese visual proposal with six unchanged SVG originals from verified Kenney Adventure UI 1.1 (CC0-1.0), CSS frame behavior and an independent translucent teal background. Only the external preview and project records are in scope; application code, dependencies and locked building assets are unchanged. Human acceptance of the revised appearance and later global integration remain pending. [Instructions](../prompts/0023-preview-material-direction.md) and [source register](../docs/ui-kit-research.md) distinguish reused artwork from AI-generated layout and styling. Browser checks covered three-screen navigation, the sample card, language switching and desktop screenshot review; no new runtime regression result is claimed.

Session 0022: Codex audited the homepage/setup/town/card visual split and researched reusable game UI assets, icons and browser primitives. [The research](../docs/ui-kit-research.md) distinguishes observed licenses from integration estimates; [the proposal](../specs/0011-shared-game-interface.md) defines a shared game vocabulary. An in-conversation HTML/CSS concept uses the existing fictional town screenshot and host-provided icons. No candidate pack, new dependency or runtime skin was imported or implemented; human direction review remains pending.

Sessions 0020–0021: Codex researched terrain and automatic-layout options, implemented immutable landscape configuration, original Three.js terrain assembly, floating HUD/cards/minimap, player OAuth and local/account progress. The accepted GLBs remain unchanged and are checked by fingerprints. Source instructions are [0020](../prompts/0020-landscapes-and-player-ui.md) and [0021](../prompts/0021-automatic-town-generation.md); [the implementation record](landscapes-player-ui.md) identifies research, file scopes, executed checks and limits. Integration review resumed on 2026-09-12 (UTC), including documentation reconciliation, production build, full/targeted browser checks and actual screenshot inspection. Player authorization, avatars and synchronization were tested with mocked provider/session responses; real OAuth remains unconfigured. Walking, sorting and world-map UI remain deferred.

Session 0019: Codex addressed the human's missing-foundation report by adding a fictional sample project and synchronizing its JSON. [Evidence and limits](sample-foundation.md). No new geometry or real repository observation was produced.

Session 0018: the human supplied the land-stage correction; Codex implemented the green surface, broken fence segments and small saplings in the Blender source and two stage-1 assets. [Revision evidence](moss-land-stage.md) records generation and executed checks. Final human visual acceptance is pending.

Session 0017: Codex derived five reduced-detail GLBs and generated the main town integration, instancing, loading/retry lifecycle, project signs and targeted browser checks. [Town integration record](town-visuals.md) documents evidence and limits. The human has not yet reviewed this integrated result.

| Scope | Actual assistance | Verification status |
| --- | --- | --- |
| docs/ | Feasibility, GitHub API research, competition-source summaries and decisions | Sources recorded; product assumptions not user-validated |
| specs/ and prompts/ | Requirements, original project instructions, labeled translations and implementation plan | Historical documentation checks recorded in collaboration log |
| src/ | TypeScript/Three.js scene, locked GLB loading, generated terrain, bilingual setup/HUD/cards/minimap, progress, data contract and link boundary | Current production build and targeted/full browser checks passed |
| server/, scripts/, tests/ | Deployer/player OAuth, GitHub reads, snapshots, account progress, asset lock, CLI and regression tests | Recorded Node/browser results in verification; OAuth mocked; earlier real public reads verified |
| scripts/art/ and public/models/ | Original Blender authoring source, five building appearances and distant GLB derivatives | Human accepted the five appearances; ten GLBs protected by fingerprints |
| package.json, tsconfig.json, vite.config.ts, index.html | Dependency and build setup | Installed and built; npm audit reported zero vulnerabilities after Vite update |
| README.md and collaboration/ | Project status, contribution and reuse documentation | Does not establish adoption or production readiness |
| hackathon/ and submission copy | Reviewer guide, rules, checklist, demo outline and English project description | Final video, human narration and submission verification pending |

## Development trace

Session 0016: the human accepted the prior visual style. Codex expanded the final courtyard without scaling the architecture, derived four other appearances and implemented stage selection/retry in the studio. [Five-stage record](five-stages.md) documents Blender exports, architecture fingerprints, real browser checks and pending review of the new art.

Session 0015: Codex authored the Blender model-generation script, generated original mesh/texture assets and wrote the standalone Three.js house studio and browser checks. Actual exports, visual corrections, test results and unresolved fidelity/performance limits are in the [prototype record](house-prototype.md). No image-generation service or third-party model pack was used. Human visual acceptance is pending.

Session 0014: Codex inspected the new reference sheets and current rendering code, researched primary-source technology/asset pages, and wrote a [visual pipeline evaluation](../specs/0007-visual-pipeline.md). No replacement render or imported asset was produced. Human visual acceptance remains pending. See the [research record](visual-research.md).

Session 0012: the human supplied six visual references and specified two setup modes, deployer GitHub authorization, bilingual UI, portable snapshot backup and public exploration. Codex generated the server, data pipeline, tests, procedural 3D components and UI. Eight Node tests and browser journeys passed; browser capture/OAuth responses were mocked for repeatability, while separate public GitHub reads were verified live. Real OAuth authorization and a hosted production deployment have not been tested. The reference image model/prompts were not supplied, so no attribution has been invented.

Session 0011: Codex wrote the user-facing root README and relocated reviewer materials to hackathon/ at the human's direction. The README identifies planned and unverified functionality; no product code changed.

Session 0010: the human proposed developer portfolio towns. Codex assessed reuse of the existing data contract, wrote the scope and translated the project-related prompt excerpt, and updated positioning documents. No developer-mode implementation or adoption is claimed.

Project prompt records 0002–0007 and linked specifications preserve human requirements and AI proposals. Earlier recommendations conflicting with organizer-controlled growth were corrected after human feedback. See [collaboration log](log.md) for outputs and checks, and [reuse baseline](baseline.md) for dependencies and related prior work. No prior project code or art has been imported.
