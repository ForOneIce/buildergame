# Shared game interface proposal

Date: 2026-09-12. Status: AI proposal for visual review; not an implemented skin. Human requirement: [0022](../prompts/0022-unified-game-ui.md). Verified source candidates: [UI kit research](../docs/ui-kit-research.md).

## Observable problem

`main.ts` switches from the homepage `.brand` header to `gameHeader()` only in town mode. `style.css` defines a pale marketing page with green flat controls, `map-ui.css` introduces blue glass and a wood logo, and its project dialog introduces lavender surfaces and a purple action button. Typography, icon strokes, spacing and control depth change at these boundaries. Layers in `style.css`, `town.css` and `map-ui.css` override the same general selectors. A fourth stylesheet of overrides would preserve this fragmentation.

## Art direction

Use the town's handcrafted architecture as the interface's material reference. Recommended composition: **wooden identity, cream reading surfaces, blue world controls, lantern-gold primary actions and restrained moss-green status accents**. These are semantic material variants with shared geometry, not separate themes per screen. The references already combine wood signs, blue HUD panels and light project cards; consistency does not require every surface to be wood.

Alternative for comparison: a paper-led homestead interface replaces most blue control surfaces with cream panels. It gives strong continuity and reading comfort, but can obscure more of the world and weaken the blue/cream contrast in `map_en`. A highly ornamental RPG skin and an all-pixel UI are lower-fit options for the accepted soft 3D buildings.

The game metaphor remains connected to real use: repositories are plots, snapshots are the town's history, and exploration means discovering projects. Do not invent currency, energy, daily chores or experience levels to make the interface look more like a management game.

中文简注：统一的是材质、形状和反馈规则；入口、表单和游览仍各自服务真实使用任务。

## One continuous experience

| Screen | Proposed presentation | Shared elements |
| --- | --- | --- |
| Entrance | Town gate with a real town view, concise introduction, Explore sample / Create town / Import backup actions | Same wood logo, account/language controls, paper panel and primary button |
| Collection setup | Planning desk with readable form sections, personal/community selection and illustrated landscape choices | Same field, tab, button, repository row and status components |
| Capture and success | An opening notice over the same world background; real measured progress where available, otherwise an indeterminate loading state | Same progress ribbon, notification and explicit local/published state |
| Town exploration | Light blue HUD variants around the town; collapse secondary panels to leave the world visible | Same player medallion, icon buttons, project row and snapshot ribbon |
| Project information | A cream visitor card that looks related to setup panels | Same title scale, avatar, metrics, link button and focus treatment |

Changing landscape affects the world background, not the interface brand. Keep the logo and account entry in predictable locations. On capable devices, later implementation can keep the scene canvas alive between screen states; use a lightweight town poster where maintaining the full scene would be costly. Both should share one composition.

## Component contract

| Component | Variants and expected behavior |
| --- | --- |
| `WorldShell` | Shared brand/account/language chrome; entrance, desk and world layouts |
| `GamePanel` | Paper and blue HUD variants; shared radii, warm edges, inset highlights, spacing and shadow direction |
| `GameButton` / `GameIconButton` | Primary, secondary and quiet; default, hover, pressed, selected, disabled, loading and keyboard-focus states |
| `TownTicket` | Personal/community and terrain selections; consistent thumbnail, title, selection indicator and hit area |
| `RepositoryRow` / `BuilderCard` | Search/list/detail share avatar medallion, title hierarchy, stage label and meaningful metrics |
| `GameField` / `GameTabs` | Native semantic controls with consistent field depth, labels, help and errors |
| `ProgressRibbon` / `StatusNote` | Shared snapshot, capture and exploration presentation; never imply progress that has not been measured |
| `GameDialog` / mobile sheet | Readable paper content, clear close action, controlled focus and one active mobile information panel |

Proposed starting tokens: paper `#FFF6DF`, ink `#304C4F`, wood `#997149`, deep blue `#294E62`, gold `#E8BE68`, moss `#718761`. Values are a proposal, not verified contrast pairs in every state. Limit corner radii to 8/12/16px, spacing to 4/8/12/16/24/32px, and button depth to 2–3px. Text content should remain on a quiet readable surface; illustrated grain belongs to borders and non-reading areas.

Use one functional SVG icon family such as selected Lucide icons. Give any larger illustrative badges a defined separate role. Replace ambiguous Unicode symbols. Roundness should come from shapes and typography without relying on oversized outlines. Use a readable rounded heading treatment, 14–16px body text and at least 12px compact labels where practical. Choose and license fonts during implementation; keep text outside image assets. Support Chinese fallback, natural line height and label expansion without Latin-style letter spacing.

## Implementation approach and effort

Retain Three.js for the world and native DOM for the interface. Candidate Kenney artwork can speed up borders and decorative controls after archive inspection; it supplies no browser behavior. Use native `<dialog>`, inputs and buttons, shared CSS tokens and small TypeScript render helpers. CSS nine-slice `border-image` can preserve illustrated corners at changing panel sizes. Simple surfaces can remain original CSS/SVG. No new game engine, React migration or broad component library is needed solely for this redesign.

Suggested module boundaries are `ui/tokens.css`, `ui/components.css` and shared rendering helpers, with screen-specific composition kept separate. Migrate selectors and remove superseded declarations in each step. These paths describe a proposal; files have not been created.

Relative effort estimates, not delivery commitments:

1. **Small:** settle one material direction and a compact component board; inspect selected asset files/licenses.
2. **Medium:** implement shared states, type, spacing, logo/account chrome and semantic controls.
3. **Medium:** apply the same system to entrance/setup/success and town/card; remove conflicting legacy CSS.
4. **Medium:** responsive reflow, keyboard/focus, reduced motion and complete creation/backup/exploration regression checks.

License cost can remain zero with original surfaces, CC0 candidates and selected permissively licensed icons. Main costs are adaptation, integration and review. Restrict imported files rather than shipping whole packs; set an asset-size budget after inspecting actual selected files. No asset or performance budget is claimed as measured by this study.

## Review and later acceptance

- The same logo, primary action shape, icon weight, panel edges and typography appear at the entrance, planning desk, success and world views.
- Light/dark surface variants keep information readable without changing the core identity. Long project names, empty/error/loading states and stale-data labels remain usable.
- English and Chinese layouts work at 360px, 768px and desktop widths; touch actions target at least 44px. Secondary information collapses rather than shrinking essential text.
- On mobile, opening a project closes or replaces the directory sheet, leaving one active information layer.
- Core creation, capture, snapshot, import/export, player login and exploration behavior remain intact; login/remote operations are described truthfully.
- Asset lock still passes. No building geometry changes are part of this UI proposal.
- Human review determines whether the visual continuity is satisfactory; source research and a mockup are not that acceptance.

## This study's output boundary

An in-conversation interactive concept compares entrance, planning desk and neighborhood using shared material tokens; it also offers a paper-led surface alternative. It is original HTML/CSS with a crop from the project's fictional sample screenshot, not an imported kit or a working product replacement. Mocked controls do not authenticate, fetch repositories, save settings or publish anything. The existing application and dependencies are unchanged by this study.
