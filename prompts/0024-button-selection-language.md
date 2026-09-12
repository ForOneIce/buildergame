# Distinguish unselected and selected buttons

Date: 2026-09-12. AI tool: Codex.

## Original project instruction

按钮未被选中时为棕色，选中时才为奶油色。不要造成理解和点击视觉焦点理解困难

## English translation (AI)

Buttons should be brown when unselected and cream only when selected. Avoid ambiguity in understanding the controls and where to click.

## Preview implementation interpretation (AI)

Use brown with light labels for default buttons and cream with dark labels for persistent selected navigation or choices. Hover and keyboard focus must remain distinguishable from persistent selection. A single-action button stays in the default brown family because activating it does not establish a selected mode. Teal remains a translucent panel material, not another button selection state.

The existing [preview-first review gate](0023-preview-material-direction.md) still applies. This correction concerns the standalone proposal only; the human has not authorized global integration. Reuse the already selected free assets, with no new asset imports. The [shared interface specification](../specs/0011-shared-game-interface.md) records the resulting control contract; visual QA and human acceptance are separate checks.
