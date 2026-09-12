# Shared game UI: reusable source evaluation

Research date: 2026-09-12. Status: selected Kenney Adventure UI and Cursor Pack assets are integrated into the application under [instruction 0030](../prompts/0030-implement-shared-game-interface.md). Records below distinguish original source research, preview reuse and implemented choices; [verification](verification.md) records actual runtime checks. No paid resource is used.

Implementation update: the eleven selected artwork files are vendored at `public/ui/kenney/adventure/` and `public/ui/kenney/cursor/`, alongside original license text and [Adventure](../public/ui/kenney/adventure/manifest.json)/[Cursor](../public/ui/kenney/cursor/manifest.json) source manifests. Asset/license hashes match their recorded originals; the directory's `.gitattributes` prevents text conversion. Shared CSS is implemented in `src/ui/theme.css`, and `src/ui/icons.ts` supplies original geometric icons instead of adding Lucide. The shared screens passed production build, extended UI browser checks and the landscape/player browser regression. Contextual cursor checks inspect computed CSS; they do not capture the native pointer in a screenshot.

> 中文简注：先统一首页、建镇流程和小镇界面的视觉语言；素材包只提供外观，不等于已经实现交互的组件库。

## Original artwork added for homepage refinement 0031

The refinement adds original individual-hand and community-hand-ring SVG drawings in `src/ui/builder-symbols.ts`, plus `flat.png`, `valley.png` and `clouds.png` under `public/ui/landscapes/`. These 320×180 thumbnails are cropped renders of the existing real application with its accepted buildings and fictional sample data. The [capture manifest](../public/ui/landscapes/manifest.json) records source hashes, crop coordinates and file hashes. No third-party game screenshot, additional asset pack or paid imagery is used. No separate license dedication is asserted for the new drawings/renders; the existing CC0 building and Kenney notices apply to their identified assets.

The homepage's `src/home-showcase.ts` reuses the five accepted full-detail GLBs in a single-building cycle with the existing Three.js package. It does not introduce another engine or change building geometry. The three PNG dimensions/output hashes and all five source hashes in the manifest matched. TypeScript, sample/asset validation, production build, twelve tracked Node tests and the three browser scripts passed for this revision. Actual desktop/mobile English/Chinese homepage and Chinese mobile planning screenshots were inspected; the showcase now reserves space for its controls. [Verification](verification.md) states the mocked-account/data and physical-device limits. These results do not establish final human visual acceptance. [Requirements and acceptance](../specs/0011-shared-game-interface.md#homepage-refinement-0031).

## Product need and evaluation scope

Buildergame presents public repositories as a town that grows with recorded project activity. Its homepage, town creation flow, loading states, and town controls should feel like parts of the same game. The accepted five building stages remain unchanged. This evaluation concerns the surrounding interface, not replacement building assets or changes to growth rules.

Useful reusable material falls into three categories:

- **Visual assets:** panel borders, button surfaces, icons and ornaments. They still need HTML, styling, input handling, responsive layouts and accessible behavior.
- **Functional components:** implemented controls such as dialogs, tabs and selects. They still need a visual design appropriate to Buildergame.
- **Browser primitives:** existing HTML and CSS features that can provide behavior or scalable surfaces without a component-library migration.

The proposed direction is a shared set of native DOM components and CSS tokens, with a small selection of compatible visual assets or original SVG surfaces. A replacement rendering engine is not required for this UI work.

## Game-oriented visual assets

The Kenney counts, versions and licenses below were initially read from official product pages and their previews inspected. In the subsequent preview iteration, the selected Adventure archive and its license were retrieved and inspected; the verified archive identifies version 1.1, superseding the earlier v1.0 product-page observation. Other packs in this table remain uninspected at archive level; the later Cursor Pack inspection is recorded separately below. File counts are the site's asset counts, not counts of working web components.

