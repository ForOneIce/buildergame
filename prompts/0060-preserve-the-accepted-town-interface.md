# Preserve the accepted town interface

Date: 2026-09-13 (UTC). AI tool: Codex.

## Initial project requirement summary

This is an English summary of the project correction, not a verbatim transcript. The human identified a difference between the accepted town interface and a local town view. The wallet extension should preserve the established controls and layout, adding its wallet icon only when configured.

中文摘要：保留已经确认的小镇界面；配置钱包时按需增加入口，不借扩展功能重新安排原有控件。

## Original follow-up instruction

> 好的，发现了一个bug。修改下，示例小镇和实际小镇保持一致。除了不显示游览地形按钮。

## English translation (AI)

Okay, a bug was found. Fix it so that sample towns and actual towns stay consistent, except that actual towns do not show the landscape-tour button.

## AI diagnosis and implementation response

Read-only comparison with baseline `8f8710d` found that `gameLayout()` had not changed in the wallet increment. It already selected different HUD markup for sample and non-sample data. The main layout styles and ten building assets had no diff. Browser inspection separately found that the compared views used different town types. This supports a legacy branch inconsistency; it does not establish that wallet CSS rearranged the sample interface.

Following the explicit follow-up, Codex's corrective implementation uses the accepted sample HUD as the common layout for created towns as well: camera controls beneath the map, random exploration at the upper right, and statistics above the town name at the lower left. Actual towns omit the landscape-tour button without replacing it with a town-settings button. The legacy visitor Save town control and duplicate exploration panel are removed from the common layout. Maintenance stays available through the planner's optional Continue current town and Back up current town actions for a loaded actual town. The shared virtual-support demonstration remains explicitly decorative; actual wallet entry is still conditional on configured support. Sample terrain tours, current camera framing and all accepted buildings remain unchanged. [Specification 0018](../specs/0018-preserve-the-accepted-town-interface.md) defines acceptance; this record is not visual acceptance or test evidence.
