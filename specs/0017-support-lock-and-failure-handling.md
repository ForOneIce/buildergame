# Support submission lock and failure handling

Status: **implementing; acceptance not yet verified**. Defined 2026-09-13 (UTC), following [instruction 0057](../prompts/0057-support-lock-and-failure-handling.md). This refines the [optional Privy support extension](0016-optional-privy-support.md); earlier passing tests/builds do not automatically cover this later change.

## Purpose and boundaries

Prevent accidental duplicate sends, confusing navigation and false success while a visitor approves or waits for a support transaction. Preserve usable, specific error messages and a route to inspect an uncertain transaction. The active increment remains native test ETH on Ethereum Sepolia, with standard Privy Email/Wallet login and optional recipients. No new chain, contract, backend payment service, gas sponsorship, wallet export or custom authentication is authorized here.

The scope is ordinary operation in the unmodified browser application. A frontend cannot prevent a malicious user from editing JavaScript, clearing storage or separately approving transactions from another origin/device. Web Locks coordinate participating tabs on the same origin; they are not a blockchain or server access-control primitive. Ethereum permits only one execution for a sender/nonce in the same canonical chain, but a user can sign another valid transaction with a different nonce. Do not describe client-side guards as backend idempotency or complete replay-attack protection.

## State and page behavior

| Phase | Expected behavior |
| --- | --- |
| Connection and read-only review | Readiness, chain/account, amount, balance and fee checks cannot transfer funds. The visitor may leave a pre-send review; stale read responses cannot begin signing or alter a different view |
| Starting approval/submission | Acquire the browser send guard and persist enough public recovery context before invoking the wallet send. Freeze the transaction's town, project, sender, chain, recipient and amount |
| Signing/submitted/checking | Lock unrelated in-app controls. Disable close, backdrop dismissal, Escape, recipient/project/wallet/amount edits, logout and a second send. Privy's portal remains interactive so the visitor can approve or reject the actual wallet request |
| Pending or send outcome unknown | Keep a clear unresolved state and the original intent/hash when known. Permit only the appropriate wallet-history/receipt-recheck recovery path; no fresh send or automatic retry |
| Known rejection before broadcast | Explain cancellation without receipt/success animation, clear that request's guard/checkpoint and restore the normal town controls |
| Confirmed success or verified on-chain revert | Record the terminal outcome once, release the critical UI/send guard, and restore town interaction. A revert cannot trigger the success coin; it may still have consumed gas |
| Provider/storage/locking capability unavailable before send | Show the limitation and refuse a new real transfer. Base town browsing and virtual coins remain usable |

Expose `onLockChange?(locked: boolean)` from the optional panel to the game. The implementation's `critical` flag begins at explicit-send preflight and remains active through signing, checking, pending or unknown outcomes; a read-only review is separate. Make the surrounding game regions inert during the critical phase, without disabling the active wallet/support controls or Privy's portal. Restore only inert states introduced by this lock. A modal overlay alone must not leave keyboard shortcuts, background buttons or hidden focus targets active.

The lock applies to application interaction, not the browser's address bar, tab close, refresh or crash. Navigation/disposal must preserve a broadcast or uncertain transaction's recoverable context and suppress stale scene feedback. Do not imply that closing or refreshing can cancel a signed/broadcast transaction.

## Same-origin guard and public checkpoint

- Use the browser Web Locks API with `buildergame.support.transfer.v2` for exclusive new-send coordination. Its scope is one participating transfer across accounts, towns and tabs on the same origin; it does not span other origins or devices.
- Pair the guard with a validated public `localStorage` record under `buildergame.support.pending.v2`. The version-2 envelope contains `version`, `attemptId`, `eventId`, `phase`, `projectId`, `recipient`, `amount`, `sender` and a known `hash` where available. The intent is restricted to the fixed Sepolia chain. No private key, signature, login token or Privy secret belongs in the record or town JSON exports. This supersedes the initial version-1 tab-local recovery. A later implementation adds migration of a valid legacy checkpoint under the origin guard, without overwriting an existing v2 record or sending. Retain the original legacy context until its own verified terminal outcome; unfamiliar or malformed recovery state must not authorize a new send.
- Check persisted pending state while holding the relevant guard, and fail closed before a new send if guard acquisition or required storage is unavailable. Mere read access to localStorage does not prove that a checkpoint can be written.
- Never trust a restored checkpoint as proof of success, account ownership, recipient identity or permission to sign. Validate its format and recover through the original network and matching transaction receipt/value. Restoration itself cannot send.
- A pending guard/checkpoint must not disappear just because the SDK times out, the view is unmounted or a send response arrives late. Cleanup of an old terminal request must not erase a newer unrelated request's context.
- Same-origin competing requests should receive an actionable busy/pending message, not queue a second wallet send to execute automatically when the first finishes.
- Browser storage can be cleared and may not be available. Describe its practical limits; do not claim a complete account-wide transaction history or cross-device recovery.

## Deployment continuity assessment

This is a technical assessment and acceptance requirement, not a verbatim user instruction or a completed guarantee. A Vercel update normally serves a new build on subsequent page loads; it does not itself require a forced refresh of every already open page. Once broadcast, a transaction continues regardless of which frontend version is visible.

