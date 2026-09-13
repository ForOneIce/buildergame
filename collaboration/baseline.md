# Pre-existing work and new contributions

Recorded on 2026-09-11. This is a workspace baseline, not the official event start or confirmation of eligibility.

## Current baseline

Session 0043: read-only research of ENSv2, Privy and current prize requirements; no SDK, code, asset or contract was imported. These remain [unapproved candidates](../docs/ideation/0043-web3-support-options.md).

Sessions 0039–0042: named-town storage/routing, baseline snapshots, browser-only exploration, direct GitHub capture/token access and static Vercel/Pages output are original Codex-assisted work using the existing Node/Vite/Three.js stack. The pre-existing `src/exploration.mjs` and `src/locations.mjs` primitives were preserved and tested, not newly released walking or world-map interfaces. No additional dependency, external artwork, paid asset or storage service is added; no Vercel or GitHub SDK was installed. The license update in local commit `0a4dd23` applies only where no separate license already governs the material: CC0 building/Kenney assets, GPL-3.0-or-later authoring scripts/art test and dependency terms remain intact. Data/backend/browser-capture work is separated in `309d32b`. Supplied design references have no inferred reuse grant. The final 42-test suite, 49-module build, four browser scripts and focused short-viewport/production-static checks passed within the revision boundaries in [verification](../docs/verification.md), preserving all ten locked GLBs. Human visual review remains pending. [LICENSE](../LICENSE), [NOTICE](../NOTICE), [workflow scope](../specs/0012-named-towns-and-static-snapshots.md), [Vercel sources](../docs/vercel.md). Historical checks below apply to their recorded revisions.

Session 0038: the implemented sample-town HUD refinement reuses existing control markup, exploration/history behavior, cream hints and previously vendored CC0 Kenney materials. No new artwork, model, dependency or license scope is introduced. Validation preserved all ten GLBs; browser/focused checks and the final production build passed with timing and limits in [verification](../docs/verification.md). Homepage/setup and real-town account/settings/export retain their existing scope. [Instruction](../prompts/0038-refine-sample-town-hud.md); human visual acceptance remains pending.

Session 0037: planner changes reuse the existing header, hand/community SVGs and paper/wood styles; `src/planning-draft.mjs` is original application code. The three original terrain previews were regenerated at 1280×720 from the same fictional scenes/framing; the updated [manifest](../public/ui/landscapes/manifest.json) records 2560×1440 source captures using locked distant buildings, crops and hashes. Asset-only commit `2868c56` contains the three PNGs and manifest. These dimensions supersede earlier thumbnails without adding external artwork, dependencies or license scope. Final validation preserved all ten GLBs; [verification](../docs/verification.md) records passing checks and limits. [Instruction](../prompts/0037-refine-town-planning-page.md).

