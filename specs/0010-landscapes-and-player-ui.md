# Landscapes and player exploration

## Scope

Freeze the accepted five high- and low-detail GLBs with SHA-256 fingerprints. Terrain and UI may change; architectural geometry, materials and garden dimensions may not.

Persist `landscape: flat | valley | clouds` in each town manifest. Missing values mean flat for older backups. Validate configuration/imports and reject landscape changes when appending snapshots to the same town. New towns can choose their mode in setup or configuration files. Provide separate fictional sample towns for visual comparison.

Use deterministic fixed plot transforms. Flat mode has uniform elevation and concrete streets; valley mode uses flat building pads joined by smooth slopes, gravel paths, mountains and water; cloud mode groups plots into elevated districts, with soft cloud platforms and staggered cloud steps. Growth updates never move a plot. Reuse Three.js and batch scenery by material.

Follow `design/map_en.png` for a full-screen scene with upper-left logo, left navigation, upper-right profile/statistics, exploration panel, lower-left explorer card and lower-right clickable minimap. Preserve bilingual copy, keyboard project access, camera controls and timeline. Follow `design/info.png` for the sign-triggered project card. Show actual available project statistics, not invented currency or levels.

Extend existing GitHub OAuth with a player flow that accepts visitors and returns to the town. Keep deployer publishing restricted to the configured account. Use public avatar data; tokens remain server-side. Guest exploration is local; authenticated progress can synchronize for the deployed town and persists on private disk. Show truthful local/synced status. No wallet or payments.

## Acceptance and checks

- Fingerprints of all accepted GLBs remain unchanged.
- Three terrain modes render distinct scenery and their fixed coordinates survive snapshot changes.
- File configuration round-trips and attempts to change established landscape fail.
- Player login cannot grant publishing rights; state checks, account isolation and persisted progress are tested with mocked GitHub responses. Real OAuth needs configured credentials and is reported separately.
- Inspect actual desktop and mobile screenshots of all three landscapes and project cards. Verify minimap focus, visited counts, reload persistence, language switching and existing sample timeline.
- Build and relevant data/API tests pass. Make incremental local commits; do not push.
