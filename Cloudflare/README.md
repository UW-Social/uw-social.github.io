# UW Social — Cloudflare Workers + Workers AI

网站仍部署到 GitHub Pages，Firebase 继续负责登录和数据库。聊天、活动导入和提交时的自动评分由这个 Worker 调用 Workers AI，不需要 Gemini key，也不需要把 Cloudflare token 放进前端。

评分规则保存在 [shared/event-evaluation.json](../shared/event-evaluation.json)，使用方式见 [EVENT_EVALUATION.md](../shared/EVENT_EVALUATION.md)。`/score-event` 根据最终活动信息返回四项评分依据；后端按 35% / 25% / 25% / 15% 计算总分及星级，对外评分使用 5.0 分制并保留一位小数；内部保留百分制分数用于星级阈值计算。发布和编辑时自动评估，评分失败不会保存活动。粘贴文本中的人工评分不作为最终评分导入。未来自动抓取也应复用这个接口。

## 首次部署

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
- `/chat`、`/extract-event` 和 `/score-event` 都必须携带 Firebase ID token。Worker 校验 RS256 签名、issuer、audience、expiry、subject 和认证时间，并拒绝匿名登录。无需 Firebase 管理员私钥。浏览器 SDK 自动刷新 ID token；这里不额外查询用户撤销状态，被禁用/撤销用户的现有 token 可能在过期前仍有效。
- CORS 只约束浏览器，不替代身份校验。不要通过关闭身份校验解决 401。
- 三个接口共享每用户每分钟 5 次的服务端限流，应用整体每分钟 30 次。Cloudflare 原生限流是按边缘位置计算的近似限流，**不是全球精确日配额**。前端的会话计数仅用于交互提示。
- 请求体最大 64 KiB，聊天消息最多 4,000 字符，历史最多 8 条，活动上下文最多 12 条；活动导入原文最多 24,000 字符。输出 token 上限在服务端设置。
- Worker 只做模型推理，不代为抓取任意 URL；活动链接导入仍受目标网站原有 CORS 限制，不能读取时可粘贴正文。
- 活动和兴趣等上下文会发送给 Cloudflare 模型；没有添加消息持久化或请求正文日志。

## 免费额度

Workers AI 免费额度与 Workers 请求额度分别计算。当前 Workers AI 每天有 **10,000 Neurons** 免费额度；实际可处理的对话数量取决于模型与输入/输出长度。免费方案额度耗尽后请求失败，需要等额度重置。聊天使用 `@cf/meta/llama-3.1-8b-instruct-fp8`；活动解析使用 `@cf/meta/llama-3.3-70b-instruct-fp8-fast`，并传入活动字段的 JSON Schema。8B fp8 模型不支持 JSON Schema，旧的非 fp8 8B 模型已不可用。不自动切换其他供应商或付费模型。

运行 `npm run dev` 时 AI binding 仍使用真实 Cloudflare 远端推理，消耗账户额度；离线测试 `npm test` 使用模拟模型，不产生推理用量。

官方参考：[Workers AI 价格](https://developers.cloudflare.com/workers-ai/platform/pricing/)、[模型说明](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/)、[限流说明](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、[Firebase token 校验](https://firebase.google.com/docs/auth/admin/verify-id-tokens)。
