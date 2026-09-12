# Landscapes and player exploration

Create a town in the setup screen and select Flat, Valley or Clouds. File configurations may include `"landscape": "valley"`; accepted values are `flat`, `valley` and `clouds`. Omitted values keep older backups in flat mode. The manifest preserves this setting on export. Appending a snapshot with a different landscape is rejected; choose another landscape by creating another town.

New collections receive compact, deterministic spiral plot assignments. Existing imported coordinates stay as supplied. Metric snapshots reuse positions. Changing the membership of an existing published collection remains unsupported by the current history contract; larger initial collections are supported up to the existing 200-project limit.

The welcome screen offers three independent sample towns. They demonstrate the same fictional projects in different landscapes; they are not a live setting that changes one published town's landscape.

## GitHub players

The profile control supports a page-memory GitHub token for direct browser access and avatars, including on static deployments. Optional Node OAuth uses `/api/auth/callback`; an OAuth-authenticated builder can publish their own town, while `GITHUB_ALLOWED_LOGIN` optionally grants administration. See the [current deployment guide](deployment.md).

All visits are stored only in the current browser, regardless of connection method. Reopening a card does not multiply progress. There is no cross-device synchronization or new server progress storage; existing private legacy files are not exported. Browser-token identity and repository requests do not require backend OAuth credentials. Mocked authentication tests do not validate a real provider login.

The five accepted building stages are fingerprinted in `public/models/buildings.lock.json`. `node scripts/verify-buildings.mjs` and the normal validation/build path check all ten GLBs. Terrain development must not update these fingerprints to bypass the human-approved asset lock.
