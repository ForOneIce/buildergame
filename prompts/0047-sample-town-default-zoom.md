# Start sample-town exploration at a closer zoom

Date: 2026-09-13 (UTC). AI tool: Codex.

## Original project instruction

探索实例小镇每次进入我都要点击+号四次，才能比较好地触发鼠标交互。改为默认进入时符合该放大比例为原始状态。

## English translation (AI)

Each time I enter Explore sample town, I have to click the plus button four times before mouse interaction works comfortably. Make that zoom level the default initial view.

## Implementation interpretation

For the three sample landscapes, start at the existing fit view followed by four existing zoom-in steps, and make camera reset return to that same view. Created/imported/published towns keep their current framing. This is a camera adjustment while the [interaction-audio work](0046-ui-interaction-sounds.md) continues. [Specification 0015](../specs/0015-sample-town-default-camera.md) records the scope and acceptance before implementation completion; scoped camera checks and the final combined build passed, with human visual review pending.
