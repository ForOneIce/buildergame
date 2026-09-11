# Decision log

Record dates, decisions, attribution, rationale, impact, and references. Unconfirmed AI proposals belong in the brief.

> 中文提示：只记录实际决策，不把建议写成已确认。

## D-000 — Create a separate workspace

- Date: 2026-09-11 (UTC+8).
- User instruction: create `buildergame`, organize collaboration around competition requirements, and record subsequent ideation.
- Implementation: documentation, specs, prompts, collaboration, implementation, tests, and submission directories.
- Attribution: the user specified the name and recording objective; AI implemented the directory structure within that scope.
- Boundary: no product selected, no old code copied, no earlier discussion treated as a final specification.
- Reference: [Original instruction](../prompts/0000-workspace-setup.md).
- Initial commit: `0b573c4`.

## D-001 — Use English first with short Chinese notes

- Date: 2026-09-11 (UTC+8).
- User instruction: prioritize English because the competition is international; add simple Chinese notes.
- Decision: translate project documents into English, retain concise Chinese explanations, and apply the policy to future artifacts.
- Attribution: user selected the language; AI translated documents and implemented the policy.
- Traceability: preserve original Chinese instructions with labeled English translations, and retain original documents in Git history.
- Impact: no product, stack, or competition-track change.
- Reference: [Language instruction](../prompts/0001-language-policy.md).

Next decision: D-005.

## D-002 — Assess the user-originated town proposal

- Date: 2026-09-11 (UTC+8).
- User instruction: assess a Three.js hackathon town, preparation, partner fit, costs, and user acceptance.
- Confirmed scope of this session: research and assessment only.
- Attribution: the user originated the town, house-growth, metric-selection, and sign interaction concept; AI supplied technical/product critique and recorded proposals.
- No confirmation: the suggested MVP size, metric policy, blockchain layer, ENS integration, and competition route are not implementation decisions.
- Evidence: existing showcase README and GitHub REST limits retrieved on September 11; partner rules from earlier official-page reading.
- References: [Original idea](../prompts/0002-hackathon-town.md), [review](ideation/0002-hackathon-town-review.md).

## D-003 — Record organizer deployment and two presentation modes

- Date: 2026-09-11 (UTC+8).
- User-specified direction: event-branded organizer deployments; deployment-time game version; static snapshot or live monitoring; visually recognizable building evolution.
- Scope: conceptual refinement, not authorization to build or deploy.
- AI proposals: separate data timestamp, stable plots, persisted snapshots, last-visit comparison, and skippable opening.
- Sponsor and competition route: still undecided.
- Reference: [Input](../prompts/0003-town-deployment-modes.md).

## D-004 — Fixed plots and timeline transitions

- Date: 2026-09-11 (UTC+8).
- User-defined direction: stable land positions per project, whole-town timeline selection, and visible scene transitions between versions.
- AI elaboration: snapshot semantics, stable camera, missing-data behavior, display-policy consistency, and accessible transition options.
- Status: interaction direction supplied by the user; implementation details remain a draft.
- References: [Input](../prompts/0004-town-timeline.md), [draft](../specs/0001-town-timeline.md).
