# Specifications and acceptance criteria

The first draft is [0001-town-timeline.md](0001-town-timeline.md), based on the user's interaction proposal. Its implementation details and acceptance criteria remain unapproved. [0002-organizer-growth-rules.md](0002-organizer-growth-rules.md) records the user's growth-rule clarification. Use `0003-<feature>.md` for a subsequent specification.

Each specification should include:

1. User problem and links to decisions/prompts.
2. Smallest complete workflow and out-of-scope features.
3. Data, roles, permissions, and external dependencies.
4. The concrete role of Web3 and partner technology.
5. Observable acceptance criteria for normal and important failure paths.
6. Verification method and links to actual results.
7. Status: draft / confirmed / implementing / verified, with revision history.

Preserve actual specs, plans, and important revisions. Acceptance targets are not passing test results.

Current workflow increment: [0012 — Named towns and deliberate snapshot publication](0012-named-towns-and-static-snapshots.md), including browser-only exploration, persistent town addresses and static deployment boundaries.

Current optional support increment: [0016 — Optional Privy support for builders](0016-optional-privy-support.md), implemented for Ethereum Sepolia with 65 passing Node tests, scoped browser fixtures and a passing production build including the optional wallet bundle. Existing virtual mailbox interactions remain available without recipient configuration. Hosted and live-chain verification remain separate pending milestones; consult current verification before claiming a confirmed transfer.

Subsequent support refinement: [0017 — Submission lock and failure handling](0017-support-lock-and-failure-handling.md), implemented locally with critical-phase interaction locks, same-origin send coordination, validated pending recovery and creator/visitor acknowledgment. The later 77-test/build checkpoint and scoped browser fixtures passed before the shared-HUD correction; final integrated and live acceptance remain pending. [Exact evidence](../docs/verification.md#support-submission-lock-and-failures-0057).

Current interface correction: [0018 — Preserve the accepted town interface](0018-preserve-the-accepted-town-interface.md), sharing the established sample HUD with created towns while keeping optional-wallet entry and town-specific actions conditional. The source audit identified a pre-existing sample/non-sample layout split; corrective implementation and visual verification are separate from that diagnosis.

Previous interaction increment: [0013 — Sample-town mailbox coins](0013-sample-mailbox-coins.md), an implemented visual Easter egg with a future-support explanation. Scoped mailbox browser checks and the production build for that revision passed; human visual review remains pending.

Current audio increment: [0014 — Game UI interaction sounds](0014-ui-interaction-sounds.md), covering six verified free local clips, user-gesture audio unlock, click/map/hover feedback and a remembered mute preference. Asset/scoped browser checks and the final combined build passed; human listening review remains pending.

Companion camera refinement: [0015 — Sample-town default camera](0015-sample-town-default-camera.md) starts and resets all three sample landscapes at the previous fit view plus four zoom-in steps. Scoped camera checks and the final combined build passed, including unchanged non-sample fit; human visual acceptance remains pending.

Subsequent interaction refinements: [0048 mailbox target/cursor](0013-sample-mailbox-coins.md#cursor-refinement-0048) and [0049 planner-only supplied music](0014-ui-interaction-sounds.md#planner-music-0049). Five mailbox groups, seven planner-music groups, five existing audio fallback fixtures and the combined build passed; exact evidence is in [verification](../docs/verification.md). [Submission preparation](../hackathon/summitinfo.md), [media](../hackathon/media/README.md) and the [optional live-demo script](../hackathon/demo-script.md) track presentation materials. The initial feature recording contains no background music or added narration, with an extra no-audio export.
