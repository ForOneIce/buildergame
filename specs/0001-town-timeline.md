# Town timeline and stable plots

Status: draft. The user specified the core interaction; technical choices and acceptance criteria below are AI proposals. No implementation has started.

Source: [prompt 0004](../prompts/0004-town-timeline.md).

> 中文提示：地块固定，切换整城快照；过渡动画帮助识别变化。

## User-defined interaction

- Every project keeps the same plot across versions.
- A town-wide timeline selects an earlier or later recorded state.
- A visible transition between the two rendered states makes evolving buildings apparent.

## Meaning of a version

A timeline entry represents a recorded town data snapshot. Keep the deployment-time game version separately visible. GitHub commits, page visits, and individual API responses are not automatically town versions.

Each snapshot records its collection window and per-project data freshness. Fetching multiple repositories is not an atomic GitHub-wide observation; state the sampling window.

Never infer missing historical stars, forks, or buildings from today's values. Simulated snapshots must be labeled as simulations. One snapshot supports a static showcase; two or more enable a comparison timeline.

## Proposed interaction flow

1. Open the latest available snapshot and show its date.
2. Select another recorded date from the timeline.
3. Keep plot coordinates and the current camera unchanged.
4. Preload required data/models, then animate changed buildings to the selected state.
5. Show the destination date and an optional changed-project count derived from the two states.
6. Clicking a changed house reveals the observed change and its source.
7. Selecting an earlier date reverses the historical view without overwriting newer snapshots.

A first version needs two date selectors or previous/next controls; continuous autoplay can follow later. While dragging a timeline, show a date preview and render on selection, or debounce scene updates.

Suggested transition duration: approximately 0.4–0.8 seconds, subject to device and user testing.

## Rendering proposal

- Reuse a single scene, fixed camera, and stable plot objects.
- Interpolate transforms/material appearance when states are compatible.
- For different house geometries, use a brief controlled fade or construction reveal; do not assume arbitrary meshes can morph correctly.
- Keep unchanging buildings still so changes remain legible.
- Avoid rendering two complete towns continuously; profile before using full-frame crossfades.
- Render each selected state from saved snapshot data. Screenshots may be optional previews but do not replace interactive snapshot data.
- Treat animation frames as a presentation transition, not measurements of intermediate historical activity.
- In reduced-motion mode, switch directly and retain textual change indicators.
- Provide keyboard-operable timeline controls and equivalent list/card information.

> 中文提示：第一版无需复杂模型变形，短暂淡入淡出即可表达变化。

## Stable identity and layout

- Persist projectId → plotId and plot coordinates in an event manifest/layout.
- Use stable repository IDs where available; a rename must not create a new building.
- Allocate new projects to free reserved plots without relocating existing projects.
- Before a project's first listing, show its reserved location as not yet listed.
- For a removed project, preserve older snapshots; its current plot follows an explicit removal policy.
- A failed fetch is not project removal and must not downgrade or erase a building.
- A confirmed zero-commit repository may have an empty plot. No new commits on an existing repository leaves its building unchanged under the same mapping.
- If a layout must change, version it and do not silently present relocation as project evolution.

## Comparison integrity

Freeze the display policy within a comparable timeline: metric definitions, repository/reference scope, thresholds, weights, and visual mappings. Commits mode uses cumulative history; the collection window describes when data was fetched, not a rolling scoring period.

If an organizer changes those settings, identify a new display-policy version and label the view change. Do not present a house upgrade caused only by new weights or artwork as new development.

A future replay lens may apply one chosen policy consistently to stored raw snapshots, but must label that policy and preserve the original published states. It is outside the first version.

Keep data, display policy, and layout versions identifiable as internal metadata; an optional organizer-authored explanation may be shown. Scores need not be exposed.

Growth follows the organizer's chosen commits, stars, or complete custom-score table; see [growth rules](0002-organizer-growth-rules.md). Historical comparison preserves the selected configuration without imposing another scoring philosophy.

## Suggested stored data

- Snapshot: townId, snapshotId, capturedAt, collectionWindow, layoutVersion, displayPolicyVersion.
- Project state: projectId, repositoryId, plotId, rawMetrics, visualStage, decorations, dataStatus, sourceCapturedAt.
- Store history persistently; do not rely on ephemeral runtime memory.
- If using cached data after a failed fetch, retain its original timestamp and mark it stale.
- Publish a snapshot once its collection attempt is complete; label partial coverage.
- If a selected snapshot is unavailable, retain the current scene and explain the missing date.

## Proposed acceptance criteria

- [ ] Switching between two fixtures preserves every shared project's plot and camera position.
- [ ] One changed project produces a visible building/decorative change; unchanged projects remain stable.
- [ ] Historical selection is read-only and does not modify stored latest data.
- [ ] A rename retains project identity; newly listed and unavailable repositories behave distinctly.
- [ ] A failed fetch preserves the last good state and displays its original freshness.
- [ ] Different display-policy/layout versions are identified; incompatible views are not silently treated as growth.
- [ ] Keyboard and reduced-motion users can select dates and identify the same changes.
- [ ] A static one-snapshot edition shows its date and explains that no historical comparison exists.
- [ ] Any simulated timeline used in the hackathon video is clearly labeled.

All criteria are untested. These are proposed checks, not test results.
