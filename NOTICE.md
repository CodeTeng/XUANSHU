# NOTICE

本项目以 MIT 许可发布。以下为第三方来源与使用方式的说明。

## 一、直接依赖的开源库

| 库 | 许可 | 用途 |
|---|---|---|
| [lunar-javascript](https://github.com/6tail/lunar-javascript) | MIT | 历法换算、四柱、节气、大运 |
| [iztro](https://github.com/SylarLong/iztro) | MIT | 紫微斗数安星 |
| [React](https://react.dev) / [Vite](https://vitejs.dev) / [Tailwind CSS](https://tailwindcss.com) / [Framer Motion](https://www.framer.com/motion/) | MIT | 前端框架与动画 |

## 二、规则与知识的来源仓库

| 仓库 | 许可状态 | 本项目的使用方式 |
|---|---|---|
| [jinchenma94/bazi-skill](https://github.com/jinchenma94/bazi-skill) | **MIT** | 参考分析顺序、神煞表与夜子时口径；排盘改用 lunar-javascript 实现 |
| [daman-ovo-0404/tarot-skill](https://github.com/daman-ovo-0404/tarot-skill) | **MIT** | 参考抽牌纪律（seed / time_factor / 可复现）与花色数字体系；78 张牌义与 SVG 牌面为自建 |
| [FANzR-arch/Numerologist_skills](https://github.com/FANzR-arch/Numerologist_skills) | **未声明** | 参考奇门定局表、转盘排布规则与紫微口径；代码以 TypeScript 独立重写，未复制其 Python 源码 |
| [voidforall/fengshui.skill](https://github.com/voidforall/fengshui.skill) | **未声明** | 参考玄空飞星、八宅、择日规则与核对状态体系；算法以 TypeScript 独立重写。`src/data/glossary.ts` 的术语白话释义改写自其 `scripts/kanyu/glossary.py` |
| [Ming-H/yinyuan-skills](https://github.com/Ming-H/yinyuan-skills) | **未声明** | 100 支签诗文本提取自其 `references/fortune-sticks.md`；合婚、生肖、桃花规则参考其 `references/` |

## 三、关于传统知识

术数规则本身（如六十甲子、游年歌诀、奇门定局表、十二宫安星法）属传统公有知识，不构成著作权客体。受著作权保护的是具体的代码表达与文字表述。

本项目对未声明许可的三个仓库，采取的处理是：

- **算法**：读取其规则后以 TypeScript 独立重写，不复制源码文件
- **术语释义**：`glossary.ts` 部分条目改写自 fengshui.skill 的白话释义，已尽力重述，但实质内容相近

## 四、商业使用建议

若你计划将本项目用于商业用途，建议：

1. 联系 `FANzR-arch`、`voidforall`、`Ming-H` 三位作者，确认其仓库的使用条款
2. 或替换 `src/data/glossary.ts` 的释义文案与 `src/data/sticks.json` 的签诗文本
3. 保留本文件与上述 MIT 项目的版权声明

本项目作者不对上述未声明许可仓库的授权状态作任何保证。

## 五、典籍引文

`glossary.ts` 中标注 ✅ 的引文取自维基文库所收公有领域古籍（《三命通会》《渊海子平》《穷通宝鉴》等）。引文仅用于说明术语出处，不构成对古籍的独占主张。
