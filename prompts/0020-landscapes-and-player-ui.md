# Locked buildings, landscapes and player interface

Original instruction:

> 现在锁定基础五状态的建筑，这个版本我很满意。但是示例小镇的 道路和城镇布局以及游戏交互ui的呈现效果我并不满意。你可以看看设计图中带map命名的图示，是我一开始对城镇风光的预期。【城镇布局和道路】组织者新建城镇时，支持3种路面模式（1、平地  城镇 水泥路面 统一海拔 2、山谷 由地面海拔造成的缓坡 有山有水 碎石路面 3、垂直结构 小云朵做成的小阶梯 交错连结着大云朵上的片区城镇  错落梦幻  设置后作为基础配置 之后的版本也不会更改   【游戏交互ui】玩家进入具体小镇时看到的界面 是map_en图片中的组件布局，左上角logo、浮窗控件的半透明设计、玩家支持github登陆 、登陆后可以显示github头像作为玩家头像、支持记录玩家的探索进度。玩家点击具体的建筑前的木板，弹窗效果参考info图片的项目卡片

Translation: Lock the accepted five building stages. Revise town scenery using the map references. Offer three immutable creation-time modes: flat towns with concrete roads and uniform elevation; gently sloped valleys with mountains, water and gravel roads; vertically staggered districts on large clouds connected by small cloud steps. Follow map_en for the upper-left logo and translucent floating controls. Support GitHub player login, profile avatars and exploration progress. Clicking a building's sign should open a project card like info.png.

Plan and observable acceptance: [specification](../specs/0010-landscapes-and-player-ui.md).
