# 0006 — Cumulative commits preserve existing buildings

- Date: 2026-09-11 (Asia/Shanghai, UTC+8).
- Phase: requirements correction.
- AI tool: Codex, this conversation.

> 中文提示：累计提交总数决定房屋；没有新提交就保持原状。

## Original user input

避免把“没有新提交”表现成项目荒废  不会呀 历史提交总数有记录的 除非是空白的仓库 没有提交过新代码

## English translation

There is no need to worry that having no new commits will make a project look abandoned: the historical total commit count is recorded. Only a blank repository that has never had a code commit would be empty.

## Correction and attribution

The user clarified that commits mode uses accumulated historical commits, not recent activity or a rolling time window. The AI had introduced an inactivity/decay concern that does not follow from the user's design and withdraws that assumption.

With the same mapping, an unchanged total produces an unchanged building. New commits can move it to a higher stage when a threshold is reached. A confirmed empty repository with no commits can render as an empty plot; unavailable data is not an empty repository.

## Prompts submitted to other AI tools

None.

## Output

Updated [growth rules](../specs/0002-organizer-growth-rules.md), [timeline draft](../specs/0001-town-timeline.md), feasibility review, and collaboration records. No application code changed.
