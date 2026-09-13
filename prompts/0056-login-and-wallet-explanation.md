# Explain login and wallets to visitors

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instruction excerpts

> 补充一个游客用户提示解释下登陆和钱包的关系

> 对的 降低用户理解门槛 用最简洁清晰的文案提示清楚钱包。提供钱包组件官方的说明引导用户自行查看钱包管理方法。

> 赞赏投币游客还是会比较谨慎，需要说明交易风险。

## English translation (AI)

Add a visitor-facing explanation of the relationship between login and a wallet.

Lower the learning barrier with the shortest clear wallet explanation. Provide the wallet component's official guidance so users can read how to manage their wallets.

Visitors may be cautious about sending support, so explain transaction risks.

## Scope

Clarify that email authenticates an account, while Privy creates or restores its embedded Ethereum wallet for this app. Wallet keys are not derived from the email address. Signing in does not automatically import an external wallet or its balance; connecting an existing wallet remains optional. Transfers still require review and wallet confirmation, with test funds in the selected sending wallet. Link official wallet-management guidance and distinguish pre-broadcast cancellation, pending transactions, on-chain failure costs and confirmed-transfer finality. This is explanatory copy, not a change to authentication, wallet custody or transaction behavior. Do not claim a private-key export interface or absolute security. Personal questions and account history are not included.
