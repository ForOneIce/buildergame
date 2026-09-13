# Buildergame — project and integration overview

Buildergame turns public GitHub repositories into a town that people can explore and return to after demo day. Each project has a permanent plot, and saved snapshots make its progress visible.

[Live application](https://buildergame-two.vercel.app/) · [Interactive demonstration](https://buildergame-two.vercel.app/demo/) · [GitHub repository](https://github.com/ForOneIce/buildergame) · [Reviewer introduction](README.md)

## Product

Town creators choose cumulative commits, stars, a weighted combination of commits/stars/forks, or a custom score table to control growth. Five building appearances run from land to a garden home. Inactivity does not remove accumulated commit progress.

Personal towns showcase one builder's projects; community towns bring several builders together. Visitors explore flat, valley or cloud landscapes, open project cards, find buildings in the directory and minimap, and revisit earlier snapshots. Public GitHub capture, English/Chinese interfaces, JSON import/export and static town deployment are implemented.

Optional Privy support connects discovery with direct builder appreciation on Ethereum Sepolia. Personal towns can configure one recipient; community towns can map a different recipient to each project. A visitor reviews the transfer and explicitly approves it through the wallet. A matching successful receipt confirms the result. Eligible garden mailboxes can then show coin feedback; the timber-frame building in the recorded transaction has no garden mailbox.

## How it works

| Component | Implementation |
| --- | --- |
| Town rendering | TypeScript and Three.js; fixed plots, deterministic terrain, authored Blender/GLB buildings and distance-based detail |
| Project history | GitHub REST capture with pagination, cancellation, timeouts and unavailable-observation handling; validated JSON snapshots |
| Portability | JSON backups and generated static town pages; browser storage remembers exploration progress |
| Interface | HTML/CSS/SVG with English/Chinese copy and Kenney interface effects; an optional Node service provides OAuth and owner-checked publication |
| Optional support | Privy React SDK in a lazy React panel, Ethers/viem support, direct native Sepolia test-ETH transfers and application receipt checks |

All ten building files, covering five appearances at two detail levels, are protected by model hashes. Six scoring labels remain for schema compatibility, with the final two sharing one visual appearance.

## Privy integration

PrivyProvider configures email/wallet login, embedded-wallet creation and Sepolia as the supported chain. The panel uses Privy hooks for authentication, wallet selection and sending transactions. Embedded wallets use useSendTransaction with visible, cancellable wallet approval; connected external wallets use their EIP-1193 provider.

Before sending, the application switches to Sepolia, obtains a fresh provider, and checks the reviewed recipient, amount, account and available funds. Explicit acknowledgment and wallet approval remain separate steps. During signing and pending states, unrelated controls are locked. Receipt checks verify the chain, transaction hash, sender, recipient, value and successful status before the application reports success.

Published code references at revision 4ec64c0:

- [Sepolia switch, fresh provider and Privy useSendTransaction](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/wallet-panel.tsx#L139-L160)
- [PrivyProvider: email/wallet login and embedded-wallet configuration](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/wallet-panel.tsx#L335-L339)
- [Privy authentication, wallet and transaction hooks](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/wallet-panel.tsx#L49-L53)
- [Receipt validation and confirmed feedback](https://github.com/ForOneIce/buildergame/blob/4ec64c0ec15af922757d9cfd8684015dbc52a3e1/src/support/transaction.mjs#L229-L251)

The code ranges were checked against the published revision. [Integration specification](../specs/0016-optional-privy-support.md) and [verification](../docs/verification.md) provide further detail.

## Observed evidence

| Area | Verified result |
| --- | --- |
| Automated checks | 82 Node tests, including 33 transaction fixtures; 21 real-React/mock-SDK compact-wallet scenarios; production build passed |
| Hosted onboarding | Real Privy login, a visible sending wallet, insufficient-funds handling and funded review |
| Test transfer | A human-approved 0.001 Sepolia test-ETH transfer succeeded; the app result matched Sepolia Etherscan success, sender, recipient and value |
| Cancellation and interaction | A separate final-preview cancellation submitted no transfer; ordinary project interaction resumed after both cancellation and success |
| Recorded demonstration | Sample exploration, fresh anonymous public-GitHub town creation, founding/measured snapshots, real Privy login and a new human-approved transfer with a successful app result |

The earlier explorer observation had nine confirmations and was not yet finalized. It is separate from the new transaction shown in the final demonstration. No identifying wallet addresses or transaction hashes are included here.

## Final media

The completed **217.68-second** video uses **1280×720** footage, the creator's human narration, original interface sounds and no background music. It shows the actual application and retains the real wallet approval.

- [Five-slide interactive presentation](https://buildergame-two.vercel.app/demo/) · [HTML source](demo.html)
- [Logo, cover and screenshot provenance](media/README.md)
- [Homepage screenshot](media/01-homepage.png)
- [Planning interface](media/02-town-planning.png)
- [Cloud town and project card](media/05-cloud-town-project.png)

The planning image contains an example draft, and the cloud-town screenshots use fictional sample projects. They illustrate the working interface; transaction evidence is recorded separately above.

## Limitations

The current wallet flow sends native Sepolia test ETH directly between wallets, without a custom contract. Test ETH has no monetary value. Support does not affect building growth or grant ownership or financial return.

Deployed interrupted session/reload recovery remains unverified and is in the [next-version backlog](../docs/backlog.md). Automated recovery fixtures do not replace that live check. ENS identity, community membership, management permissions and on-chain milestones remain future work.

## Contributions and provenance

The human originated the concept, defined growth rules, supplied visual references, accepted the five building appearances, directed interaction revisions, recorded the final narration and personally approved the demonstrated transfers. Codex assisted research, specifications, implementation, Blender authoring scripts, testing, documentation and media editing.

Kenney interface assets and effects have CC0 source records. The planner includes a supplied Suno track, which is excluded from the final video. The project uses a noncommercial source-available license, with separate licenses for reused material.

[AI disclosure](../collaboration/AI_USAGE.md) · [Reuse baseline](../collaboration/baseline.md) · [Specifications](../specs/README.md) · [NOTICE](../NOTICE) · [License](../LICENSE)
