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

Next collaboration record: **0002**, expected to cover ideation.
