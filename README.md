# 玄枢 XUANSHU

中国传统术数的可视化推演站。四柱、紫微、奇门、塔罗、姻缘、堪舆六门，排盘由确定性算法完成，解读交给你自己接入的大模型。

> 盘是算出来的，话是问出来的。

## 为什么这样拆

大模型很会说话，但不擅长排盘。历法换算、定局起盘、安星布门这些地方，「看起来对」的错误最难被发现。所以这个站把两件事分开：

- **算法层**：四柱、九局、十二宫、飞星、抽牌、求签，全部由代码算出。同一次输入永远得到同一结果，可以与通行排盘软件逐条对照。
- **解读层**：模型只读算法给的盘面事实，负责翻译成人话。换模型不会改变盘面。

## 功能

| 门 | 子模式 | 排盘内核 |
|---|---|---|
| 四柱八字 | 四柱 / 十神 / 藏干 / 五行 / 神煞 / 大运 / 流年 | lunar-javascript |
| 紫微斗数 | 十二宫 / 主星辅星 / 庙旺 / 生年四化 / 大限 | iztro（三合派） |
| 奇门遁甲 | 阴阳遁定局 / 九宫 / 九星八门八神 / 值符值使 / 空亡驿马 / 格局 | 移植 qimen_cli.py |
| 塔罗 | 5 种牌阵 / 78 张牌 / 正逆位 / 牌间关系 / 可复现抽牌 | 自建牌库 + mulberry32 |
| 姻缘 | 八字合婚 / 生肖配对 / 夫妻宫 / 求签 / 桃花 / 红线 | 100 支签 + 合婚规则 |
| 堪舆 | 玄空飞星 / 八宅命卦 / 择日 | 移植 kanyu/ + 黄历 |

## 快速开始

```bash
npm install

# 开发（Vite 5173 + 代理服务 8787）
npm run dev
npm run serve        # 另开一个终端，提供 /api/llm 代理

# 生产
npm run build
npm start            # 构建并起服务，默认 http://127.0.0.1:8787
```

`npm run serve` 只做两件事：托管 `dist/`，以及把浏览器请求转发到你填的模型端点（绕过 CORS）。密钥只在单次请求的内存里过一遍，不落盘、不写日志。

## 接入模型

右上角「接入模型」打开配置面板：

- **接口地址**：任何 OpenAI 兼容端点，需以 `/v1` 结尾，站内会拼接 `/chat/completions`
- **API Key**：只写入本浏览器 localStorage
- **模型**：可手填，也可点「测试连接」拉取可用列表

内置 DeepSeek / OpenAI / Moonshot / 智谱 / SiliconFlow / Ollama 预设。本地 Ollama 不需要 Key。

> 若部署在纯静态环境（无 Node 服务），请求会由浏览器直连端点，需要端点允许跨域。

## 排盘口径与出处

本项目的算法与知识分别来自五个开源 skill 仓库，处理方式如下：

| 来源 | 用途 | 处理 |
|---|---|---|
| `jinchenma94/bazi-skill` | 四柱、十神、神煞、大运规则 | 排盘改用 lunar-javascript（与 lunar-python 同作者同源），1990-05-15 12:00 例与 `pai_pan.py` 输出逐字一致 |
| `FANzR-arch/Numerologist_skills` | 奇门、紫微 | 奇门逐行移植 `qimen_cli.py`（含中五寄坤、值符加时干、值使移宫）；紫微用 iztro，命宫/夫妻宫位置与 `ziwei_cli.py` 人工核对一致 |
| `Ming-H/yinyuan-skills` | 姻缘六模式 | 100 支签诗从 `fortune-sticks.md` 提取为 JSON；六合/三合/六冲/六害/三刑、桃花位、合婚规则照 `references/` 实现 |
| `voidforall/fengshui.skill` | 玄空飞星、八宅、择日 | 移植 `kanyu/feixing.py`、`bazhai.py`、`core.py`；择日简化为建除 + 黄历宜忌 + 冲当事人 |
| `daman-ovo-0404/tarot-skill` | 塔罗纪律 | 抽牌纪律（脚本抽牌、展示 seed/time_factor、可复现）与花色数字体系照 `cards.md`；78 张牌义与 SVG 牌面自建 |

口径声明：

- 年柱以立春为界，月柱以节为界，子时默认 23:00 换日
- 奇门为时家转盘奇门，中五一律寄坤
- 紫微走三合派，命宫由生月逆数生时定，五行局起大限
- 玄空飞星按元运论旺衰，兼向超过 3° 建议并参替卦
- 有分歧处（早晚子时、兼向度数、流派取用）在界面上标注，不假装唯一答案

## 目录

```
src/
├── lib/
│   ├── astro/        bazi.ts  ziwei.ts  qimen.ts  fengshui.ts
│   ├── tarot/        deck.ts（78 张）  draw.ts（抽牌）
│   ├── love/         match.ts（合婚/桃花/签/红线）
│   ├── data/sticks.json
│   ├── llm.ts        OpenAI 兼容客户端 + 流式解析
│   └── prompts.ts    六套系统提示词（纪律蒸馏自各 SKILL.md）
├── components/       Starfield  BaguaRing  Compass  MagicCircle
│                     TarotCardView  ReadingPanel  LlmSettings
├── pages/            Home  Bazi  Ziwei  Qimen  Tarot  Love  Fengshui
scripts/
├── verify.ts         排盘自检：三盘对照输出
├── mock-llm.mjs      假端点，用于本地验证流式链路
server/index.mjs      静态托管 + /api/llm 代理
```

## 边界

- 不保存任何测算记录，刷新即清空
- 不卖摆件、不做化解商品推荐
- 不替代医疗、法律、投资建议；涉及健康提示就医，涉及财务提示理性决策
- 内容为传统文化研究与娱乐参考，不作宿命论断言

排盘引擎自检：

```bash
npx tsx scripts/verify.ts
```
