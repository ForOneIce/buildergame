# Balance the introduction spacing and reuse the shared tooltip

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

1、首页左侧“为github builder打造的家园，让我们一起见证彼此的成长。”这个字的左右边界宽度效果不一致，减少离右侧边框的距离，和左侧边距保持一致，更美观。2、五阶段展示区域的文案hover样式需要和首页其它hover样式统一，而不是显示在图片下方的黑色文字

## English translation (AI)

1. The left-side homepage introduction, “A home for GitHub builders. Let’s watch each other grow,” has uneven space at its left and right edges. Reduce the distance to the right border to match the left margin and improve its appearance.
2. Make the five-stage showcase's hover text use the same hover style as the other homepage hints, rather than showing black text below the image.

## Scope

The introduction now uses the paper panel's full content width with equal side padding, and the building tagline reuses the existing cream `.control-hint` tooltip. Models and scoring are unchanged. Focused browser checks and build validation passed; human visual acceptance remains pending. [Specification](../specs/0011-shared-game-interface.md#balanced-introduction-and-tooltip-refinement-0034), [verification](../docs/verification.md).
