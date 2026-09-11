# Decision log

Record dates, decisions, attribution, rationale, impact, and references. Unconfirmed AI proposals belong in the brief.

## D-000 — Create a separate workspace

- Date: 2026-09-11.
- User instruction: create `buildergame`, organize collaboration around competition requirements, and record subsequent ideation.
- Implementation: documentation, specs, prompts, collaboration, implementation, tests, and submission directories.
- Attribution: the user specified the name and recording objective; AI implemented the directory structure within that scope.
- Boundary: no product selected, no old code copied, no earlier discussion treated as a final specification.
- Reference: [Original instruction](../prompts/0000-workspace-setup.md).
- Initial commit: `0b573c4`.

## D-002 — Assess the user-originated town proposal

- Date: 2026-09-11.
- User instruction: assess a Three.js hackathon town, preparation, partner fit, costs, and user acceptance.
- Confirmed scope of this session: research and assessment only.
- Attribution: the user originated the town, house-growth, metric-selection, and sign interaction concept; AI supplied technical/product critique and recorded proposals.
- No confirmation: the suggested MVP size, metric policy, blockchain layer, ENS integration, and competition route are not implementation decisions.
- Evidence: existing showcase README and GitHub REST limits retrieved on September 11; partner rules from earlier official-page reading.
- References: [Original idea](../prompts/0002-hackathon-town.md), [review](ideation/0002-hackathon-town-review.md).

## D-003 — Record organizer deployment and two presentation modes

- Date: 2026-09-11.
- User-specified direction: event-branded organizer deployments; deployment-time game version; static snapshot or live monitoring; visually recognizable building evolution.
- Scope: conceptual refinement, not authorization to build or deploy.
- AI proposals: separate data timestamp, stable plots, persisted snapshots, last-visit comparison, and skippable opening.
- Sponsor and competition route: still undecided.
- Reference: [Input](../prompts/0003-town-deployment-modes.md).

## D-004 — Fixed plots and timeline transitions

- Date: 2026-09-11.
- User-defined direction: stable land positions per project, whole-town timeline selection, and visible scene transitions between versions.
- AI elaboration: snapshot semantics, stable camera, missing-data behavior, display-policy consistency, and accessible transition options.
- Status: interaction direction supplied by the user; implementation details remain a draft.
- References: [Input](../prompts/0004-town-timeline.md), [draft](../specs/0001-town-timeline.md).

## D-005 — Organizer-selected scoring governs house growth

- Date: 2026-09-11.
- User decision: organizers choose commits, stars, or their own complete repository-to-score table; the app renders according to that choice.
- Supersedes: AI recommendations to mandate attention/development separation or additional platform-selected adjustments.
- AI work: document configurable sources, direct score-to-stage mapping, complete-table validation, and snapshot behavior.
- Scope: accepted product principle; no implementation or deployment authorization.
- References: [Input](../prompts/0005-organizer-growth-rules.md), [specification](../specs/0002-organizer-growth-rules.md).

## D-006 — Use cumulative commits without inactivity decay

- Date: 2026-09-11.
- User clarification: historical commit totals remain recorded; stopping new commits does not imply abandonment or a smaller house.
- Behavior: unchanged total and mapping → unchanged building; confirmed zero-commit repository → empty-land stage.
- Supersedes: AI's recent-activity interpretation and related decay concern.
- Technical details still pending: repository/reference count definition, handling changed Git history, and stage boundaries.
- Reference: [Input](../prompts/0006-cumulative-commit-growth.md).

## D-007 — Build the Web2-first pilot Demo

- Human decision: ETHOnline 2026 pilot; lower weight for cumulative commits, medium for stars, higher for forks; reusable Web2 base and deferred ENS.
- AI implementation choices: TypeScript, Vite, Three.js, provisional weights 1/3/6, replaceable procedural buildings and sample snapshots.
- Status: initial implementation; actual project list, final art and verification remain pending.
- References: [Input](../prompts/0007-web2-demo.md), [Demo specification](../specs/0003-web2-demo.md).
