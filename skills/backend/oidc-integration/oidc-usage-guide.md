# OIDC 接入使用指南

## 与项目配置对齐

实施 OIDC 时，必须使技能配置与目标项目既有设置一致，避免仅复制示例值导致请求打到错误地址。

### backend_api_base_url

- 对照项目前端 axios `baseURL`、`.env` 中的 API 基底变量（如 `VITE_API_BASE_URL`、`REACT_APP_API_BASE_URL`）。
- 必须包含协议、主机、端口及 API 路径前缀（如有）。
- 禁止使用仅相对路径（如 `/api`）。

### frontend_app_url

- 对照前端实际访问 origin（开发/部署 URL）。
- 用于后端 CORS 配置；须与 `OIDC_CLIENT_REDIRECT_URI` 的 host/port 策略一致。

### OIDC_CLIENT_REDIRECT_URI

- 指向前端 `/callback` 路由的完整 URL。
- 须与 OIDC 提供者在控制台注册的回调地址完全一致（含 IP、端口）。

### 环境变量前缀

| 构建工具 | 前缀 | 访问方式 |
|----------|------|----------|
| CRA (react-scripts) | `REACT_APP_` | `process.env.REACT_APP_*` |
| Vite | `VITE_` | `import.meta.env.VITE_*` |
| Next.js | `NEXT_PUBLIC_` | `process.env.NEXT_PUBLIC_*` |

### Vite 代理

- 仅代理 `'/login/oidc'`，勿代理 `'/login'`。
- `/login`、`/oidc-login` 由 Vite 返回 SPA `index.html`。

### oidc-config.json 与 .env 同步

- 步骤七写入的 `.env` 键值应与 `oidc-config.json`（或 AskQuestion 补齐结果）一致。
- `sso_login_button_text` 仅用于共存模式按钮 JSX 字面量，不写入 `.env`。
