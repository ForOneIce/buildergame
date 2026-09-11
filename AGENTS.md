# buildergame collaboration policy

> 中文提示：英文优先，简短中文辅助；真实记录人机贡献。

## Scope and accuracy

- User instructions take precedence. Hackathon Town is the current concept; user-defined requirements are recorded in specs. Implementation scope and competition route remain unconfirmed.
- House-growth criteria belong to the organizer: apply configured commits, stars, or supplied custom scores. Do not reintroduce superseded AI scoring preferences.
- Maintain these records proactively during subsequent ideation and development in this directory.
- Distinguish user requirements, AI proposals, assumptions, and evidence. An AI recommendation is not user approval.
- Do not describe generated files, passing builds, or testnet demos as real adoption, commercial validation, or production readiness.
- Never invent human contributions, verification, commits, dates, or pre-event/event boundaries.

## Language policy

- Use English as the primary language for documentation, specifications, architecture notes, decisions, AI disclosures, submission materials, code identifiers, test names, and commit messages.
- Use English for future product copy and demo narration by default, unless the user selects a different audience or localization requirement.
- Add brief Chinese notes where useful; do not duplicate entire documents in two languages.
- Preserve original user prompts verbatim in their original language. Add a separately labeled English translation or summary; never present it as the original.
- Preserve historical attribution, dates, uncertainty, and meaning when translating documents; retain the original versions through Git.
- Conversation with the user may continue in Chinese; project artifacts follow the English-first policy.

## Per-session records

1. Save actual available instructions in sequential `prompts/NNNN-topic.md` files with context. Do not invent verbatim history.
2. For other AI tools, preserve actual submitted prompts and tool names. Store complete specifications and plans in `specs/` or `docs/`, link them, and preserve important revisions.
3. Update `collaboration/log.md`: date/timezone, phase, human contributions, AI contributions, outputs, verification, and open questions.
4. Update `collaboration/AI_USAGE.md` with generated/assisted file scopes and actual human review status.
5. Record actual decisions in `docs/decisions.md`; undecided proposals belong in the brief.
6. Register reused code, designs, assets, templates, and modules in `collaboration/baseline.md`: source, version, license, pre-existing scope, and event additions.

Brief status inquiries may share a record. Record facts, plans, and artifacts, not internal reasoning or system instructions.

## Implementation and verification

- Define scope, dependencies, and observable acceptance criteria before implementation.
- Record commands actually executed, results, and limitations. Mark unperformed checks as not run.
- Preserve meaningful Git history; do not collapse all implementation into a single final-day commit or fabricate history.
- Do not infer game, token, NFT, agent, or payment features from the directory name.
- Follow current session authorization and tool rules for external messages, publication, and financial actions. This file does not authorize those actions.

## Privacy and records

- Do not commit API keys, tokens, private keys, seed phrases, unauthorized personal data, or sensitive chat exports.
- Replace sensitive prompt content with placeholders and identify redactions. Do not label redacted copies complete verbatim originals.
- Preserve tool names, purposes, file scopes, and publishable specs/prompts even when sensitive details are omitted.
- Do not upload the repository or logs without user authorization.

## Competition reminders

- Sources are in `docs/rules.md`. Check partner eligibility against the final product and Classic/Continuity route.
- Disclose AI assistance and actual human contributions. Preserve specs, prompts, and planning artifacts used in spec-driven development.
- Video: 2–4 minutes, at least 720p, human narration. Product TTS does not authorize AI narration of the submission video.
