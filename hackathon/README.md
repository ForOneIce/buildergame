# Buildergame — hackathon review

This directory is the entry point for ETHOnline 2026 reviewers. For the product introduction, see the [main README](../README.md).

A 3D town where GitHub projects become houses that evolve with their recorded history. Designed for hackathon showcases and individual developers' public portfolios. Intended pilot: ETHOnline 2026. Basic viewing requires no wallet; ENS integration is deferred.

Human–AI collaboration is recorded from workspace preparation onward. A playable demo and final-submission materials are prepared locally; user requirements, AI proposals and verified results are recorded separately. Submission and hosted production have not been verified.

The checkout contains a **playable local Demo**: five accepted building appearances, flat/valley/cloud landscapes, floating map controls, project cards/minimap, bilingual personal/hackathon setup, direct browser GitHub capture, snapshots and portable backups. Exploration progress is browser-only. Towns start with a visual founding baseline and receive independent addresses; exported repository JSON produces static town pages. Optional Node OAuth supports immediate publication with private ownership checks. Exact executed checks and their revision scope are in [verification](../docs/verification.md). Real token/OAuth login and hosted production remain unverified; provider tests use fixtures. Sample data is fictional, actual event projects remain pending, and no adoption is claimed. See [deployment](../docs/deployment.md) and [current specification](../specs/0012-named-towns-and-static-snapshots.md).

The town owner controls growth: an event organizer or an individual developer. This pilot uses cumulative commits, stars and forks, with provisional AI-selected weights of 1, 3 and 6 respectively. These are not official ETHGlobal criteria. Inactivity does not reduce accumulated commit progress. The town is intended to support both fixed showcases and newly published snapshots. See the [Demo specification](../specs/0003-web2-demo.md) and [developer town proposal](../specs/0004-developer-towns.md).

## Directory map

```text
buildergame/
├── AGENTS.md                 # Collaboration policy
├── README.md                 # Project entry point
├── docs/
│   ├── brief.md              # Problems, candidates, and assumptions
│   ├── decisions.md          # Decisions and rationale
│   └── ideation/             # Proposals and feasibility reviews
├── specs/
│   ├── README.md             # Specifications and acceptance criteria
│   ├── 0001-town-timeline.md  # Draft timeline interaction
│   └── 0002-organizer-growth-rules.md
├── prompts/
│   ├── README.md             # Prompt recording conventions
│   ├── 0000-workspace-setup.md
│   ├── 0002-hackathon-town.md
│   ├── 0003-town-deployment-modes.md
│   ├── 0004-town-timeline.md
│   ├── 0005-organizer-growth-rules.md
│   └── 0006-cumulative-commit-growth.md
├── collaboration/
│   ├── log.md                # Inputs, contributions, outputs, verification
│   ├── AI_USAGE.md           # AI disclosure by file or module
│   └── baseline.md           # Pre-existing work and event additions
├── src/                      # Initial application implementation
├── tests/                    # Meaningful acceptance verification
└── hackathon/                # Review materials
    ├── README.md            # Reviewer introduction
    ├── rules.md             # Competition rules and sources
    ├── checklist.md          # Submission and partner requirements
    ├── summitinfo.md         # Copy-ready submission answers
    ├── media/               # Logo, cover and actual app screenshots
    └── demo-script.md       # Optional later live-demo script
```

## Current status

- Phase: final-submission preparation for the Web2-first Demo authorized in prompt 0007; the human has accepted and locked five building appearances. Sample mailbox interaction, control sounds and planner-only music are implemented; submission video excludes music.
- Current proposal: a Three.js hackathon town driven by curated event/project links and GitHub snapshots.
- Concept: Hackathon Town. Organizer-defined growth is confirmed as a product principle; Classic/Continuity route and partners are undecided.
- Outputs: collaboration records, feasibility review and a tested local Demo. No user-adoption validation or hosted production verification yet.
- Snapshot schema compatibility retains six scoring labels but renders five building appearances. Landscape and project membership are fixed for each town's history; larger initial collections generate larger layouts.
- Walking, building interiors, project-list sorting and the resident world map remain deferred. Three.js/Blender and Web2 GitHub integration are the implemented stack; no partner integration or on-chain deployment is claimed.

## Workflow

1. Save actual instructions in `prompts/` and update the problem brief.
2. Keep proposals and confirmed decisions distinct; preserve relevant reasons for changes.
3. Before implementation, write small specifications with observable acceptance criteria.
4. Update collaboration, AI disclosure, reuse boundaries, and actual verification after each session.
5. Commit meaningful work units. Never invent or backdate development history.

Project prompt records 0002–0007 preserve the concept, product decisions and Demo scope; 0010 covers developer portfolios and 0011 the product/reviewer documentation split. [0020](../prompts/0020-landscapes-and-player-ui.md) and [0021](../prompts/0021-automatic-town-generation.md) record the current landscape, player-interface and automatic-generation requirements.

## Entry points

- [Problem brief](../docs/brief.md)
- [Hackathon Town feasibility review](../docs/ideation/0002-hackathon-town-review.md)
- [Timeline interaction draft](../specs/0001-town-timeline.md)
- [Organizer-defined growth rules](../specs/0002-organizer-growth-rules.md)
- [Current landscape/player specification](../specs/0010-landscapes-and-player-ui.md)
- [Automatic-generation assessment](../docs/procedural-town-plan.md)
- [Landscape/player implementation and evidence](../collaboration/landscapes-player-ui.md)
- [Competition rules](rules.md)
- [Collaboration log](../collaboration/log.md)
- [AI disclosure](../collaboration/AI_USAGE.md)
- [Submission checklist](checklist.md)
- [Copy-ready submission sheet](summitinfo.md)
- [Logo, cover and screenshots](media/README.md)
- [Optional live-demo script](demo-script.md)

Final submission: **2026-09-13 16:00 UTC**.
Second check-in: **2026-09-11 03:59 UTC**.
