# Buildergame — final submission sheet

Prepared for ETHOnline 2026. The application is public on GitHub and deployed on Vercel; the homepage and sample-town interface were checked online. The latest suite passed 82 Node tests, including 33 transaction fixtures, and 21 compact-wallet browser scenarios; the combined production build passed. Production checks verified real Privy login, the insufficient-funds guard, funded review and a human-approved 0.001 Sepolia test-ETH transfer with a matching successful receipt, independently checked on Sepolia Etherscan. A separate final-preview cancellation restored interaction without a second transfer. The current priority is the replacement spoken video. Interrupted session/reload recovery is explicitly deferred to the [next-version backlog](../docs/backlog.md) and remains unverified. The fields below reflect this checkpoint.

## Short description

A living 3D home for GitHub builders to showcase projects, share progress, and grow together.

## Description

Buildergame gives builders and their projects a place to belong. It transforms public GitHub repositories into a cozy, explorable 3D town, making a portfolio or hackathon community feel like a neighborhood people want to visit again. The idea begins with a simple problem: after demo day, promising projects are easily buried in repository lists. What if following their progress felt like returning to a familiar little town?

Every repository has a permanent plot. Five building appearances grow from green land into a furnished garden home, while recorded snapshots let visitors travel through the town's history and see what has changed. Town owners choose the growth values that matter to their community: cumulative commits, stars, a weighted combination of commits/stars/forks, or their own score table. Builders keep the progress they have already earned.

Individual developers can create a home for their public projects; hackathon organizers and communities can bring many builders together. Visitors explore flat streets, a valley or cloud neighborhoods, open wooden signs to meet creators, discover projects through the directory and minimap, and follow links to the work itself. Personal and community planning, GitHub data capture, snapshot playback, portable JSON backups, static deployment, and English/Chinese interfaces form the working demo.

The broader vision is to turn discovery into lasting participation. We have implemented an optional Privy-powered support extension, starting with native test ETH on Ethereum Sepolia. A personal town can nominate its builder's receiving address; a community can configure a separate recipient for each participating project. In a wallet-enabled deployment, visitors can sign in by email or connect a wallet, review the recipient, network and amount, and explicitly confirm a transfer directly to the builder. The mailbox celebrates only a verified successful chain receipt. Concise notices, acknowledgment, repeat-send guards and pending-transaction recovery support this flow. The sample town demonstrates the playful coin animation; configured towns connect that interaction to builder support. Each creator decides whether to enable wallets for their community. The deployed town, live Privy login, insufficient-funds guard, a human-approved Sepolia transfer with a matching successful receipt, and cancellation before submission are verified. Interrupted session/reload recovery remains unverified and is deferred to the next version.

Wallet/ENS identity, community membership and town-management permissions remain future directions. On-chain milestone records could also preserve the relationship between an event, its projects and their continuing progress.

Buildergame starts by making creation visible and inviting. It aims to grow into a place where attention, encouragement and community support help builders keep building long after a hackathon ends.

## How it's made

Buildergame uses TypeScript, Three.js 0.180.0, Vite 7.3.6 and Node.js. HTML, CSS and original SVG components create a shared interface of wooden controls, kraft-paper planning sheets, cream project cards and translucent teal panels.

The five accepted building appearances were authored with reproducible Blender Python scripts and exported as GLB files. Each has a full-detail and a distant model. The renderer combines instanced distant assets with a bounded number of detailed nearby buildings. Deterministic layout code generates terrain, roads, water and cloud districts from the town's initial roster. All ten building files are protected by SHA-256 checks. Six scoring labels remain for schema compatibility, with the last two sharing the final visual appearance.

Repository capture is separate from rendering. Shared GitHub REST transport gathers public repository and builder data, handles pagination, cancellation, timeouts, rate limits and unavailable observations, then stores deliberate snapshots in validated JSON. Personal-access-token connection runs directly in the browser; the token stays in page memory and is excluded from URLs, backups and persistent storage. An optional Node service supports OAuth and owner-checked publication.

Town snapshot JSON committed to `public/data/towns/` produces physical `/towns/<name-and-timestamp>/` pages during the build, supporting static hosting such as Vercel. This keeps project history portable and lets organizers manage it through their own repository. Complete backups can also be imported locally on the deployed site, letting us test recipient-configured towns without publishing test-wallet data in GitHub. Browser storage remembers exploration progress, and an all-land founding snapshot makes the first measured version replayable.

Native Web Audio plays six locally hosted Kenney CC0 interface effects. A single lazy HTMLAudioElement loops a supplied Suno track quietly on the planner only and shares the mute control. The submission recording excludes background music. The mailbox prototype combines a Three.js raycast target, contextual coin cursor, animated delivery and a demo receipt to make builder support tangible within the town.

