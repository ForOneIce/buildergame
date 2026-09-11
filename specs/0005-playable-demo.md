# Playable town, authorization and snapshot publishing

Status: implementing. Source: project prompt 0012. Date: 2026-09-11.

## Authorized scope

- Interpret design/ reference images into procedural Three.js island, blue-roof timber houses, fences, signs, greenery and a navigable town.
- English default and Chinese toggle throughout setup and exploration.
- Personal mode: deployer GitHub login, paginated public repositories, selection and batch snapshot capture.
- Hackathon mode: multi-owner repository list through UI or configuration file.
- Snapshot success leads into exploration. Published snapshots are public to visitors without login.
- Export portable JSON backups for inclusion in the deployment repository; import restores history. Export never contains credentials.

## Architecture and boundaries

- Vite + TypeScript + Three.js UI; Node HTTP API shared between Vite dev middleware and the production static server.
- GitHub confidential OAuth web flow: state in a short-lived HttpOnly SameSite cookie, server-side token exchange, in-memory expiring session and deployer-login allowlist. No repo-write scope, no token in browser storage or exports. Configured callback and same-origin mutation checks.
- OAuth requires the deployer to register a GitHub OAuth app and configure local environment secrets; no real OAuth success can be claimed without that configuration.
- Public GitHub preview supports a credential-free trial with lower rate limits. Only the allowed authenticated deployer can publish a server snapshot. A public preview remains local until exported and deployed as a static JSON file.
- REST public repository metadata + full default-branch commit history count (per_page=1 pagination total), captured HEAD SHA. Failed observations remain unknown/stale and are never fabricated as zeros.
- One published town per deployment. Atomic on-disk bundle, appended historical snapshots, public GET endpoint and portable file fallback. OAuth does not grant arbitrary visitors publication rights.
- Separate sample gallery (fictional metrics), draft configuration, successful capture and published version. Fixed roster when appending; changing the collection starts a distinct town unless restored from its full backup.
- No automatic Git commits or GitHub repository writes. Export JSON and document where the deployer commits it. A static deployment supports viewing/import/export; OAuth and data capture require the Node service.

## Verification plan

Test schema validation, full commit counting, stale handling, historical integrity, stable plots, token-free exports, OAuth state/cookies, publish authorization and cross-origin rejection. Run TypeScript/build, Node tests and desktop/mobile browser journeys covering both modes, translations, sample timeline, import/export and public viewing. Mock GitHub only for automated tests and identify this boundary in verification records.

## Visual implementation

References are supplied by the human; image-generation model and exact prompts have not been provided. Use them as references, not a flat screenshot substituted for the interactive scene. Build timber beams, roof tiles, stone foundations, chimneys, lit windows, flower boxes, island cliffs, footpaths and a central gathering space as reusable geometry. Keep resource disposal and reduced-motion behavior; use HTML list controls as a keyboard alternative.
