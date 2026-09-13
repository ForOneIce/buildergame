# Buildergame — final submission sheet

Prepared for ETHOnline 2026. The optional Privy extension is implemented locally in `315f65d`, with 77 passing Node tests, scoped browser fixtures and a production build completed before the subsequent shared-town HUD correction. The wallet revision is not yet pushed or deployed; real Privy login and a confirmed Sepolia transfer remain pending. The copy below describes implemented code and identifies the remaining verification milestones. Use the answers matching the revision actually submitted.

## Short description

A living 3D home for GitHub builders to showcase projects, share progress, and grow together.

## Description

Buildergame gives builders and their projects a place to belong. It transforms public GitHub repositories into a cozy, explorable 3D town, making a portfolio or hackathon community feel like a neighborhood people want to visit again. The idea begins with a simple problem: after demo day, promising projects are easily buried in repository lists. What if following their progress felt like returning to a familiar little town?

Every repository has a permanent plot. Five building appearances grow from green land into a furnished garden home, while recorded snapshots let visitors travel through the town's history and see what has changed. Town owners choose the growth values that matter to their community: cumulative commits, stars, a weighted combination of commits/stars/forks, or their own score table. Builders keep the progress they have already earned.

Individual developers can create a home for their public projects; hackathon organizers and communities can bring many builders together. Visitors explore flat streets, a valley or cloud neighborhoods, open wooden signs to meet creators, discover projects through the directory and minimap, and follow links to the work itself. Personal and community planning, GitHub data capture, snapshot playback, portable JSON backups, static deployment, and English/Chinese interfaces form the working demo.

The broader vision is to turn discovery into lasting participation. Our optional Privy-powered support extension starts with native test ETH on Ethereum Sepolia. A personal town can nominate its builder's receiving address; a community can configure a separate recipient for each participating project. Visitors can sign in by email or connect a wallet, review the recipient, network and amount, and explicitly confirm a transfer directly to the builder. The mailbox celebrates only a successful chain receipt. Clear notices, acknowledgment, repeat-send guards and pending-transaction recovery support this flow. Projects without recipients keep their playful virtual coins, so each creator decides how support belongs in their community. Local implementation and automated checks are complete; live login, transfer and deployment verification are the next milestone.

Wallet/ENS identity, community membership and town-management permissions remain future directions. On-chain milestone records could also preserve the relationship between an event, its projects and their continuing progress.

Buildergame starts by making creation visible and inviting. It aims to grow into a place where attention, encouragement and community support help builders keep building long after a hackathon ends.

## How it's made

Buildergame uses TypeScript, Three.js 0.180.0, Vite 7.3.6 and Node.js. HTML, CSS and original SVG components create a shared interface of wooden controls, kraft-paper planning sheets, cream project cards and translucent teal panels.

The five accepted building appearances were authored with reproducible Blender Python scripts and exported as GLB files. Each has a full-detail and a distant model. The renderer combines instanced distant assets with a bounded number of detailed nearby buildings. Deterministic layout code generates terrain, roads, water and cloud districts from the town's initial roster. All ten building files are protected by SHA-256 checks. Six scoring labels remain for schema compatibility, with the last two sharing the final visual appearance.

Repository capture is separate from rendering. Shared GitHub REST transport gathers public repository and builder data, handles pagination, cancellation, timeouts, rate limits and unavailable observations, then stores deliberate snapshots in validated JSON. Personal-access-token connection runs directly in the browser; the token stays in page memory and is excluded from URLs, backups and persistent storage. An optional Node service supports OAuth and owner-checked publication.

Town snapshot JSON committed to `public/data/towns/` produces physical `/towns/<name-and-timestamp>/` pages during the build, supporting static hosting such as Vercel. This keeps project history portable and lets organizers manage it through their own repository. Optional recipient configuration has a separate publication boundary that is still being finalized. Browser storage remembers exploration progress, and an all-land founding snapshot makes the first measured version replayable.

Native Web Audio plays six locally hosted Kenney CC0 interface effects. A single lazy HTMLAudioElement loops a supplied Suno track quietly on the planner only and shares the mute control. The submission recording excludes background music. The mailbox prototype combines a Three.js raycast target, contextual coin cursor, animated delivery and a demo receipt to make builder support tangible within the town.

The optional support layer uses Privy's React SDK in an on-demand React island, preserving the main TypeScript/Three.js application. Standard Email/Wallet login supports embedded or connected wallets. Native Sepolia test ETH goes directly to the configured builder recipient, with no custody contract or platform transaction fee. Personal towns use one recipient; community towns map recipients to repositories. Creator/login notices and a fresh per-transfer acknowledgment precede explicit approval. Recipient addresses are shortened by default with full review and copy available. Critical signing and pending states lock unrelated controls; Web Locks and public localStorage checkpoints coordinate participating tabs on the same origin. Recovery checks the original transaction instead of automatically resending. Receipt sender, destination, value and success checks gate the existing coin animation. Local controller and real-React/mock-SDK browser fixtures have passed; actual Privy login and chain evidence remain separate verification work. ENS identity and community permissions remain on the roadmap.

