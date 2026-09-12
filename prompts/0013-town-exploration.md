# Buildings, exploration, project visits and optional resident map

Date: 2026-09-11. AI tool: Codex.

## Original project instruction

我更新了5种建设状态的建筑外观3d图 以及建筑之间布局构成城镇风光的参考图。我希望项目越多城镇规模越大，用户在上帝视图可以看到城市整体，也可以放大和移动观察每栋建筑。建成的城镇允许用户以玩家视角行走和走进房间，走进去就会出现进入建筑的小弹窗，渲染开门loading效果，弹窗内展示项目访问地址网站网页或者github仓库地址预览效果，弹窗内loading后可以真实进行站外网站互动。不以玩家视角步行，切换上帝视角，可以点击完成互动，查看地图、缩略图。除了图形支持列表查看项目、按照不同关注维度排序查看等。如果github仓库涉及个人有标记github上的地理位置，可以生成城镇居民地图标记，通过世界地图显示人的聚集效果，点击具体地区，查看地区相关人员的项目列表。世界地图模式作为可选项，需要选择非而个人仓库类型的小镇里可以选择是否获取或输入该github数据字段来实现。、

## English summary (AI)

Use five new building-state references and a streetscape reference. Town size should increase with project count. Provide an overview with zoom/pan, first-person walking and room entry, a door/loading transition, and project website or repository previews with real interaction when possible. Overview clicks should provide equivalent access. Include a map, thumbnails and sortable project list. For non-personal towns, optionally retrieve or enter public GitHub profile location data and show a world map of resident clusters, with region-filtered project lists.

## Plan

See [exploration specification](../specs/0006-town-exploration.md). Existing paused model changes resume based on the newly supplied references. External image-generation prompts and model identity have not been supplied.
