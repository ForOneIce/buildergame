# Foundation example — 2026-09-11 (UTC)

Human input: the sample town was missing the second construction stage. [Original instruction and scope](../prompts/0019-sample-foundation.md).

AI contribution: added the fictional First Bricks project at a new fixed plot (0, 2), with 2/5/8 cumulative commits, 0/1/2 stars and zero forks across the three sample snapshots. Scores 2/8/14 produce the foundation stage under the unchanged default rule. Updated `src/sample.mjs` and `public/data/town.json`. The prior eight projects, plots and recorded metrics remain unchanged. No real GitHub activity is claimed.

Verification: one-off assertions checked the existing eight projects and records against the previous JSON, unchanged rules and all five appearances in the latest snapshot. `node scripts/validate.mjs` passed (nine projects, three snapshots); all seven `tests/data.test.mjs` tests passed. A targeted Chrome check confirmed stage sequence 1,3,4,5,5,5,5,5,2, the First Bricks foundation directory entry, detail focus and no page errors. Codex inspected the rendered foundation screenshot. Human visual acceptance is pending.

Reuse: existing sample generator, scoring contract and stage-2 GLB. No new asset, library or dependency. Renderer and scoring code were not changed.