Codex assisted with specifications, research, implementation, Blender authoring scripts, tests and documentation. The human supplied the concept, growth policy, visual references, acceptance of the five building stages and successive interaction revisions.

## Technology selections

| Form field | Current answer |
| --- | --- |
| Ethereum developer tools | Ethers.js; Privy React SDK 3.42.0. viem supplies chain definitions/SDK support and can be listed under Other if absent from the dropdown |
| Blockchain networks | Optional extension targets Ethereum Sepolia, chain ID 11155111; live transaction verification pending |
| Programming languages | TypeScript, JavaScript, Python; HTML/CSS for the interface |
| Web frameworks | Main app: TypeScript/DOM. Optional wallet panel: React 19.3.0. Vite is the build tool |
| Databases | None; JSON snapshot files and browser local storage |
| Design tools | Blender; human-supplied reference artwork |
| Other technologies | Three.js, GitHub REST API, Node.js, GLB/glTF, Web Audio API, Git, Playwright, FFmpeg; viem 2.56.0 in the optional wallet extension |

The core stack and optional wallet code are implemented. A listed SDK/network is not evidence of a successful transaction. Reconcile selections with the final installed code and actual verification. ENS, Solidity, custom contracts, onramps and gas sponsorship are not part of this increment.

## AI tools disclosure

Codex assisted with product and technical research, English documentation and translations, specifications, application code, procedural Blender Python scripts, original SVG/interface work, tests and browser verification. The human originated Buildergame's concept, defined organizer-owned growth rules, supplied visual references, accepted and locked the five building appearances, and directed visual and interaction revisions. The reference-image generation tool and prompts have not been supplied, so no specific model is claimed for those images.

The human supplied the Suno-generated track "Miniature Sky" and its musical style prompt. Codex integrated it only into the Create town page; the demo recording excludes background music. The Suno account plan and generation-rights evidence have not been independently verified, and the track is not labeled CC0. Kenney interface artwork, cursors and six sound effects are reused CC0 assets with source and license records. Video capture shows the actual application; no generated feature footage or TTS/AI voiceover is used.

See [AI disclosure](../collaboration/AI_USAGE.md), [human–AI log](../collaboration/log.md), [reuse baseline](../collaboration/baseline.md), [prompts](../prompts/README.md), [specifications](../specs/README.md) and [NOTICE](../NOTICE).

## Partner prizes

