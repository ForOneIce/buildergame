# Refine the town-planning page

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

点击创建城镇按钮后进入的图纸页面：1、去掉返回按钮，功能和左上角logo重复 2、返回按钮下面到图纸上面的字去掉。3、右上角按钮与首页保持一致 4、图纸界面左上角3d图片下面的划线实例图去掉，放大3d图片。5、游览三个布局的按钮移到探索示例小镇的详情页里 替换那边的城镇设置按钮 。 6、个人和团队模式切换按钮上logo要和首页呼应，可以简化，但要类似，方便理解。7、房屋成长设置  默认展开 8、图纸背景的竖条纸张折横需要在两个垂直区块的分隔线 9、城镇地形按钮缩小，图纸页面最大的按钮是创建和发布小镇。导出配置作为默认隐藏的附加选项（还没准备好数据？先备份本地配置后补充修改？提供这类提示）8、个人和社区的切换选择，窗口加载用图纸翻页的效果展示，可以从竖条折痕翻页。其它控件修改建议和前面同理

## English translation (AI)

For the planning-sheet page opened by Create town:

1. Remove the Back button; it duplicates the upper-left logo's function.
2. Remove the text between that button and the planning sheet.
3. Keep the upper-right buttons consistent with the homepage.
4. Remove the line-drawn example below the upper-left 3D image and enlarge the 3D image.
5. Move the three landscape-tour buttons into the sample-town exploration view, replacing its Town settings button.
6. Make the personal/team mode icons resemble their homepage counterparts; they may be simplified but should remain recognizable.
7. Expand House growth settings by default.
8. Place the paper's vertical fold at the division between the two columns.
9. Make the terrain buttons smaller. Creating and publishing the town should have the largest button emphasis. Hide configuration export in an additional option by default, with a hint such as “Not ready with your data? Back up the local configuration and finish editing later.”

Final item, numbered 8 in the original: when switching between individual and community modes, show a planning-sheet page-turn effect, originating at the vertical fold. Apply the preceding control-design guidance to other controls as well.

## Scope and implementation interpretation

The planner and sample-town navigation are implemented with reused hand symbols/materials and refreshed 1280×720 scene previews; real towns retain Town settings. Mode changes preserve inputs with keyboard/reduced-motion support. A separate incomplete-plan backup supports resuming unfinished input and remains distinct from a complete deployment configuration or captured town. The preview is a rendered scene image, not a live 3D editor. [Acceptance criteria](../specs/0011-shared-game-interface.md#planning-page-refinement-0037) and [verification](../docs/verification.md) record passing browser, unit, build and asset checks with their timing and limits. Human visual acceptance remains pending.
