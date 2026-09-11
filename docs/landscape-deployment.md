# Landscapes and player exploration

Create a town in the setup screen and select Flat, Valley or Clouds. File configurations may include `"landscape": "valley"`; accepted values are `flat`, `valley` and `clouds`. Omitted values keep older backups in flat mode. The manifest preserves this setting on export. Appending a snapshot with a different landscape is rejected; choose another landscape by creating another town.

New collections receive compact, deterministic spiral plot assignments. Existing imported coordinates stay as supplied. Metric snapshots reuse positions. Changing the membership of an existing published collection remains unsupported by the current history contract; larger initial collections are supported up to the existing 200-project limit.

The welcome screen offers three independent sample towns. They demonstrate the same fictional projects in different landscapes; they are not a live setting that changes one published town's landscape.

## GitHub players

Use the existing GitHub OAuth app credentials and callback `/api/auth/callback`. Player login uses `/api/auth/login?role=player` and requests no extra GitHub scopes. Any GitHub player may sign in, but only `GITHUB_ALLOWED_LOGIN` can publish. The client sees the public login and avatar, never the access token.

Guest visits are stored in this browser. Signed-in visits also synchronize for the town published on this deployment. Account-scoped progress files live under `PLAYER_DATA_DIR` (default `private/players`) and must be on persistent private storage for server restarts and cross-device access. The API stores a deduplicated list of viewed project IDs; reopening a card does not multiply progress. Imports, alternative local samples and deployments without OAuth keep local progress. The UI distinguishes local from synchronized storage. Backend OAuth credentials are required for real login; mocked tests do not validate a production OAuth setup.

The five accepted building stages are fingerprinted in `public/models/buildings.lock.json`. `node scripts/verify-buildings.mjs` and the normal validation/build path check all ten GLBs. Terrain development must not update these fingerprints to bypass the human-approved asset lock.
