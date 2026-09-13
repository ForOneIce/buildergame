# Compact the support card

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instruction

> 这个窗口信息太多了，精简内容，有需要的话内嵌另外完整信息弹窗，不要出现竖条滚动条，ui不和谐。

## English translation (AI)

This window contains too much information. Simplify it and, if needed, provide another dialog with the full information. Avoid the vertical scrollbar, which does not fit the interface.

## Scope and acceptance

Keep the primary support card concise and consistent with the existing game materials. Move extended explanations into an accessible secondary information dialog. Preserve the recipient and network, amount/review controls, a brief current error or pending state, and the initially unchecked acknowledgment required for the relevant action. Shortened addresses still need a full-address review path. Do not remove wallet approval, transaction locks or pending recovery to achieve a smaller card.

Check ordinary desktop/mobile layouts without a tall, scrolling primary card or clipped essential controls. Secondary information must remain reachable by keyboard and touch, and closing it must restore focus to the triggering control. Error and critical transaction states must not reopen a second send path or allow background town interaction. This is a visual simplification requirement; its implementation and acceptance are pending, and earlier wallet/HUD fixtures do not verify the revised card automatically.
