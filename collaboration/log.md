# Human–AI collaboration log

Dates use Asia/Shanghai (UTC+8). Record actual inputs, contributions, and verification; planned work is not completed work.

> 中文提示：保留真实过程，未验证项明确注明。

## 0000 — Create the workspace

- Date: 2026-09-11.
- Human contribution: specified the workspace name, competition-oriented structure, and recording of subsequent ideation.
- AI contribution: summarized prior background and previously read official rules; created collaboration instructions and submission templates.
- Outputs: initial workspace files; scopes listed in `AI_USAGE.md`.
- Topic status: undecided; no code copied from `web3-FTW` or other existing projects.
- Verification: checked 16 workspace files; local links in 13 Markdown files resolved; staged whitespace checks passed; working tree clean after commit. No product tests were applicable.
- Version record: local initial commit `0b573c4`; no remote publication.
- Open questions: topic, roles, track, partners, acceptance criteria, and user validation.
- Input: [0000-workspace-setup](../prompts/0000-workspace-setup.md).

## 0001 — Apply the language preference

- Date: 2026-09-11.
- Human contribution: selected English as the primary language with simple Chinese notes.
- AI contribution: translated documentation, preserved original prompts, added labeled English translations, and updated the collaboration policy.
- Outputs: 13 translated Markdown files and one new language-instruction record.
- Scope: preparation only; no product, stack, or track decision.
- Verification: local links in all 14 Markdown files resolved; git diff --check passed. No product code changed, so product tests were not applicable.
- Execution note: the sandbox denied document writes; the write command required elevated execution.
- Version record: preserve the setup commit and save this change separately.
- Input: [0001-language-policy](../prompts/0001-language-policy.md).

Next collaboration record: **0007**.

## 0002 — Review Hackathon Town

- Date: 2026-09-11 (UTC+8).
- Phase: ideation and assessment.
- Human contribution: conceived a Three.js town linking events, repositories, builder profiles, activity-driven house models, and viewer interactions.
- AI contribution: researched the existing showcase and GitHub REST limits; assessed feasibility, incentive risks, costs, chain boundaries, sponsor fit, and validation; produced English review materials with short Chinese notes.
- Sources: existing HackathonGalacticShowcase README and official GitHub rate-limit page retrieved today; partner pages reviewed earlier in this conversation.
- Execution: browser tool unavailable; sandbox network access denied. Public read-only requests succeeded after elevated execution. No accounts were modified or messages sent.
- Outputs: prompt 0002, feasibility review, and updated project/AI/reuse/decision records.
- Verification: all local links in 16 Markdown files resolved and git diff --check passed. No implementation, performance test, pilot interview, or user retention measurement performed.
- Open questions: pilot, data mapping, display policy, reuse/track, assets, and partner choice.
- References: [Input](../prompts/0002-hackathon-town.md), [review](../docs/ideation/0002-hackathon-town-review.md).

## 0003 — Refine organizer deployments and presentation modes

- Date: 2026-09-11 (UTC+8).
- Human contribution: specified self-deployed, event-branded towns, deployment-time game versions, fixed editions and live monitoring, and visual building evolution.
- AI contribution: recorded and translated the refinement; separated deployment versions from data snapshots; proposed persistence, stable plots, and clear change comparisons.
- Outputs: prompt 0003, review section 13, and updated status/decision/AI records.
- Verification: local links in all 17 Markdown files resolved and git diff --check passed. No product code, deployment, or user validation.
- Input: [0003-town-deployment-modes](../prompts/0003-town-deployment-modes.md).

## 0004 — Fixed plots and timeline transitions

- Date: 2026-09-11 (UTC+8).
- Human contribution: specified permanent project plots and town-wide timeline transitions to make changes visible.
- AI contribution: drafted snapshot/version semantics, transitions, stable identity, policy consistency, accessibility, and proposed acceptance criteria.
- Outputs: original prompt with English translation, draft timeline specification, and updated cross-references.
- Verification: local links in all 19 Markdown files resolved and git diff --check passed. Product acceptance criteria remain untested.
- References: [Input](../prompts/0004-town-timeline.md), [draft](../specs/0001-town-timeline.md).

## 0005 — Organizer-defined growth rules

- Date: 2026-09-11 (UTC+8).
- Human contribution: clarified that each organizer's values determine growth; custom scores require complete repository mapping before deployment.
- AI contribution: corrected prior assumptions, specified commits/stars/custom sources and validation, and removed conflicting current recommendations.
- Outputs: prompt 0005, growth-rule specification, reconciled review/timeline, and updated records.
- Verification: all local links in 21 Markdown files resolved; git diff --check passed; conflicting current metric-separation recommendations were reconciled. No product code or acceptance tests.
- References: [Input](../prompts/0005-organizer-growth-rules.md), [specification](../specs/0002-organizer-growth-rules.md).

## 0006 — Cumulative commits preserve buildings

- Date: 2026-09-11 (UTC+8).
- Human contribution: clarified historical total commits and rejected the implied inactivity/abandonment mechanic.
- AI contribution: corrected recent-window wording and recorded persistent cumulative growth with empty-versus-unavailable data handling.
- Outputs: prompt 0006 and updated specs, review, policy, and project records.
- Verification: local links in all 22 Markdown files resolved and git diff --check passed. No product code or acceptance tests.
- Input: [0006-cumulative-commit-growth](../prompts/0006-cumulative-commit-growth.md).
