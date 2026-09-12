# Direct GitHub token access from the browser

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

github使用token的方式登陆不需要后端服务，纯通过接口请求数据。不过会存在网络异常、加载超时等异常。

## English translation (AI)

GitHub sign-in using a token does not need a backend service; data can be requested directly through the API. Network failures, loading timeouts and similar errors still need to be handled.

## Architecture interpretation and implementation

The requested static-client option uses an explicitly supplied GitHub personal access token to call GitHub's API from the browser. It is distinct from the existing confidential OAuth redirect flow, which still needs the Node backend. Direct access supports identity/avatar and public repository data; it does not by itself publish files to GitHub or write persistent data to the hosting platform.

The implemented flow keeps the token only in browser memory for the current session. It must not enter localStorage, sessionStorage, IndexedDB, cookies, URLs, logs, configuration files, town backups or public assets. Clearing/disconnecting the account or reloading the page discards it. Requests use only the intended GitHub API origin, with explicit timeout, cancellation and useful network/auth/rate-limit errors. No token file or new server secret is required.

Local data commit `309d32b` includes the browser adapter/shared transport. Unit/integration checks, final affected lifecycle/PAT browser tests and an unauthenticated public repository capture passed. Browser fixtures verified retry/error handling, token-free storage/exports, disconnect/reload clearing, discarded late listing responses, static preview refresh and safe draft recovery without backend writes or progress requests. No real token or OAuth authentication was tested. [Workflow specification](../specs/0012-named-towns-and-static-snapshots.md), [verification and revision boundaries](../docs/verification.md).
