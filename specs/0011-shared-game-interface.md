# Shared game interface

Date: 2026-09-12. Status: implemented; production build and extended shared-interface browser checks passed. Final human visual review remains pending. Human requirements: [0022](../prompts/0022-unified-game-ui.md), [0023](../prompts/0023-preview-material-direction.md), [0024](../prompts/0024-button-selection-language.md), [0025](../prompts/0025-readable-preview-layout.md), [0026](../prompts/0026-concise-project-popup.md), [0027](../prompts/0027-paired-action-layout.md), [0028](../prompts/0028-playful-context-cursors.md), [0029](../prompts/0029-object-based-game-interface.md) and [0030](../prompts/0030-implement-shared-game-interface.md). Sources: [UI assets](../docs/ui-kit-research.md) and [game-object interaction research](../docs/game-interaction-language.md).

## Current implementation authorization

Instruction 0030 supersedes the standalone-preview restriction and authorizes adoption across the actual application. Earlier preview descriptions below preserve the design's development history; their previous approval gate is satisfied for implementation. Human authorization is distinct from the recorded automated checks and does not establish separate visual acceptance of every detail.

The shared header/material system now covers welcome, planning, success and town views, with object-based entry actions and contextual feedback. Both collection modes, capture, import/export, player interfaces and locked building appearances are retained. Project details are concise; the opening-door dialog offers an explicit external link. Exact executed checks and remaining limits are recorded in [verification](../docs/verification.md).

Implemented files: `src/ui/theme.css` contains common material tokens, control states, object-entry drawings, transitions and cursor styling; `src/ui/icons.ts` contains original geometric icons; `src/ui/planning.ts` provides the planning-sheet composition. Integration updates `src/main.ts`, `src/game-ui.ts`, `src/style.css`, `src/map-ui.css`, `src/town.css` and `src/town.ts`. Six Adventure UI SVGs and five Cursor Pack PNGs are vendored with verified original bytes, licenses and source manifests under `public/ui/kenney/`. No Lucide dependency is introduced.

## Homepage header alignment 0036

[Instruction 0036](../prompts/0036-align-homepage-header-top-edges.md) is implemented with two homepage-scoped rules in `src/map-ui.css`, aligning the header/action group and the account's visible guest icon at the top. English/Chinese checks at 1440/760/360px and screenshot review passed matching edges, usable targets and no overflow; setup remains centered. [Results and limits](../collaboration/log.md#0036--align-homepage-header-top-edges).

## Homepage action order 0035

