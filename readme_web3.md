# Optional developer support with Privy

Buildergame's base town experience works without Privy, a wallet or a blockchain account. Enable this extension only when a town creator wants visitors to try direct support for its builders. Ordinary GitHub capture, snapshots, exploration and virtual mailbox coins remain available on their own.

**Current scope: native test ETH on Ethereum Sepolia (chain ID 11155111).** Test coins have no monetary value. Local automated checks and production compilation have passed; a live Privy transfer and the deployed configuration still require verification. See [current evidence](docs/verification.md#optional-privy-support-0053-and-post-test-recording-plan-0054).

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

- **Personal:** enter one public receiving address for the builder.
- **Community:** use one `owner/repository = address` line per participating project. Each repository must already be in the town's roster. Leaving a project out gives it no real-transfer destination; there is no organizer-wallet fallback.

Leave these fields empty to retain virtual mailbox coins. A town with at least one valid recipient shows the upper-right wallet icon. A configured project's mailbox opens the support review card; its project card also provides an accessible action, including at early building stages. A project without a recipient keeps its existing virtual mailbox behavior and receives no wallet-setup prompt.

The mapping is **public** in configuration/JSON exports. Buildergame checks the address format and checksum, not who controls the wallet or whether it belongs to the repository's developer. Agree on the recipient with the builder before publishing. Do not label the destination GitHub-verified.

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
2. Click its wallet control or a configured project's mailbox. Review the project, full recipient address and **Ethereum Sepolia** label.
3. Sign in through Privy. For embedded-wallet verification, use or create the **Privy wallet itself**; merely connecting an external wallet tests a different path.
4. Copy that sending wallet's public address and fund it with Sepolia test ETH. Test coins held in another wallet do not automatically become its balance.
5. Enter a small amount, then use **Review test transfer**. The implementation permits more than zero and at most 1 test ETH, with up to 18 decimal places. Check the balance and estimated network fee.
6. Explicitly confirm the amount in Buildergame and approve the wallet prompt. Wait for a successful receipt; only then should the mailbox success animation play.
7. Open **View Sepolia transaction** and check the actual network, sender, recipient, value and receipt status. A connected wallet or a returned hash alone is not proof of arrival.
8. Also verify cancellation and an unconfigured project's virtual mailbox. Record public transaction evidence only with the relevant participants' authorization; keep login codes and account secrets out of recordings.

There is no platform transaction fee in this implementation. The sender still needs network fees, and Privy's service terms/usage limits apply. Before public deployment, check the current [Privy pricing](https://www.privy.io/pricing) and your application's activation/billing terms: included monthly active users, signature limits, overage charges and any payment-method requirement. Production activation may require a payment method even when selecting a Free plan. Development access and a Free label do not promise unlimited production usage, free gas or no billing prerequisites. Standard Email/Wallet login does not require enabling the optional custom-auth features.

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

Closing a card or leaving the town cannot cancel a transaction already broadcast. The app stores public pending intent/sender/state/hash in tab-local `sessionStorage` when available, separate from exported town data. Recovery rechecks an existing transaction and never automatically sends another. Privy manages its own authentication/session storage; Buildergame does not export those sessions, keys or signatures.

## Scope and development references

This version does not enable mainnet payments, ERC-20/USDC, cross-chain transfers, onramps, gas sponsorship, escrow, a custom payment contract or ENS permissions. Support does not change organizer-defined house growth and grants no ownership, shares or financial returns. The existing [project license](LICENSE) and third-party terms still apply.

Run `npm test` and `npm run build`. Tests use deterministic provider fixtures; successful tests are separate from a live signed transaction. Start implementation review at [the lazy entry](src/support/panel.ts), [Privy wallet UI](src/support/wallet-panel.tsx), [transaction lifecycle](src/support/transaction.mjs) and [scope/acceptance](specs/0016-optional-privy-support.md).

中文要点：个人小镇一个地址，社区按项目独立配置。测试币必须在实际发送的 Privy 钱包中；待确认或响应丢失时先查交易，不要重复发送。未配置地址的邮箱继续保留原有投币彩蛋。