Avoid automatic reloads during the critical phase. Preserve compatible pending-record schemas between releases, retain unfamiliar/invalid records for diagnosis and refuse a fresh send while unresolved state cannot be safely interpreted. Do not erase an unknown version as cleanup or claim that a missing UI status proves transaction failure. The valid version-1 checkpoint migration has a passing controller fixture; actual hosted refresh/authentication continuity and all legacy-data edge cases remain separate acceptance work.

## Failure copy

Use concise English/Chinese states for connection/login refusal, wrong chain, changed account, invalid amount/recipient, insufficient balance including gas, review timeout, another active submission, unavailable storage/locks, wallet rejection, unknown send outcome, pending receipt, mismatched receipt and on-chain failure. Keep the destination, amount, network and available hash visible during the critical phase.

Risk copy remains visible near the amount/confirmation: no on-chain gas for a request stopped before broadcast; a transaction that fails on chain can consume gas; pending is not failure; Buildergame cannot reverse a confirmed direct transfer. Sepolia test ETH has no monetary value. Never label an unknown send as safely cancelled or invite a blind resend.

## Observable acceptance

### Creator and visitor notices (0059)

The [subsequent notice requirement](../prompts/0059-creator-and-visitor-wallet-notices.md) adds three concise, localized acknowledgment points. These are interface prerequisites, not legal waivers, evidence of comprehension or permission to sign a transaction.

- **Creator:** manually choosing the optional wallet settings (or restoring valid wallet configuration) opens a notice covering the dedicated receiving-wallet recommendation, address changes/old views, already sent transactions, retained access to old wallets, deployment/origin changes, pending recovery boundaries and network/provider costs. The acknowledgment starts unchecked; continuing into wallet configuration requires checking it. Closing returns to ordinary planning and cannot block creation of a basic town. Do not automatically interrupt every new-town visit with this notice.
- **Visitor login:** show brief wallet/login guidance and an unchecked acknowledgment before initiating Privy's standard login. This does not replace provider authentication or automatically import an external wallet/balance.
- **Transfer review:** require an unchecked risk acknowledgment for each reviewed transfer before the app's final confirmation. Reset it for a new amount, recipient, sending account, network context or review. A previously checked box must not authorize a changed transfer. Keep the separate wallet approval and receipt-gated result.
- Use clear labels such as **I have read and understand these notes / 我已阅读并了解以上说明**. Provide the deployment guide and official wallet-management links. Do not require forced scrolling, a countdown, broad risk waivers or hidden terms.
- All three notices must work with keyboard/touch and English/Chinese layouts. An unchecked box leaves the corresponding optional-wallet Continue/Sign in/Confirm action disabled. An unconfigured town has no visitor wallet control/dialog/login/acknowledgment and does not need to load the SDK. In a mixed community, an unmapped project's mailbox keeps its virtual interaction and never opens a wallet notice. Basic creation/browsing and the existing sample virtual coins remain available.
- Address changes affect visitors only when they load updated town data; old/cached views may retain an earlier address. A sent transaction keeps its original destination. Deployment updates cannot promise uninterrupted open pages, and pending recovery is limited by browser/origin/storage. Do not claim that a notice changes those technical limits.

### Transfer behavior

The later [compact-card requirement 0062](../prompts/0062-compact-support-card.md) moves extended explanations to a secondary dialog and reduces the main panel's vertical density. Preserve the unchecked acknowledgment, complete address-review path, current failure/pending status, explicit wallet action and critical lock. Secondary details need keyboard/touch access and focus restoration. Verify the revised primary panel at desktop/mobile sizes without clipping essential controls; this new visual acceptance remains pending.

1. Read-only review never invokes send; leaving/reopening a review cannot cause a late request to sign.
2. One explicit confirmation produces at most one adapter/SDK send under repeated click, Enter, callback and rerender attempts.
3. During signing and receipt checking, pointer and keyboard cannot activate game navigation/timeline/cards or edit/dismiss the support card. Privy's approval and rejection controls remain usable.
4. Pending and unknown states retain the original intent and allow only receipt/history recovery. Rechecks issue reads, never another send.
5. A second same-origin tab cannot initiate a competing send while the first owns the guard or has an unresolved checkpoint. Refresh/restoration also cannot automatically send.
6. Missing Web Locks, unavailable/failed localStorage writes or invalid restored records refuse new sends with useful copy while virtual mailboxes and other base features remain available.
7. A late wallet response after disposal persists its known hash for recovery without animating the wrong town. An old request cannot clear a newer checkpoint.
8. Before-broadcast rejection, reverted receipt, mismatched receipt, no receipt, lost send response and successful receipt each produce the correct distinct UI/lock state. Only one matching successful receipt can trigger one coin effect.
9. Terminal resolution restores the game controls and focus without leaving inert attributes behind. Previously inert elements remain inert.
10. Current source/build/model-lock and relevant configuration/mailbox regressions pass after implementation. Record actual controller fixtures, cross-tab/browser checks and real-chain evidence separately.
11. Creator and login continuations require fresh visible acknowledgment, and a transfer acknowledgment resets after its context changes. Checking any notice cannot itself trigger authentication, signing or transfer submission without the corresponding explicit action.

## Evidence and revision record

At scope creation no acceptance result is claimed for this increment. Record commands/results and the final storage/lock scope in [verification](../docs/verification.md) and the [wallet deployment guide](../readme_web3.md) after implementation. The prior feature commit `8722006` and its 65-test build checkpoint remain historical evidence for that revision.
