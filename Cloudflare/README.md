# UW Social — Cloudflare Workers + Workers AI

网站仍部署到 GitHub Pages，Firebase 继续负责登录和数据库。聊天、活动导入和提交时的自动评分由这个 Worker 调用 Workers AI，不需要 Gemini key，也不需要把 Cloudflare token 放进前端。

评分规则保存在 [shared/event-evaluation.json](../shared/event-evaluation.json)，使用方式见 [EVENT_EVALUATION.md](../shared/EVENT_EVALUATION.md)。`/score-event` 使用 `event-value-v2`：先按活动目的分类，再对每项标准给出 0–4 分或 Unknown，并附英文证据。Growth 权重为 40% / 33% / 27%，Social 为 64% / 36%；后端计算百分制总分。信息不足时返回分数区间及加权信息覆盖率，不以零分代替未知。Hybrid 分别计算两类分数；无法分类时返回 Needs clarification。评分卡同时展示 Confidence、Best for、Scoring basis 和 Main limitations。发布和编辑时根据最终表单自动评估，评分失败不会保存活动。粘贴文本中的人工评分不作为最终评分导入。`/recommend-events` 将用户兴趣标签和最多 50 个候选活动发送给 `@cf/meta/llama-3.1-8b-instruct-fp8`，返回按兴趣排序的活动 ID；Worker Cache API 和进程内缓存按用户及输入内容缓存 15 分钟。

## 首次部署

### 活动采集审核的 Firebase 配置准备

凭据 JSON 保存在仓库外。以下命令在 `Cloudflare` 目录运行：

```bash
npm run setup:firebase -- check /absolute/path/service-account.json
npm run setup:firebase -- admin /absolute/path/service-account.json FIREBASE_USER_UID
npm run setup:firebase -- secrets /absolute/path/service-account.json
```

`check` 仅验证本地凭据属于 `uw-social-ae4c7`。`admin` 在 Firebase 中为指定的现有、未禁用用户添加 `admin: true` custom claim，保留其他已有 claims，并读回验证；执行后用户需退出网站重新登录。此操作仅准备身份标记，不代表审核接口或界面已实现。

`secrets` 使用当前 Wrangler 登录，将 `FIREBASE_CLIENT_EMAIL` 和 `FIREBASE_PRIVATE_KEY` 通过标准输入写入 `uw-social-ai` 的 Secrets，不生成凭据副本、不打印私钥。Wrangler 的 `secret bulk` 会更新线上 Worker 的 secrets 并产生部署；不会发布本地源码。需先确认 `npx wrangler whoami` 显示预期 Cloudflare 账户。

### 手动采集与审核（第一阶段）

- 已接入 ECE `sea_ee` 和 Foster `sea_foster` 的公开 Trumba JSON 日历，无需 Browser Rendering。仅处理未来 60 天内开始且尚未结束的活动，取消的活动跳过。
- `POST /admin/imports/list`：分页读取草稿（请求 `{ "pageToken": "" }`）。
- `POST /admin/imports/crawl`：请求 `{ "sourceId": "ece" }` 或 `foster`，最多检查 20 条；每来源保存游标，多次运行可以覆盖全部活动。仅采集草稿，不调用 AI、不发布。
- `POST /admin/imports/review`：请求包含 `id`、`version`、`action`（`approve` 或 `reject`）；批准时还需提交 `event` 中的标题、描述、地点、分类及 ISO 起止时间。批准对最终内容执行 AI 评分，再原子写入正式活动和审核状态。AI 失败不发布。
- 三个接口均要求 Firebase token 的 `admin` custom claim 严格等于 `true`，共享现有每用户 5 次/分钟限制。评分还受应用 AI 限流约束。
- 草稿、运行记录、来源游标分别在 `eventCandidates`、`crawlRuns`、`crawlSources`。同一 Trumba ID 跨来源去重，相同的已拒绝内容不重新入队；来源变化重新待审核。已发布内容经再次批准更新同一活动并保留参与者。
- 审核页面使用网站的 Hash 路由：`/#/admin/imports`，登录后的头像菜单提供 **Review activities**。仅显示当前页加载的结果，可加载更早记录。手动修改后批准时仍保留原始来源链接。
- `IMPORT_ORGANIZER_UID` 是编辑团队活动的归属 UID，不是管理员授权白名单；授权依据是已验证的 custom claim。

验证部署顺序：运行 `npm test`、`npm run check`，然后在 `Cloudflare` 运行 `npm run deploy`。在 `Frontend/.env.local` 设置 `VITE_AI_API_BASE_URL` 为部署输出的 Worker URL（无路径），运行 `npm run dev -- --port 5173`，登录后打开 `http://localhost:5173/#/admin/imports`。端口必须为白名单中的 5173；若占用则关闭旧服务或更新白名单。