The optional support layer uses Privy's React SDK in an on-demand React island, preserving the main TypeScript/Three.js application. Privy's standard Email/Wallet login offers embedded or connected wallets, making wallet onboarding accessible to builders and visitors. The implemented transfer path sends native Sepolia test ETH directly to the configured builder recipient, with no custody contract or platform transaction fee. Personal towns use one recipient; community towns map recipients to repositories. Creator/login notices and a fresh per-transfer acknowledgment precede explicit approval. Recipient addresses are shortened by default with full review and copy available. Critical signing and pending states lock unrelated controls; Web Locks and public localStorage checkpoints coordinate participating tabs on the same origin. Recovery checks the original transaction instead of automatically resending. Receipt sender, destination, value and success checks gate the existing coin animation. Controller and real-React/mock-SDK browser fixtures have passed. Hosted verification covered real login, the low-balance guard, funded review and a human-approved 0.001 test-ETH transfer. The app and Sepolia Etherscan agreed on success, sender, recipient and value. A separate Privy final-preview cancellation submitted no transfer and released the interaction lock; interrupted session/reload recovery remains unverified and is deferred to the next version. ENS identity and community permissions remain on the roadmap.

Codex assisted with specifications, research, implementation, Blender authoring scripts, tests and documentation. The human supplied the concept, growth policy, visual references, acceptance of the five building stages and successive interaction revisions.

## Technology selections

| Form field | Current answer |
| --- | --- |
| Ethereum developer tools | Ethers.js; Privy React SDK 3.42.0. viem supplies chain definitions/SDK support and can be listed under Other if absent from the dropdown |
| Blockchain networks | Ethereum Sepolia, chain ID 11155111; human-approved test transfer and matching successful receipt verified |
| Programming languages | TypeScript, JavaScript, Python; HTML/CSS for the interface |
| Web frameworks | Main app: TypeScript/DOM. Optional wallet panel: React 19.3.0. Vite is the build tool |
| Databases | None; JSON snapshot files and browser local storage |
| Design tools | Blender; human-supplied reference artwork |
| Other technologies | Three.js, GitHub REST API, Node.js, GLB/glTF, Web Audio API, Git, Playwright, FFmpeg; viem 2.56.0 in the optional wallet extension |

The core stack and optional wallet code are implemented. A listed SDK/network is not evidence of a successful transaction. Reconcile selections with the final installed code and actual verification. ENS, Solidity, custom contracts, onramps and gas sponsorship are not part of this increment.

## AI tools disclosure

Codex assisted with product and technical research, English documentation and translations, specifications, application code, procedural Blender Python scripts, original SVG/interface work, tests and browser verification. The human originated Buildergame's concept, defined organizer-owned growth rules, supplied visual references, accepted and locked the five building appearances, and directed visual and interaction revisions. The reference-image generation tool and prompts have not been supplied, so no specific model is claimed for those images.

The human supplied the Suno-generated track "Miniature Sky" and its musical style prompt. Codex integrated it only into the Create town page; the demo recording excludes background music. The Suno account plan and generation-rights evidence have not been independently verified, and the track is not labeled CC0. Kenney interface artwork, cursors and six sound effects are reused CC0 assets with source and license records. Video capture shows the actual application without generated feature footage. Codex drafted the English narration and generated an edge_tts `en-US-JennyNeural` rehearsal reference. The final competition video will use the user's human recording, which has not yet been received.

See [AI disclosure](../collaboration/AI_USAGE.md), [human–AI log](../collaboration/log.md), [reuse baseline](../collaboration/baseline.md), [prompts](../prompts/README.md), [specifications](../specs/README.md) and [NOTICE](../NOTICE).

## Partner prizes

