# Optional developer support with Privy

Buildergame's base town experience works without Privy, a wallet or a blockchain account. Enable this extension only when a town creator wants visitors to try direct support for its builders. Ordinary GitHub capture, snapshots, exploration and virtual mailbox coins remain available on their own.

**Current scope: native test ETH on Ethereum Sepolia (chain ID 11155111).** Test coins have no monetary value. The SDK integration and notice/recovery baseline are recorded locally in `315f65d`, with further review and interface refinements prepared for release. The latest suite passed 82 Node tests, including 33 transaction fixtures; prior production compilation and scoped browser checks passed at their recorded revisions. Final release compilation, new deployment, fresh Privy login and a confirmed transfer remain pending. See [current evidence](docs/verification.md#creator-and-visitor-notices-0059).

## Before you start

Prepare:

- A working Buildergame deployment and Node.js 22.12 or newer for local builds.
- A Privy application and its **public App ID**.
- The exact web origins that will run the app locally and publicly.
- A valid public receiving address designated by the personal builder, or explicit receiving addresses for participating community projects.
- A test login and enough Sepolia test ETH in the **sending wallet** for the amount and network fee. A newly created Privy wallet starts unfunded.

This client integration requires no Privy App Secret, private key, seed phrase, ENS name or custom smart contract. A browser-only/static deployment does not need a new Node payment backend. Privy is still an external authentication/wallet service with its own availability, usage limits and terms.

中文要点：基础版不需要 Privy。只有启用赞赏的小镇部署者需要完成以下配置；首次接入仅支持 Sepolia 测试币。

## 1. Create the Privy application

Create an app in the [Privy Dashboard](https://dashboard.privy.io/), using a web application configuration. Choose Ethereum as the wallet/chain family where onboarding asks for one. Keep the **public App ID** for the next step.

The installed integration configures:

| Setting | Buildergame behavior |
| --- | --- |
| Login methods | Email and wallet |
| Chain | Ethereum Sepolia as the default and only supported chain |
| Embedded Ethereum wallets | Create on login for users without a wallet |
| Existing-wallet users | An explicit **Create a Privy wallet** action is available |
| Wallet choice | Prefer the embedded Privy wallet when available; users can select among connected wallets |
| Transfer approval | Keep Privy's wallet confirmation UI; embedded transfers use its SDK, external wallets use their connected provider |

Ensure the application settings permit the email/wallet methods and embedded Ethereum wallet behavior used by the SDK. Dashboard wording can change; the current code is in [wallet-panel.tsx](src/support/wallet-panel.tsx). [Official React setup](https://docs.privy.io/basics/react/setup) is the reference for service configuration. Do not add chains or mainnet options to get past a configuration error.

Use Privy's standard built-in **Email/Wallet** login for this demo. Leave **Custom authentication** and **Custom OAuth** disabled. This version does not need a custom identity provider, custom JWT service or paid custom-auth feature.

### Explain login and wallets to visitors

Email is a way to sign in and verify your account. Privy can create or restore the embedded Ethereum wallet associated with that account in this app. That wallet still has a private key; its address and key are not derived from your email address.

Signing in does not import MetaMask or move its balance. Visitors can optionally connect an existing wallet instead. Sending support still requires review and wallet confirmation, and Sepolia test ETH must be in the wallet actually selected for sending.

Privy supports a user-initiated export of an embedded wallet's private key for import into a compatible external wallet such as MetaMask. Importing that same wallet preserves its address; it does not require transferring its assets to a new address. **This demo does not yet provide a key-export control.** Visitors who want to manage an existing MetaMask wallet outside the app can connect it directly. No visitor should send a private key to a town creator or enter one in Buildergame's configuration; the existing recipient field accepts only a public address.

Official guidance: [Privy's user guide to transferring an app account](https://privy-io.notion.site/Transferring-Your-App-Account-9dab9e16c6034a7ab1ff7fa479b02828) and [wallet export documentation for developers](https://docs.privy.io/wallets/wallets/export). These explain provider capabilities; they do not imply that Buildergame already includes an export control.

中文要点：邮箱用于登录和身份验证，Privy 为本应用创建或恢复内嵌钱包；钱包仍有私钥，并非由邮箱地址生成。不会自动导入 MetaMask 或其余额，也可自行连接已有钱包。转账仍需确认，测试币须在实际选择的发送钱包中。当前 demo 未提供私钥导出入口；已有 MetaMask 钱包可直接连接，无须提交私钥。

## 2. Add allowed origins

Allow the exact origin of each intentional deployment. An origin contains **scheme + hostname + port**, with no page path, query string or fragment.

| Where you open Buildergame | Origin to allow |
| --- | --- |
| Default local development | `http://127.0.0.1:5173` |
| Local development using localhost | `http://localhost:5173` — a different origin; allow it separately if used |
| A local server on another port | Its actual origin, for example `http://127.0.0.1:5175` |
| Production website | The actual HTTPS origin, for example `https://your-buildergame.example` |
| A Vercel preview | That preview's exact HTTPS origin |

Replace the production example with your real domain. Do not enter `/towns/<slug>/`, `/buildergame/`, or a preview query in the origin field. One allowed origin covers all town subpaths on that same host. A custom domain, a `www` alias and a Vercel hostname are different origins. Add only the hosts you intend to use, and recheck this setting after changing a preview URL or local port.

中文要点：`localhost` 和 `127.0.0.1` 不相同；端口也必须一致。正式域名配置一次即可覆盖该域名下所有小镇路径，不要把小镇路径填进允许来源。

## 3. Configure the build

### Local development

Create or update the ignored `.env.local` in the project root:

```dotenv
# Replace the placeholder with the application's public App ID.
VITE_PRIVY_APP_ID=YOUR_PUBLIC_PRIVY_APP_ID
```

Restart `npm run dev` after changing environment values. Use the same local origin allowed in Privy. `.env.local` is ignored by Git; [.env.example](.env.example) records the variable name with an empty value.

Vite places `VITE_` variables in browser code. The App ID is intended to be public. Never put an App Secret, GitHub token, wallet key or recovery phrase in a `VITE_` variable. GitHub connection and Privy wallet authentication are independent.

### Vercel or another static host

1. Add `VITE_PRIVY_APP_ID` in the project's **build environment variables**. Select the Production and/or Preview environments that you actually use.
2. Add the corresponding final/preview origins to Privy.
3. Run a new build or redeploy. Use `npm run build` with `dist` as the output directory, as described in the [Vercel guide](docs/vercel.md).
4. Open the new deployment and verify an opted-in town there.

Changing a runtime setting after a static build does not rewrite that build's JavaScript. A build without an App ID can eliminate the wallet SDK through tree shaking. Adding the ID later requires a **new build**, not only a browser refresh. Other static hosts likewise need the variable present in the environment that executes Vite.

The optional wallet panel is loaded on request. It adds a substantial SDK download when opened; ordinary town visits do not need to load it. Check the latest measured bundle sizes and limitations in [verification](docs/verification.md).

## 4. Opt a town into support

Open **Create town → Builder support (optional)** on the planning sheet.

**Recommended: use a dedicated receiving wallet for project support, separate from your everyday personal wallet.**

中文建议：为项目准备一个专用赞赏收款钱包，与日常个人钱包分开。

### Creator notice

The creator notice appears only when choosing the optional wallet settings or restoring valid wallet configuration. Its acknowledgment starts unchecked; checking it allows the creator to continue configuring support. Cancelling returns to basic town planning. It is an acknowledgment, not wallet authorization or a legal waiver.

- Address changes apply when a visitor loads updated town data. Old tabs or cached copies may retain the old address; sent transactions keep their original destination. Keep access to the old receiving wallet.
- A new domain or port requires the corresponding Privy allowed origin. Avoid forced reloads during transfers; a deployment cannot guarantee that an open page will never reload.
- Pending recovery depends on the same browser and site origin with its data retained. Check the transaction before trying again; changing device/domain or clearing storage can remove the app's recovery context.
- Senders pay network fees. Review Privy's current limits and deployment billing in the setup guide. This extension uses Sepolia test ETH with no monetary value.

Visitor login and each final transfer review also receive relevant acknowledgment controls. A changed amount, recipient, sending wallet or review resets the transfer acknowledgment. Checking a box is **not wallet authorization**; the separate action and wallet approval still apply. Local creator checks and 21 compact React-panel browser scenarios passed, including English/Chinese desktop/mobile layouts and secondary detail/notice pages. Final release compilation, human visual review and live-wallet verification remain separate.

An unconfigured town keeps its original visitor experience: no wallet dialog, wallet login, acknowledgment checkbox or SDK requirement. Unconfigured projects in mixed towns also retain their virtual mailbox interaction. These notices belong only to the optional wallet flow, not ordinary GitHub capture or town exploration.

中文要点：新地址只影响加载了新数据的页面，旧页可能仍用旧地址；已发送交易不随配置变化。请保留旧钱包访问权限。勾选“已阅读”仅用于确认已看过说明，不等于授权钱包转账。

### Recipient fields

- **Personal:** enter one public receiving address for the builder.
- **Community:** use one `owner/repository = address` line per participating project. Each repository must already be in the town's roster. Leaving a project out gives it no real-transfer destination; there is no organizer-wallet fallback.

Leave these fields empty to retain virtual mailbox coins. A town with at least one valid recipient shows the upper-right wallet icon. A configured project's mailbox opens the support review card; its project card also provides an accessible action, including at early building stages. A project without a recipient keeps its existing virtual mailbox behavior and receives no wallet-setup prompt.

The complete configuration/JSON export retains receiving addresses. Keep test-recipient backups local and out of GitHub. To test on a deployed site, open **Create town → Not ready yet? → Load a plan** and select the full bundle: it restores in that browser without publishing the JSON. The App ID belongs in the host's build environment, not a committed account-specific configuration. A broadly shared recipient-enabled town still needs deliberate configuration publication; local import does not create that shared route. Addresses used by the running wallet interface and blockchain transactions remain publicly observable. [Import and deployment details](docs/deployment.md#test-a-local-backup-on-a-deployed-site).

Buildergame checks the address format and checksum, not who controls the wallet or whether it belongs to the repository's developer. Agree on the recipient with the builder before using it. Do not label the destination GitHub-verified.

For file configuration, put `support` in the event manifest (under `event.support` in a full town backup):

| Field | Value |
| --- | --- |
| `version` | `1` |
| `chainId` | `11155111` |
| `recipient` | One valid nonzero address; personal towns only |
| `projectRecipients` | An object mapping lowercase canonical `owner/repository` names to addresses; community towns only |

Use **either** `recipient` **or** `projectRecipients`. Omit `support` when disabled. Wrong chains, invalid/zero addresses, unknown repositories and duplicate normalized mappings are rejected. Older backups without support fields continue to work. The [configuration module](src/support-config.mjs) defines validation; the [deployment guide](docs/deployment.md#publish-from-github-files-lowest-maintenance-option) explains publishing a town backup under its static route.

## 5. Verify a real test-network flow

1. Publish or open the configured town. Confirm that ordinary browsing, cards and snapshots still work before connecting a wallet.
2. Click its wallet control or a configured project's mailbox. The recipient is shortened initially; expand **Review full address** and verify the complete destination, project and **Ethereum Sepolia** label. Display masking does not make an address private on the network or in runtime data.
3. Sign in through Privy. For embedded-wallet verification, use or create the **Privy wallet itself**; merely connecting an external wallet tests a different path.
4. Copy that sending wallet's public address and fund it with Sepolia test ETH. Test coins held in another wallet do not automatically become its balance.
5. Enter a small amount, then use **Review test transfer**. The implementation permits more than zero and at most 1 test ETH, with up to 18 decimal places. Check the balance and estimated network fee.
6. Read and acknowledge the reviewed transfer notes, explicitly confirm the amount in Buildergame, and approve the wallet prompt. Wait for a successful receipt; only then should the mailbox success animation play. A changed review requires fresh acknowledgment.
7. Open **View Sepolia transaction** and check the actual network, sender, recipient, value and receipt status. A connected wallet or a returned hash alone is not proof of arrival.
8. Also verify cancellation and an unconfigured project's virtual mailbox. Record public transaction evidence only with the relevant participants' authorization; keep login codes and account secrets out of recordings.

There is no platform transaction fee in this implementation. The sender still needs network fees, and Privy's service terms/usage limits apply. Before public deployment, check the current [Privy pricing](https://www.privy.io/pricing) and your application's activation/billing terms: included monthly active users, signature limits, overage charges and any payment-method requirement. Production activation may require a payment method even when selecting a Free plan. Development access and a Free label do not promise unlimited production usage, free gas or no billing prerequisites. Standard Email/Wallet login does not require enabling the optional custom-auth features.

### Explain transaction costs and finality

| Transaction stage | What the visitor should know |
| --- | --- |
| Rejected or stopped before broadcast | Declining wallet approval or failing a pre-send check sends no transaction and spends no on-chain gas for that request |
| Broadcast, still pending | Pending is not failure. Check the known transaction instead of sending it again |
| Failed on chain | The support amount is not delivered to the recipient, but execution can consume a network fee |
| Confirmed successfully | Buildergame cannot reverse the transfer. A refund requires the recipient to make a separate return transfer, which can also incur a fee |

Check the destination and amount before confirmation. If a wallet response is lost, do not assume the request stopped before broadcast; inspect its history first. This demo uses **Sepolia test ETH with no monetary value**.

中文要点：广播前取消不花链上手续费；已上链但失败仍可能消耗手续费。待确认不等于失败，不要重复发送。成功后平台无法撤回，退款需收款人另行转回。当前仅为无货币价值的测试币。

## Failure and recovery

| What happens | What to do |
| --- | --- |
| Wallet control absent | Check whether this town has a valid recipient; unconfigured towns intentionally retain the base experience |
| Wallet unavailable | Check the built App ID, exact allowed origin and network access; rebuild after environment changes |
| Wrong network or a declined switch | Return to Sepolia and review again; no mainnet fallback is supported |
| Insufficient balance | Fund the selected sending wallet with enough Sepolia test ETH for amount plus fee |
| User rejects approval | No success animation; return to review if the user wants to try again |
| Review read times out before signing | Check the connection and repeat review; this step does not send a transaction |
| A hash exists but the receipt is unconfirmed | Use **Check confirmation** or the explorer; do not send again automatically |
| The wallet response is lost and the send status is unknown | Inspect the sending wallet's history. Use the actual transaction hash for receipt-only recovery; do not blindly retry |
| Receipt reports a revert | The support amount did not arrive; a network fee may still have been charged |

Closing the browser or reloading cannot cancel a transaction already broadcast. The local refinement implements critical-phase UI locking, a same-origin Web Lock and a persistent `localStorage` pending record, replacing the initial tab-local checkpoint. Controller and browser fixtures have passed; final integrated and hosted acceptance remains pending. Recovery rechecks an existing transaction and never automatically sends another. The guard coordinates cooperating tabs on the same origin, not other domains/devices or modified clients. Privy manages its own authentication/session storage; Buildergame does not export those sessions, keys or signatures.

## Maintenance considerations

These are deployment considerations and possible follow-up work, not features implemented or a commitment to expand this demo.

| Scenario | Current boundary and maintenance consideration |
| --- | --- |
| A builder changes their recipient | Verify the new destination with the builder and republish the town configuration. Already downloaded or cached copies may still contain the old address |
| A visitor returns with an old town/configuration | The displayed recipient is from that town's data; there is no live ownership registry. Make the current public configuration clear when sharing updates |
| A transaction is pending across a return visit | Pending recovery and an explorer help check a known hash. Clearing browser storage or using another device does not provide a complete in-app transaction history; the newer persistent guard/recovery path is still under verification |
| Privy, email delivery or a chain provider is unavailable | Optional support may be unavailable while the base town remains usable. Verify origins/configuration and provider status before changing transaction state or retrying a send |
| Usage or dependencies grow | Review provider quotas/billing and the optional SDK's size. Check wallet/login and failure paths after dependency upgrades; package installation alone does not verify the live service |
| A visitor needs account recovery or external wallet management | Privy's recovery/export capabilities are separate from Buildergame's UI. This demo lacks a key-export control; document the current method clearly before considering any additional recovery/export interface |

A future mainnet release needs its own review of recipient changes, durable transaction visibility and wallet-management support. Those items are not enabled merely by replacing a testnet address.

Deployment-maintenance assessment: publishing a new Vercel build does not normally force an already open page to reload, but refresh, navigation or a crash can still replace it. A submitted transaction continues independently. Avoid forced reloads during a critical transfer. Preserve compatible pending-record formats across releases; do not silently delete an unfamiliar record version or interpret it as permission to resend. Valid earlier tab-only checkpoints now have a migration path into the persistent guard, with a passing controller fixture; this does not establish every legacy edge case or a complete hosted refresh/authentication journey. These are release requirements and scoped verification results, not a guarantee that every interrupted session has been tested.

## Scope and development references

This version does not enable mainnet payments, ERC-20/USDC, cross-chain transfers, onramps, gas sponsorship, escrow, a custom payment contract or ENS permissions. Support does not change organizer-defined house growth and grants no ownership, shares or financial returns. The existing [project license](LICENSE) and third-party terms still apply.

Run `npm test` and `npm run build`. Tests use deterministic provider fixtures; successful tests are separate from a live signed transaction. Start implementation review at [the lazy entry](src/support/panel.ts), [Privy wallet UI](src/support/wallet-panel.tsx), [transaction lifecycle](src/support/transaction.mjs) and [scope/acceptance](specs/0016-optional-privy-support.md).

中文要点：个人小镇一个地址，社区按项目独立配置。测试币必须在实际发送的 Privy 钱包中；待确认或响应丢失时先查交易，不要重复发送。未配置地址的邮箱继续保留原有投币彩蛋。
