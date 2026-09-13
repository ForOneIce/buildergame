# Free UI sounds for the town interface

Research date: 2026-09-13. Scope: short interaction effects for Buildergame's shared wood, cream-paper and sea-glass interface. Six unchanged CC0 audio files are now vendored; application integration and browser verification are tracked separately. No background music or paid resource is included.

> 中文简注：轻量点击、翻纸与金币提示音；仅使用免费 CC0 素材，音效不能代替视觉提示。

## Sources checked

The official Kenney pages, their free-download links and all three downloaded Kenney archives were inspected. All three archives include a `License.txt` granting CC0 use in personal and commercial projects; attribution is appreciated but not required. Pack counts below are the product pages' advertised counts. The OpenGameArt alternative was checked at the page and download-link level, not downloaded or auditioned.

| Candidate | Verified source and license | Fit and selection |
| --- | --- | --- |
| [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) | 100 assets; v1.0; CC0. The archive license explicitly identifies Interface Sounds 1.0 and a 2020 creation date. | Broad semantic UI collection with click, tick, open, close, confirmation and other families. Candidate metadata was measured. No files from this pack are shipped: the shorter UI Audio rollover and the physical book cues from RPG Audio cover this revision. |
| [Kenney UI Audio](https://kenney.nl/assets/ui-audio) | 50 assets; official page reports v1.0, released in 2012; CC0. The archive license calls the pack “UI SFX Set” without specifying a version. | Selected a 94 ms click and a 57 ms rollover. The brief durations make them suitable candidates for frequent controls at low volume. |
| [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) | 50 assets; official page reports v1.0, released in 2014; CC0. The archive license names RPG Audio without specifying a version. | Selected book flip/open/close and coin handling. These named physical actions match the existing paper panels and virtual mailbox interaction. The close effect needs lower playback gain than the other book cues. |
| [SubspaceAudio: 512 Sound Effects, 8-bit style](https://opengameart.org/content/512-sound-effects-8-bit-style) | Author page on OpenGameArt, published 2016-04-07; CC0 field and an explicit CC0 confirmation by the author. The page links a free 512-sound ZIP. No semantic version is advertised. | A reputable free alternative for a retro arcade direction. Its advertised NES/C64/8-bit character is less aligned with this interface's physical materials, so no file is selected. The larger commercial collections linked from that page are separate offers and are not used. |

The material fit above is an implementation proposal based on source descriptions, original filenames and measured duration/levels. No listening session or human auditory approval is claimed.

## Selected subset

All six files are original stereo Ogg Vorbis assets, renamed only. They total **49,420 bytes** (48.3 KiB). Audio/license hashes, original archive paths, versions, version evidence, archive URLs and measured metadata are in the [asset manifest](../public/audio/ui/manifest.json). Original licenses are preserved in the same directory.

| Local file | Original pack path | Duration | Proposed interaction |
| --- | --- | --- | --- |
| `audio/ui/click.ogg` | UI Audio: `Audio/click1.ogg` | 0.094 s | Activate a wooden button or control. |
| `audio/ui/hover.ogg` | UI Audio: `Audio/rollover2.ogg` | 0.057 s | Optional, quiet, throttled pointer hover. |
| `audio/ui/map-open.ogg` | RPG Audio: `Audio/bookFlip3.ogg` | 0.231 s | Open a map or paper directory. |
| `audio/ui/panel-open.ogg` | RPG Audio: `Audio/bookOpen.ogg` | 0.154 s | Open a paper panel or dialog. |
| `audio/ui/panel-close.ogg` | RPG Audio: `Audio/bookClose.ogg` | 0.231 s | Close a panel, with lower gain. |
| `audio/ui/success.ogg` | RPG Audio: `Audio/handleCoins2.ogg` | 0.338 s | Optional completed action or virtual coin receipt. |

No trimming, normalization, synthesis, transcoding or remixing was applied. Runtime gain does not change the asset bytes. The local `.gitattributes` preserves audio and license bytes when Git line-ending conversion is enabled.

## Integration guidance

Native browser audio is sufficient for this small set; no sound library or external audio service is needed. Serve the files through the application's base URL so a deployment under a path prefix can resolve them. Decode or load only after the user's audio choice and a browser-supported user gesture. Unsupported codecs, unavailable audio devices or decode failures must leave controls usable without sound; Ogg support in older browsers must not be assumed.

Use one shared mute state and a small bounded playback pool. A single action should trigger one cue: opening a panel should not stack a generic click underneath its opening cue. Throttle pointer hover, avoid repeated sound while dragging or scrubbing history, and keep essential status messages visible. Short effects supplement the interface; they do not indicate real financial activity.

The originals have different levels. FFmpeg measured the panel-close source at a mean of -18.8 dBFS and a peak of 0 dBFS, compared with panel-open at -33.6/-11.5 dBFS and the coin cue at -34.0/-10.7 dBFS. Start panel-close at substantially lower gain and hover below click. These measurements support initial mixing but do not establish perceived comfort on speakers or headphones; listening and final volume adjustment remain necessary.

## Archive evidence

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| [Interface Sounds ZIP](https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip) | 834,536 | `f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232` |
| [UI Audio ZIP](https://kenney.nl/media/pages/assets/ui-audio/490d233f68-1677590494/kenney_ui-audio.zip) | 411,949 | `946fc23a63d535d693eb31b2eabb80c8c28d6351e2186b344ceb71b2cb1d5eb6` |
| [RPG Audio ZIP](https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip) | 964,837 | `6dbeaf8544da958d8f2adcb4a4a4b76c1ade34a05f8ab9edccd327da7375f38b` |

OpenGameArt's observed alternative download: [The Essential Retro Video Game Sound Effects Collection, 512 sounds](https://opengameart.org/sites/default/files/The%20Essential%20Retro%20Video%20Game%20Sound%20Effects%20Collection%20%5B512%20sounds%5D.zip). Its page advertises 20.6 MB; archive contents and bytes were not inspected, and nothing from it is shipped.

Technical checks performed for the selected assets: `ffprobe` read codec, sample rate, channel count, duration and size; `ffmpeg -af volumedetect -f null NUL` decoded each sound and measured levels. All six sounds and both license files matched their original archive entries byte for byte, their SHA-256 hashes matched the manifest, and the audio byte total matched. `git check-attr` confirmed text conversion is disabled for audio and license files. These are file-validity checks, not browser playback or listening results.
