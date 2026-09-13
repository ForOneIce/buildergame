# Preserve the accepted town interface

Status: **implemented; scoped browser checks passed**. Defined 2026-09-13 (UTC). Final human visual acceptance and the combined post-correction release build remain separate. [Requirement and diagnosis](../prompts/0060-preserve-the-accepted-town-interface.md).

## Scope and attribution

The human requires the optional wallet addition to preserve the accepted town controls and layout, and subsequently explicitly required actual towns to match samples except for omitting landscape tours. Codex's source audit found a pre-existing sample/non-sample layout split, rather than a new structural wallet change. The correction shares the accepted HUD between town types and keeps the landscape-tour action sample-only. No new artwork, provider, storage service, 3D model or camera policy is part of this correction.

## Expected behavior

- Keep the sample interface's existing control placement and styling: camera buttons below the map; random exploration at the upper right; project totals above the town-name control at the lower left. Preserve the project directory, timeline, map, terrain-tour and virtual-mailbox interactions.
- Use that same arrangement for created personal/community towns. Omit landscape tours without substituting a settings button. Actual town terrain remains fixed after creation.
- Remove the legacy duplicate exploration panel and visitor Save town action from the shared HUD. Keep browser-local exploration state and creator backup/export workflows available in their existing appropriate views.
- Preserve maintenance through the planner's **Not ready yet?** area: **Continue current town** and **Back up current town** appear only when an actual town is loaded. Continuation restores the existing configuration and snapshot history with the terrain locked. Moving maintenance out of the visitor HUD must not make later snapshots or backups inaccessible.
- Retain the same decorative virtual-support demonstration control in both types, clearly separated from actual support. Add the wallet icon only where valid optional support configuration exists. Unconfigured mailboxes retain virtual coins and no wallet-configuration prompts; configured mailboxes retain the explicit wallet review flow. Critical transfer locks must not move controls.
- Preserve the existing sample/non-sample initial camera rules and all ten locked GLB files. Camera behavior is separate from correcting control placement.

## Verification

Compare the same sample data and language at the same viewport before and after the correction. Check sample, created personal and mixed community towns with and without valid support configuration. Confirm shared control order/placement, sample-only tour actions, absence of legacy settings/duplicate exploration/save controls, optional wallet visibility and working map/directory/timeline/mailboxes. Run relevant UI fixtures and TypeScript/build checks after source changes. Record actual results separately in [verification](../docs/verification.md); no live chain transaction or final human visual acceptance is implied by this specification.

The implementation agent reported six passing HUD parity variants at 1440×1000 and 390×844, plus passing map and support browser regressions. Shared control dimensions/positions differed by no more than one CSS pixel. The subsequent focused planner-continuation fixture also passed: the existing bundle exports unchanged, continuation preserves identity/support/history with terrain locked, and a new fixture capture appends one snapshot without rewriting previous observations. These are local fixture results, not actual Privy authentication or chain evidence. [Exact scope](../docs/verification.md#shared-town-interface-and-progress-documentation-00600061).
