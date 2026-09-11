# Hackathon Town — feasibility and product review

- Date: 2026-09-11.
- Status: AI assessment of a user-originated idea; not an approved specification or implementation plan.
- Working title: Hackathon Town. Neither branding nor competition track is confirmed.
- Input: [Original idea and translation](../../prompts/0002-hackathon-town.md).

## 1. Assessment

A feasible small MVP combines a curated event/repository manifest, cached GitHub snapshots, a lightweight Three.js town, project detail cards, and ordinary outbound links. Browsing needs no wallet or GitHub login.

The strongest proposition is continued project discovery after an event. A 3D presentation may attract an initial visit, but sustained attention, builder motivation, organizer adoption, and willingness to pay remain hypotheses. Public repositories provide initial content, not an existing audience.

Recommend proceeding to a small validation prototype, conditional on scope selection. Do not build a full farming game, universal GitHub reputation score, marketplace, or multi-chain platform first.

## 2. Relationship to existing work

The user's [HackathonGalacticShowcase](https://github.com/ForOneIce/HackathonGalacticShowcase) README was retrieved on September 11. It describes a hackathon project showcase with an immersive cockpit, project details, demo links, previews, and bilingual UI. Its stated stack is React, TypeScript, Tailwind, Motion, and Vite; this does not establish existing Three.js experience or reusable 3D assets.

New proposed capabilities are periodic repository snapshots, visible progress over time, organizer-configured displays, and optional verifiable event/project association.

- No existing project code or assets have been imported into buildergame.
- Reusing project-specific code/designs/assets requires an appropriate Continuity route and disclosure.
- A new repository alone does not establish From Scratch eligibility.
- The showcase README declares CC BY-NC-SA 4.0. Before reuse, clarify rights and licenses, including third-party components/assets. A public repository is not automatically permissively licensed.
- Requirements learned from previous experience do not by themselves establish that implementation has been copied.

## 3. Users, value, and retention

| Audience | Useful task | Return trigger | Payment hypothesis |
| --- | --- | --- | --- |
| Organizer | Curate one event and see which projects remain active | A weekly post-event update | Hosting, branding, curation, exports; unvalidated |
| Builder/team | Keep the demo and status visible without repeated form entry | A release or progress update changes the house | Basic listing should be low-friction; payment unvalidated |
| Viewer | Discover and try interesting projects | A visible 'changed since last visit' view | No clear reason to charge for browsing |

Minimum retention mechanism: show what changed since a previous snapshot, link to the underlying release/commit, and make towns/project cards shareable. A digest is a future opt-in feature, not an instruction to send messages now.

Actual project usage is not measured by stars. Outbound demo clicks are a proxy, and do not prove the demo was used or that a viewer became a customer. A mature project may remain useful with few recent commits.

## 4. MVP scope

Proposed first deployment: one event, 20–50 curated public repositories, one named representative per project plus optional team members, three house stages, two visual signals, and daily refreshes.

### Included

- JSON or CSV manifest with validation and a preview before publication.
- Cached server-side GitHub metadata and timestamped snapshots.
- Fixed, stable plot positions and an orthographic/isometric town.
- Sign click opens an accessible HTML card with project/representative information.
- Explicit 'Try demo', 'Open repository', and 'View builder' actions.
- Optional house click opens a validated HTTP(S) demo URL, falling back to the repository.
- Stars/follow actions open GitHub, where the viewer performs the action.
- Search, keyboard access, a list/card view, reduced-motion support, loading/error states.
- A source/timestamp display and separation of official, community-curated, and unverified associations.
- Optional single-chain registry only after the core discovery experience works.

### Deferred

- Automatic OAuth-based starring/following, payments, tokens, NFTs, daily quests, and farming economics.
- Realtime updates, full GitHub history scans, universal contributor identity inference.
- Multiplayer, first-person movement, procedural world generation, user-uploaded 3D models.
- Arbitrary screenshot services, embedded third-party demo pages, and automatic scraping of every hackathon platform.
- Scoring code quality, security, revenue, or verified maintenance effort from public activity counts.