[Instruction 0035](../prompts/0035-create-before-explore.md) is implemented: Create left, Explore right, with existing artwork/hints/actions and matching keyboard order. Focused English/Chinese checks at 1440/360px and TypeScript passed; [results](../collaboration/log.md#0035--place-create-before-explore).

## Balanced introduction and tooltip refinement 0034

[Instruction 0034](../prompts/0034-balanced-intro-and-shared-tooltip.md) is implemented in `src/main.ts` and `src/style.css`: the introduction fills the paper panel's content width, and the building tagline uses the shared cream `.control-hint` inside the illustration. Focused English/Chinese checks at 1440/768/360px passed equal insets, matching hint styles and hover/viewport behavior; desktop English/Chinese and mobile Chinese screenshots were inspected. A final width adjustment passed a targeted mobile Chinese single-line check and a new production build. TypeScript and asset validation preceded that CSS-only adjustment; no full suite or new tests/assets. Human visual acceptance remains pending. [Verification](../docs/verification.md).

## Hover tagline and framing refinement 0033

[Instruction 0033](../prompts/0033-hover-tagline-and-larger-building.md) makes “Keep building. Keep growing.” visible only while hovering over the homepage building illustration and enlarges its framing further, preserving the full courtyard. This supersedes the permanently visible tagline from the previous revision. Implementation changes only `src/style.css`. Focused Chrome checks passed initial-hidden, hover-visible and pointer-exit-hidden behavior at 1440/768/360px, exact Chinese copy and no horizontal overflow/page errors; stage-5 screenshots showed the full courtyard. TypeScript, sample/asset validation and production build passed. No full suite was rerun; human visual acceptance remains pending. [Verification](../docs/verification.md).

## Silent automatic showcase refinement 0032

Status: implemented; TypeScript, sample/asset validation, production build and the final extended shared-interface browser check passed. Final human visual acceptance remains pending. [The original instruction and translation](../prompts/0032-silent-automatic-building-showcase.md) supersede the stage buttons, pause/play control and loading presentation described in 0031 below.

The homepage's right side presents the accepted building stages at a larger scale through camera framing and available layout space. It cycles automatically from 1 through 5 and back to 1, with no stage buttons, pause control, internal caption or loading-status text. The next stage's file bytes preload while the current building remains visible. GLB bytes are cached for the five stages; each incoming model is parsed on demand. One live WebGL scene and a temporary 2D outgoing frame provide the dissolve after the next model is ready. A slow next-model request retains the current building without a status popup.

Reduced-motion entry shows a stable stage-5 illustration with no visible controls. Up to two silent retries can recover its failed initial load. Hiding the page cancels future transition timers; in-flight loading/parsing may finish. Leaving the homepage aborts requests and releases resources. These are supporting implementation choices, distinct from the human's explicit request. Existing model files and scoring are unchanged; the refinement adds no external asset or dependency.

Executed checks covered no controls or status/caption text inside `#home-showcase`, normal-motion stage 1–5 playback and loopback, stage 1 remaining visible during a delayed stage-2 request, a nonempty outgoing 2D frame and incoming canvas opacity 1 during the dissolve, and a reduced-motion HTTP 503 fixture recovering on exactly two requests before staying at stage 5. The final shared-interface run also passed existing English/Chinese, 1440/768/360px, planning/capture/card/backup journeys without page errors. Desktop enlarged stage-5 and mobile stage-5 screenshots were inspected after narrow camera correction. Node unit, map-UI and broad browser scripts were not rerun for this revision; prior results remain historical. [Exact verification and limits](../docs/verification.md). Stage/readiness markers remain internal verification aids.

中文简注：建筑放大、自动成长；下一阶段未加载好时保留当前建筑，不出现加载文案。

## Homepage refinement 0031

Status: implemented; revision-specific build, asset validation, twelve tracked Node tests and all three browser scripts passed. Final human visual acceptance remains pending. The later 0032 refinement above replaces this revision's manual showcase controls and loading presentation; checks below describe the 0031 revision. [The complete eleven-point instruction](../prompts/0031-refine-homepage-and-building-showcase.md) refines the implemented interface above and supersedes the earlier entrance table where they differ.

- Keep the shared wood logo level. On the homepage, the account control shows only its avatar/person symbol, with the original account action available as a hover/focus hint and accessible name.
- Use the single introduction “A home for GitHub builders. Let’s watch each other grow.” Remove the redundant headline and wallet/guest sentence. The map and planning objects remain usable buttons; show their action text as hover/focus hints instead of permanent labels.
- Replace the homepage's town scene with one accepted building shown at a time, cycling through stages 1–5, and the caption “Keep building. Keep growing.” Reuse the locked GLBs without changes to geometry or growth rules. Pause/play and direct stage buttons remain accessible; reduced motion starts paused and permits manual selection.
- Under “Who can create a town?”, show two noninteractive descriptions: an individual hand and a community hand ring, each with a short explanation. These are explanatory content, not buttons or mode selectors.
- Move all three sample-terrain tours into creation. Selecting flat, valley or clouds updates a labeled thumbnail in the site's upper-left plan area without resetting the form. Opening a sample and returning to the plan preserves the draft and the selected collection mode/terrain.
- Remove the homepage backup/configuration button. Retain real import/export and restore behavior in the existing creation and town workflows.

The DOM contract uses `#home-showcase` with visible-stage/readiness markers and native stage/play controls, plus `#terrain-thumbnail` inside `.site-plan` and a return-to-plan action for sample visits. These markers support focused regression checks; the displayed building and usable form are the acceptance outcomes. Original hand illustrations and terrain thumbnails are project-authored assets, not another external resource pack.

Executed acceptance checks extended the shared-interface and landscape journeys: desktop/narrow/Chinese layouts; no old homepage copy or clickable audience cards; labeled icon entries and login hover/focus hints; one real building with automatic/manual stage switching and reduced motion; terrain thumbnails and sample return retaining personal/hackathon drafts; existing capture/backup/card/player flows and all ten building fingerprints. The broader browser journey also passed mocked-deployer publication opt-out and active-town preservation regression. Actual desktop/mobile English/Chinese homepage and Chinese mobile planning screenshots were inspected. The canvas reserves room for showcase controls; preview return preserves publication opt-out. All three terrain PNG dimensions/output hashes and five source hashes matched. Account, repository and capture transport is mocked; real OAuth, remote publication, physical devices and human visual acceptance remain unverified. [Exact commands, results and limits](../docs/verification.md).

中文简注：首页展示单栋建筑的成长；地形游览回到建镇表单，保留已填内容。

## Observable problem

`main.ts` switches from the homepage `.brand` header to `gameHeader()` only in town mode. `style.css` defines a pale marketing page with green flat controls, `map-ui.css` introduces blue glass and a wood logo, and its project dialog introduces lavender surfaces and a purple action button. Typography, icon strokes, spacing and control depth change at these boundaries. Layers in `style.css`, `town.css` and `map-ui.css` override the same general selectors. A fourth stylesheet of overrides would preserve this fragmentation.

## Art direction

Use the town's handcrafted architecture as the interface's material reference. The human selected **wooden identity, cream reading surfaces and highly transparent teal world controls**, using free assets only. Kenney Adventure UI is selected for the standalone preview; lantern-gold and restrained moss-green accents remain AI supporting design choices. These are semantic material variants with shared geometry, not separate themes per screen. The references already combine wood signs, floating HUD panels and light project cards; consistency does not require every surface to be wood.

The earlier paper-led alternative is historical comparison material. The current preview should emphasize the selected wood, cream and transparent teal combination. Keep text opacity independent of panel opacity so transparency does not fade labels; the preview starts the teal surface at alpha 0.24, subject to review against the actual background. A highly ornamental RPG skin and an all-pixel UI remain lower-fit options for the accepted soft 3D buildings.

The game metaphor remains connected to real use: repositories are plots, snapshots are the town's history, and exploration means discovering projects. Do not invent currency, energy, daily chores or experience levels to make the interface look more like a management game.

中文简注：统一的是材质、形状和反馈规则；入口、表单和游览仍各自服务真实使用任务。

## One continuous experience

| Screen | Proposed presentation | Shared elements |
| --- | --- | --- |
| Entrance | Town gate with a real town view, concise introduction, Explore sample / Create town / Import backup actions | Same wood logo, account/language controls, paper panel and primary button |
| Collection setup | Planning desk with readable form sections, personal/community selection and illustrated landscape choices | Same field, tab, button, repository row and status components |
| Capture and success | An opening notice over the same world background; real measured progress where available, otherwise an indeterminate loading state | Same progress ribbon, notification and explicit local/published state |
| Town exploration | Transparent teal HUD variants around the town; collapse secondary panels to leave the world visible | Same player medallion, icon buttons, project row and snapshot ribbon |
| Project information | A concise cream visitor card that looks related to setup panels | Same title scale, avatar, description, link button and focus treatment |

Changing landscape affects the world background, not the interface brand. Keep the logo and account entry in predictable locations. On capable devices, later implementation can keep the scene canvas alive between screen states; use a lightweight town poster where maintaining the full scene would be costly. Both should share one composition.

## Component contract

| Component | Variants and expected behavior |
| --- | --- |
| `WorldShell` | Shared brand/account/language chrome; entrance, desk and world layouts |
| `GamePanel` | Paper and transparent teal HUD variants; shared radii, warm edges, inset highlights, spacing and shadow direction |
| `GameButton` / `GameIconButton` | Primary, secondary and quiet; default, hover, pressed, selected, disabled, loading and keyboard-focus states |
| `TownTicket` | Personal/community and terrain selections; consistent thumbnail, title, selection indicator and hit area |
| `RepositoryRow` / `BuilderCard` | Search/list/detail share avatar medallion and title hierarchy; the concise popup uses author, description and one visit action |
| `GameField` / `GameTabs` | Native semantic controls with consistent field depth, labels, help and errors |
| `ProgressRibbon` / `StatusNote` | Shared snapshot, capture and exploration presentation; never imply progress that has not been measured |
| `GameDialog` / mobile sheet | Readable paper content, clear close action, controlled focus and one active mobile information panel |

Proposed starting tokens: paper `#FFF6DF`, ink `#304C4F`, wood `#997149`, deep blue `#294E62`, gold `#E8BE68`, moss `#718761`. Values are a proposal, not verified contrast pairs in every state. Limit corner radii to 8/12/16px, spacing to 4/8/12/16/24/32px, and button depth to 2–3px. Text content should remain on a quiet readable surface; illustrated grain belongs to borders and non-reading areas.

Use one functional SVG icon family such as selected Lucide icons. Give any larger illustrative badges a defined separate role. Replace ambiguous Unicode symbols. Roundness should come from shapes and typography without relying on oversized outlines. Use readable rounded headings, comfortable body text and clearly legible secondary labels; the readability revision below supersedes the earlier compact sizing proposal. Choose and license fonts during implementation; keep text outside image assets. Support Chinese fallback, natural line height and label expansion without Latin-style letter spacing.

### Button selection language

The human requires brown for unselected buttons and cream only for selected buttons. In the standalone preview, default buttons use a brown surface with light labels; persistently selected navigation and choices use cream with dark labels. An ordinary action such as opening a card stays brown because it does not select a lasting mode. This takes precedence over the earlier AI suggestion of separate gold primary-action surfaces.

Hover and pressed feedback can adjust depth or brightness without switching an unselected control to cream. Keyboard focus uses a separate visible outline, and must not imply persistent selection. Teal remains the translucent panel material. Reuse the already selected free assets; this state correction adds no new artwork or dependency.

中文简注：棕色表示可点击，奶油色表示已选中；悬停和键盘焦点不冒充选中状态。

### Readable typography and layout

The human requested more breathing room and a layout that reduces reading effort. In the standalone proposal, enlarge body and secondary text where needed, allow generous line height and panel padding, and use a consistent hierarchy of space between text, controls and sections. Labels should stay close to their fields; related details should form recognizable groups, with actions separated from explanatory copy.

Desktop and narrow layouts should reflow without clipping text or controls. Chinese text uses normal letter spacing, with enough line height for the typeface. Preserve the brown-default and cream-selected button rule while changing spacing. The earlier typography-only revision added no assets; instruction 0030 now authorizes carrying this layout direction into the application.

Current preview choices: 16px body text, 28px descriptive-paragraph line height, 13–15px secondary labels, 20–32px panel padding and at least 48px button height. Form labels sit 8px above their fields; field groups use a 24px gap. Narrow layouts stack fields and actions while retaining readable labels. The project card replaces the exploration summary in a dedicated grid area, leaving navigation unobscured. Opening/closing the card moves and restores keyboard focus. These are preview choices awaiting visual acceptance, not a global design-system release. Actual checks are recorded in [the collaboration log](../collaboration/log.md).

Paired horizontal action rows use two equal columns, each with a content-sized button centered in its half. Stack the actions on narrow layouts when both cannot fit. This rule applies to paired action groups, not three-tab navigation or compact account controls; existing button-state semantics remain unchanged.

### Concise project popup

The human requested less redundant popup content. Keep the title, close control, avatar with author name, one useful sentence about the project and one Visit project action, disabled for fictional samples. Remove the construction-stage badge, redundant “Builder” suffix, three-metric block and repeated generic filler copy. This is a presentation change: it does not remove source metrics or alter house-growth rules. Preserve the existing button materials, readable spacing and focus behavior. Instruction 0030 authorizes implementation; real-application QA for this simplification must be recorded after inspection.

### Contextual cursors: prototype and application

The human requested axe, footprint and gloved-hand cursors to make building, exploration and door interactions more playful. The application uses PNG cursor assets for construction and exploration contexts, ordinary controls and building/drag feedback. Text fields retain the native I-beam and disabled controls retain `not-allowed` feedback; touch users do not receive custom cursors. Cursor artwork supplements action labels rather than replacing them.

The earlier standalone prototype used a responsive poster-door hotspot and bilingual greeting. The application now uses scene hit testing: signs open the concise project card, while building targets open a doorway dialog; a card's Visit project action reaches the same dialog. Its opening animation leads to an explicit external link, with Escape/close returning to the card where applicable. Keyboard access and reduced motion are supported and checked. This is not a walkable interior or an embedded third-party browser. Asset choices and actual QA are recorded separately.

### Objects that explain actions

The human requested that major controls communicate through their visual form: creating a town unfolds a physical planning drawing on kraft paper; exploration begins from a map or globe, with a map-unfolding transition. The standalone proposal chooses a folded map for that entry. Combine these with the door greeting so the action follows the object's meaning: open the map, unfold the plan, greet a neighbor.

Use short visible labels and accessible names to support recognition. Keep required fields as real controls within the planning sheet and preserve clear button states, the concise project card, keyboard behavior and reduced-motion support. A transition may illustrate opening the world; it must not imply measured loading progress that is unavailable. Referenced games are design inspiration, not licensed asset sources. [Observed sources and proposed mappings](../docs/game-interaction-language.md) guide the authorized implementation.

## Implementation approach and effort

Retain Three.js for the world and native DOM for the interface. Kenney Adventure UI 1.1 has been inspected and six original SVG files were selected in the standalone proposal; they supply no browser behavior. The authorized runtime implementation can use native `<dialog>`, inputs and buttons, shared CSS tokens and small TypeScript render helpers. CSS nine-slice `border-image` can preserve illustrated corners at changing panel sizes. Simple surfaces can remain original CSS/SVG. No new game engine, React migration or broad component library is needed solely for this redesign.

Suggested module boundaries separate shared tokens/components from screen composition and rendering helpers. Migrate selectors and remove superseded declarations in each step. Exact implemented paths are recorded with the completed changes rather than treating the earlier proposed filenames as required architecture.

Relative effort estimates, not delivery commitments:

1. **Small:** settle one material direction and a compact component board; inspect selected asset files/licenses.
2. **Medium:** implement shared states, type, spacing, logo/account chrome and semantic controls.
3. **Medium:** apply the same system to entrance/setup/success and town/card; remove conflicting legacy CSS.
4. **Medium:** responsive reflow, keyboard/focus, reduced motion and complete creation/backup/exploration regression checks.

License cost can remain zero with original surfaces, CC0 candidates and selected permissively licensed icons. Main costs are adaptation, integration and review. Restrict imported files rather than shipping whole packs; set an asset-size budget after inspecting actual selected files. No asset or performance budget is claimed as measured by this study.

## Implementation acceptance criteria

- The same logo, primary action shape, icon weight, panel edges and typography appear at the entrance, planning desk, success and world views.
- Light/dark surface variants keep information readable without changing the core identity. Long project names, empty/error/loading states and stale-data labels remain usable.
- English and Chinese layouts work at 360px, 768px and desktop widths; touch actions target at least 44px. Secondary information collapses rather than shrinking essential text.
- On mobile, opening a project closes or replaces the directory sheet, leaving one active information layer.
- Core creation, capture, snapshot, import/export, player login and exploration behavior remain intact; login/remote operations are described truthfully.
- Asset lock still passes. No building geometry changes are part of this UI proposal.
- Human review determines whether the visual continuity is satisfactory; source research and a mockup are not that acceptance.

Executed verification: TypeScript, sample/building validation, Vite production output and the twelve tracked data/API/landscape/player tests passed. `tests/unified-ui-check.cjs` passed extended journeys covering shared screens at 1440/768/360px, English/Chinese, capture and both setup modes, backup restoration, card/focus behavior, delayed-model loading with inactive background controls, safe explicit door links and return, reduced motion and contextual cursor styles. It also checked a signed-in 360px header and controls/timeline at 844×390. No page errors were reported. GitHub sessions/repositories/capture are mocked; this is not real OAuth or physical-device verification. [Exact scope and limits](../docs/verification.md).

## Prototype history and implementation boundary

The standalone interactive proposal compares entrance, planning desk and neighborhood using shared material tokens, with English as the default and a Chinese toggle. Its HTML/CSS surrounds a crop from the project's fictional sample screenshot. The current revision embeds six unchanged SVG originals from Kenney Adventure UI 1.1: wooden sign/frame variants, a cream panel, a matching button, a transparent-center frame and a round medallion. The exact files and source/license evidence are recorded in [UI kit research](../docs/ui-kit-research.md).

The standalone proposal is stored outside the repository and remains a review artifact; its mocked controls do not authenticate, fetch repositories, save settings or publish anything. Earlier preview iterations left the application and locked building models unchanged. Instruction 0030 led to the implemented application revision and its separately recorded runtime checks. Locked building appearances and existing data semantics remain intact; passing checks do not establish human visual acceptance or real adoption.
