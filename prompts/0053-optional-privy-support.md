# Add optional Privy support for builders

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instruction excerpts

The excerpts below preserve the project requirements from successive messages. Personal setup and submission administration are omitted.

> 虚拟货币捐赠直达开发者项目建设钱包是我想做，觉得对builder有正向激励的功能。但是我不希望它影响其它现有功能。

> 缺少地址项目仍显示邮箱和投币互动效果，只是不显示钱包配置提示和真实投币相关交互，最大限度保留已有前端设计，避免大规模地变动3d设计。仅影响ui控件面板弹窗之类的小改动。

> 创建时配置了钱包 右上角才显示钱包图案按钮。点击邮箱才显示确认卡。如果创建时不配置钱包地址，邮箱点击动画保持原来的逻辑。

> 采用 Privy ，接入钱包可选扩展。用户是否接受由创建城镇的人对社群属性自行判断。继续开发迭代，优先完成测试链操作测试。

## English translation (AI)

The intended feature is cryptocurrency support paid directly to a developer's project-building wallet, providing encouragement without affecting existing features.

Projects without a recipient address must retain their existing mailbox and coin interaction, with no wallet-configuration prompt or real-payment interaction. Preserve the frontend and avoid extensive changes to the 3D design; changes should mainly affect interface panels and dialogs.

Show a wallet icon in the upper-right only when a wallet was configured during town creation. Clicking a configured mailbox opens the confirmation card. Without a configured recipient, mailbox clicks retain the original animation.

Use Privy as an optional wallet extension. Town creators decide whether it suits their communities. Continue implementation, prioritizing test-network operation checks.

## Implementation scope derived from the conversation

- A personal town has one optional recipient; a community town explicitly maps each opted-in repository to its own recipient. An unconfigured community project does not inherit another project's address.
- Start with native test ETH on Ethereum Sepolia. Retain the five accepted building appearances and existing GitHub, snapshot, publication, exploration and audio workflows.
- A configured mailbox requests review of recipient, network and amount. Animate success only after a successful transaction receipt; virtual coin feedback remains separate.
- Scope, acceptance criteria and implementation verification are tracked in [specification 0016](../specs/0016-optional-privy-support.md). This record authorizes implementation, not a claim that a live transaction or prize eligibility has been verified.
