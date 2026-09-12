# Refine the sample-town HUD

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

示例小镇页面：1、右上角按钮去掉，左下角的个人探索进度按钮移到右上角 2、左下角的放大缩小重置按钮移动到小镇地图按钮下 3、游览地形按钮hover时提示仅示例城镇支持切换演示，真实城镇建立后不支持切换 4、取消保存小镇按钮  5、关于小镇模块移动到左下角，只显示城镇名称，不显示“关于小镇” 和其它文案。hover时提示城镇名称可以创建时命令 6、上方三个数据hover提示“为所有项目数据总和”

## English translation (AI)

For the sample-town page:

1. Remove the upper-right buttons and move the personal exploration-progress control from the lower left to the upper right.
2. Move the lower-left zoom-in, zoom-out and reset controls beneath Town map.
3. On hovering the landscape-tour control, explain that switching landscapes is supported only for sample demonstrations; an actual town's landscape cannot be switched after creation.
4. Remove Save town.
5. Move the About this town module to the lower left and show only the town name, without its heading or other copy. On hover, explain that the town can be named during creation.
6. Add hover hints to the three top statistics: “Totals across all projects.”

## Scope and implementation interpretation

This instruction refines sample-town presentation only. Real-town account, settings and export actions, and the homepage/planner, retain their existing behavior. The original item 5 says “命令”; Codex interprets this as “命名” (naming), because the sentence describes setting a town's name during creation. The original wording above is unchanged.

The relocated exploration control remains visible, reports current progress and toggles its progress panel. Reuse the existing cream hint style for hover and keyboard focus, with accessible control names. Keep snapshot history, project interactions and exploration persistence working. Existing UI controls, building assets and CC0 Kenney materials are reused; no new artwork or dependency is required.

[Acceptance criteria](../specs/0011-shared-game-interface.md#sample-town-hud-refinement-0038) are implemented. The three existing browser regressions, bilingual layout/hint checks, TypeScript, sample/asset validation and final production build passed; [verification](../docs/verification.md) distinguishes earlier regression runs from checks after the final CSS changes. Unit tests were not rerun. Live OAuth, publication and physical-device testing were not performed; final human visual acceptance remains pending.
