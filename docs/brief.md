# Problem brief

Status: playable local Web2-first Demo with public repository capture, two setup modes, bilingual UI and snapshot export. Five accepted building appearances are locked; current implementation adds flat/valley/cloud landscapes, floating controls/cards/minimap and guest/GitHub player progress. Current build/browser checks passed; human review of the new town composition remains pending. See [verification](verification.md) for evidence and limits. ETHOnline 2026 is the intended pilot; competition route remains undecided.

## Product priorities

- Current visual requirement: make entrance, setup, success and town interactions feel like the same game. [Shared interface proposal](../specs/0011-shared-game-interface.md) and [reusable UI research](ui-kit-research.md) are under review; the proposed palette and asset selections are not yet accepted.

- Build practical value with a chance of continued use after the hackathon.
- Consider willingness to pay and maintenance costs; prizes and integrations alone are not validation.
- Reduce wallet, signing, and transaction friction for people unfamiliar with Web3.

## Fill during ideation

- Target users: event organizers, individual developers curating public portfolios, and visitors discovering their projects.
- Current alternatives and limitations: unvalidated.
- User versus payer: unvalidated.
- First potential test participant: unidentified.
- Smallest complete workflow: event town, project discovery and recorded timeline. ENS is deferred.
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
- Pending: actual event project data, town-composition review, production verification and competition route. Building references and five accepted appearances are now available. Pilot and metric ordering are set in prompt 0007.

## User refinement: deployment modes

The user specified organizer self-deployment with event-name branding in the opening animation, a deployment-time game version, a fixed post-event showcase mode, and a continuously updated town mode. Evolving project buildings form the cityscape and should make change visible to returning visitors.

Reference: [prompt 0003](../prompts/0003-town-deployment-modes.md). The Demo now keeps build and data timestamps separate and displays recorded snapshot history; `live` viewing polls published data but does not itself schedule new GitHub captures.

## User refinement: visible town history

The user specified fixed project land positions and a town-wide update timeline. Switching versions should produce a visible transition between historical scenes. See [prompt 0004](../prompts/0004-town-timeline.md) and the [draft interaction specification](../specs/0001-town-timeline.md). Snapshot persistence and animation details were proposed by AI; initial Demo implementation is now authorized in prompt 0007.

## Current clarification: organizer authority over growth

The user explicitly assigns growth criteria to each organizer. Commits or stars can directly drive house stages. A custom scoring system requires a complete repository-to-score mapping supplied before deployment. Earlier AI proposals for mandatory separation or adjustment of metrics are superseded.

See [prompt 0005](../prompts/0005-organizer-growth-rules.md) and [the current specification](../specs/0002-organizer-growth-rules.md). The Demo implements cumulative commits, stars, weighted commits/stars/forks and complete custom-score tables.

## User clarification: accumulated construction remains

Commits mode uses cumulative historical totals. With no new commits, the existing building stays unchanged under the same mapping. A confirmed empty repository with zero commits may render as empty land. Recent activity, rolling scoring windows, and inactivity decay are not part of this requirement.

Source: [prompt 0006](../prompts/0006-cumulative-commit-growth.md).

## Current refinement: stable landscapes and project discovery

The next-version [Web3 discussion](ideation/0043-web3-support-options.md) considers optional mailbox tips and delegated community records. The human requested discussion before development; no wallet, chain or partner integration is selected.

The human accepted the five building appearances and redirected the visual iteration to scenery and interaction. Organizers choose flat ground with concrete streets, a valley with water/gravel paths, or cloud districts at creation; subsequent snapshots retain that landscape and project locations. The game uses floating map controls, a searchable project list, minimap and sign-opened project cards. Exploration progress stays in the visitor's browser. GitHub connection adds an avatar and repository selection; direct browser tokens are supported without a backend. Named towns and static snapshot publication are defined in [specification 0012](../specs/0012-named-towns-and-static-snapshots.md).

The current generator expands the initial town's extent with collection size. More detailed reusable district modules and adding projects to an existing history are separate proposals, described in [the generation assessment](procedural-town-plan.md). Walking/interior visits, dimension-based list sorting and the optional resident world map are deferred requirements from [prompt 0013](../prompts/0013-town-exploration.md), not available app features. See [0020](../prompts/0020-landscapes-and-player-ui.md), [0021](../prompts/0021-automatic-town-generation.md) and [implementation evidence](../collaboration/landscapes-player-ui.md).
