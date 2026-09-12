# Assess Vercel deployment

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project question

这个项目可以部署到vercel吗

## English translation (AI)

Can this project be deployed to Vercel?

## Assessment and concrete output

Codex read official Vercel documentation and prepared a minimal static Vite [configuration](../vercel.json) and [deployment guide](../docs/vercel.md). Static town viewing can use generated physical town pages; the current Node API's in-memory sessions and filesystem writes require a different runtime/storage design for Vercel Functions.

The guide distinguishes available static behavior from a proposed Functions/database/optional Blob upgrade, explains GitHub-backed snapshot publication and records free-plan conditions. JSON configuration and whitespace checks passed. No service was created, paid plan enabled, repository pushed or remote deployment performed. Real Vercel routing remains unverified until deployment.

Subsequent [instruction 0042](0042-browser-github-token-access.md) added a direct browser-token option for GitHub reads/manual capture without Functions. Physical static-page/subpath tests and the production build passed; static preview creation still requires exported JSON committed and rebuilt before the town is public. Confidential OAuth and immediate server publication retain their separate backend requirements.
