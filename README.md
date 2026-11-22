<div align="center">

# 玄枢 · XUANSHU

**中国传统术数的可视化推演站**

排盘由确定性算法完成，解读交给你自己接入的大模型

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-D4AF6A?style=flat-square)](#-许可)

[简体中文](README.md) · [English](README.en.md)

</div>

---

> 盘是算出来的，话是问出来的。

## 🧭 为什么这样拆

大模型很会说话，但不擅长排盘。历法换算、定局起盘、安星布门这些地方，「看起来对」的错误最难被发现。

所以这个站把两件事分开：

| | 谁来做 | 结果 |
|---|---|---|
| **排盘** | 算法 | 同一次输入永远得到同一个盘，可逐条核对 |
| **解读** | 你接入的模型 | 只把盘面符号翻译成人话，不参与推演 |

换模型不会改变盘面。对不上通行排盘软件，就是 bug，不是「流派不同」。

## 🎴 六门 · 十七种问法

| 门 | 子模式 | 排盘内核 | 视觉 |
|---|---|---|---|
| 🀄 **四柱八字** | 四柱 · 十神 · 藏干 · 五行 · 神煞 · 大运 · 流年 | lunar-javascript | 四柱翻开、五行生长、柱间合冲刑害弧线 |
| ✨ **紫微斗数** | 十二宫 · 主星辅星 · 庙旺 · 生年四化 · 大限 · 三方四正 | iztro（三合派） | 十二宫放射入场、点击看星曜 |
| 🧿 **奇门遁甲** | 阴阳遁定局 · 九宫 · 星门神仪 · 值符值使 · 空亡驿马 · 格局 | 移植 `qimen_cli.py` | 九宫按洛书轨迹逐宫飞布 |
| 🃏 **塔罗** | 5 种牌阵 · 78 张牌 · 正逆位 · 经典组合 · 可复现抽牌 | 自建牌库 + mulberry32 | 洗牌散开、3D 翻牌、旋转魔法阵 |
| 💞 **姻缘** | 八字合婚 · 生肖配对 · 夫妻宫 · 求签 · 桃花 · 红线 | 100 支签 + 合婚规则 | 红线生长、签诗竖排 |
| 🏔 **堪舆** | 玄空飞星 · 八宅命卦 · 择日 | 移植 `kanyu/` | 可点击二十四山罗盘、九宫飞星 |

## 🚀 快速开始

```bash
npm install

# 开发：一键起 Vite(5173) + 代理服务(8787)
npm run dev

# 生产
npm run build
npm start          # → http://127.0.0.1:8787
```

需要 Node 20+。`npm run serve` 只做两件事：托管 `dist/`，把浏览器请求转发到你填的模型端点（绕过 CORS）。密钥只在单次请求的内存里过一遍，不落盘、不写日志。

## 🔑 接入模型

右上角 **接入模型** 打开配置面板：

- **接口地址** — 任何 OpenAI 兼容端点，需以 `/v1` 结尾（站内会拼接 `/chat/completions`）
- **API Key** — 只写入本浏览器 localStorage
- **模型** — 可手填，也可点「测试连接」拉取可用列表

| 预设 | 端点 | 备注 |
|---|---|---|
| DeepSeek | `https://api.deepseek.com/v1` | 性价比高，中文典籍理解好 |
| OpenAI | `https://api.openai.com/v1` | 需海外网络 |
| Moonshot | `https://api.moonshot.cn/v1` | 长文本 |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | 国内直连 |
| SiliconFlow | `https://api.siliconflow.cn/v1` | 聚合多模型 |
| Ollama | `http://127.0.0.1:11434/v1` | 本地推理，无需 Key |

> 纯静态环境（无 Node 服务）下，请求由浏览器直连端点，需要端点允许跨域。

## 👥 多人使用 · 每人自带模型

这个站是「自带模型」的结构，不存在站长替所有人付 token 的情况：

| 谁 | 用谁的 Key | 花谁的额度 |
|---|---|---|
| 访客 A | A 自己填的 | A 自己 |
| 访客 B | B 自己填的 | B 自己 |
| 你（站长） | 你在**自己浏览器**里填的 | 你自己 |

技术上：配置只存在于浏览器的 `localStorage`（键名 `xuanshu.llm.v1`），不进入任何服务端存储；Node 服务只做请求转发，不落盘、不写日志。所以把网址发给一百个人，你也不会为其中任何一个字付钱。

站内还有一本 **本机用量账本**：记录这台设备调用了几次、输入输出多少字，用来核对额度。它同样只在本地，不上报。

同一个人也可以存多套配置（比如「日常 · 便宜」与「深问 · 贵」），随时一键切换。

## 📐 排盘口径

| 项目 | 口径 |
|---|---|
| 年柱 | 以立春为界 |
| 月柱 | 以节为界（非中气） |
| 日柱 | 真太阳时；**23:00 起取次日**（夜子时法，与 `pai_pan.py` 一致） |
| 时柱 | 五鼠遁 |
| 奇门 | 时家转盘，中五一律寄坤 |
| 紫微 | 三合派，命宫由生月逆数生时定 |
| 飞星 | 按元运论旺衰，兼向超过 3° 建议并参替卦 |
| 塔罗 | 抽牌可复现（seed + time_factor） |
| 择日 | 建除 + 黄历宜忌 + 冲当事人 + 月破（简化版） |

有分歧处（早晚子时、兼向度数、流派取用）在界面与[方法与出处](#-方法与出处)页里标注，不假装唯一答案。

## 🔬 方法与出处

站内每一类结论都标了依据等级，用的是同一套四级标记：

| 标记 | 含义 |
|---|---|
| ✅ | 原文已核对（维基文库公有领域本） |
| 🧮 | 古法规则按原样实现，与独立数据源对照一致 |
| 📖 | 出处公认，本次未取得原文 |
| ⚖️ | 流派口径 / 属判断，各派说法不一 |

八字盘上的**十神、纳音、十二长生、神煞**都可以点开看白话释义与出处（40+ 条，每条带核对状态）。

### 算法来源

排盘内核由三部分组成：

| 类型 | 模块 |
|---|---|
| 成熟库 | 历法与四柱用 lunar-javascript，紫微安星用 iztro |
| 按传统规则重写 | 奇门时家转盘、玄空飞星、八宅游年、择日 |
| 本项目自建 | 78 张塔罗牌库与牌面、100 支签诗数据、合婚与桃花评分 |

各模块的口径、依据等级与核对状态在站内「方法与出处」页逐一列出。

## 🧪 测试

13 个快照用例覆盖排盘边界：夜子时、立春交界、时辰不详、阴阳遁、青龙反转、固定 seed 抽牌。

```bash
npm test           # 比对快照
npm test -- -u     # 改口径后重新生成，必须 review diff
npm run verify     # 打印三盘对照输出，人工核对
npm run mock       # 起假端点，验证流式链路
```

## 📁 目录

```
src/
├── lib/
│   ├── astro/        bazi.ts  ziwei.ts  qimen.ts  fengshui.ts
│   ├── tarot/        deck.ts（78 张）  draw.ts（抽牌 + 牌间关系）
│   ├── love/         match.ts（合婚 / 桃花 / 签 / 红线）
│   ├── data/         sticks.json（100 支签）
│   ├── llm.ts        OpenAI 兼容客户端 + SSE 流式解析
│   └── prompts.ts    六套系统提示词（纪律蒸馏自各 SKILL.md）
├── data/glossary.ts  术语白话 + 出处等级（40+ 条）
├── components/       Starfield · BaguaRing · Compass · MagicCircle
│                     TarotCardView · ReadingPanel · LlmSettings
├── pages/            Home · Bazi · Ziwei · Qimen · Tarot · Love
│                     Fengshui · Method（方法与出处）
scripts/
├── test-snapshot.ts  快照测试
├── verify.ts         排盘自检
├── mock-llm.mjs      假端点
└── dev.mjs           同时起前端与代理
server/index.mjs      静态托管 + /api/llm 代理
```

## ⚠️ 边界

- 不保存任何测算记录，刷新即清空
- 不卖摆件、不做化解商品推荐
- 不替代医疗、法律、投资建议
- 内容为传统文化研究与娱乐参考，不作宿命论断言
- 塔罗牌面为自绘 SVG，非韦特牌原图

## 📄 许可

MIT。术数规则与典籍引文属公有领域。

<div align="center">

**玄枢** · 在星图与卦象之间，问一个具体的问题

</div>
