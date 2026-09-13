# Submission checklist

Check items only with evidence. Final submission status has not been verified.

## Eligibility and process

- [ ] Verify acceptance and check-ins; second check-in due 2026-09-11 03:59 UTC.
- [ ] Confirm members and the 1–5 person team limit.
- [ ] Select Classic/Continuity and disclose pre-existing project-specific work.
- [ ] Verify partner eligibility for that route; select at most three partners.
- [ ] Preserve development history.
- [ ] Complete AI disclosure, actual human contributions, prompts, specs, and planning records.
- [ ] Check licenses for code, assets, and reused work.

## Product and materials

- [ ] Demonstrate one primary workflow and important failure cases.
- [ ] Provide an English README with setup, environment examples, architecture, and limitations.
- [ ] Make code/design materials accessible to judges without secrets or unauthorized personal data.
- [ ] Record actual verification and unfinished work.
- [ ] Explain integration locations, functions, and evidence for each partner.
- [ ] Complete required feedback files/forms, testnet deployment, and contract verification.
- [ ] Verify a 2–4 minute feature video at 720p or higher, with interface audio and no background music; keep a separate export without an audio stream.
- [x] Prepare English submission answers and an optional later live-demo script; added narration is not a blocker for the initial feature recording.
- [x] Prepare a 512×512 logo, 1280×720 cover and three actual app screenshots; see [media and provenance](media/README.md).
- [ ] Check for no AI voiceover, speeding up to fit the limit, or phone recording.
- [ ] Submit and confirm success before 2026-09-13 16:00 UTC.
- [ ] If seeking Finalist consideration, check the individual assignment and prepare a four-minute demo plus three-minute Q&A.

## Partner-specific register

| Partner and prize | Official link | Route eligibility | Required integration/materials | Evidence/status |
| --- | --- | --- | --- | --- |
| Privy — Best financial flow, candidate | [Official requirements](https://ethglobal.com/events/ethonline2026/prizes/privy) | Verify final route requirements | Functional financial flow using Privy wallets; specific source links and actual demo evidence | Optional Sepolia code, 65-test suite, scoped browser fixtures and production build passed; deployment/live receipt pending |
| ENS — roadmap only | [Official requirements](https://ethglobal.com/events/ethonline2026/prizes/ens) | Not assessed for this increment | Actual ENS integration required | Not implemented; do not claim as a used protocol |

## Optional Privy increment

- [x] Record creator opt-in, recipient scope, unchanged virtual mailboxes and locked buildings in [specification 0016](../specs/0016-optional-privy-support.md).
- [x] Verify personal recipient and per-project community mapping, including unconfigured and legacy JSON; configuration tests and the community browser fixture passed.
- [x] Verify ordinary configured-town creation/browsing does not load the wallet panel or request a provider; browser fixture passed. Broader hosted regression remains separate.
- [ ] Verify wrong network, rejected login/signing, insufficient balance, invalid amount, receipt failure, unconfirmed timeout, double clicks and late callbacks.
- [x] Run the production build/model-lock and relevant mailbox/browser regressions; all ten accepted GLBs unchanged. See verification for the exact scope.
- [ ] Complete an actual user-confirmed Ethereum Sepolia transfer through Privy and verify its successful receipt. Mocked hashes do not satisfy this item.
- [ ] Add the actual committed/pushed provider and transfer code permalinks and authorized public chain evidence to [summitinfo.md](summitinfo.md).
- [ ] Verify the deployed App ID/origin configuration and test the exact hosted town used in the demonstration.
- [ ] Record the updated competition feature video after testing: original site UI sound is permitted; no added background music. Keep any English script separate from a claim of recorded narration.
- [ ] Reconcile technology selections, prize answers, rating and feedback with demonstrated functionality; remove any integration still represented only by a roadmap.
