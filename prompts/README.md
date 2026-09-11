# Prompt records

Record 0000 covers setup, 0001 the language preference, and 0002 the Hackathon Town idea and review. The next record is **0003**.

> 中文提示：用户原话原样保留，英文翻译单独标注。

Use English for structure and reviewer-facing explanations. Preserve original inputs in their original language.

Suggested format:

```markdown
# NNNN — Topic
- Date and timezone:
- Phase: ideation / planning / implementation / verification / submission
- AI tools used:

## Original user input
Preserve actual input. Replace sensitive content with placeholders and label redactions.

## English translation
Provide a labeled translation of non-English input for reviewers.

## Prompts submitted to other AI tools
Save actual prompts and tool names; write "None" if not applicable.

## Proposals, outputs, and feedback
Include actual proposals or links to complete specs/plans.
Identify user feedback, decisions, and open questions.
```

Do not fabricate earlier verbatim history. Background is summarized in `docs/brief.md`. Track these files without publishing sensitive material.
