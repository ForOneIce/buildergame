# Buildergame 🏡

**Your repos. Your town. A place for everything you build.**

Turn a collection of GitHub projects into a little 3D neighborhood. Each repository gets a house, each builder gets a sign, and recorded snapshots let visitors travel through the town's history.

Build a home for your public portfolio, or bring a whole hackathon community together on one map.

[Explore the idea](#a-town-you-can-explore) · [Make-it-yours workflow](#make-it-yours) · [Development status](#development-status) · [Hackathon review](hackathon/README.md)

> **Under construction.** The first Demo is in development. The current checkout is not yet a complete runnable app; the experiences below describe the intended product, with implementation status listed below.

## A town you can explore

**Give every project an address.** Repositories keep their own plots. A small experiment and a long-running project can sit side by side, each with a door into what its builder made.

**Watch the neighborhood change.** Move between recorded snapshots while the town stays in place. A timber frame becomes a cottage. A familiar house gains another storey. Return to an earlier snapshot to see how it looked then.

**Meet the people behind the houses.** Select a wooden sign to discover a project and its builder. Visit the demo, explore the code, or head to GitHub to star a repository or follow its author.

| In the town | What it represents |
| --- | --- |
| 🏡 A house | A GitHub repository |
| 📍 A permanent plot | The project's place across snapshots |
| 🪧 A wooden sign | Project details and builder profile |
| ⏳ The town timeline | Previously recorded versions of the neighborhood |
| 🌱 A changing building | Progress under the town owner's chosen rules |

The building palette runs from **open land → foundation → timber frame → cottage → townhouse → garden house**. Owners choose how data maps to those appearances. Buildings are a visual expression of those rules, not a universal quality rating.

## What will your town be?

**A developer's portfolio.** Choose the public repositories you want to share. Give visitors a place to explore your experiments, tools and ongoing work—and a reason to come back.

**A hackathon neighborhood.** Put participating projects on a shared map. Publish a snapshot after demo day, or keep adding observations so people can follow what happens next.

Both use the same core idea: a curated collection, fixed plots, project links and visible history.

## Make it yours

The planned setup is a small configuration workflow:

1. **Name your town.** Add a title and introduction for your portfolio or event.
2. **Choose your neighbors.** Supply a curated list of public GitHub repositories, builder profiles and optional demo links.
3. **Choose what shapes the houses.** Use cumulative commits, stars, a weighted mix of commits/stars/forks, or your own complete score table.
4. **Record a moment.** Capture repository observations as a snapshot. Earlier snapshots keep their recorded appearance.
5. **Share the town.** Self-host a fixed showcase, or publish new snapshots to keep the timeline growing.

The basic experience is designed to work without wallets. Star and follow links take visitors to GitHub, where they choose whether to perform the action.

### Growth at your pace

- **You choose the rules.** A portfolio and an event can express different priorities.
- **Taking a break does not erase construction.** With the same cumulative commit total and mapping, a house stays the same.
- **Missing data is not empty land.** Failed observations retain the last known state or show that data is unavailable.
- **History starts when it is recorded.** Today's star count cannot reconstruct what a repository had last month.

## Development status

| Area | Current state |
| --- | --- |
| Three.js town and procedural houses | Initial code written; browser verification pending |
| Timeline, project directory and detail cards | Initial code written; end-to-end verification pending |
| Growth rules and snapshot validation | Shared data contract written; tests pending |
| Sample town data and GitHub snapshot capture | Pending |
| Developer-specific branding | Planned; current interface still contains event-oriented copy |
| Final artwork and hosted Demo | Pending |

**Running locally:** setup is not ready yet. Required sample data and capture/validation scripts are missing, and installation/build have not been verified. A working quick start will be added with the first complete Demo.

## For builders

Built with **TypeScript, Three.js and Vite**. The implementation keeps repository data, growth rules and house models separate so the town can change its look without rewriting its history.

| File | Start here to… |
| --- | --- |
| [src/town.ts](src/town.ts) | Explore the 3D scene and replace procedural house models |
| [src/model.mjs](src/model.mjs) | Understand growth rules and snapshot validation |
| [src/main.ts](src/main.ts) | Explore the timeline, directory and project interactions |
| [src/types.ts](src/types.ts) | Inspect the configuration and snapshot data shapes |
| [src/links.ts](src/links.ts) | Understand project destinations |

Feedback on project discovery, town visuals and the portfolio workflow is welcome in [Issues](https://github.com/ForOneIce/buildergame/issues).

Competition materials, development provenance and AI disclosure are collected in the [hackathon review guide](hackathon/README.md).
