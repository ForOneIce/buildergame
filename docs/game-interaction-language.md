# Game objects as interface language

Date: 2026-09-12. Scope: design research developed for the standalone proposal, now informing application implementation authorized by [0030](../prompts/0030-implement-shared-game-interface.md). [Design directions](../prompts/0029-object-based-game-interface.md). This study does not rank game popularity or establish that a visual metaphor is understood without user testing.

## Diagnosis and design direction

The human identified a gap between the town's game setting and its text-heavy controls. Codex's assessment is that material styling alone does not explain an action: a wood-framed rectangle can still function like a generic website button. A recognizable object, a matching verb and a visible response can work together to explain the transition. This is a design hypothesis for the proposal, not evidence of improved usability.

Keep concise labels and accessible names. A folded map can suggest exploration, but a globe might also mean worldwide data, language settings or travel. The preview therefore chooses a folded map with an “Explore” label rather than assuming that its silhouette is unambiguous. Forms still need actual labels and fields; the planning drawing gives them a coherent setting.

## Observed sources

These findings come from official explanatory text and the community-maintained Stardew Valley Wiki. No live game session or comprehensive screenshot analysis was performed, so the observations do not describe every screen or establish how easily players understand the controls.

| Reference | Documented interaction | Interpretation for Buildergame |
| --- | --- | --- |
| Stardew Valley: [Crafting](https://stardewvalleywiki.com/Crafting), [Options](https://stardewvalleywiki.com/Options) | The wiki describes a hammer-icon crafting tab, item icons, hover material information, unavailable recipes with gray/red feedback, tool-target tile borders and game cursor behavior over doors or NPCs. | Combine an object symbol with target feedback and a short hint. Selection, unavailability and activation need distinct states. This is a community reference, not a developer design rationale. |
| Animal Crossing: New Horizons: Nintendo [Create](https://animalcrossing.nintendo.com/new-horizons/create/), [Explore](https://animalcrossing.nintendo.com/new-horizons/explore/) | Nintendo describes learning recipes, gathering materials and crafting at a workbench; visiting Orville at the airport to travel; donating discoveries to the museum; and using NookPhone for goals, recipes and collection records. | Organize entry points around a meaningful place or object. A planning sheet can organize creation and a doorway can organize a project visit; ongoing tools can share a recognizable container. |
| Minecraft: official [How to craft](https://www.minecraft.net/en-us/article/how-craft) | The guide describes crafting tables, recipe-book categories/search, choosing a recipe to populate the grid and red feedback when required materials are missing. | A visible input-to-result structure can explain a task, while search, labels and error messages remain useful for complex input. |

The common design inference is to connect object, context and response. These sources do not justify removing all text or assuming that decorative artwork alone makes an interface intuitive. In particular, “Say hi” should remain a greeting near the door while the surrounding context makes clear that it opens project information rather than a chat.

## Practical mappings for Buildergame

| Action | Object and response | Status and limits |
| --- | --- | --- |
| Create a town | Open a kraft-paper planning sheet, with plot sketches and grouped inputs on the drawing | Implemented with the real repository and capture controls; schematic plots are illustrative |
| Explore a town | Activate a folded map and unfold it into the town view | Implemented; actual asset readiness ends loading, with an option to explore while loading |
| Discover a project | A gloved hand and greeting identify a building; opening reveals a doorway and project link | Implemented with scene hit testing and a native dialog; a sign opens the concise card. No navigable interior |
| Review history | Turn pages of a dated town album | AI follow-up idea only; not included in this revision |
| Import a backup | Open a saved map case | AI follow-up idea only; existing explicit import action remains available |

The construction axe, exploration footsteps and door glove reinforce these actions; they do not replace text-field cursors, disabled states or keyboard operation. Footsteps identify the current proposal's exploration context, without claiming that walking is implemented. A later draggable map should use appropriate grab feedback rather than ambiguously presenting movement as a click action. Existing brown-default/cream-selected semantics apply to persistent control selection. Object controls need a distinguishable pressed/focus response, while the unfolding effect expresses entry rather than fabricating data-loading progress.

## Preview acceptance and reuse boundary

The preview should let a visitor identify the two main paths with a short label and a recognizable object, complete the relevant transition and return without losing navigation. Inspect narrow-screen wrapping, keyboard activation, reduced-motion behavior and the concise project card. These are acceptance targets; actual results belong in [the collaboration log](../collaboration/log.md).

The proposal reuses the project's own town image and the free Kenney files recorded in [UI kit research](ui-kit-research.md). Referenced commercial games are inspiration only: their screenshots, icons, layouts and code are not copied into the product. New planning/map illustrations and CSS behavior are original implementation work. Instruction 0030 now authorizes global integration; its implementation, QA and final visual review remain separate from this research evidence.
