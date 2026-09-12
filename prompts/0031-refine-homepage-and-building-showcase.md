# Refine the homepage and single-building showcase

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

首页修改：1、左上角游戏logo图标摆正，不要歪。2、右上角的登陆按钮，只留人头指示logo，hover提示按钮原有的文案；3、左侧展示文案去掉多余文案（为你的创造，留一处位置 让每个作品， 在这里安家。无需钱包，以访客身份探索。  ）4、“把公开 GitHub 项目变成生动的小镇。认识开发者，再回来看看新的成长。  ”修改成“为github builder打造的家园，让我们一起见证彼此的成长。” 5、探索示例小镇按钮改为hover图案时显示的提示，新建城镇按钮同理。6、去掉“无需钱包，以访客身份探索。  ”7、把游览三种地形的按钮从首页移动到新建城镇的表单里，切换选择城镇地形时，可以在场地规划示意的左上角看到缩略图。8、“谁在这里安家？”改成“谁能新建城镇？ ”9、去掉下方的备份配置文件按钮。10、谁在这里安家？下面两种个人、社群区分图标修改成个人用一个手表示，一群人社区用围成一圈握手互相打气的图标表示。不需要支持点击.去掉按钮控件样式。显示为图标和文案。 11、右侧改为单独展示五个阶段的建筑风格，自动从1到5滚动播放。更吸引人。不需要显示城镇。显示单个建筑的变化。文案提示“一个仓库，一处家园。”改为“持续构建，持续成长”

## English translation (AI)

Homepage changes:

1. Straighten the game logo in the upper left; do not tilt it.
2. In the upper right, show only the person/avatar icon for the login button. Reveal its original label on hover.
3. Remove the extra left-side copy: “Leave a place for your creations,” “Let every project find a home here,” and “No wallet needed. Explore as a guest.”
4. Replace “Turn public GitHub projects into a living town. Meet builders, then return to see new growth” with “A home for GitHub builders. Let’s watch each other grow.”
5. Make the Explore sample town label a tooltip shown when hovering its illustration; do the same for Create town.
6. Remove “No wallet needed. Explore as a guest.”
7. Move the three terrain-tour buttons from the homepage into the town-creation form. When selecting a terrain, show its thumbnail in the upper left of the site-plan illustration.
8. Change “Who lives here?” to “Who can create a town?”
9. Remove the backup/configuration-file button below this section.
10. For the individual and community descriptions, use a single hand for an individual and a ring of people holding hands and encouraging each other for a community. These should not be clickable or styled as buttons; show illustrations and text.
11. Replace the right-side town view with a single building cycling automatically through the five construction stages, from 1 to 5. Show the changes to one building, not a town. Replace “One repository, one home” with “Keep building. Keep growing.”

## Scope and implementation interpretation

This refines the actual application authorized by [0030](0030-implement-shared-game-interface.md). Reuse the five accepted building models unchanged. Preserve English as the default and provide Chinese text. Keep accessible names and keyboard-focus hints when visible labels become hover hints; preserve usable touch actions. Provide manual stage selection and pause/play, with reduced-motion autoplay initially paused. These accessibility details are implementation choices supporting the requested presentation.

The homepage no longer exposes the backup button or collection-mode buttons. Existing backup import/export workflows remain available in the creation and town flows. Terrain sample tours start from the planner and must return to the same unsaved form. This is a presentation revision; organizer-defined scoring and stored town data are not changed.

The [shared-interface refinement](../specs/0011-shared-game-interface.md#homepage-refinement-0031) records acceptance criteria. TypeScript, sample/asset validation, production build, twelve tracked Node tests and three browser scripts passed for this revision; [verification](../docs/verification.md) records exact scope, screenshot review and mocked-transport limits. Final human visual acceptance remains pending.
