# Lock support submissions and explain failure states

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instructions

> 处理好钱包、赞赏投币的异常情况的前端显示和处理

> 投币后页面需要锁定不给游客操作其它内容和防止接口重放等攻击

## English translation (AI)

Handle wallet and support-transfer exceptions with appropriate frontend states and behavior.

After initiating a coin transfer, lock the page so visitors cannot operate other content, and prevent repeated/replayed submission attempts.

## Scope

Distinguish read-only review from the critical signing/submission/receipt phase. During a critical transfer, block unrelated game controls and edits/closure of the support card while keeping Privy's approval surface and receipt checks accessible. Coordinate ordinary same-origin browser tabs with Web Locks and a public pending-transaction checkpoint; if the required browser safeguards are unavailable, do not offer a new real send. Virtual mailbox interactions remain independent.

This is browser-side duplicate prevention, not a claim of a server idempotency layer or protection against maliciously modified clients. Ethereum's account nonce prevents the same signed transaction from executing twice on the same canonical chain; separately signed transactions with different nonces can both execute. [Specification 0017](../specs/0017-support-lock-and-failure-handling.md) defines the authorized scope and observable checks. Implementation and verification are pending at scope creation.
