# Organizer-defined house growth

Status: user-confirmed product principle; configuration details and acceptance checks below are draft implementation proposals.

Sources: [prompt 0005](../prompts/0005-organizer-growth-rules.md) and [cumulative-count clarification](../prompts/0006-cumulative-commit-growth.md).

## Authority

The event organizer owns the growth criteria. The platform is a configurable visualization tool, not a universal evaluator.

Do not enforce AI-proposed separation of attention/development, logarithmic normalization, active-day substitution, score caps, or other adjustments. Apply a transformation only when it is part of the organizer's configuration.

Numerical scores do not need to appear in the viewer interface, consistent with the original concept. Do not impose an additional public scoring dashboard. A short organizer-authored description may be provided.

## Sources

| Mode | Input | Computation |
| --- | --- | --- |
| commits | Cumulative historical GitHub commit total for the selected repository/reference definition | Map the total directly; no rolling activity window or inactivity decay |
| stars | GitHub star count at the snapshot | Use the selected count directly |
| custom | Complete repository-to-score table supplied before deployment | Use supplied scores; do not recompute the organizer's method |

Earlier discussion allowed multiple dimensions. The organizer can combine them externally and import final custom scores, avoiding an arbitrary formula engine in the first version.

The repository/reference counting definition and house-stage boundaries still need to be specified before implementation. Count full available history under that definition, not a recent time window. Do not substitute active days, recent commit counts, event-only additions, or star growth.

## Cumulative commit behavior

- A repository's recorded historical commit total is the input.
- If the total and mapping remain unchanged, its building stays unchanged regardless of elapsed time.
- Additional commits can advance the house when the next configured threshold is reached; not every commit must change the model.
- A confirmed blank repository with zero commits may use the empty-land stage. A missing response, inaccessible repository, or counting failure is not zero.
- Timeline selection renders the historical count and model saved in that snapshot; returning to an older version is historical viewing, not decay.
- Branch/reference changes or rewritten history require an explicit data-handling policy during implementation; do not assume Git itself guarantees every observed count is monotonic or silently invent replacement scores.
- This clarification applies to commits mode. Stars and organizer-supplied scores retain their own recorded values.

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

- [ ] Commits mode maps cumulative historical counts to organizer-defined house stages without an unrequested adjustment.
- [ ] Advancing snapshot time without new commits preserves the same building under the same mapping.
- [ ] Only a confirmed zero-commit repository uses the zero-commit empty-land state; unknown data does not.
- [ ] Crossing a configured threshold through additional commits changes the stage in the next snapshot.
- [ ] Stars mode maps star counts, not increments or active days.
- [ ] Custom mode uses the exact supplied values and validates full repository coverage.
- [ ] Missing/duplicate/non-numeric custom entries block publication with actionable errors.
- [ ] The same inputs and organizer configuration produce the same house stages.
- [ ] Each snapshot preserves its selected scoring configuration and plot positions.
- [ ] Scores remain absent from the default viewer interface.
- [ ] Timeline selection displays the saved state for the selected version.

All checks remain untested; no application code exists yet.
