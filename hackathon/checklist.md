# Submission checklist

Check items only with evidence. Final submission status has not been verified.

## Eligibility and process

- [ ] Verify acceptance and check-ins; second check-in due 2026-09-11 03:59 UTC.
- [ ] Confirm members and the 1–5 person team limit.
- [ ] Select Classic/Continuity and disclose pre-existing project-specific work.
- [ ] Verify partner eligibility for that route; select at most three partners.
- [x] Preserve development history; the published repository has incremental project commits.
- [ ] Complete AI disclosure, actual human contributions, prompts, specs, and planning records.
- [ ] Check licenses for code, assets, and reused work.

## Product and materials

- [ ] Demonstrate one primary workflow and important failure cases.
- [ ] Provide an English README with setup, environment examples, architecture, and limitations.
- [ ] Make code/design materials accessible to judges without secrets or unauthorized personal data.
- [ ] Record actual verification and unfinished work.
- [ ] Explain integration locations, functions, and evidence for each partner.
- [ ] Complete the selected partner's required feedback and live integration evidence. This direct-transfer implementation has no custom contract to deploy or verify.
- [ ] Verify the mandatory final video is 2–4 minutes at 720p or higher, includes intelligible spoken audio and no background music. The old UI-effects-only and silent videos fail the latest spoken-audio requirement and must not be submitted.
- [x] Prepare English submission answers, the [recording timeline](demo-script.md) and [213-word narration](demo-narration.txt).
- [ ] Receive and review the user's human narration, then replace the TTS reference in the final competition mix. Human audio is not yet received.
- [x] Prepare a 512×512 logo, 1280×720 cover and three actual app screenshots; see [media and provenance](media/README.md).
- [ ] Verify normal-speed screen capture, no phone recording and human narration with no TTS in the final export. See [verified official video rules](rules.md#video-wording-and-current-preparation).
- [ ] Upload the actual final video file to the project page; do not substitute a YouTube, cloud-storage or other video URL.
- [ ] Click **Submit** after all edits and confirm success before 2026-09-13 16:00 UTC (September 13, 12:00 pm ET).
- [ ] If seeking Finalist consideration, check the individual assignment and prepare a four-minute demo plus three-minute Q&A.

## Partner-specific register

| Partner and prize | Official link | Route eligibility | Required integration/materials | Evidence/status |
| --- | --- | --- | --- | --- |
| Privy — Best financial flow, candidate | [Official requirements](https://ethglobal.com/events/ethonline2026/prizes/privy) | Verify final route requirements | Core Privy integration, creation/use of a Privy wallet, and a functional financial flow; specific source links and actual demo evidence | Source published; 82 Node tests, 21 compact-wallet scenarios and combined build passed. Hosted login, funded review, human-approved Sepolia transfer, matching receipt and final-preview cancellation verified; replacement video pending |
| ENS — roadmap only | [Official requirements](https://ethglobal.com/events/ethonline2026/prizes/ens) | Not assessed for this increment | Actual ENS integration required | Not implemented; do not claim as a used protocol |

## Optional Privy increment

- [x] Record creator opt-in, recipient scope, unchanged virtual mailboxes and locked buildings in [specification 0016](../specs/0016-optional-privy-support.md).
- [x] Verify personal recipient and per-project community mapping, including unconfigured and legacy JSON; configuration tests and the community browser fixture passed.
- [x] Verify ordinary configured-town creation/browsing does not load the wallet panel or request a provider; browser fixture passed. Broader hosted regression remains separate.
- [x] Exercise wrong-network, signing-rejection, balance/amount, receipt-failure, timeout, repeated-action and late-callback cases with controller/browser fixtures. These do not replace actual hosted login and transaction checks.
- [x] Run the production build/model-lock and relevant mailbox/browser regressions; all ten accepted GLBs unchanged. See verification for the exact scope.
- [x] Complete an actual user-confirmed Ethereum Sepolia transfer through Privy and verify its successful receipt. The observed 0.001 test-ETH result matched Sepolia Etherscan success, sender, recipient and value; see [verification](../docs/verification.md#successful-hosted-sepolia-transfer-observed-on-2026-09-13-utc). This does not prove every recovery case.
- [x] Add publicly accessible provider and transfer code permalinks to [summitinfo.md](summitinfo.md).
- [ ] Add actual chain evidence only after a successful test and approval to publish identifying transaction data.
- [ ] Verify the deployed App ID/origin configuration and test the exact hosted town used in the demonstration.
- [ ] Record the final spoken demonstration as the current priority: sample exploration → actual public-GitHub town creation with support enabled → new-town exploration → funded Privy review → human-confirmed Sepolia transfer and matching successful receipt. The prerequisite live transfer and cancellation have been verified. Follow the [updated recording plan](demo-script.md); preserve actual building stages and do not invent a coin animation for a timber-frame town.
- [ ] Keep sensitive setup and full test recipients out of public footage, using clearly labeled normal cuts where needed; preserve actual metrics, the same transaction and genuine pending/confirmed states. No fabricated success or accelerated footage. The human must still approve the actual wallet transaction, regardless of voice source.
- [ ] Verify the replacement is 2–4 minutes at 720p or higher, with the user's human narration and original site effects mixed in stereo, and no background music. Keep the TTS reference and old silent videos out of the competition final.
- [ ] Prepare the same replacement footage with original interface effects only as the requested upload contingency. Clearly identify that it lacks spoken audio and is not verified to satisfy the latest notice.
- [ ] Reconcile technology selections, prize answers, rating and feedback with demonstrated functionality; remove any integration still represented only by a roadmap.

## Explicitly deferred to the next version

- [ ] Verify interrupted session/reload recovery on the deployed origin. The human deferred this work to the [next-version backlog](../docs/backlog.md); it is unverified and is not a blocker for the final video. Passing controller/mock-SDK fixtures and a successful ordinary transfer do not complete this item.