Session 0036: homepage header alignment reuses existing controls/styles with no new asset, dependency or license scope. Focused checks passed. [Instruction](../prompts/0036-align-homepage-header-top-edges.md), [results and limits](log.md#0036--align-homepage-header-top-edges).

Session 0035: homepage action reordering reuses existing buttons, artwork and styles; no new assets or dependencies. Focused checks and TypeScript passed. [Instruction](../prompts/0035-create-before-explore.md), [results](log.md#0035--place-create-before-explore).

Session 0034: introduction spacing and the building hint reuse existing layout and cream tooltip styles, with no new asset, dependency or license scope. Focused checks/build validation passed; all ten GLBs remain unchanged. [Instruction](../prompts/0034-balanced-intro-and-shared-tooltip.md), [verification and check timing](../docs/verification.md).

Session 0033: the CSS-only hover tagline and enlarged framing reuse the existing renderer and locked buildings. No new artwork, dependency or license scope is introduced. Focused browser/build checks passed; all ten GLBs remain unchanged. [Instruction](../prompts/0033-hover-tagline-and-larger-building.md), [verification](../docs/verification.md).

Session 0032: the enlarged automatic showcase reuses the existing five-stage GLBs, Three.js renderer and homepage assets. Original framing, byte preloading/cache, on-demand parsing, 2D-frame dissolves and bounded quiet retry code were added without another external asset, dependency or license declaration. The cache retains GLB bytes, not five live 3D scenes. TypeScript, sample/asset validation, production build and the final extended shared-interface check passed; all ten GLB fingerprints remain unchanged. Other test suites were not rerun for this revision. [Verification and limits](../docs/verification.md), [instruction](../prompts/0032-silent-automatic-building-showcase.md).

Session 0031: the homepage refinement reuses the project's five accepted full-detail GLBs and existing Three.js dependency in `src/home-showcase.ts`. Codex authored the original hand/community SVG drawings in `src/ui/builder-symbols.ts`. The three 320×180 PNGs under `public/ui/landscapes/` are cropped renders of the actual application's flat/valley/cloud fictional sample scenes; [the manifest](../public/ui/landscapes/manifest.json) records source paths, capture/crop details and hashes. All three output dimensions/hashes and five source hashes matched. They are original project artwork/renders, not another external pack; no separate license dedication for these new files is asserted. Existing building-asset and Kenney CC0 declarations retain their stated scopes. No paid resource or new dependency is added. TypeScript, sample/asset validation, production build, twelve tracked Node tests and all three browser scripts passed; [verification](../docs/verification.md) records screenshot review and mocked-transport limits. Final human visual acceptance remains pending. [Requirements](../prompts/0031-refine-homepage-and-building-showcase.md).

Session 0030: application-wide integration is implemented. Vendored six unchanged Adventure UI 1.1 SVGs and five unchanged Cursor Pack 1.1 PNGs under `public/ui/kenney/`, with each pack's original `License.txt` and a generated source/hash manifest: [Adventure](../public/ui/kenney/adventure/manifest.json), [Cursor](../public/ui/kenney/cursor/manifest.json). Both packs are CC0-1.0. The directory's `.gitattributes` preserves original asset/license bytes. Codex authored `src/ui/theme.css` for shared materials, control states, object-entry drawings, transitions and cursor rules, `src/ui/icons.ts` for original geometric icons, and `src/ui/planning.ts` for the planning composition; no Lucide dependency was added. The eleven artwork files and two license files match the recorded SHA-256 values. Production build, twelve tracked Node tests, extended shared-interface checks and landscape/player browser regression passed; [verification](../docs/verification.md) states mocked-provider and device limits. Earlier entries describe the preview-only scope at their respective stages.

Session 0028: selected unchanged originals from Kenney [Cursor Pack](https://kenney.nl/assets/cursor-pack) 1.1, CC0-1.0, retrieved 2026-09-12, for the standalone preview. Files in `PNG/Outline/Default/`: `tool_axe_single.png`, `steps.png`, `hand_point.png`, `hand_open.png` and `hand_closed.png`; matching outline SVG sources were inspected. [Source/archive checksum and scope](../docs/ui-kit-research.md). Cursor roles, hotspots, poster-door placement and CSS opening behavior are Codex adaptations. Existing Adventure UI assets and original fictional town imagery remain; no paid resource or application dependency is added. This is preview reuse, with global integration still awaiting human confirmation.

Session 0023: the standalone visual proposal reuses six unchanged SVG originals from Kenney's [UI Pack – Adventure](https://kenney.nl/assets/ui-pack-adventure), verified archive version 1.1, CC0-1.0, retrieved 2026-09-12. Files: `panel_brown_dark_corners_a.svg`, `panel_brown_dark.svg`, `panel_brown.svg`, `button_brown.svg`, `panel_border_brown.svg` and `round_brown.svg`, all from the archive's `Vector/` directory. [Source/archive checksum and usage register](../docs/ui-kit-research.md). Codex authored the surrounding layout/CSS, frame adaptation and transparent teal surface; the existing fictional town image remains original project artwork. The preview is outside the repository and introduces no application asset or dependency. Human approval is required before global integration; no paid material is used.

Session 0022: researched Kenney Adventure/UI Pack/Fantasy Borders (CC0), Lucide (ISC with specified Feather MIT notices), Tabler (MIT), Game-icons.net (CC BY 3.0), Web Awesome Core (MIT) and native CSS/HTML techniques. These are candidates, not adopted dependencies or assets. [Source and license register](../docs/ui-kit-research.md). The visual concept reuses a crop of the existing original fictional sample render; no third-party game artwork was copied into the project. Conversation-only Lucide placeholders do not add a repository dependency.

Sessions 0020–0021: the existing five original building assets and their distant derivatives are reused unchanged and protected by SHA-256 checks. Codex generated original Three.js terrain, road/cloud primitives, floating HUD/cards and account-progress logic without importing a new npm package, model pack or earlier project code. Three.js remains 0.180.0 (MIT); original generated building assets retain CC0-1.0. Research inspected THREE.Terrain, MapGenerator and WaveFunctionCollapse as alternatives without importing them. The human supplied map and project-card reference artwork; no ownership or license for those references is inferred. See [implementation/reuse evidence](landscapes-player-ui.md) and [research sources](../docs/procedural-town-plan.md).

Session 0019: reused the existing sample generator, growth rules and foundation GLB to complete the default view's five-stage coverage. No dependency or external asset additions; see [verification](sample-foundation.md).

Session 0018: stage-1 revisions reuse the project's existing original CC0 materials and geometry primitives; no new external asset or dependency. [Land-stage record](moss-land-stage.md).

Session 0017: existing original CC0 house assets were decimated using Blender 4.5.10 LTS; the town reuses Three.js 0.180.0 addons and introduces no dependency or imported model pack. [Integration record](town-visuals.md) includes derivative statistics and license scopes.

Session 0016: five original building GLBs now derive from the same Blender source. No new dependency or third-party asset pack was added. See the [five-stage record](five-stages.md) for the original generated asset scope and separate human-reference provenance.

Session 0015: Blender 4.5.10 LTS was used to generate the original cottage GLB; the official portable archive was checksum-verified. The viewer reuses existing Three.js 0.180.0 addons and adds no npm dependency. [Prototype reuse register](house-prototype.md) identifies actual tools, script/asset license scopes, fonts and reference-image limitations.

Session 0014: researched Blender/GLB production, Three.js materials, AO/effects tools and CC0 environment kits. These remain candidates, not imported code or assets. Sources, observed licenses and practical limits are recorded in the [visual evaluation](../specs/0007-visual-pipeline.md); the [research record](visual-research.md) identifies actual work. The five new construction sheets and roads.jpg were inspected as human-supplied references; provenance was not inferred.

Session 0012 update: dependencies are installed and locked in package-lock.json. Vite was updated to 7.3.6 (MIT) after an audit; Three.js and @types/three remain 0.180.0 (MIT), TypeScript 5.9.2 (Apache-2.0), and @types/node uses the locked 22.x release (MIT). Codex generated the Node API, CLI, UI, models and tests. Six human-supplied design images are now tracked as references; their generation model/prompts are unknown. The actual Demo screenshot is generated from this implementation. Browser QA used bundled Playwright and installed Chrome, without importing a prior project template. Historical baseline notes below describe earlier states.

Session 0007 update: new product code has now been generated in this workspace, without importing prior project code or art. Declared dependencies are Three.js 0.180.0 (MIT), Vite 7.1.5 (MIT), TypeScript 5.9.2 (Apache-2.0) and @types/three 0.180.0 (MIT); installation remains unverified. CSS requests DM Sans and Manrope from Google Fonts (SIL Open Font License); these fonts are not bundled. Procedural geometry and initial styling were generated by Codex. Earlier bullets below record the pre-implementation baseline.

- Preparation documents and empty implementation/test directories.
- No product code, design assets, third-party templates, or old repository files imported.
- Product and Classic/Continuity route undecided.
- AI assisted setup and English translation; see `AI_USAGE.md`.
- Initial setup: `0b573c4`.

## Background, not imported code

- From Scratch/Continuity depends on actual reuse and event rules, not the directory name or a new Git repository.

## Reuse register

Record source URL/repository, exact version/commit, files, license, pre-event functionality, event additions, human/AI involvement, and selected track for each imported item.

No previous project-specific code has been imported. Current external dependencies and supplied design references are listed above. The earlier landscape integration/documentation review introduced no additional external asset; session 0030 subsequently vendored the eleven Kenney UI/cursor assets recorded in the current baseline. Current-revision checks and limitations are tracked in [verification](../docs/verification.md).

## Session 0002: related prior showcase

- Source reviewed: [HackathonGalacticShowcase](https://github.com/ForOneIce/HackathonGalacticShowcase), README retrieved 2026-09-11.
- Described prior scope: immersive hackathon project discovery, project details, demo links, previews, bilingual React UI.
- Declared stack: React/TypeScript, Tailwind, Motion, Vite. Existing Three.js capability was not established.
- README license declaration: CC BY-NC-SA 4.0; verify rights and applicable licenses before any reuse.
- Relationship: relevant previous work to disclose if reused. Only its public README was read; no code or assets were imported.
- Proposed additions: periodic snapshots, visible activity over time, configurable displays, optional event/project registry.
- Competition route: still undecided; a fresh folder does not establish From Scratch eligibility.