正式上线时通过项目既有 Firebase 流程部署 `Frontend/firestore.rules`，其中导入草稿禁止浏览器直接访问，`import-` 活动 ID 保留给服务端创建；再按既有 GitHub Pages 工作流部署前端。本阶段未启用 Cron/Queues、Luma 或 Devpost。已发布活动的取消/删除尚不会自动同步，需要管理员人工处理。仅本地构建成功不等于线上已部署或浏览器联调通过。


1. 注册/登录 Cloudflare，选择 **Workers Free**。启用 Workers AI 并接受模型条款（如果控制台提示）。不要为了此配置升级到付费方案。
2. 本地使用 Node.js 22 或更高版本，在项目根目录运行：

   ```bash
   cd Cloudflare
   npm ci
   npx wrangler login
   npm test
   npm run check
   npm run deploy
   ```

3. 保存部署输出中的完整 `https://uw-social-ai.<你的子域>.workers.dev` 地址。
4. 在 GitHub 仓库的 Settings → Secrets and variables → Actions → **Variables** 中创建仓库变量 `VITE_AI_API_BASE_URL`，值为上面的地址，不加 `/chat`。工作流会在下次构建时读取它；手动重新运行 GitHub Pages 部署，或推送变更触发部署。该地址是公开配置，不是密钥。
5. 本地开发时，在 `Frontend/.env.local` 添加同名变量：

   ```dotenv
   VITE_AI_API_BASE_URL=https://uw-social-ai.<你的子域>.workers.dev
   ```

6. 登录网站，验证 AI Consultant 能回答、活动导入能填入表单、引用能打开对应活动。浏览器请求应发往 Worker，并且不会再包含 Gemini key。
7. 在 Google AI Studio 撤销旧 Gemini key；删除 GitHub Actions 中旧的 `VITE_GEMINI_API_KEY` secret，以及本地环境文件里的 `VITE_GEMINI_API_KEY` / `VITE_GEMINI_MODEL`。仅删除变量不会使旧 key 失效。Google Maps key 继续按原有用途保留并设置域名/API 限制。

## 配置与访问控制

- `wrangler.jsonc` 中的 `FIREBASE_PROJECT_ID` 必须与网站登录使用的 Firebase 项目一致，当前为 `uw-social-ae4c7`。
- `ALLOWED_ORIGINS` 为精确来源白名单；来源不包含路径，例如测试网站 `https://uw-social.github.io/test/` 的来源是 `https://uw-social.github.io`。本地默认允许 `http://localhost:5173`，其他端口需手动加入并重新部署。
- `/chat`、`/extract-event`、`/score-event` 和 `/recommend-events` 都必须携带 Firebase ID token。Worker 校验 RS256 签名、issuer、audience、expiry、subject 和认证时间，并拒绝匿名登录。无需 Firebase 管理员私钥。浏览器 SDK 自动刷新 ID token；这里不额外查询用户撤销状态，被禁用/撤销用户的现有 token 可能在过期前仍有效。
- CORS 只约束浏览器，不替代身份校验。不要通过关闭身份校验解决 401。
- 四个接口共享每用户每分钟 5 次的服务端限流，应用整体每分钟 30 次。缓存命中不会调用模型或消耗限流额度。Cloudflare 原生限流是按边缘位置计算的近似限流，**不是全球精确日配额**。前端的会话计数仅用于交互提示。
- 请求体最大 64 KiB，聊天消息最多 4,000 字符，历史最多 8 条，活动上下文最多 12 条；活动导入原文最多 24,000 字符。输出 token 上限在服务端设置。
- Worker 只做模型推理，不代为抓取任意 URL；活动链接导入仍受目标网站原有 CORS 限制，不能读取时可粘贴正文。
- 活动和兴趣等上下文会发送给 Cloudflare 模型；没有添加消息持久化或请求正文日志。

## 免费额度

Workers AI 免费额度与 Workers 请求额度分别计算。当前 Workers AI 每天有 **10,000 Neurons** 免费额度；实际可处理的对话数量取决于模型与输入/输出长度。免费方案额度耗尽后请求失败，需要等额度重置。聊天和活动推荐使用 `@cf/meta/llama-3.1-8b-instruct-fp8`；活动解析使用 `@cf/meta/llama-3.3-70b-instruct-fp8-fast`，并传入活动字段的 JSON Schema。8B fp8 模型不支持 JSON Schema，因此推荐接口使用 JSON mode，旧的非 fp8 8B 模型已不可用。不自动切换其他供应商或付费模型。

运行 `npm run dev` 时 AI binding 仍使用真实 Cloudflare 远端推理，消耗账户额度；离线测试 `npm test` 使用模拟模型，不产生推理用量。

官方参考：[Workers AI 价格](https://developers.cloudflare.com/workers-ai/platform/pricing/)、[模型说明](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/)、[限流说明](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、[Firebase token 校验](https://firebase.google.com/docs/auth/admin/verify-id-tokens)。
