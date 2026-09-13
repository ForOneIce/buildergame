# Explain and acknowledge wallet notices

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instruction excerpts

> 可以在创建城镇选择钱包配置时添加弹窗进行清晰说明，说明对建设者的影响（包含变更、部署更新等场景）游客投币和钱包登陆时也相应梳理提醒。

> 就像金融产品的用户须知一样，提示弹窗要求用户阅读后勾选已知.

> 钱包的所有交互都只在配置情况下显示，不影响不配置情况的原有交互

## English translation (AI)

When a creator chooses wallet configuration, show a clear dialog explaining its effects, including address changes and deployment updates. Organize corresponding notices for visitor wallet login and support transfers.

Like a financial product's user notice, require users to read the dialog and check that they understand it.

Show wallet interactions only when configured, without changing the original experience when no wallet is configured.

## Scope

Add concise English/Chinese notices at three relevant points: enabling creator wallet configuration, starting visitor wallet login, and confirming each reviewed transfer. Checkboxes start unchecked. Acknowledgment enables the next interface action only; it is not wallet authorization, a legal waiver or a guarantee of protection. Keep Privy's explicit wallet approval. Do not use forced scrolling or countdowns. The creator notice appears only after choosing the optional wallet settings (or restoring valid wallet configuration); cancelling preserves ordinary town creation. Unconfigured visitor paths have no wallet notice, login, acknowledgment or SDK requirement, and virtual coin interactions remain unchanged.

Explain dedicated receiving wallets, changed addresses in new versus old views, the unchanged destination of already sent transactions, retained access to old wallets, deployment/allowed-origin changes, same-browser/origin recovery limits, testnet-only scope and provider/network costs. Changing a transfer's amount, recipient, sender or review must reset its acknowledgment. [Specification 0017](../specs/0017-support-lock-and-failure-handling.md) contains the extended notice acceptance requirements. Publication architecture and this increment's visual/live verification remain pending.
