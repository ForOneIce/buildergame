# Problem brief

Status: ideation in progress. The user proposed Hackathon Town on 2026-09-11 and requested an assessment. No implementation scope or competition track is approved. Earlier candidates below remain background.

> 中文提示：区分用户需求、AI 建议与待验证假设。

## Explicit user priorities

- Build practical value with a chance of continued use after the hackathon.
- Consider willingness to pay and maintenance costs; prizes and integrations alone are not validation.
- Reduce wallet, signing, and transaction friction for people unfamiliar with Web3.
- The user has one Solidity hackathon experience and confirmed `web3-FTW` was that submission.
- Use English for this international competition, with brief Chinese notes.

## Candidate directions

| Direction | Reported problem | Questions to validate |
| --- | --- | --- |
| Small-event formation and refunds | Fragmented announcements, attendance counting, go/no-go decisions, payment handling | Which task costs organizers the most time? What payment methods can participants use? |
| Voice and accessible coding-AI interaction | Reduce visual dependence with speech input, status narration, and audio feedback | Who are the initial users? Which visual or manual task matters most? |
| Web3 vulnerability reproduction tools | Environment setup, reproduction, and confidential materials are difficult for beginners | What is the first vulnerability and environment? Can a beginner complete it independently? |

Community admission was discussed but has not been included in a selected proposal. Proof of a live human, gender, and community eligibility are distinct claims; a selfie credential must not be presented as proof of actual gender.

## Fill during ideation

- Target user and one concrete problem: undecided.
- Current alternatives and limitations: unvalidated.
- User versus payer: unvalidated.
- First potential test participant: unidentified.
- Smallest complete workflow and out-of-scope features: undecided.
- Why the chosen Web3 technology is needed: to establish.
- Partner and specific prize: undecided.
- From Scratch versus Continuity, including reuse scope: undecided.
- Dependencies, timing risks, and alternatives: to assess.
- User validation results: none.

## Current user proposal: Hackathon Town

A Three.js town maps hackathon repositories to houses. Structured event manifests, periodically fetched GitHub metrics, organizer-selected display priorities, builder signs, and demo/repository links make projects discoverable after the event. An optional on-chain record preserves the asserted event/project association.

- Origin: the user's own concept, recorded in [prompt 0002](../prompts/0002-hackathon-town.md).
- User-requested assessment: feasibility, preparation, appropriate sponsors, cost, and acceptance.
- Evidence of potential reuse: the existing HackathonGalacticShowcase README describes an immersive React project showcase; no source or assets have been copied.
- AI recommendations, not confirmed: one event, 20–50 projects, cached daily snapshots, three house stages, a list fallback, wallet-free viewing, and conditional ENSv2 integration. The earlier metric-separation proposal was superseded by the user's organizer-defined growth requirement in session 0005.
- Important assumptions: the town creates repeat visits; builders welcome metric-based appearance; organizers will curate and may pay. None has been tested.
- Full review: [Hackathon Town](ideation/0002-hackathon-town-review.md).
- Next decisions: pilot event, initial data set, metric definitions, reuse/track choice, and whether ENS namespace delegation solves a real need.

## User refinement: deployment modes

The user specified organizer self-deployment with event-name branding in the opening animation, a deployment-time game version, a fixed post-event showcase mode, and a continuously updated town mode. Evolving project buildings form the cityscape and should make change visible to returning visitors.

Reference: [prompt 0003](../prompts/0003-town-deployment-modes.md). AI proposes separate deployment/data timestamps and persistent snapshot comparison; these technical details remain unapproved.

## User refinement: visible town history

The user specified fixed project land positions and a town-wide update timeline. Switching versions should produce a visible transition between historical scenes. See [prompt 0004](../prompts/0004-town-timeline.md) and the [draft interaction specification](../specs/0001-town-timeline.md). Snapshot persistence and animation details are AI proposals; no implementation is authorized.

## Current clarification: organizer authority over growth

The user explicitly assigns growth criteria to each organizer. Commits or stars can directly drive house stages. A custom scoring system requires a complete repository-to-score mapping supplied before deployment. Earlier AI proposals for mandatory separation or adjustment of metrics are superseded.

See [prompt 0005](../prompts/0005-organizer-growth-rules.md) and [the current specification](../specs/0002-organizer-growth-rules.md). Technical configuration and implementation remain pending.