| Candidate | Observed availability | Visual assessment and proposed use | Integration effort estimate |
| --- | --- | --- | --- |
| [Kenney UI Pack – Adventure](https://kenney.nl/assets/ui-pack-adventure) | Site advertises 130 items; downloaded archive identifies v1.1 and CC0-1.0. Free download with optional donation. Archive contains SVG, PNG and spritesheets. | Human-selected wood/cream frames, matching button and medallion; a transparent-center frame allows a CSS teal surface beneath it. | Initially estimated medium integration effort. Six unchanged SVGs are now used by the shared application CSS; border sizing, states and responsive behavior are original implementation work. |
| [Kenney UI Pack](https://kenney.nl/assets/ui-pack) | 430 files, v2.0; Creative Commons CC0; free download with optional donation. | Broad collection of colorful beveled controls. Useful for control anatomy and state coverage; its generic casual-game appearance needs stronger art direction to match the existing town. | Medium: more selection and recoloring work to prevent unrelated button families appearing together. |
| [Kenney Fantasy UI Borders](https://kenney.nl/assets/fantasy-ui-borders) | 140 files, v1.0; Creative Commons CC0; free download with optional donation. | Thin ornate frames could support a title plaque or a special project card. Repeated ornamental borders would compete with the town and make everyday forms busy. | Low for one accent; medium if used as the basis for responsive containers. |
| [Game-icons.net](https://game-icons.net/) | Homepage observed 4,180 icons, SVG and PNG. [License guidance](https://game-icons.net/about.html): CC BY 3.0, with attribution to each icon's original author. | Building, place and resource imagery is useful for larger illustrated badges. Many icons are too detailed for small navigation controls. Select a few compatible motifs rather than importing the entire catalog. | Low for a few assets, plus an author/source attribution record and contrast checks at actual display size. |

CC0 permits flexible reuse, but source and version should still be recorded in the project's reuse disclosure when a pack is actually adopted. For CC BY material, record the individual asset URL, author and any modification as part of its attribution. Screenshots and artwork from proprietary commercial games are not reusable assets in this plan.

### Selected standalone-preview assets

Verified source: Kenney's [Adventure UI page](https://kenney.nl/assets/ui-pack-adventure) and [official archive](https://kenney.nl/media/pages/assets/ui-pack-adventure/9a877376bc-1723597274/kenney_ui-pack-adventure.zip), retrieved 2026-09-12. The archive identifies Adventure UI 1.1 by Kenney and includes `License.txt` with [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/). Archive SHA-256: `982e8ab66842509ee9214f9c2038e594cbe029f19d1dc177fecaad3b41a67ed3`.

| Original archive file | Role in the proposal |
| --- | --- |
| `Vector/panel_brown_dark_corners_a.svg` | Wooden identity sign with corner details |
| `Vector/panel_brown_dark.svg` | Plain wooden panel |
| `Vector/panel_brown.svg` | Cream paper with a wood frame |
| `Vector/button_brown.svg` | Matching cream button with a wood rim |
| `Vector/panel_border_brown.svg` | Transparent-center wood frame over the teal CSS surface |
| `Vector/round_brown.svg` | Round player medallion |

These six SVG originals were embedded without modifying their source content in the local visual proposal and are now vendored under `public/ui/kenney/adventure/`. CSS sizing, frame slicing, transparency and interaction states are Codex adaptations, not features supplied by the asset pack. Only the teal surface uses alpha 0.24; dark label text retains its own opacity. Slices are implementation choices based on inspection, not official pack metadata. No paid resource is used. Other inspected files remain candidates until adopted.

### Contextual cursor assets

For the [cursor and door-greeting request](../prompts/0028-playful-context-cursors.md), Kenney's [Cursor Pack](https://kenney.nl/assets/cursor-pack) provides the requested axe, footprints and glove family. The [official archive](https://kenney.nl/media/pages/assets/cursor-pack/461b29df18-1717599281/kenney_cursor-pack.zip), retrieved 2026-09-12, identifies version 1.1; its original `License.txt` confirms CC0-1.0 and free personal, educational and commercial reuse, with optional attribution. Archive SHA-256: `baa87634f3cfd294b0c83e70222053aab2f56d19f78eca4067b9b38a555269cc`.

Selected original files are from `PNG/Outline/Default/`: `tool_axe_single.png` for construction, `steps.png` for exploration, `hand_point.png` for ordinary actions, `hand_open.png` for the doorway and `hand_closed.png` during opening. All five are now vendored unchanged under `public/ui/kenney/cursor/`. Matching SVG sources in `Vector/Outline/` were inspected but are not vendored. Cursor roles, CSS hotspots, doorway placement and animation are Codex implementation choices, not pack features; shared CSS also provides open/closed-hand variants for drag feedback. No paid source or extra icon library is needed. Actual interaction QA is separate from source/license verification.

## Functional icons and controls

| Candidate | Verified facts | Assessment for this project |
| --- | --- | --- |
| [Lucide for Vanilla JavaScript](https://lucide.dev/guide/packages/lucide) | Scalable SVG icons, no framework dependency, individually importable/tree-shakable, with configurable color, size and stroke. The [repository license](https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE) is ISC and also lists Feather-derived icons covered by MIT. | Preferred proposal for a small, consistent navigation set: map, home, search, zoom, settings and external links. Put these icons inside the shared game controls. Preserve the relevant copyright and permission notices if adopted. |
| [Tabler Icons](https://tabler.io/icons) | Official page observed 6,184 icons, while some page copy still says 6,150+. Free SVG source is offered under MIT. Icons use a 24×24 grid and a customizable 2px stroke. An optional $9 bundle includes compiled PNG/PDF and a webfont. | A viable alternative to Lucide. Choose one functional icon family to keep visual weight consistent. The paid bundle is unnecessary for using the free SVG source. Icons alone do not supply game surfaces or interactions. |
| [Web Awesome Core](https://webawesome.com/docs) | Documentation observed v3.12.0. Actual framework-independent web components include buttons, dialogs, drawers, tabs, selects and progress indicators. The [Core license](https://webawesome.com/license) is MIT and permits self-hosting. The site separately marks Pro components and resources, including some advanced inputs, charts, patterns and its Figma kit. | A possible future choice for more complex forms. Medium integration cost: component APIs, styling boundaries, theme work and behavior regression checks. It does not automatically produce a coherent game appearance. No adoption is recommended merely to reskin the current demo. |

Only the observed $9 Tabler bundle price is a quoted monetary price above. “Low” and “medium” are comparative engineering estimates, not measured timings, delivery promises or vendor prices. Free licensing does not remove design, integration or verification work. No Pro subscription or premium purchase is proposed.

### Maintenance finding

[Shoelace](https://shoelace.style/) still exposes v2.20.1 and an MIT license, but its homepage explicitly states **“Shoelace Is Sunset with no active development”** and directs new work to Web Awesome. It should not be presented as an actively maintained new dependency.

## Browser techniques that fit the existing architecture

### Scalable panel frames

[CSS `border-image-slice`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice) divides a source into nine regions: four corners, four edges and a center. Corners retain their shape while edges can stretch or repeat; `fill` can retain the center. This is the web equivalent of the scalable frame technique used in many game interfaces.

One well-designed wood or painted frame can therefore serve a welcome panel, a town-creation section, a project card and a small HUD panel at different sizes. An SVG source avoids raster pixelation when enlarged. Padding, minimum sizes and the inset needed for text still require deliberate design. Simple controls may be better expressed with CSS borders, gradients and shadows; a nine-slice image is useful where an illustrated edge matters.

This is a browser capability, not an asset license or a third-party UI package. The proposal does not import MDN example artwork or code.

### Dialog behavior and readable controls

[Native `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) supports modal and non-modal windows. Calling `showModal()` makes the surrounding page inert and supports Escape closing; `::backdrop` can carry the shared backdrop treatment. Supply an accessible title and deliberate initial focus, and verify focus behavior in the actual project flow.

[Lucide's accessibility guidance](https://lucide.dev/guide/lucide/advanced/accessibility) recommends keeping decorative icons hidden from assistive technology and putting the action name on the containing button. An icon-only mobile toolbar therefore needs accessible button labels even when visible text is removed.

Neither a decorative frame nor an accessible component library makes the whole application accessible automatically. Keyboard navigation, readable contrast, reduced motion, control names and dialog behavior remain application-level checks. Web Awesome states this limitation explicitly in its [accessibility commitment](https://webawesome.com/docs/resources/accessibility).

## Proposed shared visual system

The selected direction is a restrained town-management interface: warm wood for identity, light cream for readable content and highly transparent teal panels for lightweight controls over the scene. The human's later button-state instruction supersedes the initial gold-primary proposal: default actions are brown, and cream identifies persistent selection. Restrained moss-green status accents remain a supporting AI proposal. These should be variations of the same component shapes and spacing, not separate site and game themes. See [the shared interface proposal](../specs/0011-shared-game-interface.md) for screen and component contracts.

Start with shared tokens for colors, typography, spacing, radii, border depth, shadows, focus rings and motion. Build a small set of reusable surfaces and controls: panel, button, icon button, tab, field, metric badge, progress indicator, dialog and notification. Use the same components in the homepage, setup workflow and town HUD.

The homepage can act as the town's entrance, with the actual town imagery and the same title treatment. Town creation can use readable sections within the common panel system. Project cards can share those surfaces while giving project information more space. Game character should come from composition, material hints and small feedback animations; key actions must retain clear labels such as “Create town,” “Import backup” and “Visit project.”

Recommended order:

1. Approve a small visual board showing the homepage, creation flow and town card together.
2. Implement the shared tokens and representative controls in a style preview, including disabled, loading, error, focus and mobile states.
3. Apply the same components across the existing screens; remove conflicting legacy rules as each surface is migrated.
4. Verify English and Chinese text expansion, keyboard access, mobile layout and scene readability. Recheck existing creation, snapshot and exploration journeys.

The human selected free Kenney Adventure UI materials for the preview and explicitly requested review before global application. The later contextual-cursor request is supported by the selected free Cursor Pack originals. Both archives and their licenses are recorded above; no functional library is adopted by these preview choices.

## Evidence and limits

Official web pages and the indicated raw license files were read using HTTP requests; Kenney official previews were visually inspected. Initial research did not retrieve archives. Follow-up work inspected the official Adventure UI 1.1 and Cursor Pack 1.1 archives/licenses, selecting six SVG and five PNG originals respectively, then integrated them following instruction 0030. Production build and scoped browser checks passed; no isolated asset-performance benchmark was run. Some live icon counts and package versions may change after the research date. Actual test results remain distinct from human visual acceptance.
