# Sample-town mailbox coin demonstration

Date: 2026-09-13 (UTC). Status: implementing; acceptance checks pending. Source: [instruction 0045](../prompts/0045-sample-mailbox-coins.md).

## Purpose and smallest workflow

Give visitors a playful way to imagine supporting a project while exploring a fictional sample town. The human requested a gold-coin cursor over a stage-five mailbox, a virtual deposit animation, and an investment explanation below landscape tours. Real Web3 work is explicitly paused.

1. Open a sample town. An investment/building-support action appears below the landscape tour controls, using the shared game materials and English/Chinese copy.
2. Open its modal to read a future wallet-connection prompt and concise examples of sponsorship approaches. It clearly describes a simulation with no money or wallet connection and does not claim an implemented partner integration, financial return or project funding.
3. Hover an existing stage-five mailbox to see a coin cursor. Activate it to send a virtual coin into that specific mailbox, with a small sparkle and project-specific receipt. The receipt is a temporary visual acknowledgement, not a transaction or stored balance.
4. Keyboard and touch visitors can use Find mailbox and Try demo coin actions in the modal to reach an eligible project and play the same feedback without precision hovering. If the selected snapshot contains no stage-five mailbox, show an honest unavailable state; do not modify its stage.

## Implementation choices and dependencies

AI implementation choices: attach a raycast target to the mailbox already present in the accepted stage-five GLB; use original lightweight coin/effect geometry or CSS with the existing Three.js and UI stack. Do not add another mailbox model or modify any of the ten locked GLBs. The five-stage growth rules, cumulative metrics and snapshot data remain unchanged.

The effect exists only in the current sample-view lifecycle. Snapshot switches, landscape switches and navigation cancel it and clear temporary feedback/cursor state. Repeated activation remains bounded. Reduced motion replaces the flight/burst with gentle, short feedback. Modal controls retain accessible names, keyboard focus, Escape/close behavior and focus restoration.

## Scope and external boundaries

- Interactive mailboxes are restricted to stage five in fictional sample towns. Stages one through four and all created/imported/published towns retain their existing behavior.
- No wallet/provider calls, wallet-address collection, token, chain transaction, signature, payment, sponsor SDK, funding ledger, storage or scoring change.
- Sponsorship explanations are illustrative future options. No partner/track selection, payment commitment or production financial feature is implied.
- Reuse the accepted buildings and existing free UI materials. No paid asset or external dependency is required. Walking, interiors and resident maps remain deferred.

## Observable acceptance criteria

1. The investment action is below landscape tours only in sample views; its modal states the demo/future-wallet boundary in English and Chinese.
2. A stage-five mailbox has a precise, usable hit region and coin cursor. A house/sign or earlier-stage object does not accidentally send a coin. Normal drag/orbit interaction still works.
3. Clicking/tapping an eligible mailbox displays a bounded coin/drop/sparkle effect and identifies the correct fictional project in the virtual receipt. No wallet prompt from a provider or payment/network side effect occurs.
4. Find mailbox and Try demo coin work through keyboard/touch. Unavailable mailboxes are handled without inventing a stage-five building. Closing the modal restores focus; responsive layouts keep controls reachable.
5. Snapshot/landscape/view changes clear effects and pointer state. Repeated activation does not accumulate permanent objects or balances. Reduced-motion mode avoids a long flight or burst.
6. Non-sample behavior, project cards, existing snapshot navigation and all ten building fingerprints remain unchanged.

## Verification plan and status

Check the sample pointer and modal paths, keyboard/touch alternatives, cancellation and reduced motion, and stage/non-sample exclusions. Verify bilingual narrow/desktop presentation, production build and the locked-model fingerprints. Record executed commands, fixtures and screenshots in [verification](../docs/verification.md); plans above are not passing results. No implementation acceptance, actual funds, live wallet integration or human visual approval is claimed yet.

中文简注：仅示例小镇的第五阶段邮箱投虚拟金币；不连接钱包、不转账、不保存余额。
