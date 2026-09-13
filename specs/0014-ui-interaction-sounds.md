# Game UI interaction sounds

Date: 2026-09-13 (UTC). Status: implemented; asset checks, scoped browser checks and the final combined production build passed. Human listening review remains pending. Source: [instruction 0046](../prompts/0046-ui-interaction-sounds.md).

## Purpose and smallest workflow

Extend Buildergame's shared wood, paper and translucent-panel interface with short sound feedback that makes controls feel tangible. The human requested reusable game-control audio research and sounds for clicks, map unfolding and hover. The details below are AI implementation choices within that authorized scope; human listening acceptance is not established.

1. Enter the homepage or a town silently. The app does not autoplay or unlock audio on loading, programmatic focus or pointer hover.
2. A user gesture may unlock the native Web Audio context. Subsequent supported actions play quiet, short cues: a tactile button click, a distinct paper/map-opening cue, and a softer hover/focus cue.
3. Fine-pointer hover and keyboard-focus feedback are throttled to avoid repeated noise when crossing child elements, moving rapidly between controls or holding a key. Touch interaction uses activation cues without simulated hover sounds.
4. A labeled sound toggle lets visitors mute all interaction audio. Remember the preference in local browser storage and retain it across navigation/reload. If storage or audio is unavailable, controls and navigation still work.

## Implementation and assets

Six unchanged Ogg Vorbis clips from Kenney UI Audio 1.0 and RPG Audio 1.0 are served locally under `public/audio/ui/`. Official pages and each archive's `License.txt` establish CC0; byte-identity and metadata checks passed. The set totals 49,420 bytes. The [audio research and reuse register](../docs/ui-audio-research.md) records sources, licenses and exact fingerprints; technical validation does not establish listening acceptance. Assets, research and the NOTICE update are recorded in local commit `d4f22f6`.

| Local filename | Original pack and file | Duration |
| --- | --- | --- |
| `click.ogg` | UI Audio 1.0 — `Audio/click1.ogg` | 0.094 s |
| `hover.ogg` | UI Audio 1.0 — `Audio/rollover2.ogg` | 0.057 s |
| `map-open.ogg` | RPG Audio 1.0 — `Audio/bookFlip3.ogg` | 0.231 s |
| `panel-open.ogg` | RPG Audio 1.0 — `Audio/bookOpen.ogg` | 0.154 s |
| `panel-close.ogg` | RPG Audio 1.0 — `Audio/bookClose.ogg` | 0.231 s |
| `success.ogg` | RPG Audio 1.0 — `Audio/handleCoins2.ogg` | 0.338 s |

The two original pack licenses and manifest are preserved alongside the clips; all six clips and both licenses match their archive bytes and recorded SHA-256 values. FFmpeg decode/level checks and Git byte-preservation attributes passed. No paid asset, remote playback dependency, background music or new sponsor SDK is introduced.

`src/ui/interface-audio.ts` implements one shared native Web Audio mixer with trusted-gesture unlock, local clip loading, quiet per-cue gain, bounded voices and throttled feedback. `src/ui/audio-control.css`, `src/game-ui.ts`, `src/ui/icons.ts` and `src/main.ts` add the bilingual sound toggle and action cues. `src/town.ts` supplies fine-pointer scene-hover feedback; the virtual mailbox receipt uses the coin confirmation cue. The mute preference is stored as `bg-sound-enabled`; unavailable storage keeps a session-only setting. Research, manifest and licenses preserve the reused audio's CC0 scope; the mixer and sound icons are original Codex-assisted application work.

Use the browser's native Web Audio API with low gain and bounded playback. Loading, decoding, suspended contexts or playback failures must fail quietly without delaying the requested UI action. Audio is supplementary: no state, success or warning depends on hearing it. Existing visual/focus feedback, English/Chinese labels, snapshot behavior and the ten locked GLBs remain unchanged. No wallet or payment integration is introduced.

The mute preference is the only new persistent setting in this scope. Do not store a listening history or interaction log, write town data or send audio telemetry. Scene and UI navigation must not accumulate event listeners or duplicate sound playback. Mute takes effect on active/pending audio as well as subsequent controls.

## Observable acceptance criteria

1. Source and license evidence confirms every shipped audio clip is free CC0 and locally served; only selected assets are imported with their provenance.
2. Initial loading, pointer hover and programmatic focus before a user gesture produce no audio playback. Sound unlock follows a real user action and respects the browser's autoplay policy.
3. Supported button activation and map expansion use distinct short cues; hover/focus cues are softer and throttled. Disabled controls do not sound, one activation does not duplicate, and touch does not generate a second hover cue.
4. The sound toggle is reachable by keyboard/touch, has English/Chinese accessible labeling and accurately reflects its state. Muting stops audio; the preference survives reload and navigation. Storage-denied environments remain usable.
5. Audio load/decode failures and unavailable/suspended Web Audio do not interrupt clicking, map opening, dialog controls or navigation. Repeated view changes do not multiply listeners/playback.
6. Audio requests stay within the local deployment; no background track, external service, sponsor/wallet calls or town-data writes are added. Existing building fingerprints and core UI flows remain intact.

## Verification plan and status

Source/license, clip metadata, decoding/levels and original-byte/hash checks passed. Scoped browser checks used actual native decoding, sources and gains to verify gesture unlock, no autoplay, throttling, one shared mixer, map/panel cues, normal/reduced-motion mailbox confirmation, active/pending mute, preference persistence and hidden-page stopping. Missing API/storage/files, corrupt decoding and denied resume fixtures retained usable controls. English/Chinese guest and signed-in headers at 360px passed overlap checks.

The native lifecycle run preceded the final success-cue throttle exemption; affected reduced-motion/pending, fallback, responsive and camera checks passed after it. The final build after that fix and the [camera refinement](0015-sample-town-default-camera.md) passed with 54 modules, nine fictional projects, three snapshots and ten unchanged GLBs. Codex inspected 360px guest/signed-in screenshots. [Verification](../docs/verification.md) records exact execution boundaries and separate regression results. No listening session or human auditory/visual acceptance is claimed; automated playback evidence does not establish perceived comfort.

中文简注：仅控件短音效，点击后启用；支持静音，不自动播放背景音乐。
