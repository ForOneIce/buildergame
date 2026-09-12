# Enlarge the automatic building showcase and make transitions silent

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

首页右侧自动轮播  不用提供5个按钮和暂停，切换时的loading自然过度，不要弹文案。我是希望阶段展示可以在首页右侧尽可能大地展示，会更有吸引力。

## English translation (AI)

Automatically cycle the showcase on the right side of the homepage. Do not provide the five stage buttons or a pause control. Make loading between stages transition naturally, without displaying text. I want the building stages to appear as large as possible on the right side of the homepage, making them more attractive.

## Scope and implementation interpretation

This refines the actual homepage from [0031](0031-refine-homepage-and-building-showcase.md), superseding its manual-stage and pause/play controls. The human requests a larger, automatic presentation and silent transitions. Codex implemented preloading/caching of GLB file bytes and on-demand model parsing while retaining the current building, then dissolving a temporary outgoing 2D frame over the single live WebGL scene. Playback loops from stages 1 through 5 back to 1. Camera and layout changes enlarge the presentation without modifying the locked building assets.

As a supporting reduced-motion choice, show stage 5 as a static illustration on reduced-motion entry, with up to two quiet retries for an initial load failure and no visible playback controls. Hiding the page cancels future transition timers; in-flight work may finish. Leaving the homepage releases resources. The in-scene stage caption and loading status are removed alongside the controls.

The [showcase refinement](../specs/0011-shared-game-interface.md#silent-automatic-showcase-refinement-0032) records acceptance criteria. TypeScript, sample/asset validation, production build and the final extended shared-interface browser check passed. [Verification](../docs/verification.md) records transition/retry checks, screenshot review and suites not rerun. Final human visual acceptance remains pending.
