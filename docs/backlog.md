# Next-version backlog

Deferred development checks; these items are not completed verification.

## Short-height town controls

- **Status:** regression recheck needed on the current revision.
- **Observed boundary:** an earlier 1280 × 720 browser viewport showed overlap between Support builders and the lower-left town totals. The later interface revisions have not been explicitly verified against that exact observation.
- **Acceptance:** sample and created towns keep support, totals, minimap and navigation controls readable and operable at 1280 × 720 without overlap.

## Interrupted session/reload recovery

- **Status:** planned for the next version; deployed behavior remains unverified.
- **Scope:** verify recovery on the actual deployed origin after reload or interruption of an unresolved Privy/Sepolia transfer. Existing controller and mock-SDK browser fixtures do not replace this live check.
- **Acceptance:** preserve the original reviewed intent and transaction reference; check that transaction after reopening; do not automatically resend; prevent another send while the original outcome is unresolved; distinguish pending, failure and a matching successful receipt; release the interaction lock only when appropriate.
- **Evidence to record:** exact tested revision/origin, interruption point, observed recovered state, original-versus-recovered transaction consistency, final receipt outcome and navigation/lock behavior. Keep sensitive setup and full test-wallet information out of public records. Any new wallet confirmation remains a human action.
- **Current boundary:** the observed ordinary transfer succeeded, its receipt matched Etherscan, and a separate final-preview cancellation restored interaction without a second transaction. Those checks do not establish interrupted recovery. This verification is scheduled for the next version.
