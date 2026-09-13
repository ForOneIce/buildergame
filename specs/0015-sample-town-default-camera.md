# Sample-town default camera

Date: 2026-09-13 (UTC). Status: implemented; scoped camera checks and the final combined production build passed. Human visual acceptance remains pending. Source: [instruction 0047](../prompts/0047-sample-town-default-zoom.md).

## Scope and behavior

The human reports pressing zoom-in four times on every sample-town visit to reach useful pointer interaction. Apply those four existing steps when entering any flat, valley or cloud sample town. AI interpretation: the reset control should also return to this closer default. This camera refinement accompanies the ongoing [UI audio increment](0014-ui-interaction-sounds.md).

The sample camera distance is the existing fit distance multiplied by `0.8 ** 4` (`0.4096`), using the existing zoom-distance limits. Preserve the current target and viewing direction; do not emulate four UI clicks or play four click sounds. Created, imported and published towns keep their existing fit/reset behavior. Manual zoom and pan remain available. No building, landscape geometry, plot location, metric or snapshot data changes are included.

Implementation adds the `initialZoomSteps` option in `src/town.ts`; `src/main.ts` supplies four for sample towns and zero otherwise. Entry and reset use the same initial framing.

## Observable acceptance criteria

1. Entry and reset in each of the three sample landscapes match the existing fit view followed by four zoom-in steps, subject to the existing clamp.
2. Reentering a sample, switching its landscape or resetting after manual movement uses the same closer default; the factor is not repeatedly compounded.
3. House/sign/mailbox pointer interactions and manual zoom/pan still work from that view. Smaller viewports retain accessible camera controls and a usable town view.
4. Non-sample entry/reset uses the previous framing. All ten locked GLBs and snapshot/growth data remain unchanged.
5. Initial camera setup does not synthesize clicks or unlock/play UI audio. Audio's user-gesture and mute behavior retains its existing scope.

## Verification

Scoped projected-point checks confirmed that sample entry/reset matches the previous fit view plus four zoom-in steps for flat, valley and clouds; normal non-sample fit remained unchanged. The final combined build passed with 54 modules, nine fictional projects, three snapshots and all ten GLBs unchanged. Codex inspected the closer desktop default and 360px guest/signed-in screenshots. [Verification](../docs/verification.md) records execution boundaries and related audio checks. Human visual acceptance remains pending.

中文简注：示例小镇默认放大到原先点四次加号的视角；重置也返回此视角。
