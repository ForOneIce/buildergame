# Authored buildings in the town

## Scope and dependencies

Use the existing Three.js 0.180 renderer and five original Blender assets. Preserve the complete house geometry and reserve 12 world units per logical plot, exceeding the 9.4-unit final courtyard. Logical coordinates and scoring remain unchanged. Add connecting streets on a continuous ground surface.

Author reduced-detail GLBs from the existing assets for distant views. Batch repeated mesh geometry using instancing; limit full-detail buildings to nearby plots. Retain the studio as the single-building reference.

## Observable acceptance

- The main demo shows authored buildings with connected streets and no overlapping complete courtyards on adjacent integer plots.
- All five appearances follow the existing stage mapping; missing data has a distinct placeholder.
- Zoom, pan, project signs, building visits, directory access and snapshot selection remain available.
- Snapshot changes do not move projects; late asset loads cannot restore older snapshot state.
- Loading failures are visible and retryable; disposal also handles pending loads.
- Inspect actual desktop and narrow-screen renders and measure representative larger collections. Report performance observations with their hardware limitations.
- Run TypeScript/build and existing data tests. Commit asset work separately from integration.

## Deferred

Player movement, interiors, embedded sites, geographic aggregation, new scoring rules and wallet integration.
