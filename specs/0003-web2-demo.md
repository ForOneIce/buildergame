# Web2-first town Demo

Date: 2026-09-11 (Asia/Shanghai). Implementation authorized by prompt 0007.

> 中文提示：先跑通演示；真实名单、视觉素材后换，ENS 后续接入。

## User requirements

- Pilot ETHOnline 2026; reusable for Web2 hackathons without wallets.
- Organizer growth combines cumulative commits (low), stars (medium), forks (high).
- User supplies actual project list and visual references later.
- Defer ENS and permissions; retain a small integration boundary.
- Preserve fixed plots, historical transitions, organizer branding, project signs and links.

## AI implementation choices (provisional)

- Vite, TypeScript and Three.js, no UI framework or database.
- Linear score = commits × 1 + stars × 3 + forks × 6. These coefficients express the requested ordering only and are not official event criteria. Forks count observed copies, not verified contribution or extensibility.
- Stage thresholds: 0, 30, 100, 220, 450 for foundation, frame, cottage, townhouse, decorated house. Confirmed zero commits overrides to empty land; unknown data never becomes zero.
- JSON event manifest and immutable snapshot files. Each snapshot saves rule version, metrics, effective score, stage, and plot. Sample history is clearly fictional.
- Procedural replaceable buildings; accessible project list and reduced-motion support.
- Server-side CLI captures public GitHub metadata and cumulative commits reachable from the captured default-branch HEAD via GraphQL. Token stays in the local environment. Failed requests carry forward known observations marked stale, or remain unknown.
- A small link resolver is the future ENS seam. No ENS SDK, authentication, wallet, chain, or generalized plugin framework.

## Delivery plan

1. Record scope and prompt, scaffold data contract and app.
2. Implement stable town, history controls, project details, import validation and snapshot capture.
3. Test mapping, immutable history, plot identity, stale handling, and invalid input; typecheck/build and inspect UI where tools permit.
4. Document organizer setup and verification, record AI contributions and dependency reuse.

## Acceptance

- Static sample runs without credentials and explicitly identifies fictional data.
- Timeline animates saved stages while plots/camera remain stable; unchanged counts preserve buildings.
- Scores are absent from viewer UI; source metrics may be inspected in project details.
- All projects are reachable through keyboard-operated HTML controls even without WebGL.
- Organizer can replace event/project JSON, capture a snapshot, build and self-host static output.
- Snapshot collector never edits older records or exposes tokens to the browser.
- Actual event data, final art, live scheduled hosting and ENS integration remain pending.