## 5. GitHub data model and limitations

| Data | Practical source/handling | Caveat |
| --- | --- | --- |
| Repository name, description, stars, forks, homepage, archived/fork flags | Repository metadata | Counts are cumulative and are not quality or user metrics |
| Avatar, bio, follower count | Explicitly chosen representative's user profile | An organization owner is not a person; ownership is not team membership |
| Cumulative commits | Historical total under an explicit repository/reference definition, captured per snapshot | Not a rolling activity window; pagination/truncation or failures must not be reported as a complete zero/smaller total |
| Releases | Release metadata if within scope | Not all useful projects publish GitHub releases |
| Event association | Organizer submission, official showcase link, or curator manifest | A URL alone does not prove participation or organizer endorsement |
| Demo URL | GitHub homepage with an explicit curator override | Nonempty URL does not prove a working or safe demo |

Use stable repository IDs alongside owner/name to handle renames where possible. Distinguish deleted, private, unavailable, empty, archived, and rate-limited repositories. Keep the last good snapshot and show staleness instead of downgrading a building on a failed request.

Record source identity, fetch timestamp, window, and calculation version. Store an initial observation snapshot. Historical star growth cannot be derived from a current star count alone; do not invent a pre-event baseline.

Built-in commits mode follows the user's cumulative-history rule; do not silently limit it to event-only additions. Reuse disclosure for the buildergame competition submission is a separate requirement. The other sources are stars and organizer-provided custom scores. See section 6.

### API limits and request budget

