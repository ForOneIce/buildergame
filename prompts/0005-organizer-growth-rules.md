# 0005 — Organizer-defined growth rules

- Date: 2026-09-11.
- Phase: requirements clarification.
- AI tool: Codex, this conversation.

## Original user input

房屋成长规则是这个产品最需要谨慎打磨的部分   不是的 这个就是看项目活动方的价值观来定 一开始设置房屋成长维度按照commits数量设置就按这个计算  如果在意传播影响力就按星级计算 当然如果活动方有自己的评分体系，也可以，但是就需要另外在部署前提供完整的仓库与评分数值对照关系列表。

## English translation

I disagree that house-growth rules are the part that needs especially careful balancing by the product. They are determined by the event organizer's values. If the organizer initially selects commit counts, calculate growth from those counts. If the organizer values reach, use stars. An organizer may use its own scoring system, provided it supplies a complete repository-to-score mapping before deployment.

## Correction and attribution

The user clarified the authority for growth rules. Earlier AI recommendations to separate development from attention or impose platform-selected adjustments are not requirements and are superseded by this clarification.

The tool applies the organizer's selected source and house-stage mapping. A custom scoring method can run outside the app and supply final scores.

## Prompts submitted to other AI tools

None.

## Output

[Organizer growth-rule specification](../specs/0002-organizer-growth-rules.md), updated review and timeline references, and collaboration records. No implementation has started.
