# Named towns, static snapshots and a simpler visitor interface

Date: 2026-09-12 (UTC). AI tool: Codex.

## Original project instruction

示例小镇的探索进度按钮改成随机探索，点击效果和发现一个项目按钮一致。2、去掉你的探索弹窗，功能重复了。3、小镇统计数据移到左下角按钮上方。界面的部分差不多是这些修改建议了。接下来要把主要功能完善一下，1、右上角github登陆支持 方便导入个人仓库和显示用户头像 2、创建城镇后城镇会正常生成并且保存到当前域名下的子路径，以城镇名和时间戳为路径。城镇名唯一，避免多个重名在github备份时异常。简单引导用户使用github进行配置文件管理和部署。github仓库文件存储方式生效城镇数据。（或者调研其它更便捷但低成本的存储方案）3、用户浏览进展纯前端。4、项目信息先按照快照静态同步，可以选择特殊时间节点进行快照纪念 5、后续版本再考虑当下现时状态的github数据展示同步刷新等。6、检查新建后小镇的正常显示效果 7、边界情况考虑、拓展兼容：第一快照预设为全第一阶段。这样即使只有一个快照也可以播放。从0到第一个快照也可以播放。创建时限制0输入，避免影响生成。

## English translation (AI)

Change the sample town's exploration-progress button to Random explore, with the same effect as Discover a project. Remove the Your exploration popup because it duplicates functionality. Move the town statistics above the lower-left control. These are the remaining interface changes; next, complete the main functionality:

1. Support GitHub login in the upper right to make importing personal repositories and showing the user's avatar convenient.
2. After creation, generate and save each town under a subpath on the current domain using the town name and timestamp. Town names must be unique to avoid backup conflicts. Briefly guide users through managing configuration files and deployment with GitHub. Town data stored as repository files should take effect; alternatively, research easier low-cost storage options.
3. Keep visitors' exploration progress entirely in the frontend.
4. Initially synchronize project information through static snapshots, with optional snapshots commemorating particular moments.
5. Consider displaying and refreshing GitHub's current live state in a later version.
6. Check that newly created towns render correctly.
7. Handle boundary cases and compatibility: provide an initial snapshot with every project in stage one, so playback works even with only one captured snapshot and can animate from zero to that capture. Reject zero input at creation to avoid generation problems.

## Scope and implementation interpretation

This supersedes 0038's removed sample login, relocated progress badge and duplicate progress panel. The sample gets Random explore; shared GitHub account access returns. Exploration becomes browser-only across towns, independent of server account synchronization.

Codex interprets “限制0输入” as rejecting an empty project collection, not rejecting valid zero stars, forks or cumulative commits. The founding view is an explicitly synthetic stage-one baseline with no invented GitHub observations. A named occasion labels the actual capture; it does not backdate the observed metrics. Names and paths are unique within a deployment's known town collection, not globally across unrelated hosts.

GitHub repository files are a reviewed publication source, not permission to add automatic repository-write scopes or push files. The [specification](../specs/0012-named-towns-and-static-snapshots.md) records the implemented workflow and acceptance criteria. The final 42-test suite, production build, all four browser scripts and focused short-viewport/production-static checks passed within the revision boundaries in [verification](../docs/verification.md). Human visual acceptance and real authentication/remote hosting verification remain pending.