**Current candidate: Privy — Best financial flow.** [Official prize page](https://ethglobal.com/events/ethonline2026/prizes/privy). This aligns the optional wallet extension with the project's actual goal: helping visitors support the builders they discover. The relevant prize requires a functional financial flow using Privy wallets. A wallet icon, provider mock, future plan or virtual coin animation does not by itself demonstrate that requirement. Verify the final prize wording and Classic/Continuity conditions against the submitted revision; no award or eligibility is guaranteed.

### How are you using this Protocol / API?

Current accurate text while live integration is being verified:

> Buildergame integrates Privy's React SDK as an optional wallet layer for developer-support mailboxes. Standard Email/Wallet login supports an embedded wallet or a connected external wallet. Town creators configure one personal recipient or explicit per-project community recipients. Visitors review a native Sepolia test-ETH transfer, acknowledge its risks and explicitly approve it; support goes directly to the builder, and a matching successful receipt triggers the coin celebration. The implementation adds critical-state interaction locks and receipt-only pending recovery while preserving virtual mailboxes in unconfigured projects. Local configuration, transaction-controller and mock-SDK browser checks have passed. Real Privy login and confirmed chain evidence are the next verification step.

### Link to the line of code where the tech is used

The wallet implementation and notices/recovery refinement are recorded in local commit `315f65dc39a67c8dcf3f4f2274abb6946af25696`. The following exact permalinks were checked against that local commit, **but it has not yet been pushed; verify they open on GitHub before pasting them into the form**:

- [Privy embedded-wallet transfer through useSendTransaction](https://github.com/ForOneIce/buildergame/blob/315f65dc39a67c8dcf3f4f2274abb6946af25696/src/support/wallet-panel.tsx#L143)
- [PrivyProvider, email/wallet login and embedded Sepolia configuration](https://github.com/ForOneIce/buildergame/blob/315f65dc39a67c8dcf3f4f2274abb6946af25696/src/support/wallet-panel.tsx#L304)
- [Receipt verification before confirmed feedback](https://github.com/ForOneIce/buildergame/blob/315f65dc39a67c8dcf3f4f2274abb6946af25696/src/support/transaction.mjs#L206)

Implementation locations for review: [Privy provider and wallet panel](../src/support/wallet-panel.tsx), [lazy panel entry](../src/support/panel.ts), [transaction lifecycle](../src/support/transaction.mjs) and [public recipient validation](../src/support-config.mjs). Embedded Privy wallets use the SDK's `useSendTransaction`; connected external wallets use their EIP-1193 provider. An external-wallet-only test must not be labeled proof of an embedded Privy-wallet transfer.

### Integration evidence

| Evidence | Current status |
| --- | --- |
| Scope and lifecycle acceptance | [Optional Privy specification](../specs/0016-optional-privy-support.md) |
| Implementation commit and line links | Local wallet commit `315f65d`; exact links prepared above, remote push/reachability pending |
| Automated behavior / compatibility / failure tests | 77/77 Node tests including 28 transaction fixtures; four React/mock-SDK panel groups, four loading-wrapper groups and three page-lock groups passed. Production build passed before the later HUD-only edit. [Exact evidence and timing](../docs/verification.md#creator-and-visitor-notices-0059) |
| Shared sample/actual-town interface | Six desktop/mobile sample/actual/configured variants passed layout parity, followed by map and support browser regressions. Actual towns omit landscape tours; camera rules and locked models are preserved |
| Hosted opted-in town | Pending deployed configuration and verification |
| Live Privy session and Sepolia receipt | Pending; add the real explorer link only after confirmation |
| Updated no-music competition demo | Record after functionality and live-flow checks; current published videos predate this extension |

Test ETH has no monetary value. A successful test-network receipt validates that demonstrated flow, not mainnet readiness or real financial support received by a builder.

### Next release sequence

1. Complete the combined release checks, then verify an actual Privy login and Sepolia transfer, including rejection and pending recovery.
2. Finalize recipient configuration delivery, publish the tested revision, and verify the deployed town and source links.
3. Record the updated music-free demonstration from that verified revision, then refresh the form's evidence and media links.

Wallet/ENS identity, community permissions and on-chain milestones remain subsequent product directions. This sequence is the current development plan, not a claim that deployment, recording or partner eligibility is already complete.

### Ease-of-use rating and sponsor feedback

Leave the numerical rating and experience feedback for actual integration observations. Do not prefill a perfect score or invented developer experience. Record concrete SDK/setup issues and improvements after testing, then write the final answer from those observations.

**ENS remains a roadmap item.** There is no implemented ENS evidence in this increment; do not claim it as a used protocol or describe the Privy integration as ENS usage. Select only partner technologies actually integrated in the submitted revision.

## Links and images

| Item | Prepared value or action |
| --- | --- |
| Project name | Buildergame |
| Repository | https://github.com/ForOneIce/buildergame |
| Live project URL | [buildergame-two.vercel.app](https://buildergame-two.vercel.app/), as listed in the repository's public metadata; HTTP 200 and Buildergame title checked |
| Video | [Direct video URL](https://buildergame-two.vercel.app/demo/buildergame-demo-no-music.mp4) — 3:07, 1280×720, interface audio without music |
| Silent alternative | [Direct silent video URL](https://buildergame-two.vercel.app/demo/buildergame-demo-silent.mp4) — identical video with no audio stream |
| Square logo | [buildergame-logo.png](media/buildergame-logo.png), 512×512; [SVG source](media/buildergame-logo.svg) |
| Cover | [buildergame-cover.png](media/buildergame-cover.png), 1280×720, composed from an actual house capture |
| Screenshot 1 | [Homepage](media/01-homepage.png), 1920×1245 |
| Screenshot 2 | [Town planning](media/02-town-planning.png), 1920×1508; an unsubmitted example draft |
| Screenshot 3 | [Sample town and project card](media/03-sample-town-project.png), 1920×1080; fictional sample project |

Images and both finished videos are included in the repository. The video files in `public/demo/` are served directly by the static deployment after this revision builds. [Media provenance](media/README.md), [video files](../public/demo/README.md) and [verification](../docs/verification.md) record preparation and export checks. Confirm the direct URL opens before pasting it into the form.

The currently linked competition video and still images show the earlier town demo; they do not constitute Privy transaction evidence. Prepare replacement demonstration footage after functionality is tested. Retain original site interface sounds and exclude added background music. Any English presentation script is separate from the actual recorded narration and must not be treated as permission for AI/TTS competition narration.

## Video requirements

The supplied requirements state **2–4 minutes**, **at least 720p**, and **"Audio without music."** The main export shows the working interface with interaction effects and no background music. The extra silent export removes its audio stream completely. This initial feature demo does not add narration; an [optional English live-demo script](demo-script.md) is kept for later use.

The earlier unconditional human-narration statement was an interpretation, not a literal rule. Recorded guidance says not to play music with explanatory text instead of talking, and not to use TTS/AI voiceover. Do not speed up footage to fit the limit. See [rules and source boundaries](rules.md).

中文简注：当前提交视频以实际功能演示为主，不加背景音乐；另备无音轨版。英文讲稿留待后续现场演示使用。

## Before submission

- Verify video metadata, playback and screenshots against the current build; actual evidence belongs in [verification](../docs/verification.md).
- Upload the video, square logo, 16:9 cover and at least three screenshots. Paste only real public links into the form.
- Confirm team, check-ins, Classic/Continuity route and final prize choices in the Dashboard.
- Review the noncommercial source-available [license](../LICENSE) against competition source requirements. It is not an OSI-approved open-source license; no eligibility ruling is claimed.
- Confirm the final submitted revision and success before the recorded deadline, **2026-09-13 16:00 UTC**.
