# buildergame collaboration policy

## Scope and accuracy

- User instructions take precedence. A Web2-first Hackathon Town Demo is authorized in prompt 0007; competition route remains unconfirmed.
- House-growth criteria belong to the organizer: apply configured commits, stars, weighted commits/stars/forks, or supplied custom scores. Do not reintroduce superseded AI scoring preferences.
- Commits mode uses the cumulative historical total, not recent activity. No new commits means no change in the building under the same mapping; do not invent inactivity decay.
- Maintain these records proactively during subsequent ideation and development in this directory.
- Distinguish user requirements, AI proposals, assumptions, and evidence. An AI recommendation is not user approval.
- Do not describe generated files, passing builds, or testnet demos as real adoption, commercial validation, or production readiness.
- Never invent human contributions, verification, commits, dates, or pre-event/event boundaries.

## Public project documentation

- Keep the root README focused on the user experience, features, usage and accurate availability. Keep event-specific review materials in hackathon/ and link to development evidence from there.

- Use English for public product copy, documentation, code identifiers and commit messages.
- Publish only project ideation, requirements, architecture, implementation, tests, design prompts and necessary AI/reuse disclosure. Do not publish prompt transcripts or conversational logs about hackathon submissions, rehearsal, narration or demo preparation; retain finalized deliverables and necessary artifact provenance.
- Do not publish personal preferences, language/timezone setup, unrelated interests, account or Git troubleshooting, or conversations about documentation privacy. Do not create public prompt/log records for those conversations.
- Do not record personal style, preferences or casual conversation with no material effect on project development in any file, including private notes, backups, prompts or collaboration logs.
- Reserve the ignored private/ directory for necessary local project material only. Do not automatically archive conversations. Never link to private material from public documents or stage it with git add -f.
- Before a commit, inspect staged paths and content for personal material. An ignore rule does not remove already tracked files or historical versions; handle those separately and do not claim otherwise.
- Preserve project-relevant original prompts and separately labeled translations. Label omissions from mixed prompts as excerpts or redactions, never complete verbatim input.

## Per-session records

1. Save only project-relevant instructions in sequential `prompts/NNNN-topic.md` files with context. Do not invent verbatim history.
2. For other AI tools, preserve actual submitted prompts and tool names. Store complete specifications and plans in `specs/` or `docs/`, link them, and preserve important revisions.
3. Update `collaboration/log.md`: date/timezone, phase, human contributions, AI contributions, outputs, verification, and open questions.
4. Update `collaboration/AI_USAGE.md` with generated/assisted file scopes and actual human review status.
5. Record actual decisions in `docs/decisions.md`; undecided proposals belong in the brief.
6. Register reused code, designs, assets, templates, and modules in `collaboration/baseline.md`: source, version, license, pre-existing scope, and event additions.

Record project facts, plans and artifacts. Exclude personal administration and setup conversations. Do not record publication preferences as public user prompts.

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

- Sources are in `hackathon/rules.md`. Check partner eligibility against the final product and Classic/Continuity route.
- Disclose AI assistance and actual human contributions. Preserve specs, prompts, and planning artifacts used in spec-driven development.
- Video: follow the current official rules in `hackathon/rules.md`: human-spoken audio, no music or AI voiceover, normal speed, 2–4 minutes and at least 720p. Upload the actual file to the project page and click Submit; a hosted video URL is not a substitute.
- Interrupted session/reload recovery verification is deferred to the next-version backlog; do not describe it as passed.
- Keep earlier demo exports identified as archives; distinguish final deliverables from rehearsal artifacts.
