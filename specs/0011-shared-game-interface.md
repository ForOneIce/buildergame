# Shared game interface proposal

Date: 2026-09-12. Status: material direction selected; revised standalone proposal awaiting human review before global adoption. Human requirements: [0022](../prompts/0022-unified-game-ui.md), [0023](../prompts/0023-preview-material-direction.md) and [0024](../prompts/0024-button-selection-language.md). Verified source candidates and selected preview assets: [UI kit research](../docs/ui-kit-research.md).

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
| Project information | A cream visitor card that looks related to setup panels | Same title scale, avatar, metrics, link button and focus treatment |

Changing landscape affects the world background, not the interface brand. Keep the logo and account entry in predictable locations. On capable devices, later implementation can keep the scene canvas alive between screen states; use a lightweight town poster where maintaining the full scene would be costly. Both should share one composition.

## Component contract

| Component | Variants and expected behavior |
| --- | --- |
| `WorldShell` | Shared brand/account/language chrome; entrance, desk and world layouts |
| `GamePanel` | Paper and transparent teal HUD variants; shared radii, warm edges, inset highlights, spacing and shadow direction |
| `GameButton` / `GameIconButton` | Primary, secondary and quiet; default, hover, pressed, selected, disabled, loading and keyboard-focus states |
| `TownTicket` | Personal/community and terrain selections; consistent thumbnail, title, selection indicator and hit area |
| `RepositoryRow` / `BuilderCard` | Search/list/detail share avatar medallion, title hierarchy, stage label and meaningful metrics |
| `GameField` / `GameTabs` | Native semantic controls with consistent field depth, labels, help and errors |
| `ProgressRibbon` / `StatusNote` | Shared snapshot, capture and exploration presentation; never imply progress that has not been measured |
| `GameDialog` / mobile sheet | Readable paper content, clear close action, controlled focus and one active mobile information panel |

Proposed starting tokens: paper `#FFF6DF`, ink `#304C4F`, wood `#997149`, deep blue `#294E62`, gold `#E8BE68`, moss `#718761`. Values are a proposal, not verified contrast pairs in every state. Limit corner radii to 8/12/16px, spacing to 4/8/12/16/24/32px, and button depth to 2–3px. Text content should remain on a quiet readable surface; illustrated grain belongs to borders and non-reading areas.

Use one functional SVG icon family such as selected Lucide icons. Give any larger illustrative badges a defined separate role. Replace ambiguous Unicode symbols. Roundness should come from shapes and typography without relying on oversized outlines. Use a readable rounded heading treatment, 14–16px body text and at least 12px compact labels where practical. Choose and license fonts during implementation; keep text outside image assets. Support Chinese fallback, natural line height and label expansion without Latin-style letter spacing.

### Button selection language

The human requires brown for unselected buttons and cream only for selected buttons. In the standalone preview, default buttons use a brown surface with light labels; persistently selected navigation and choices use cream with dark labels. An ordinary action such as opening a card stays brown because it does not select a lasting mode. This takes precedence over the earlier AI suggestion of separate gold primary-action surfaces.

Hover and pressed feedback can adjust depth or brightness without switching an unselected control to cream. Keyboard focus uses a separate visible outline, and must not imply persistent selection. Teal remains the translucent panel material. Reuse the already selected free assets; this state correction adds no new artwork or dependency.

中文简注：棕色表示可点击，奶油色表示已选中；悬停和键盘焦点不冒充选中状态。

## Implementation approach and effort

Retain Three.js for the world and native DOM for the interface. Kenney Adventure UI 1.1 has now been inspected and six original SVG files are used only in the revised standalone proposal; they supply no browser behavior. After human approval of that result, native `<dialog>`, inputs and buttons, shared CSS tokens and small TypeScript render helpers can support global integration. CSS nine-slice `border-image` can preserve illustrated corners at changing panel sizes. Simple surfaces can remain original CSS/SVG. No new game engine, React migration or broad component library is needed solely for this redesign.

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

The standalone interactive proposal compares entrance, planning desk and neighborhood using shared material tokens, with English as the default and a Chinese toggle. Its HTML/CSS surrounds a crop from the project's fictional sample screenshot. The current revision embeds six unchanged SVG originals from Kenney Adventure UI 1.1: wooden sign/frame variants, a cream panel, a matching button, a transparent-center frame and a round medallion. The exact files and source/license evidence are recorded in [UI kit research](../docs/ui-kit-research.md).

The proposal is stored outside the repository and remains a review artifact. Mocked controls do not authenticate, fetch repositories, save settings or publish anything. The human explicitly requires confirmation of the revised appearance before it is applied globally. The existing application, dependencies and locked building models are unchanged by this iteration. Preview verification and visual acceptance must be recorded separately; neither is implied by selecting the materials.
