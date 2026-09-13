# Buildergame — final submission sheet

Prepared for ETHOnline 2026. Copy the answers below into the form. Upload, submission and prize eligibility remain unverified.

## Short description

Turn GitHub projects into a cozy 3D town and explore how builders grow over time.

## Description

Hackathon projects often lose visibility after demo day, and a growing list of repositories can make a builder's work difficult to discover. Buildergame gives those projects a place people can explore and revisit: a cozy 3D town where every public GitHub repository becomes a house.

Individual developers can create portfolio towns, while hackathon organizers and communities can bring many builders into one neighborhood. Visitors move around the scenery, zoom into a building, open its wooden sign, meet the creator, and follow links to the website or repository. A searchable directory, minimap and random exploration action help visitors find their next project. Exploration progress stays in the browser. Viewing requires neither a wallet nor a login.

Each project keeps the same plot across recorded snapshots. Five building appearances turn a green plot into a foundation, timber frame, blue-roof shell and furnished garden home. The owner chooses how cumulative commits, stars, a weighted mix of commits/stars/forks, or a complete custom score table map to growth. These express the owner's priorities, not a universal judgment of project quality. A pause in development does not reduce a house under an unchanged cumulative-commit rule.

The planner supports personal and community collections, configuration files, public GitHub data capture and portable JSON backups. Flat streets, a valley with water and gravel paths, and cloud neighborhoods give towns different identities. A founding snapshot starts every project at the first stage, so even the first captured snapshot has a visible transition. Repository-backed static deployment gives published towns their own addresses without a database.

English and Chinese are supported. A sample-only mailbox coin animation imagines encouragement for builders; it has no wallet connection, transaction or funding balance. Web3 integration is deferred. Sample projects and metrics are fictional, and real adoption or post-event retention has not yet been measured.

## How it's made

Buildergame uses TypeScript, Three.js 0.180.0, Vite 7.3.6 and Node.js. HTML, CSS and original SVG components create a shared interface of wooden controls, kraft-paper planning sheets, cream project cards and translucent teal panels.

The five accepted building appearances were authored with reproducible Blender Python scripts and exported as GLB files. Each has a full-detail and a distant model. The renderer combines instanced distant assets with a bounded number of detailed nearby buildings. Deterministic layout code generates terrain, roads, water and cloud districts from the town's initial roster. All ten building files are protected by SHA-256 checks. Six scoring labels remain for schema compatibility, with the last two sharing the final visual appearance.

Repository capture is separate from rendering. Shared GitHub REST transport gathers public repository and builder data, handles pagination, cancellation, timeouts, rate limits and unavailable observations, then stores deliberate snapshots in validated JSON. Personal-access-token connection runs directly in the browser without a backend; the token stays in page memory and is excluded from URLs, backups and persistent storage. An optional Node service supports OAuth and owner-checked publication. Real token/OAuth login has not been verified with production credentials.

Town JSON committed to `public/data/towns/` produces physical `/towns/<name-and-timestamp>/` pages during the build, supporting static hosting such as Vercel. Before publication, a local preview works only in the browser that holds it. GitHub reads never automatically write to a repository. Browser storage keeps visitor exploration progress; no database or automatic live refresh is required.

Native Web Audio plays six locally hosted Kenney CC0 interface effects. A single lazy HTMLAudioElement loops a supplied Suno track quietly on the planner only, shares the mute control, pauses in hidden tabs and resets on exit. The submission recording excludes that music. A separate Three.js mailbox target and temporary coin effect provide the sample Easter egg without changing the building models or integrating payments.

Codex assisted with specifications, research, implementation, Blender authoring scripts, tests and documentation. The human supplied the concept, growth policy, visual references, acceptance of the five building stages and successive interaction revisions. No partner SDK, Ethereum tool, blockchain network or smart contract is integrated in this version.

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

Use the closest available form labels. Researching a technology does not mean it is integrated.

## AI tools disclosure

Codex assisted with product and technical research, English documentation and translations, specifications, application code, procedural Blender Python scripts, original SVG/interface work, tests and browser verification. The human originated Buildergame's concept, defined organizer-owned growth rules, supplied visual references, accepted and locked the five building appearances, and directed visual and interaction revisions. The reference-image generation tool and prompts have not been supplied, so no specific model is claimed for those images.

The human supplied the Suno-generated track "Miniature Sky" and its musical style prompt. Codex integrated it only into the Create town page; the demo recording excludes background music. The Suno account plan and generation-rights evidence have not been independently verified, and the track is not labeled CC0. Kenney interface artwork, cursors and six sound effects are reused CC0 assets with source and license records. Video capture shows the actual application; no generated feature footage or TTS/AI voiceover is used.

See [AI disclosure](../collaboration/AI_USAGE.md), [human–AI log](../collaboration/log.md), [reuse baseline](../collaboration/baseline.md), [prompts](../prompts/README.md), [specifications](../specs/README.md) and [NOTICE](../NOTICE).

## Partner prizes

No partner prize is selected for the current build. ENS and optional wallet support were researched, then deferred. The mailbox is a visual simulation and is not evidence of a partner integration. General/Finalist eligibility and the Classic or Continuity route must be checked in the Dashboard; no qualifying blockchain use is claimed.

## Links and images

| Item | Prepared value or action |
| --- | --- |
| Project name | Buildergame |
| Repository | https://github.com/ForOneIce/buildergame |
| Live project URL | Add the actual public deployment URL after checking it in a signed-out browser |
| Video | Upload the delivered music-free MP4; add its real upload URL if required |
| Silent alternative | Separate export with no audio stream; additional option, not the default for an "Audio without music" field |
| Square logo | [buildergame-logo.png](media/buildergame-logo.png), 512×512; [SVG source](media/buildergame-logo.svg) |
| Cover | [buildergame-cover.png](media/buildergame-cover.png), 1280×720, composed from an actual house capture |
| Screenshot 1 | [Homepage](media/01-homepage.png), 1920×1245 |
| Screenshot 2 | [Town planning](media/02-town-planning.png), 1920×1508; an unsubmitted example draft |
| Screenshot 3 | [Sample town and project card](media/03-sample-town-project.png), 1920×1080; fictional sample project |

These still images are prepared and visually inspected locally; upload remains pending. [Media provenance](media/README.md) records capture boundaries and guest fixtures. Do not paste localhost URLs or links to ignored capture files into the submission. Local artifacts and public upload URLs are different deliverables.

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
