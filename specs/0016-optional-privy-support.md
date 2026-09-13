# Optional Privy support for builders

Status: **implemented; local automated checks passed; live verification pending**. Scope defined 2026-09-13 (UTC), committed as `22de9db` before final implementation verification. The final 65-test suite, scoped browser fixtures and production build with the optional wallet bundle enabled passed. A live Privy receipt and hosted integration verification remain pending. [Human instructions](../prompts/0053-optional-privy-support.md), [exact results and limits](../docs/verification.md#optional-privy-support-0053).

## Product boundary

Town creators may opt into direct support for developers. Privy supplies the wallet connection/signing surface; a native Ethereum Sepolia transfer sends test ETH to the explicitly configured recipient. Buildergame does not custody funds or deploy a payment contract. Test ETH has no monetary value and demonstrates the intended support flow without establishing mainnet readiness.

Personal towns use one optional recipient for their repositories. Community towns use explicit repository-to-recipient mappings; no address means no real-transfer entry for that project. Missing support configuration in older town JSON is equivalent to support disabled. Blank optional fields must not break existing imports, plans, captures or static builds; malformed supplied addresses must be rejected with a useful field error.

All ten accepted full/distant GLBs, terrain geometry, scores and snapshot history remain unchanged. Existing physical mailboxes and eligible virtual coin interactions are retained. This increment changes configuration, conditional controls and dialog behavior, not building models or growth policy.

## Smallest complete workflow

1. The creator optionally enters a personal recipient or community repository recipients during planning. Validated configuration survives draft/config export, capture, public town backup and static deployment.
2. Towns with at least one configured valid recipient show an upper-right wallet icon. It is absent from unconfigured towns. Loading a town does not require wallet login; the optional SDK is loaded when its interaction is requested.
3. A configured project's mailbox opens an English/Chinese support confirmation card showing the project, the complete recipient address, **Ethereum Sepolia**, **test ETH**, amount and the fact that network fees apply. The address originates in public town configuration and is not identity-verified by Buildergame.
4. The visitor connects/authenticates through Privy only when requested, selects the wallet and explicitly confirms the transfer. The wallet must use chain ID **11155111**. Reject other networks instead of silently sending there. Do not use mainnet fallback.
5. Disable duplicate sends while wallet approval/submission/receipt is pending. Keep a submitted transaction hash and its Sepolia explorer link visible. Only a successful receipt for that transfer triggers the existing coin-delivery effect; no pending or failed request is labeled received.
6. An unconfigured mailbox retains its previous virtual interaction. It does not show a wallet setup prompt, connect control, real transfer amount or chain receipt. Existing virtual counts never represent a wallet balance.

## Dependencies and configuration

- Privy React SDK, with a small React/React DOM island mounted on demand within the existing TypeScript/Three.js application. Do not rewrite the main application in React.
- Ethers for amount/address validation and transaction helpers; viem supplies Privy-compatible chain definitions. Avoid implementing duplicate transaction paths. Exact installed packages, versions and licenses are in [reuse baseline](../collaboration/baseline.md).
- A deployment's public `VITE_PRIVY_APP_ID`; no App Secret, private key or seed phrase is needed in the frontend. Configure allowed origins, login methods, embedded Ethereum wallets and the Sepolia network in the deployment's Privy application as required by the SDK.
- A Sepolia JSON-RPC endpoint for chain reads. Missing app configuration, unavailable RPC or SDK loading errors must affect only optional support.
- Public recipient addresses belong in the exported town data by creator choice. Do not serialize login sessions, access tokens, signatures or wallet secrets into snapshots or backups.
- A tab-local `sessionStorage` checkpoint may retain the public pending intent, sender, state and known transaction hash, keyed by town, to prevent blind resends after returning/reloading. Restored data is untrusted and must only enable receipt checks, never authorize a new transaction. This recovery record is separate from public town exports and carries no wallet secret or login token. Lack of storage must not break the base application.

The optional public event field is `support: { version: 1, chainId: 11155111, recipient?: string, projectRecipients?: Record<string, string> }`. Personal towns (`collectionType: "personal"`) use `recipient`; community towns (`collectionType: "hackathon"`) use `projectRecipients` keyed by canonical lowercase `owner/repository` identifiers from that town. The two recipient forms are mutually exclusive. Reject zero addresses, invalid checksums, unlisted repositories and normalized duplicate mappings. Omit an empty optional configuration. Preserve no more than 200 explicit community recipients, consistent with the roster limit.

## Failure and lifecycle acceptance

- Wallet refusal, closed login, network refusal, insufficient funds, invalid/nonpositive/overprecision amounts, bad addresses and failed receipts produce actionable localized feedback without a success animation.
- Receipt timeout is **unconfirmed**, not proof of failure. Preserve the submitted hash and provide a status recheck/explorer path; do not automatically send again.
- Double clicks, repeated wallet callbacks and rerenders cannot submit the same pending action twice or count a confirmed receipt twice.
- Bind asynchronous work to the original town, repository, recipient, network and request. Changing project/town/snapshot or closing the panel must not show a late result in another project's card or animate another mailbox. Leaving a view cannot reverse an already broadcast transaction.
- Account changes, disconnects or a wrong network before submission invalidate the prepared confirmation; the user reviews the current wallet/chain before sending.
- An unavailable provider/App ID must not interrupt GitHub connection, planning without recipients, repository capture, JSON backup, town routes, timeline playback, exploration progress, sign/door controls or audio.
- No wallet icon for an unconfigured town; mixed community data only enables real support for mapped projects. A disabled/missing extension never fabricates a recipient.
- Keep keyboard dismissal/focus behavior and existing pointer/coin cues. Respect reduced motion. Do not add payment meaning to existing fictional sample metrics.

## Verification plan and evidence boundary

1. Run deterministic validation/state tests for configuration compatibility, mappings, amount/chain guards, rejection, timeout, duplicate callbacks and stale request protection.
2. Run browser fixture checks for conditional controls, lazy loading, unchanged virtual mailbox behavior and configured confirmation/error states. These checks prove application behavior against fixtures, not real Privy or chain execution.
3. Run existing data/build/model-lock checks and scoped mailbox/planner regression tests. Record actual commands, outcomes and remaining limits in [verification](../docs/verification.md).
4. Separately perform a live Privy session and a user-confirmed Sepolia transfer. Record only public, authorized evidence: submitted revision, configured network, integration code links and successful receipt hash/explorer URL. Never use fixture hashes as partner proof.
5. Update [the submission sheet](../hackathon/summitinfo.md) only to the demonstrated state. Code implementation, fixture success, hosted availability and a confirmed live receipt are separate milestones. No live receipt is claimed at specification creation.

## Out of scope

Mainnet transfers, ERC-20/USDC support, cross-chain routing, swaps, fiat onramps, gas sponsorship, fees/escrow, custom smart contracts, ENS identity/permissions, wallet-bound exploration, token rewards and changes to building scores or geometry. A donation does not buy equity, yield or project ownership. Partner eligibility and actual usage feedback require separate evidence.

## Source and revision record

- [Privy prize requirements](https://ethglobal.com/events/ethonline2026/prizes/privy): assess the financial-flow prize against actual Privy wallet usage and final evidence; a selected checkbox does not establish eligibility.
- [Privy React setup](https://docs.privy.io/basics/react/setup), [wallets](https://docs.privy.io/wallets), [Ethereum Sepolia](https://ethereum.org/en/developers/docs/networks/#sepolia): implementation references, not independent completion evidence.
- 2026-09-13 (UTC): initial authorized scope and acceptance plan. Earlier paused-Web3 decisions remain historical and are superseded only for this optional Sepolia support increment.
