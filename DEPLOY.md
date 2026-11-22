# 部署指南

## 先说结论

「免费 / 国内稳定 / 不备案」这三个条件**不能同时满足**，只能三选二：

| 你选的 | 代价 |
|---|---|
| 免费 + 不备案 | 走境外节点，国内访问时通时断 |
| 免费 + 国内稳 | 必须绑一个已备案的域名（备案本身免费，但要 1–2 周） |
| 不备案 + 国内稳 | 没有免费方案 |

另外，这个项目有两种形态，直接决定你能不能部署到纯静态托管：

| | 纯静态 | 静态 + Node 代理 |
|---|---|---|
| 依赖 | 无，拖 zip 就行 | 需要能跑 Node 的托管 |
| 对模型端点的要求 | **必须允许浏览器跨域** | 任意端点 |
| 实测可用 | DeepSeek ✅ Moonshot ✅<br>智谱 GLM ❌ SiliconFlow ❌ | 全部可用 |
| 部署难度 | 低 | 中 |

前端会自动探测：能连上 `/api/health` 就走代理，连不上就直连端点。设置面板里会显示当前处于哪种模式。

---

## 方案对比

| 平台 | 免费额度 | 国内访问 | 需要备案 | 能跑代理 |
|---|---|---|---|---|
| **GitHub Pages** | 站点 1GB，流量软限 100GB/月 | 时通时断 | 否 | ❌ |
| **腾讯云 EdgeOne Makers**（原 Pages） | 40 项目、500 次构建/月、5GB 存储、边缘函数 300 万次/月、流量不限 | 默认域名在国内只有 3 小时预览；绑域名走国内节点需备案 | 是（国内节点） | ✅ 边缘函数 |
| **阿里云 OSS / 腾讯云 COS** | 5GB 存储 | 快 | 是（自定义域名） | ❌ |
| Cloudflare Pages | 无限 | `*.pages.dev` 基本不通 | 否 | ✅ |
| Vercel | 100GB 流量 | `*.vercel.app` 不通 | 否 | ✅ |

> EdgeOne 的数字取自 2026-09 官方「限制与配额」文档，免费阶段额度可能调整。

---

## 方案 A：GitHub Pages（现在就能用）

仓库里已经配好 `.github/workflows/deploy.yml`，push 即自动构建部署。

**步骤**

1. 打开仓库 **Settings → Pages**
2. **Source** 选 `GitHub Actions`（不要选 Deploy from a branch）
3. 本地 `git push` 到 `main`
4. 等 Actions 跑完（约 1–2 分钟），访问：

```
https://codeteng.github.io/XUANSHU/
```

workflow 会自动把 `VITE_BASE` 设成 `/<仓库名>/`，所以子路径部署不会白屏。构建前会跑一遍 `npm test`，快照不过就不部署。

**限制**

- 国内访问不稳定：有时能开，有时转圈。作为“发给朋友看一眼”够用，做长期入口不行
- 没有 Node 代理，只能用允许跨域的端点（DeepSeek / Moonshot 实测可以）
- 仓库必须是 public（免费账号）

---

## 方案 B：备案域名 + EdgeOne（国内最快，推荐长期用）

这条路能把国内访问做到“秒开”，代价是备案要等。

**步骤**

1. 买域名：腾讯云/阿里云，`.com` 约 30–60 元/年，`.top`/`.xyz` 首年十几块
2. ICP 备案：在域名所在云厂商提交，个人身份证 + 手写承诺书，7–20 天
3. 打开 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone) → **Makers / Pages** → 新建项目 → 导入 GitHub 仓库
4. 构建配置：
   - 框架预设：`Vite`
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - 环境变量：不需要（根域名部署不用设 `VITE_BASE`）
5. 部署完成后绑定自定义域名，加速区域选**中国大陆可用区**
6. 等 SSL 签发（几分钟）

**如果要保留代理**（让智谱、SiliconFlow 也能用）：

在项目里加三个 Edge Function，把 `server/index.mjs` 的逻辑搬过去：

| 路径 | 作用 |
|---|---|
| `/api/health` | 返回 `{ ok: true, proxy: true }`，前端据此判断走代理 |
| `/api/models` | 转发 `GET {baseUrl}/models` |
| `/api/llm` | 转发 `POST {baseUrl}/chat/completions`，SSE 原样透传 |

EdgeOne 的 Edge Functions 只支持 JavaScript，单函数 5MB、CPU 时间 200ms/请求——转发 SSE 是 IO 等待，不占 CPU，够用。**注意**：`server/index.mjs` 用的是 Node 的 `express` 与 `node:http`，不能直接搬，要改写成基于 `Request`/`Response` 的 fetch 版本（核心逻辑就是 `server/index.mjs` 里 `/api/llm` 那 40 行）。

不写代理也能跑，只是用户选智谱/SiliconFlow 时会看到“端点不允许跨域”的提示。

---

## 方案 C：OSS / COS 静态托管（有备案域名时最便宜）

适合只做纯静态、不折腾函数：

1. 阿里云 OSS 建 Bucket，读写权限设为「公共读」
2. 本地 `VITE_BASE=/ npm run build`，把 `dist/` 整个上传
3. 开启「静态页面」，默认首页 `index.html`
4. 绑定已备案域名 + 开 CDN

腾讯云 COS 同理。**注意**：直接用 OSS/COS 的默认域名访问 HTML 会被强制下载，必须绑自己的域名。

---

## 常见问题

**打开是白屏**

资源路径没对上。子路径部署（`/XUANSHU/`）必须设 `VITE_BASE=/XUANSHU/` 再构建；根域名部署则不设。

Windows 的 Git Bash 会把 `/XUANSHU/` 当成路径转换成 `C:/Program Files/Git/XUANSHU/`，本地构建子路径时加前缀禁用转换：

```bash
MSYS_NO_PATHCONV=1 VITE_BASE=/XUANSHU/ npm run build
```

GitHub Actions 跑在 Linux 上，不受影响，不用管这条。

**点「开始推演」报「网络请求失败」**

这是纯静态部署下的跨域拦截。浏览器不会告诉你原因，本站在错误提示里列了实测可用的端点。换 DeepSeek 或 Moonshot 试试，或者改用带代理的部署。

**部署后模型配置没了**

正常。配置存在浏览器 localStorage，换域名等于换了一个存储空间，需要重新填一次。这也正是「每人自带 Key」的实现方式。

**EdgeOne 的默认域名 `xxx.edgeone.app` 能长期用吗**

不能。国内网络下只能用控制台生成的预览链接，有效期 3 小时，过期返回 401。要么绑备案域名，要么别指望它。

**GitHub Pages 会不会因为仓库名改了就挂**

不会。workflow 用 `${{ github.event.repository.name }}` 动态取仓库名，改名后重新跑一次 Actions 即可。

---

## 一句话建议

- **只想让人点开看看**：GitHub Pages，现在就能用
- **想长期挂在简历/朋友圈**：买个域名备案，走 EdgeOne
- **不想备案又想要国内快**：没有这条路，别绕了
