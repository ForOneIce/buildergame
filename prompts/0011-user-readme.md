# User-facing README and hackathon review directory

Date: 2026-09-11. AI tool: Codex.

## Original user input

现在的readme更像是给ethglobal黑客松评委看的内容，新建一个黑客松展示专用的目录，评委要看的放里面 比如现在的这个readme。但新增一个readme放在默认展示位置，面向这个项目的用户展示builder的有趣和使用方式。像传统readme一样。能直观看到这个项目的功能、趣味点

## English translation (AI)

The current README reads more like something for ETHGlobal judges. Create a dedicated hackathon presentation directory and put reviewer materials there, such as the current README. Add a new README at the default location for the project's users, showing Buildergame's fun aspects and how to use it. Like a conventional README, it should make the features and appeal immediately understandable.

## Implementation

- Move the reviewer README, competition rules, submission checklist and demo outline to hackathon/.
- Write the root README around the town experience, developer/event use cases, configuration workflow and contributor entry points.
- Preserve explicit development status; do not present missing setup inputs or a planned hosted Demo as available.
- Keep specs, project prompts and contribution records at stable development paths, linked from the reviewer guide.
- Verify moved links and documentation whitespace; no application behavior changes.
