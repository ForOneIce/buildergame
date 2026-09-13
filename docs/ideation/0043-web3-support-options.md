# Optional support for builders and communities

Researched on 2026-09-13 (UTC). Discussion only. [Human proposal](../../prompts/0043-optional-web3-support.md). No partner, chain, payment architecture or implementation is approved.

## Product candidates

| Candidate | User value | Demo scope and relative effort | Current prize relationship |
| --- | --- | --- | --- |
| Mailbox tips using an existing wallet | Visitors support a builder directly | Smallest: one chain, one asset, explicit recipient/amount confirmation and transaction receipt; no custom contract needed | Generic transfers alone do not establish partner eligibility |
| Mailbox tips through a Privy wallet | Reduce wallet setup friction and demonstrate an actual financial flow | Medium: Privy app setup, supported wallet integration, test funding, confirmation/error states and a completed transfer | Privy Best financial flow, $2,500; actual Privy wallet use and a functional financial flow are required |
| ENS town directory with delegated records | Organizers assign project names; builders maintain their own project link or mailbox destination | Medium: ENSv2 Sepolia names, real resolution, scoped record updates and an unauthorized-write demonstration | ENS Best Use of ENSv2, $4,500 pool; v2 must be central and functional. The separate $500 integration award is Continuity-only |
| Community funding board | Link a project's public maintenance task to an explicit sponsor payment | Larger: approval/recipient authority and receipts; custody, escrow or automatic allocation add significant scope | Privy B2B requires a functional organization workflow and a control such as policies/signers/quorums/intents; Arc finance requires meaningful Arc/USDC use plus working frontend/backend and an architecture diagram |
| Snapshot hash receipt | Give an organizer a verifiable record of the exact published snapshot | Small contract interaction, but a hash proves integrity of the recorded bytes, not truth of GitHub metrics | No strong simple fit in the current examined prizes; avoid treating a generic hash write as sufficient |

The suggested first product increment is the human's optional mailbox support flow. A generic single-chain transfer is the smallest implementation; Privy makes a more relevant financial-flow prize candidate but adds integration work. ENS is a separate, useful community-management option. Combining both in the first demo remains a proposal, not a recommendation to maximize partner count.

## Mailbox interaction and recipient boundaries

- Keep ordinary exploration wallet-free. Hover provides the coin pointer and a short support hint; clicking opens a card with recipient, network, amount and estimated network fee. Only explicit confirmation requests a wallet transaction. On touch devices the mailbox remains tappable.
- A personal town can use one recipient. A community may declare a clearly labeled treasury recipient or per-project recipients. Never silently substitute the organizer's wallet for a missing project recipient.
- Public repository URLs can be curated by anyone. A wallet in a town configuration must not be labeled GitHub-verified. A useful intermediate design reads a recipient declaration from a file maintained in the project's repository and exposes its source commit; this is a maintainer-designated destination, not proof of wallet ownership. A wallet signature alone also does not establish control of a GitHub account.
- The smallest demo uses one test network and one asset, clearly labeled as test funds. Cover cancellation, wrong network, insufficient funds, pending confirmation and failure. A transaction hash alone is not a confirmed payment.
- A direct transfer needs neither allowance approval nor a custom tipping contract. A single shared recipient does not automatically attribute onchain transfers to individual houses: durable per-project attribution would need an additional receipt/event design or an indexing convention.
- A thank-you animation or separate garden decoration can make support visible. Changing organizer-defined building growth rules is not part of this proposal. Public supporter lists, permanent donor badges and aggregate totals require separate consent/data/indexing decisions.
- Privy can reduce wallet setup friction, but a new wallet still needs funds and network fees. Card funding, gas sponsorship and recovery are additional flows with their own availability and costs. GitHub PAT access remains separate from payment authorization.

## Technical and cost findings

Buildergame currently uses vanilla TypeScript, Three.js and Vite. Existing-wallet transfers or ENS calls can be added through a browser EVM library without replacing the renderer. No library was installed or tested in this research.

Privy has a vanilla JavaScript core SDK, but its official recipe describes it as low-level and asks developers to contact the team before using it. It must not be presented as an immediately available drop-in shortcut. A small component using the supported React SDK is an alternative to assess if Privy is chosen; rewriting the full application is unnecessary. No external contact was made. Prize eligibility requires a generally available functional financial flow; a mock alone is insufficient.

Privy's retrieved pricing page lists a free tier for 0–499 monthly active users and usage limits, with paid tiers above it. This does not imply free gas, funded wallets or free card/onramp services. Confirm dashboard terms before committing to a deployment. ENSv2 test registration needs Sepolia ETH for gas and the test MockUSDC registration token; the app guide documents free test-token minting. Neither implies free mainnet operation.

ENSv2 currently uses Sepolia. The app guide supports updated viem/ethers/ENSjs tooling and describes permissioned record writes. Ordinary ENSv1 display does not meet this prize's ENSv2 requirement. Subname ownership alone does not grant permission to edit a parent's resolver; the demo must exercise the actual delegated rights. Contract/library details are evolving and require a technical spike after approval.

Arc's finance award is $3,500, of which $2,500 is conditional on deploying the same project to Arc mainnet by September 30. Its functional frontend/backend and advanced payment focus make it a larger commitment than a plain static tip button. The Graph's examined prizes require live Graph data and meaningful composition/standardization or AI use; GitHub metadata or one simple donation query does not qualify. Hedera's current tracks focus on real x402 services, tooling contributions, ATS enterprise assets or previously existing Hedera projects, so generic tipping has weak fit.

The current Buildergame license is noncommercial source-available. ENS explicitly asks for open-source code; acceptance under the present license is unresolved and must not be claimed merely because the repository is public. No license was changed. A second product version developed within the same event does not automatically make the entry Continuity; the competition's pre-event work boundary still applies.

## Official sources read

- [ETHOnline prize index](https://ethglobal.com/events/ethonline2026/prizes)
- [Privy prizes](https://ethglobal.com/events/ethonline2026/prizes/privy)
- [ENS prizes](https://ethglobal.com/events/ethonline2026/prizes/ens)
- [Arc prizes](https://ethglobal.com/events/ethonline2026/prizes/arc)
- [Hedera prizes](https://ethglobal.com/events/ethonline2026/prizes/hedera)
- [ENSv2 app guide](https://docs.ens.domains/ensv2/tutorial-app-developers)
- [Privy documentation index](https://docs.privy.io/llms.txt) and [vanilla JavaScript recipe](https://docs.privy.io/recipes/core-js.md)
- [Privy pricing](https://www.privy.io/pricing)

These are read-only source checks and design judgments, not working integrations, prize approval or user validation.
