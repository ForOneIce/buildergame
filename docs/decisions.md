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

Next decision: D-002.
