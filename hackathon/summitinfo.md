# Buildergame — final submission sheet

Prepared for ETHOnline 2026. Copy the answers below into the form. Upload, submission and prize eligibility remain unverified.

## Short description

A living 3D home for GitHub builders to showcase projects, share progress, and grow together.

## Description

Buildergame gives builders and their projects a place to belong. It transforms public GitHub repositories into a cozy, explorable 3D town, making a portfolio or hackathon community feel like a neighborhood people want to visit again. The idea begins with a simple problem: after demo day, promising projects are easily buried in repository lists. What if following their progress felt like returning to a familiar little town?

Every repository has a permanent plot. Five building appearances grow from green land into a furnished garden home, while recorded snapshots let visitors travel through the town's history and see what has changed. Town owners choose the growth values that matter to their community: cumulative commits, stars, a weighted combination of commits/stars/forks, or their own score table. Builders keep the progress they have already earned.

Individual developers can create a home for their public projects; hackathon organizers and communities can bring many builders together. Visitors explore flat streets, a valley or cloud neighborhoods, open wooden signs to meet creators, discover projects through the directory and minimap, and follow links to the work itself. Personal and community planning, GitHub data capture, snapshot playback, portable JSON backups, static deployment, and English/Chinese interfaces form the working demo.

The broader vision is to turn discovery into lasting participation. Our planned Web3 extensions include wallet-based appreciation through project mailboxes, wallet/ENS identity, and permissions for community membership and town management. A personal town could direct support to its builder, while a community town could route it to individual projects. The mailbox coin interaction in this demo is the first prototype of that support experience. Future on-chain records could also preserve the connection between an event, its projects and meaningful milestones.

Buildergame starts by making creation visible and inviting. It aims to grow into a place where attention, encouragement and community support help builders keep building long after a hackathon ends.

## How it's made

Buildergame uses TypeScript, Three.js 0.180.0, Vite 7.3.6 and Node.js. HTML, CSS and original SVG components create a shared interface of wooden controls, kraft-paper planning sheets, cream project cards and translucent teal panels.

The five accepted building appearances were authored with reproducible Blender Python scripts and exported as GLB files. Each has a full-detail and a distant model. The renderer combines instanced distant assets with a bounded number of detailed nearby buildings. Deterministic layout code generates terrain, roads, water and cloud districts from the town's initial roster. All ten building files are protected by SHA-256 checks. Six scoring labels remain for schema compatibility, with the last two sharing the final visual appearance.

Repository capture is separate from rendering. Shared GitHub REST transport gathers public repository and builder data, handles pagination, cancellation, timeouts, rate limits and unavailable observations, then stores deliberate snapshots in validated JSON. Personal-access-token connection runs directly in the browser; the token stays in page memory and is excluded from URLs, backups and persistent storage. An optional Node service supports OAuth and owner-checked publication.

Town JSON committed to `public/data/towns/` produces physical `/towns/<name-and-timestamp>/` pages during the build, supporting static hosting such as Vercel. This keeps snapshot history portable and lets organizers manage it through their own repository. Browser storage remembers exploration progress, and an all-land founding snapshot makes the first measured version replayable.

Native Web Audio plays six locally hosted Kenney CC0 interface effects. A single lazy HTMLAudioElement loops a supplied Suno track quietly on the planner only and shares the mute control. The submission recording excludes background music. The mailbox prototype combines a Three.js raycast target, contextual coin cursor, animated delivery and a demo receipt to make builder support tangible within the town.

The current implementation establishes the visualization, data and interaction foundation. Planned Web3 work adds wallet-based support, wallet/ENS identity and community permissions around the same projects and town experience. These are the next development layer; the mailbox currently demonstrates its intended interaction. Partner technology choices will follow the requirements of those integrations.

Codex assisted with specifications, research, implementation, Blender authoring scripts, tests and documentation. The human supplied the concept, growth policy, visual references, acceptance of the five building stages and successive interaction revisions.

## Technology selections

| Form field | Current answer |
| --- | --- |
| Ethereum developer tools | None |
| Blockchain networks | None in the current demo |
| Programming languages | TypeScript, JavaScript, Python; HTML/CSS for the interface |
| Web frameworks | No component framework; Vite is the build tool |
| Databases | None; JSON snapshot files and browser local storage |
| Design tools | Blender; human-supplied reference artwork |
| Other technologies | Three.js, GitHub REST API, Node.js, GLB/glTF, Web Audio API, Git, Playwright, FFmpeg |

