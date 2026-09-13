# Clarify virtual coins and wallet support

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instruction

> “向花园屋的邮箱投一枚金币，看看落入邮箱的效果。虚拟金币没有货币价值，仅保留在本次游览中。  ”这提示容易有歧义，提示应说明演示小镇不触发真实钱包交易，真实交易在创建交易小镇之后可以真实触发。

## English translation (AI)

The hint “Drop a coin into the garden home's mailbox and watch it land. Virtual coins have no monetary value and remain only for this visit” is ambiguous. Explain that the sample town does not trigger real wallet transactions, while actual transactions can be initiated after creating a town configured for them.

## Copy clarification

The sample mailbox interaction demonstrates an animation and never initiates a wallet transaction. A created town can enable chain support by configuring a receiving address; the visitor must then explicitly confirm through the wallet. The current implementation supports Ethereum Sepolia test ETH only. This clarification preserves the virtual interaction and optional transaction flow; it does not enable mainnet or establish a successful live transfer.

Codex updated only the bilingual investment note in `src/mailbox-ui.ts`. The parent agent reported passing TypeScript and scoped whitespace checks. No new behavioral test was added for this copy-only change.