[GitHub's official REST rate-limit documentation](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), checked September 11, states:

- Unauthenticated: 60 requests/hour per source IP.
- Typical authenticated user requests: 5,000 requests/hour, shared with other activity under that user.
- Secondary limits also apply, including concurrency and endpoint request constraints; do not rely on the primary quota alone.
- Follow rate-limit/reset/retry headers and use backoff.

Illustrative budget, not a measured implementation: 100 repositories at roughly three requests per repository and one refresh per day is about 300 requests/day, before pagination, initial profile requests, releases, retries, or shared-token use. Four refreshes/day is about 1,200 requests/day. Bound additional pagination explicitly.

Do not fetch all repositories independently for every visitor. Use a backend/scheduled job, bounded concurrency, conditional requests where applicable, and shared snapshots. Keep credentials server-side and out of manifests, browser bundles, and Git history.

## 6. Organizer-defined progression

**Updated after the user's clarification in [prompt 0005](../../prompts/0005-organizer-growth-rules.md).** Earlier AI recommendations about mandatory separation of development and attention, normalization, or universal progression are superseded.

The organizer chooses the values represented by the town:
- Commit-count growth uses cumulative historical commits, as clarified in [prompt 0006](../../prompts/0006-cumulative-commit-growth.md). No new commits preserves the building; only a confirmed zero-commit repository is an empty plot.
- Star-based growth uses GitHub stars.
- A custom scoring system supplies a complete repository-to-score table before deployment.

The platform maps the selected values to the organizer's configured house stages. It does not impose another scoring philosophy or reinterpret commit count as active days.

Scores can remain hidden; model appearance is the chosen presentation. An optional description can explain the organizer's emphasis, but no separate score dashboard is required.

Custom-table validation checks repository coverage, duplicates, numeric validity, and model mapping. It does not judge the organizer's criteria. For dynamic custom-score history, each new score-table version produces a snapshot.

See [the current growth-rule specification](../../specs/0002-organizer-growth-rules.md). Stable plots and saved historical versions remain part of the timeline interaction.

## 7. Optional on-chain layer

Public data alone does not require a blockchain. A useful optional purpose is a verifiable, portable statement of event/project association and a versioned public manifest.

Proposed minimal record:

- Event ID and canonical event URL.
- Curator/organizer address and explicitly stated verification status.
- Manifest URI, canonical content hash, and version.
- Registration/update events with timestamps.

Batch project associations in the manifest to reduce writes. A hash verifies retrieved bytes; it does not store those bytes or make them available forever. Persist or pin the manifest separately, retain backups, and define updates/corrections. Direct URL storage is possible but should be small and versioned.

Keep changing GitHub metrics, avatars, biographies, and contact information off-chain. A curator-signed association is a claim by that curator until organizer authority is established. A transaction timestamp does not prove the GitHub data is correct or that the named event officially endorsed the registry.

Visitors require neither wallets nor signatures. An organizer/curator signs when publishing or updating an optional registry. No chain writes for every view, star, commit, or refresh.

## 8. Partner fit

These assessments use the official prize pages reviewed earlier in this conversation on September 10. They are not fresh partner approvals.

| Partner | Fit for the current idea | Required substantive addition | Recommendation |
| --- | --- | --- | --- |
| ENS | Conditional, strongest natural fit | ENSv2 Sepolia event/project namespaces, real resolution, delegated record editing, organizer-to-builder handoff/revocation | Consider as the sole primary partner if these solve a real product task |
| The Graph | Weak for a plain GitHub town | A real chain index plus either meaningful standardized/composable Graph products, or an actual AI data use case | Do not add a token Subgraph query solely for a prize |
| Chainlink | Conditional for a Continuity automation feature | CRE fetches relevant data and changes an on-chain registry/workflow state | Secondary only if an attestation/update workflow is genuinely needed |
| Bazantic | Conditional for a later agent-facing API | Gateway, reusable Recipe, and the relevant multi-service or controlled comparison evidence | Defer until a useful town API exists |
| Privy | Weak | Current prizes require real financial workflows, not just embedded wallet login | No current prize fit |
| Arc, Uniswap, 1inch | Weak | Finance, trading, or the specifically required protocols would materially change the product | Do not force into scope |
| Hedera, World, Ledger | Weak for the current core | Their actual prize conditions go beyond storing links, displaying identities, or generic AI use | Do not select without a separately justified feature |

### ENS details

[ENS prizes](https://ethglobal.com/events/ethonline2026/prizes/ens):
- Best Use of ENSv2: $4,500 prize pool.
- ENSv2 integration into an existing project: $500, explicitly Continuity.
- Must use ENSv2 on Sepolia; the integration must be central and functional.

Possible demo: an organizer creates a namespace, delegates a project's demo record to its builder, the builder updates the endpoint, and a revoked account fails to update it. Resolve the entry from the name in the application. Exact ENSv2 roles/APIs require a technical spike; a name is not permanent storage for the town or profiles.

[The Graph prizes](https://ethglobal.com/events/ethonline2026/prizes/the-graph): its data products query blockchain data; they do not automatically fetch GitHub metadata. A plain single-Subgraph query does not meet the composability/standardization track. AI tracks require meaningful live Graph data use or reusable tooling.

[Chainlink prizes](https://ethglobal.com/events/ethonline2026/prizes/chainlink): an existing-project upgrade must produce an actual blockchain state change. Public GitHub metrics do not inherently need a Confidential Workflow; do not manufacture a confidentiality use case.

No requirement to fill all three partner slots. A useful non-prize-aligned product can still be worth building; prize selection is separate from user value.

## 9. Cost and engineering budget

Planning estimates only, not current vendor quotes or measured performance:

| Cost | Small pilot assumption | Main risk/control |
| --- | --- | --- |
| Hosting, scheduled fetches, snapshot storage | Roughly $0–20/month for 20–100 repos and low traffic, depending on free-tier terms | Bandwidth, image traffic, compute, and growth may exceed this; avoid per-view refresh |
| GitHub metadata | No paid data service assumed; use published API quotas | Pagination, retries, and shared credentials |
| 3D assets | Procedural low-poly models or properly licensed free assets | Asset creation and visual iteration likely exceed data-integration effort |
| Blockchain | Testnet demo; organizer-only batched writes | Production gas, naming, RPC, and persistent storage depend on deployment; not priced here |
| Operations | Curating identities/links, corrections, uptime, API changes | Public data does not remove moderation and maintenance work |

Start with three reusable house models and two decorations. Use shared geometry/materials, instancing where useful, compressed assets, limited shadows, and a fixed camera. Set an explicit initial asset budget and test on a target phone before expanding the town.

Stars/follows occur on GitHub and are not blockchain transactions. The primary cost-saving design is cached data plus wallet-free viewing.

## 10. Materials the user should prepare

1. One pilot event and a contact who can confirm the listing or act as curator.
2. A list of 20–50 repositories with an official entry link where available.
3. Explicit project-to-representative/team mapping; do not infer it from repo ownership alone.
4. Short project taglines, demos, categories, and rules for missing/broken URLs.
5. A simple structured import format (JSON/CSV); fields are listed below.
6. A visual reference and asset licenses; settle on an original low-poly style rather than copying Stardew Valley assets.
7. One organizer-selected growth mode: commits, stars, or a complete custom-score table, plus house-stage boundaries.
8. A decision on reuse of the older showcase and the competition route.
9. One organizer and several builders/viewers willing to try a pilot; no actual interviews have happened.
10. A decision on whether organizer-controlled portable namespaces are valuable enough to justify ENS.

Suggested manifest fields:
- Event: id, title, canonicalUrl, startsAt, endsAt, curator, authorityStatus.
- Project: id, repositoryUrl, submissionUrl, titleOverride, tagline, demoOverride, representativeLogin, memberLogins, category.
- Display: profileId, version, scoreSource, commitScope where applicable, customTable reference where applicable, and house-stage boundaries.
- Separate generated snapshot: repositoryId, counts, effectiveScore, visualStage, capturedAt, dataStatus, sourceWindow, and scoring configuration version.

The event definition is an input. Metrics are generated data; keep them out of hand-edited fields.

## 11. Acceptance and validation proposal

No checks below have been performed.

- Import one manifest and render a stable town of 20–50 distinct projects.
- Show unknown/stale data explicitly when a repository query fails.
- Navigate to a project, read the card, and open its demo without a wallet.
- Provide the same discovery task via a keyboard-accessible list.
- Compare two actual snapshots; show an accurately attributed change.
- If snapshots are simulated to demonstrate growth, clearly label the simulation and do not claim observed post-event retention.
- If using ENS, demonstrate actual delegation, resolution, and revoked-write failure on Sepolia.
- Test whether an organizer can import/edit a manifest without developer intervention.
- Observe whether viewers find a relevant project quickly; measure clicks and return visits only with an appropriate, minimal analytics setup.
- Collect feedback on how clearly the visualization communicates the organizer's selected criteria. Any scoring changes remain the organizer's decision.

Suggested demand test: one organizer, three builders, and five viewers. These are proposed participants, not users already acquired.

## 12. Proposed build order

With roughly two and a half days until submission as of this review:
1. Confirm pilot data, product sentence, track, and reuse boundary.
2. Build import → cached snapshot → list/card → outbound demo flow.
3. Add a lightweight town with a stable layout and minimal assets.
4. Add a prior-snapshot change view and optional organizer-authored description.
5. Add ENS only if namespace delegation is a confirmed product need and the technical spike succeeds.
6. Reserve time for phone/keyboard checks, README, partner evidence, and the human-narrated video.

Do not perform a chain integration before the core discovery flow works. No implementation has been authorized or started by this review.

## Sources

- [Original idea](../../prompts/0002-hackathon-town.md)
- [Existing showcase](https://github.com/ForOneIce/HackathonGalacticShowcase) — README retrieved 2026-09-11.
- [GitHub REST limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) — retrieved 2026-09-11.
- [Event partner prizes](https://ethglobal.com/events/ethonline2026/prizes) — reviewed earlier in this conversation.
- [General event rules](https://ethglobal.com/rules)

## 13. User refinement: organizer-deployed towns with two modes

Recorded from [prompt 0003](../../prompts/0003-town-deployment-modes.md). These direction requirements were specified by the user after the initial assessment; implementation details below are AI proposals.

### Product identity

A reusable, organizer-deployed repository template. Each deployment belongs to one event and uses that event's name in the opening sequence. A centrally operated directory is not required for the first product.

The visual composition of project buildings produces the event's cityscape. Returning viewers should be able to identify projects whose observable public activity or milestones changed.

### Two modes

| Mode | Published output | Data refresh | Useful occasion |
| --- | --- | --- | --- |
| Snapshot showcase | A fixed, dated event edition | Only on deliberate publication of another edition | Closing ceremony, recap, archived exhibition |
| Live town | A persistent dashboard of project evolution | Scheduled snapshots, proposed default daily | Post-event follow-up and repeat discovery |

A snapshot edition is a supported finished product, not a failed live deployment. A later snapshot edition can be published deliberately. A live deployment needs persistent snapshot storage; ephemeral runtime memory is insufficient.

### Version and data timestamps

User requirement: use deployment time as the displayed game version.

Proposed display:
- Town version: `v20260911-094500Z` (illustrative UTC deployment timestamp, not an actual deployment).
- Data as of: a separate GitHub snapshot timestamp.
- Historical edition/source revision: retain a commit reference in metadata if useful.

Generate the deployment timestamp once per deployment; do not change it per page view or GitHub refresh. The same deployed game version may show many data snapshots. A redeployment may initially use the same latest snapshot.

### Make evolution perceptible

Proposed interaction:
1. Skip or shorten the event-title opening after the first visit; respect reduced-motion preferences.
2. Keep each project on a stable plot across snapshots.
3. Show a subtle change marker on buildings that crossed a milestone or changed visual state.
4. Provide a 'Since your last visit' summary with the period shown explicitly.
5. Let viewers inspect project details; scores can remain hidden. Building changes follow the configured commits, stars, or custom scores.
6. Offer previous/current snapshot comparison when a meaningful visual transition would otherwise be missed.

A first-time visitor has no personal prior snapshot. Show a clearly dated town-wide comparison instead of claiming they previously visited. Persist an anonymous last-seen snapshot reference locally, while retaining the actual comparison snapshots server-side. If either baseline is unavailable, state that limitation. Do not fabricate past growth.

Use the organizer's selected score source and house-stage mapping. Metric separation is optional rather than mandatory. Avoid rebuilding the street layout as scores change, because viewers then lose the location of familiar projects. Fixed plot envelopes can support different house sizes without collisions.

### Organizer preparation and operating costs

Proposed configuration additions:
- `event.title`, subtitle, logo, official URL, theme.
- `mode: snapshot | live`.
- `deploymentVersion` generated at deployment.
- Snapshot source and, for live mode, refresh cadence and persistence configuration.
- Organizer-selected growth source and house-stage mapping, with an optional description.
- Opening animation enabled/skippable settings.

Snapshot mode can be served as static assets with a bundled snapshot and has no required periodic API job. Live mode adds a scheduler, server-side credentials, persistent snapshots, error handling, and monitoring. Provide deployment instructions for each mode rather than assuming that every organizer can configure a backend.

The user-facing city should explain an activity-based representation, not certify objective code quality or effort. Organizer branding does not prove organizer identity; imported data still needs clear attribution.

### Refined validation

- Can an organizer rename and deploy a town from configuration without changing application code?
- Does a snapshot build work without exposing a GitHub token to viewers?
- Does a live town retain historical comparisons across restarts and redeployments?
- Can a returning viewer recognize what changed without memorizing counts?
- Is the same information available through a list and keyboard navigation?
- Does one organizer choose to publish a second edition or keep live refresh enabled?

No deployment, implementation, or user test has yet been performed.

## 14. User refinement: timeline transitions

The user added a whole-town timeline with fixed project plots and visible transitions between versions. This makes historical comparison an explicit interaction. See [prompt 0004](../../prompts/0004-town-timeline.md) and the [draft specification](../../specs/0001-town-timeline.md). The proposed implementation distinguishes recorded data changes from changes in organizer weights, layout, or artwork.
