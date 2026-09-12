# Reference-driven buildings and town exploration

Date: 2026-09-11. Status: partially delivered; walking, interiors, sorting and the world map are deferred while town visuals are reviewed. Source: project prompt 0013. Current landscape/HUD scope and acceptance are in [0010](0010-landscapes-and-player-ui.md).

## Scope

- Five visual states matching the supplied multi-view references: empty plot, stone foundation, timber/scaffold frame, blue-roof shell, furnished cream-roof home with porch and windmill.
- Continuous shared streets, sidewalks, greenery and plot detail. Larger collections create larger neighborhoods. Stored plot coordinates remain stable; new collections use a compact expanding grid.
- God view: orbit, pan, zoom, whole-town framing, minimap and building thumbnails. List sorting by name, commits, stars, forks and construction state does not move plots.
- Walking: first-person camera, WASD/arrows and touch controls, bounded movement, building collisions and doorway interaction. Entering the threshold opens a room/door transition and project visit panel. God-view clicks reach the same interaction.
- Project visits: sandboxed direct iframe where the destination permits embedding, with an always-available external link. GitHub uses a repository preview card and external interaction because it blocks framing. Do not proxy or remove destination framing restrictions, and do not claim iframe load proves third-party functionality.
- Resident world map: optional for non-personal collections only. Explicit setting controls GitHub public profile location retrieval. Manual region choice or coarse coordinates are supported. Missing/ambiguous locations remain unplaced. City-level pins cluster residents; region selection lists their projects.

## Compatibility and privacy

Existing score thresholds and historical data are not recalculated. Legacy cottage renders as shell; townhouse/decorated render as complete. This merges visual appearances only. Confirmed zero commits retains empty land; unknown observations do not become land.

Map settings and coarse public/manual locations are included in configuration and public backups only when enabled for a non-personal town. Location values are self-described or manually configured, not verified residence or real-time whereabouts. No browser geolocation, IP lookup or external geocoding service is used. A small explicit place dictionary handles recognizable cities; unmatched text is retained only when enabled and can be mapped manually.

## Implementation plan

1. Implement/test layout, sorting and opt-in location data contract.
2. Replace model factory with rounded textured modules; shared model templates and distance detail levels keep larger scenes practical.
3. Add walking, collision and door interaction, then map/list/preview UI in English and Chinese.
4. Verify data tests, both view modes, mocked permitted/blocked website previews, optional region filtering and desktop/mobile rendering. Preserve separate local implementation commits. Production build and real-site limitations must be reported accurately.
