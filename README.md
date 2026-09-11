# buildergame

Workspace for ETHOnline 2026. The product name, topic, technical stack, and competition track remain undecided.

Created on 2026-09-11 (Asia/Shanghai, UTC+8). Human–AI collaboration is recorded from workspace preparation onward. Product ideation has not started in this workspace.

> 中文提示：英文为主，中文仅作辅助说明；选题尚未确定。

## Directory map

```text
buildergame/
├── AGENTS.md                 # Collaboration and language policy / 协作约定
├── README.md                 # Project entry point / 项目入口
├── docs/
│   ├── brief.md              # Problems, candidates, and assumptions
│   ├── rules.md              # Official sources, deadlines, and eligibility
│   ├── decisions.md          # Decisions and rationale
│   └── ideation/             # Proposals and feasibility reviews
├── specs/
│   ├── README.md             # Specifications and acceptance criteria
│   └── 0001-town-timeline.md  # Draft timeline interaction
├── prompts/
│   ├── README.md             # Prompt recording conventions
│   ├── 0000-workspace-setup.md
│   ├── 0001-language-policy.md
│   ├── 0002-hackathon-town.md
│   ├── 0003-town-deployment-modes.md
│   └── 0004-town-timeline.md
├── collaboration/
│   ├── log.md                # Inputs, contributions, outputs, verification
│   ├── AI_USAGE.md           # AI disclosure by file or module
│   └── baseline.md           # Pre-existing work and event additions
├── src/                      # Implementation after scope selection
├── tests/                    # Meaningful acceptance verification
└── submission/
    ├── checklist.md          # Submission and partner requirements
    └── demo-script.md        # 2–4 minute, human-narrated demo
```

## Current status

- Phase: ideation; reviewing the user's Hackathon Town concept. No implementation scope has been approved.
- Current proposal: a Three.js hackathon town driven by curated event/project links and GitHub snapshots. Earlier candidate interests remain in the brief.
- Product, Classic/Continuity route, and partners: undecided.
- Outputs: collaboration scaffolding and a feasibility review; no product code, product test results, or user validation.
- Participation: acceptance and check-ins have not been verified in the Dashboard.
- Language: English first with brief Chinese notes. Original user prompts retain their language and receive separately labeled English translations.
- History: local Git initialized; setup commit `0b573c4`. No remote publication.

## Workflow

1. Save actual instructions in `prompts/` and update the problem brief.
2. Keep proposals and confirmed decisions distinct; preserve relevant reasons for changes.
3. Before implementation, write small specifications with observable acceptance criteria.
4. Update collaboration, AI disclosure, reuse boundaries, and actual verification after each session.
5. Commit meaningful work units. Never invent or backdate development history.

The next collaboration record is **0005**; records 0002–0004 capture the town concept, deployment modes, and timeline interaction. The directory structure supports the work and does not prescribe product features.

## Entry points

- [Problem brief](docs/brief.md)
- [Hackathon Town feasibility review](docs/ideation/0002-hackathon-town-review.md)
- [Timeline interaction draft](specs/0001-town-timeline.md)
- [Competition rules](docs/rules.md)
- [Collaboration log](collaboration/log.md)
- [AI disclosure](collaboration/AI_USAGE.md)
- [Submission checklist](submission/checklist.md)

Final submission: **2026-09-13 16:00 UTC / 2026-09-14 00:00 Beijing**.
Second check-in: **2026-09-11 03:59 UTC / 2026-09-11 11:59 Beijing**.
Verify personal status in the official Dashboard.
