# Automatic town growth: evaluated options

Primary sources inspected through public GitHub repository metadata and README endpoints on 2026-09-11:

| Approach | Fit | Trade-off |
| --- | --- | --- |
| Authored district modules assembled by deterministic rules | Recommended for all three styles; preserves the accepted buildings and controls composition | Requires a small original road/bridge/cloud kit and explicit connector rules |
| [THREE.Terrain](https://github.com/IceCreamYou/THREE.Terrain) | MIT terrain library: heightmaps, seeded noise, smoothing, material blending and vegetation scattering; useful for valleys | Building pads, road slope constraints and stable district assignment still need application logic; compatibility/performance must be tested before import |
| [ProbableTrain/MapGenerator](https://github.com/ProbableTrain/MapGenerator) | Procedural road/city maps, controllable generation, PNG/SVG/STL export | American-style road networks differ from miniature fantasy scenery; LGPL-3.0; evaluated, not imported |
| [WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse) | Constraint-based selection of compatible tiles; useful for decorative variants | Local adjacency does not alone guarantee global road access. Contradictions/retries need handling; re-solving can disturb stable project locations. Repository license metadata was NOASSERTION; not imported |
| Blender-authored full town per input | Strong control of one static exhibition | Needs a generation worker/Blender runtime for each new input, produces larger unique assets and complicates browser-only/static deployment |

Recommended hybrid: author reusable landscape pieces in Blender where shape detail matters; arrange districts, plot pads, streets, water and cloud stairs with Three.js. The current implementation can use original code-native landscape primitives while the accepted house GLBs stay locked. AI image generation is not required for each deployed town.

## Stable growth contract

Creation-time configuration should include landscape mode, generator version and deterministic seed. Persist project-to-plot/district assignments and any generated route choices. A seed by itself is insufficient: changing input order, the algorithm or its version can alter generated results. Sort/filter UI must not affect assignment.

Grow by adding districts at reserved connectors. Existing districts remain fixed; new projects fill available slots before creating another district. For example, 6–9 plots per authored district could make a 9-project village, a 27-project group of three districts, or a 90-project set of ten districts. These are illustrative capacities, not implemented product limits. Cloud districts use elevation and stair connectors; valley districts use flat pads and bounded road slopes; flat districts share one elevation.

The current data contract rejects changing a collection inside an existing town's snapshot history. Supporting later additions/removals within that same town requires a versioned membership/assignment migration; it must not silently renumber repositories or pretend missing observations are empty land. The immediate visual iteration supports automatic size at town creation and stable positions across metric snapshots. Incremental collection growth is a distinct follow-up contract change.

Generate layout during setup/capture (or once at initial browser load for a static bundle), save the layout with the backup when route choices become nontrivial, and render cached results for visitors. Use instancing, distance detail and eventually district streaming for large collections. Existing 200-project checks are a prototype limit, not proof of arbitrary-size performance.
