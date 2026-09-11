# 0002 — Hackathon Town idea and feasibility review

- Date: 2026-09-11.
- Phase: ideation and assessment.
- AI tool: Codex, this conversation.
- Status: user-originated concept under review; implementation and partner selection are not approved.

## Original user input

我现在突然有一个灵感  我之前很担心开发出来的东西没有人用  但是我观察到了一个现成的需求：1、越来越多的黑客松比赛出现，但是越是大型的黑客松赛事，比赛项目在上传github后，很难被在比赛结束之后持续关注（包括主办方、观众、builder） 2、开发惰性 ：一个项目的建构需要持续的维护耐心，但是只是看到github仓库、枯燥的构建工作让人提不起兴趣，或者没有用户关注，在这个注意力经济时代，没有关注就会慢慢被忘记和消失。3、比赛的主办内容、选题、参赛作品天然就带有公开属性适合web3的公开透明记录属性。 把黑客松活动链接以及github仓库地址作为一个上链存储的内容，记住这次活动和作品之间的关联 4、这次黑客松本身就会产生很多可用的项目数据（github仓库地址）。其它公开代码在github的黑客松之后也可以使用。所以我的想法是，一个threejs技术作为前端的，3d黑客松小镇。使用该仓库的人可以按照结构化的信息补充黑客松信息、参赛作品仓库列表。像星露谷种地一样，越辛勤劳作收获越多。程序会批量获取仓库列表，识别仓库名称、星数、提交commits次数、fork数量，github个人信息 followrs数量 头像 简介。每个仓库是游戏里的一座房子，房子有几种形态，纯土地、地基、木头框架、简陋小屋、升级形态、装饰形态等几种形态基础模型。然后根据活动主办更关心的单维度、多维度数值合理计算，对不同得分用户进行不同模型房屋的呈现。这个项目反映选手对于参赛作品客观上的建设程度。活动主办得分不做展示，但从维度参与最终显示效果 （比如更看重传播度的sarts星数、还是持续建设commit提交数等），反应价值导向。房屋前面的木质立牌区域展示选手特色，立牌缩略图显示用户头像和---字。点击木牌详情看到个人简介 项目简介 支持触发或跳转个人follow 项目start操作 ，形成观众与选手的互动。点击房子则跳转gtihub仓库里填写的项目网址，没有就跳转github仓库。需要你帮忙评审这个创意的可行性、我需要准备的内容、适合适量使用哪个品牌合作方的赛道或者不适合？考虑成本、实际用户接受程度

## English translation

I have a new idea. I was worried that nobody would use what I build, but I have observed a potential need:

1. Hackathons are becoming more common. Especially at large events, projects uploaded to GitHub are hard for organizers, audiences, and builders to keep following after the event.
2. Development requires sustained patience. Plain repositories and tedious build work can feel unmotivating, particularly without user attention; projects gradually disappear from attention.
3. Event topics and submissions are naturally public, which seems compatible with Web3's transparent records. Store the event link and repository links on-chain to remember the relationship.
4. This hackathon itself will produce project/repository data, and later events with public GitHub code could also use the system.

The proposal is a Three.js 3D hackathon town. Users of the repository provide structured event information and repository lists. Like farming in Stardew Valley, continued work brings visible growth.

The program fetches repository names, stars, commit counts, forks, and GitHub profiles including followers, avatars, and biographies. Each repository becomes a house with stages such as an empty plot, foundation, timber frame, basic hut, upgraded building, and decorations. Organizer-selected single or multiple metrics determine the displayed model. Numerical scores are hidden while their influence expresses the organizer's priorities, such as attention through stars or continued development through commits.

A wooden sign shows the builder's avatar and a short text. Clicking it reveals the person and project descriptions and offers GitHub follow/star interactions or links. Clicking a house opens the repository's project website, falling back to GitHub if none is provided.

Please assess feasibility, required preparation, appropriate partner prizes (or lack of fit), costs, and likely user acceptance.

## Prompts submitted to other AI tools

None. Browser, shell, and GitHub read-only requests were research tools, not additional AI services.

## Research and outputs

- Read the existing workspace policy and records.
- Retrieved the existing HackathonGalacticShowcase README and GitHub's official REST rate-limit page on September 11.
- Used partner rules already reviewed earlier in this conversation; no partner approval was obtained.
- Wrote the [English feasibility review](../docs/ideation/0002-hackathon-town-review.md).
- Updated the brief, decision log, reuse record, and AI disclosure.
- Preserved the user's idea separately from AI recommendations.

## Open decisions

No product scope, score/display profile, pilot event, asset pack, implementation stack beyond the user's Three.js proposal, competition route, or partner selection has been confirmed.