**Current candidate: Privy — Best financial flow.** [Official prize page](https://ethglobal.com/events/ethonline2026/prizes/privy). This aligns the optional wallet extension with the project's actual goal: helping visitors support the builders they discover. The relevant prize requires a functional financial flow using Privy wallets. A wallet icon, provider mock, future plan or virtual coin animation does not by itself demonstrate that requirement. Verify the final prize wording and Classic/Continuity conditions against the submitted revision; no award or eligibility is guaranteed.

### How are you using this Protocol / API?

Copy for the protocol/API field at the current verification checkpoint:

> Buildergame uses Privy to turn project discovery into optional direct support for builders. The published integration uses PrivyProvider for Email/Wallet onboarding and useSendTransaction for embedded-wallet transfers. A personal town configures one receiving address; community towns map recipients to individual projects. The visitor reviews the recipient and native Sepolia test-ETH amount, acknowledges the notice, and approves through the wallet. A matching successful receipt confirms the transfer; eligible garden mailboxes can then show coin feedback. The observed timber-frame town has no garden mailbox. Wallet creation, recovery and confirmation fit into a compact interface while the ordinary town experience remains accessible. Configuration, transaction and mock-SDK browser checks have passed. The hosted flow verified real login, insufficient-funds handling and a human-approved 0.001 Sepolia test-ETH transfer, with matching success, sender, recipient and value independently checked on Etherscan. A separate cancellation before submission and interaction unlock passed; interrupted session/reload recovery remains unverified and is deferred to the next version.

### Link to the line of code where the tech is used

The following permalinks point to published revision `4ec64c0ec15af922757d9cfd8684015dbc52a3e1`. The exact line ranges were checked locally, and both source files are unchanged from that Git revision. Use the first link if the form accepts only one:

- [Sepolia switch, fresh provider and Privy useSendTransaction with explicit confirmation UI](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/wallet-panel.tsx#L139-L160)
- [PrivyProvider: email/wallet login, Sepolia-only chains and embedded-wallet creation](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/wallet-panel.tsx#L335-L339)
- [Privy hooks for login, wallets, wallet creation, transaction sending and modal state](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/wallet-panel.tsx#L49-L53)
- [Application receipt checks: chain, hash, sender, recipient, value and successful status](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/transaction.mjs#L229-L251)

Implementation locations for review: [Privy provider and wallet panel](../src/support/wallet-panel.tsx), [lazy panel entry](../src/support/panel.ts), [transaction lifecycle](../src/support/transaction.mjs) and [public recipient validation](../src/support-config.mjs). Embedded Privy wallets use the SDK's `useSendTransaction`; connected external wallets use their EIP-1193 provider. An external-wallet-only test must not be labeled proof of an embedded Privy-wallet transfer.

### Integration evidence

| Evidence | Current status |
| --- | --- |
| Scope and lifecycle acceptance | [Optional Privy specification](../specs/0016-optional-privy-support.md) |
| Implementation commit and line links | Published revision `4ec64c0`; exact line ranges checked above and both source files unchanged from that revision |
| Automated behavior / compatibility / failure tests | Latest 82/82 Node suite includes 33 transaction fixtures; final compact-card run passed 21 real-React/mock-SDK browser scenarios in English/Chinese at desktop/mobile sizes. Four loading-wrapper and three page-lock groups also passed. Final combined production compilation passed. [Exact evidence and timing](../docs/verification.md#creator-and-visitor-notices-0059) |
| Shared sample/actual-town interface | Six desktop/mobile sample/actual/configured variants passed layout parity, followed by map and support browser regressions. Actual towns omit landscape tours; camera rules and locked models are preserved |
| Hosted deployment | Vercel serves the application and the interactive presentation from release `94f2c56`; homepage and sample-town controls were checked online. The public Privy App ID is configured and real login is verified |
| Hosted optional-wallet test | A complete town backup containing real GitHub data was imported through Create town → Load a plan on the production site. Its wallet-enabled header opened the compact React support card and the real Privy modal with standard wallet selection; the import remained browser-local |
| Live Privy session and balance guard | Live login displayed a sending wallet. The earlier default-amount review passed account/network reads and reached the insufficient-funds guard before submission or any network fee |
| Funded Sepolia flow and receipt | Funded review and a personally approved Privy transfer of 0.001 Sepolia test ETH succeeded. The app result matched Sepolia Etherscan Success, sender, configured recipient and value. Nine block confirmations were observed; the transaction was not yet finalized at that observation |
| Success/cancellation unlock and remaining edge cases | After success, Back to town closed the card and restored header-wallet focus; Projects opened the captured-repository directory. A separate review was cancelled with Privy's Not now control: the app reported cancellation before submission/no transfer/no network fee, and ordinary project interaction resumed. Interrupted session/reload recovery remains unverified and is deferred to the next version |
| Updated no-music competition demo | Three ignored local drafts are verified at 189.56 seconds, 1280×720/25 fps: TTS reference, effects-only and silent. Footage shows a fresh anonymous GitHub town capture through retained human Privy approval and a new successful 0.001 Sepolia test-ETH app result. Email/code masks and shortened-address approval passed privacy-frame review; human narration, competition final and upload remain pending |

Test ETH has no monetary value. A successful test-network receipt validates that demonstrated flow, not mainnet readiness or real financial support received by a builder.

### Next release sequence

1. Replace the verified local TTS reference with the user's recording for the final stereo mix with original interface sounds. Keep the retained approval, verified login masks and waiting-time cuts. Human audio remains pending. Repeat export checks after timing or audio changes; effects-only and silent backups are already prepared locally.
2. Upload the actual reviewed video file to the project page, finish other edits, click **Submit**, and confirm success before September 13 at 12:00 pm ET / 16:00 UTC. A hosted video URL is not a substitute for uploading the file.
3. In the next version, verify interrupted session/reload recovery on the deployed origin. This check is explicitly deferred, remains unverified and does not block the current recording. [Backlog](../docs/backlog.md).

Wallet/ENS identity, community permissions and on-chain milestones remain subsequent product directions. This sequence is the current development plan, not a claim that every live failure/recovery path, recording or partner eligibility is already complete.

### Ease-of-use rating and sponsor feedback

**Numerical rating:** not supplied. The following feedback summarizes the builder's actual observations:

> Privy's email and existing-wallet login options were useful for making direct builder support accessible. In our testing, the email submit action felt too small and easy to miss. A more prominent Continue button and short inline guidance would help; hover hints alone leave first-time users with too many decisions.
>
> Please explain the two paths before users choose: email creates or reopens an embedded app wallet, while wallet login connects an existing wallet. Make the separate address and balance, test-ETH funding, and wallet export/management path clearer.
>
> During integration, distinguishing allowed-origin settings, build-time environment configuration, and Sepolia funding/testing steps required extra work. A complete setup recipe that separates SDK settings, hosting configuration and testnet prerequisites would make onboarding easier. Clearer error guidance should also distinguish SDK issues from application configuration, network and funding problems.

**ENS remains a roadmap item.** There is no implemented ENS evidence in this increment; do not claim it as a used protocol or describe the Privy integration as ENS usage. Select only partner technologies actually integrated in the submitted revision.

## Links and images

| Item | Prepared value or action |
| --- | --- |
| Project name | Buildergame |
| Repository | https://github.com/ForOneIce/buildergame |
| Interactive demonstration | [Buildergame demo presentation](https://buildergame-two.vercel.app/demo/) — five-slide HTML overview with actual app images and Privy code references; use this for the optional demonstration-link field |
| Live project URL | [buildergame-two.vercel.app](https://buildergame-two.vercel.app/) — live application; homepage and sample-town interface checked online |
| Final video file | Human-narrated competition final pending; human audio has not yet been received. Current local draft footage is 3:09.56 at 1280×720/25 fps. Upload the final reviewed file directly to the project page; no upload has occurred |
| Local reference and backups | TTS reference and effects-only stereo drafts plus a silent draft passed full decode, stream/duration checks, identical-video-stream comparison and privacy-frame review. These ignored local files are not a published competition final |
| Earlier videos | The 3:07, 1280×720 UI-effects-only video and identical silent export in `public/demo/` are archival references. Neither meets the latest spoken-audio requirement; do not use either as the final submission |
| Square logo | [buildergame-logo.png](media/buildergame-logo.png), 512×512; [SVG source](media/buildergame-logo.svg) |
| Cover | [buildergame-cover.png](media/buildergame-cover.png), 1280×720, composed from an actual house capture |
| Screenshot 1 | [Homepage](media/01-homepage.png), 1920×1245 |
| Screenshot 2 | [Town planning](media/02-town-planning.png), 1920×1508; an unsubmitted example draft |
| Screenshot 3 | [Updated cloud town and project card](media/05-cloud-town-project.png), 1920×1080; fictional sample project. [Cloud-town overview alternative](media/04-cloud-town-overview.png), 1920×1080 |

Images and the earlier video archives are included in the repository. [Media provenance](media/README.md), [video files](../public/demo/README.md) and [verification](../docs/verification.md) record preparation and export checks. Static hosting is useful for review but does not replace the required project-page video-file upload.

The old videos predate the wallet extension and lack speech. The updated cloud-town screenshots show the current renderer and interface with fictional sample projects; they are not Privy transaction evidence. The final [recording plan](demo-script.md) shows actual new-town creation and its real transaction. The demonstrated timber-frame stage has no garden mailbox; show the successful receipt without inventing a coin animation.

## Video requirements

The final video must be **2–4 minutes**, **at least 720p**, and use **human-spoken audio with no music**. Upload the **actual video file** to the project page and click **Submit** after edits. See the [verified official guidance and supplied notice](rules.md#video-wording-and-current-preparation).

The TTS track is a rehearsal reference; replace it with the user's narration before the final export. Human audio is pending. Keep the effects-only backup separate from the competition final. [Narration text](demo-narration.txt); [recording plan](demo-script.md).

## Before submission

- Verify video metadata, playback and screenshots against the current build; actual evidence belongs in [verification](../docs/verification.md).
- Upload the actual reviewed video file, square logo, 16:9 cover and at least three screenshots. Do not substitute a YouTube, cloud-storage or other URL for the video file; use real public URLs only in fields that request links.
- Confirm team, check-ins, Classic/Continuity route and final prize choices in the Dashboard.
- Review the noncommercial source-available [license](../LICENSE) against competition source requirements. It is not an OSI-approved open-source license; no eligibility ruling is claimed.
- Click **Submit** after all edits, and confirm the final submitted revision and success before **2026-09-13 16:00 UTC / September 13, 12:00 pm ET**.