This table describes the implemented stack. The Web3 roadmap in the project description is separate from technologies already used in the build.

## AI tools disclosure

Codex assisted with product and technical research, English documentation and translations, specifications, application code, procedural Blender Python scripts, original SVG/interface work, tests and browser verification. The human originated Buildergame's concept, defined organizer-owned growth rules, supplied visual references, accepted and locked the five building appearances, and directed visual and interaction revisions. The reference-image generation tool and prompts have not been supplied, so no specific model is claimed for those images.

The human supplied the Suno-generated track "Miniature Sky" and its musical style prompt. Codex integrated it only into the Create town page; the demo recording excludes background music. The Suno account plan and generation-rights evidence have not been independently verified, and the track is not labeled CC0. Kenney interface artwork, cursors and six sound effects are reused CC0 assets with source and license records. Video capture shows the actual application; no generated feature footage or TTS/AI voiceover is used.

See [AI disclosure](../collaboration/AI_USAGE.md), [human–AI log](../collaboration/log.md), [reuse baseline](../collaboration/baseline.md), [prompts](../prompts/README.md), [specifications](../specs/README.md) and [NOTICE](../NOTICE).

## Partner prizes

Partner selection is still open. Wallet-based developer support and wallet/ENS identity for community permissions are the planned integration directions. Complete prize selections against the technologies actually integrated in the submitted revision and the relevant partner criteria; the roadmap can explain where Buildergame goes next. Confirm the Classic/Continuity route and prize choices in the Dashboard.

## Links and images

| Item | Prepared value or action |
| --- | --- |
| Project name | Buildergame |
| Repository | https://github.com/ForOneIce/buildergame |
| Live project URL | [buildergame-two.vercel.app](https://buildergame-two.vercel.app/), as listed in the repository's public metadata; HTTP 200 and Buildergame title checked |
| Video | [Direct video URL](https://buildergame-two.vercel.app/demo/buildergame-demo-no-music.mp4) — 3:07, 1280×720, interface audio without music |
| Silent alternative | [Direct silent video URL](https://buildergame-two.vercel.app/demo/buildergame-demo-silent.mp4) — identical video with no audio stream |
| Square logo | [buildergame-logo.png](media/buildergame-logo.png), 512×512; [SVG source](media/buildergame-logo.svg) |
| Cover | [buildergame-cover.png](media/buildergame-cover.png), 1280×720, composed from an actual house capture |
| Screenshot 1 | [Homepage](media/01-homepage.png), 1920×1245 |
| Screenshot 2 | [Town planning](media/02-town-planning.png), 1920×1508; an unsubmitted example draft |
| Screenshot 3 | [Sample town and project card](media/03-sample-town-project.png), 1920×1080; fictional sample project |

Images and both finished videos are included in the repository. The video files in `public/demo/` are served directly by the static deployment after this revision builds. [Media provenance](media/README.md), [video files](../public/demo/README.md) and [verification](../docs/verification.md) record preparation and export checks. Confirm the direct URL opens before pasting it into the form.

## Video requirements

The supplied requirements state **2–4 minutes**, **at least 720p**, and **"Audio without music."** The main export shows the working interface with interaction effects and no background music. The extra silent export removes its audio stream completely. This initial feature demo does not add narration; an [optional English live-demo script](demo-script.md) is kept for later use.

The earlier unconditional human-narration statement was an interpretation, not a literal rule. Recorded guidance says not to play music with explanatory text instead of talking, and not to use TTS/AI voiceover. Do not speed up footage to fit the limit. See [rules and source boundaries](rules.md).

中文简注：当前提交视频以实际功能演示为主，不加背景音乐；另备无音轨版。英文讲稿留待后续现场演示使用。

## Before submission

- Verify video metadata, playback and screenshots against the current build; actual evidence belongs in [verification](../docs/verification.md).
- Upload the video, square logo, 16:9 cover and at least three screenshots. Paste only real public links into the form.
- Confirm team, check-ins, Classic/Continuity route and final prize choices in the Dashboard.
- Review the noncommercial source-available [license](../LICENSE) against competition source requirements. It is not an OSI-approved open-source license; no eligibility ruling is claimed.
- Confirm the submitted revision and success before the recorded deadline, **2026-09-13 16:00 UTC**.
