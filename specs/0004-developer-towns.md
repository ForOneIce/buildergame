# Developer towns

Status: user-proposed audience expansion; technical recommendations are provisional. Source: [project prompt](../prompts/0010-developer-towns.md).

Buildergame can present a curated collection of public GitHub repositories for either an event or an individual developer. A developer town is a portfolio visitors can explore and revisit through recorded history.

| Concern | Hackathon town | Developer town |
| --- | --- | --- |
| Curator | Event organizer | Individual developer |
| Collection | Curated event projects | Curated public repositories |
| Branding | Event name and introduction | Developer-selected town name and introduction |
| Building | One project per permanent plot | Same |
| Interaction | Builder sign, demo/repository and GitHub links | Same; projects may share a builder |
| History | Event and post-event snapshots | Portfolio snapshots |
| Growth policy | Organizer selects metrics and mapping | Developer selects metrics and mapping |

## Minimal implementation recommendation

- Reuse the manifest, renderer, snapshots, rules and static hosting. The existing contract permits the same builder across multiple projects.
- Treat the curator as the town owner, a configuration role rather than a new authentication system.
- Make event-specific interface copy configurable. ETHOnline 2026 remains the initial pilot, with its current provisional weights.
- Start with a manually curated public repository list. Do not automatically include every public repository.
- Preserve repository IDs and plots independently of list sorting. Profile links and project links remain distinct; ownership does not identify every contributor.
- Defer a second application, OAuth onboarding, private repository access and automatic account-wide imports.
- Current snapshot validation assumes a fixed project roster. Adding/removing repositories across history needs a later explicit policy; dynamic roster support is not implemented.

## Acceptance targets (not yet run)

- One application renders developer branding without implying event affiliation.
- Multiple projects share a builder while retaining distinct plots and destinations.
- Timeline and cumulative-growth behavior remain consistent across both use cases.
- Browsing and outbound interaction need no wallet or GitHub authorization.

## Value hypotheses

An individual can curate and try a town without organizer cooperation, potentially making initial testing easier. Portfolio maintenance may provide an ongoing reason to revisit it.

Compare with a GitHub profile README or conventional portfolio: can visitors find relevant work, and do owners keep the town updated? More repositories do not establish demand, repeat visits or willingness to pay. Repository metrics are not verified quality or adoption.
