# buildergame

ETHOnline 2026 项目工作区。`buildergame` 暂为目录名，产品名称、选题、技术栈和参赛赛道尚未确定。

创建日期：2026-09-11（北京时间，UTC+8）。从下一轮构思开始记录项目的人机协作过程；本次目录搭建记录为准备工作。

## 目录

```text
buildergame/
├── AGENTS.md                 # AI 在本项目内工作时遵守的记录规则
├── README.md                 # 项目入口、状态和目录说明
├── docs/
│   ├── brief.md              # 用户问题、候选方向、范围和待验证假设
│   ├── rules.md              # 官方规则、来源、时间与资格核对
│   └── decisions.md          # 已作出的决策及其原因
├── specs/
│   └── README.md             # 规格与验收标准的编写约定
├── prompts/
│   ├── README.md             # 用户指令与 AI 工具提示词的保存约定
│   └── 0000-workspace-setup.md
├── collaboration/
│   ├── log.md                # 每轮协作：输入、贡献、产物和验证
│   ├── AI_USAGE.md           # 提交时使用的 AI 披露，按文件或模块标注
│   └── baseline.md           # 赛前既有工作、复用来源和本次新增边界
├── src/                      # 选定技术栈后存放实现
├── tests/                    # 与验收标准对应的有效验证
└── submission/
    ├── checklist.md          # 提交与合作方专项要求
    └── demo-script.md        # 2–4 分钟真人讲解演示脚本
```

## 当前状态

- 阶段：准备完成，等待第一轮构思。
- 候选兴趣：小型活动成团与退款、编程 AI 语音与无障碍交互、Web3 漏洞复现实验工具。
- 选题／Classic 或 Continuity／合作方：待定。
- 已有产物：协作与比赛记录框架；尚无产品代码、测试结果或用户验证。
- 参赛状态：是否已录取、完成 Check-in，尚未在 Dashboard 核实。

## 工作方式

1. 在 `prompts/` 保存本轮用户指令；在 `docs/brief.md` 更新需求与假设。
2. 构思结果和正式决策分别进入 brief 与 decisions，保留放弃方案的必要理由。
3. 实现前形成小范围规格和可观察的验收标准，放在 `specs/`。
4. 完成一轮工作后更新协作日志、AI 使用披露和复用边界，记录实际验证情况。
5. 使用 Git 按有意义的工作单元保留历史；记录实际 commit，不补造或回填开发时间。

优先做一个可验证的完整用户流程。目录结构是工作约定，不是必须实现的功能清单。

## 关键入口

- [项目问题与假设](docs/brief.md)
- [比赛规则与来源](docs/rules.md)
- [协作记录](collaboration/log.md)
- [AI 使用披露](collaboration/AI_USAGE.md)
- [提交清单](submission/checklist.md)

最终提交截止：**北京时间 2026-09-14 00:00**。第二次 Check-in 截止：**2026-09-11 11:59**。个人状态以官方 Dashboard 为准。
