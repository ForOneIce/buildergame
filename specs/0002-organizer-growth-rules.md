# Organizer-defined house growth

Status: user-confirmed product principle; configuration details and acceptance checks below are draft implementation proposals.

Source: [prompt 0005](../prompts/0005-organizer-growth-rules.md).

> 中文提示：活动方选择价值导向；程序按既定数值映射房屋，不另行修正评分。

## Authority

The event organizer owns the growth criteria. The platform is a configurable visualization tool, not a universal evaluator.

Do not enforce AI-proposed separation of attention/development, logarithmic normalization, active-day substitution, score caps, or other adjustments. Apply a transformation only when it is part of the organizer's configuration.

Numerical scores do not need to appear in the viewer interface, consistent with the original concept. Do not impose an additional public scoring dashboard. A short organizer-authored description may be provided.

## Sources

| Mode | Input | Computation |
| --- | --- | --- |
| commits | GitHub commit count under the configured branch/time scope | Use the selected count directly unless the organizer configures another mapping |
| stars | GitHub star count at the snapshot | Use the selected count directly |
| custom | Complete repository-to-score table supplied before deployment | Use supplied scores; do not recompute the organizer's method |

Earlier discussion allowed multiple dimensions. The organizer can combine them externally and import final custom scores, avoiding an arbitrary formula engine in the first version.

The commit branch/window and house-stage boundaries still need to be specified before implementation. Do not silently replace commit count with active days or stars with star growth.

## Shared pipeline

Repository → configured score source → organizer-defined stage boundaries → house model.

The source changes the input, not the stable project plot or timeline behavior.

The organizer supplies/selects a complete set of numeric boundaries and corresponding available house stages. No values in this document are default scoring policy.

## Custom import

Proposed minimal CSV columns:

```csv
repository,score
https://github.com/example/project-a,82
https://github.com/example/project-b,45
```

These are fictional format examples, not event data or score thresholds.

Before publishing a custom-score version:
- Every configured project must resolve to exactly one score entry.
- Normalize repository identifiers consistently and detect duplicate entries.
- Require valid finite numbers and validate the configured scale/boundaries.
- Report missing, duplicate, invalid, or unmatched entries for correction; do not silently assign zero.
- Do not merge custom scores with GitHub metrics unless the organizer explicitly configures that behavior.

These checks verify completeness and consistent rendering, not whether the organizer's values are fair.

## Snapshots and updates

- Commit/star modes can refresh according to the town's configured schedule.
- A custom-score town can publish a fixed edition from its initial table.
- To evolve custom-score buildings, the organizer supplies an updated complete table, producing a new snapshot. GitHub changes alone do not alter custom scores.
- Persist source mode, configuration version, effective score, mapped house stage, and plot identity with each snapshot.
- Preserve published historical states. A later configuration change does not silently rewrite history.
- A fetch failure is unavailable data, not a score of zero.
- Deployment-time version and data-snapshot time remain separate.

## Proposed acceptance criteria

- [ ] Commits mode maps configured commit counts to the organizer's house stages without an unrequested adjustment.
- [ ] Stars mode maps star counts, not increments or active days.
- [ ] Custom mode uses the exact supplied values and validates full repository coverage.
- [ ] Missing/duplicate/non-numeric custom entries block publication with actionable errors.
- [ ] The same inputs and organizer configuration produce the same house stages.
- [ ] Each snapshot preserves its selected scoring configuration and plot positions.
- [ ] Scores remain absent from the default viewer interface.
- [ ] Timeline selection displays the saved state for the selected version.

All checks remain untested; no application code exists yet.
