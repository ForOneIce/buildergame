# Human–AI collaboration log

## 0012 — Playable island and UI verification

- AI: built reusable merged house geometry, blue shingle roofs, timber frames, island cliffs, greenery, signs, dock and cloud scenery; implemented bilingual welcome/setup/success/town screens, both collection modes, public viewing, capture, export/import, and deployment instructions.
- Browser verification: desktop 1440×1000 and mobile 390×844 journeys passed without page errors. Checked actual WebGL canvas, timeline, details, backup round trip, language switch, both setup/capture journeys (mocked capture transport), local reload and overflow. Fixed exposed hidden input, stretched avatars, cliff overlap and camera framing found during visual review.
- Real read-only GitHub smoke checks: public repository listing returned 36 repositories for the supplied account; a one-repository capture returned a fresh observation with cumulative count, default-branch reference and HEAD SHA. It was not published. OAuth with real credentials remains untested.
- TypeScript and eight data/API tests passed after these changes. Production build passed; a final build follows remaining documentation updates.

## 0012 — Data and authorization foundation

- Human: supplied visual references and requested personal/hackathon setup, bilingual UI, authorized public-repository capture, JSON backup and public visitor access.
- AI: implemented the Node API, GitHub OAuth state/session/allowlist, public REST metadata and cumulative history counts, snapshot capture, token-free bundle projection, import validation and CLI tools. Added fictional sample data and upgraded Vite after a dependency audit.
- Verification: eight Node tests passed, covering data/history integrity, stale observations, commit pagination, OAuth state, anonymous publication rejection, same-origin checks and public viewing. GitHub calls in these tests are mocked; real OAuth remains untested until deployment credentials are configured. TypeScript check passed before the pending browser pass.
- Local history: 05731c1 preserves completed product/reviewer documentation. Subsequent data and UI work is being committed in separate stages at the human's request.

## 0011 — Product README and reviewer guide

- Date: 2026-09-11.
- Human contribution: specified a user-facing project homepage and separate hackathon presentation directory.
- AI contribution: moved reviewer materials into hackathon/, wrote the root README around the town experience and usage, and updated links and documentation policy.
- Verification: relative-link and whitespace checks. Application tests not applicable to this documentation change; existing implementation limitations remain disclosed.

## 0010 — Developer portfolio use case

- Date: 2026-09-11.
- Human contribution: expanded the target audience to individual developers exhibiting public repositories.
- AI contribution: compared event/developer workflows, reviewed the existing data contract, drafted a shared-engine scope, and updated product positioning. Preserved the project-related prompt excerpt with a labeled translation.
- Outputs: prompt 0010, spec 0004, README, brief, decisions and AI disclosure.
- Verification: reviewed types and documentation links; no application code changed or new product acceptance tests performed. Developer-mode behavior remains unverified.

## 0007 — Demo scaffold

- Date: 2026-09-11.
- Human: chose ETHOnline 2026, commits/stars/forks weight ordering, deferred ENS, reusable Web2 base.
- AI: wrote Demo spec before initial code; generated Three.js renderer, timeline/directory UI, data validation, styling, configuration and English submission text. Updated README to disclose incomplete status.
- Verification: implementation tests and build remain pending.
- Pending: complete sample data and scripts, install dependencies, test/build and visual verification, actual event list/art, human review. No push, deployment or user validation performed.
- Tools: Codex shell and apply_patch. No other AI design tools used.

Record actual inputs, contributions, and verification; planned work is not completed work.

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

## 0002 — Review Hackathon Town

- Date: 2026-09-11.
- Phase: ideation and assessment.
- Human contribution: conceived a Three.js town linking events, repositories, builder profiles, activity-driven house models, and viewer interactions.
- AI contribution: researched the existing showcase and GitHub REST limits; assessed feasibility, incentive risks, costs, chain boundaries, sponsor fit, and validation; produced a feasibility review.
- Sources: existing HackathonGalacticShowcase README and official GitHub rate-limit page retrieved today; partner pages reviewed earlier in this conversation.
- Outputs: prompt 0002, feasibility review, and updated project/AI/reuse/decision records.
- Verification: all local links in 16 Markdown files resolved and git diff --check passed. No implementation, performance test, pilot interview, or user retention measurement performed.
- Open questions: pilot, data mapping, display policy, reuse/track, assets, and partner choice.
- References: [Input](../prompts/0002-hackathon-town.md), [review](../docs/ideation/0002-hackathon-town-review.md).

## 0003 — Refine organizer deployments and presentation modes

- Date: 2026-09-11.
- Human contribution: specified self-deployed, event-branded towns, deployment-time game versions, fixed editions and live monitoring, and visual building evolution.
- AI contribution: recorded and translated the refinement; separated deployment versions from data snapshots; proposed persistence, stable plots, and clear change comparisons.
- Outputs: prompt 0003, review section 13, and updated status/decision/AI records.
- Verification: local links in all 17 Markdown files resolved and git diff --check passed. No product code, deployment, or user validation.
- Input: [0003-town-deployment-modes](../prompts/0003-town-deployment-modes.md).

## 0004 — Fixed plots and timeline transitions

- Date: 2026-09-11.
- Human contribution: specified permanent project plots and town-wide timeline transitions to make changes visible.
- AI contribution: drafted snapshot/version semantics, transitions, stable identity, policy consistency, accessibility, and proposed acceptance criteria.
- Outputs: original prompt with English translation, draft timeline specification, and updated cross-references.
- Verification: local links in all 19 Markdown files resolved and git diff --check passed. Product acceptance criteria remain untested.
- References: [Input](../prompts/0004-town-timeline.md), [draft](../specs/0001-town-timeline.md).

## 0005 — Organizer-defined growth rules

- Date: 2026-09-11.
- Human contribution: clarified that each organizer's values determine growth; custom scores require complete repository mapping before deployment.
- AI contribution: corrected prior assumptions, specified commits/stars/custom sources and validation, and removed conflicting current recommendations.
- Outputs: prompt 0005, growth-rule specification, reconciled review/timeline, and updated records.
- Verification: all local links in 21 Markdown files resolved; git diff --check passed; conflicting current metric-separation recommendations were reconciled. No product code or acceptance tests.
- References: [Input](../prompts/0005-organizer-growth-rules.md), [specification](../specs/0002-organizer-growth-rules.md).

## 0006 — Cumulative commits preserve buildings

- Date: 2026-09-11.
- Human contribution: clarified historical total commits and rejected the implied inactivity/abandonment mechanic.
- AI contribution: corrected recent-window wording and recorded persistent cumulative growth with empty-versus-unavailable data handling.
- Outputs: prompt 0006 and updated specs, review, policy, and project records.
- Verification: local links in all 22 Markdown files resolved and git diff --check passed. No product code or acceptance tests.
- Input: [0006-cumulative-commit-growth](../prompts/0006-cumulative-commit-growth.md).
