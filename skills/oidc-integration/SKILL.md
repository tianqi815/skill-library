---
name: oidc-integration
description: 前後端項目接入自建 OIDC Server 的技能。為 React 前端和 Node.js（Express）後端提供完整的 OIDC 身份驗證整合方案，使用 openid-client v5.x 函式庫。僅適用於自建 OIDC Server。支援兩種整合模式：共存模式（保留舊登入 + 新增 OIDC）與替換模式（移除舊登入、僅用 OIDC）。用於實施統一登入、權杖管理、API 認證中介軟體。當需要為項目接入自建 OIDC 服務、實現單一登入（SSO）、替換或並行現有登入邏輯時使用此技能。
---

# OIDC 協議接入技能

為前後端項目接入**自建 OIDC Server** 提供標準化的身份驗證方案。前端使用 React，後端使用 Node.js + Express + openid-client v5.x。

> **適用範圍**：僅適用於自建 OIDC Server。不適用於 Keycloak、Auth0、Azure AD、Okta 等第三方 OIDC 平台（這些平台有各自的 SDK 和接入方式）。

## ⚠️ 常見陷阱（實施前必讀）

以下是實際接入中遇到過的典型錯誤，**每個步驟都必須對照檢查**：

**1. 依賴缺失：腳本中使用的外部庫，目標項目未必已安裝**
- 後端腳本依賴 `openid-client`、`dotenv` 等，必須確認已安裝再使用
- 前端腳本依賴 `axios`，必須確認已安裝
- **原則**：任何 `require()` 或 `import` 引用的第三方包，都要檢查目標項目的 `package.json` 中是否存在，缺少則安裝

**2. 前端框架差異：環境變數前綴、構建工具、路由系統各不相同**
- CRA（react-scripts）使用 `REACT_APP_` 前綴
- **Vite** 使用 `VITE_` 前綴，且透過 `import.meta.env` 而非 `process.env` 訪問
- Next.js 使用 `NEXT_PUBLIC_` 前綴
- **原則**：步驟二必須識別前端構建工具，步驟五、七中所有 `process.env.REACT_APP_*` 都要替換為目標項目對應的寫法

**3. 導入路徑錯誤：替換舊功能時，其他文件中的 import 仍指向已刪除的舊文件**
- 替換登入組件後，路由配置、導航組件等可能仍 `import` 舊的文件
- 移除舊的 API 調用文件後，其他模組可能仍引用它
- **原則**：每次刪除或替換文件後，全局搜索該文件名，修正所有引用

**4. 權杖存儲位置錯誤：`sessionStorage` 不應存放認證權杖**
- `access_token`、`refresh_token`、使用者資訊等**必須**使用 `localStorage` 或項目既有的 `store` 等持久化封裝
- `sessionStorage` 在分頁關閉即清空，且部分跳轉場景下易與預期不符，導致「登入後立刻丟失權杖」
- 本技能腳本中 `sessionStorage` 僅用於**流程輔助標記**（如授權碼去重），**嚴禁**將權杖寫入 `sessionStorage`
- **類似錯誤**：將權杖只存在 React state / 記憶體變數中，頁面刷新後同樣丟失

**5. 前端請求後端 API 時使用相對路徑，請求落到前端開發伺服器埠**
- 錯誤寫法：`fetch('/login/oidc/callback?...')` 或 `axios.get('/login/oidc/callback')` 且未設置 `baseURL`
- 瀏覽器會將相對路徑解析為**當前頁面的 origin**（即前端 `http://localhost:3000` 等），不會自動指向後端
- **正確做法**：環境變數配置**完整後端基底 URL**（含 `http://` 或 `https://`、主機、埠、API 上下文路徑），例如 `http://172.31.61.27:5000`，再拼接 `/login/oidc/callback`
- **類似錯誤**：`baseURL` 只寫 `/api`、遺漏埠號、前後端不同網段卻未配置代理且仍用相對路徑

**6. Vite 開發代理：切勿將 `'/login'` 設為代理至後端的前綴**
- 若 `vite.config` 中 `server.proxy` 使用鍵 **`'/login'`** 指向後端，則凡以 `/login` 開頭的請求（含 **`GET /login`**）都會被轉發至後端；React Router 的**帳密登入頁**路徑通常即為 **`/login`**，瀏覽器載入該頁時會變成請求後端的 `GET /login`，後端往往**無此路由** → 控制台出現 **`/login` 404**。
- **正確做法**：僅代理 OIDC 路徑前綴，例如 **`'/login/oidc'`**（可涵蓋 `GET /login/oidc`、`GET /login/oidc/callback?...`），**不要**代理整段 **`/login`**。`/login`、`/oidc-login` 仍應由 Vite 回傳 SPA 的 `index.html`。

**7. 共存模式：全域 axios 401 攔截器與「帳密登入失敗」**
- 舊登入 API（如 **`POST /api/auth/login`**）在帳號或密碼錯誤時常回 **401**，與「已帶 token 但過期／無效」相同狀態碼。
- 若全域回應攔截器對**任意** 401 都執行「清除憑證並 **`window.location.href='/login'`**」，會誤把**登入失敗**當成**已登入後失效**，且可能與重導、StrictMode 疊加造成異常體驗。
- **原則**：對 **`/auth/login`、`/auth/register`**（依專案實際路徑調整）的 401 **不得**觸發「視為 session 過期」的全域清憑證／整頁重導，應將錯誤交回登入表單顯示。併入 OIDC 攔截器時（**5.4**）須與既有 `api` 實例一併檢查。

---

## 實施流程

複製以下清單追蹤進度：

```
任務進度：
- [ ] 步驟零：讀取配置文件
- [ ] 步驟一：收集 OIDC 配置參數
- [ ] 步驟二：分析項目結構
- [ ] 步驟三：安裝依賴
- [ ] 步驟四：後端 OIDC 實施
- [ ] 步驟五：前端 OIDC 實施
- [ ] 步驟六：整合模式實施（共存 or 替換）
- [ ] 步驟七：環境配置
- [ ] 步驟八：生成接入分析文檔
```

---

### 步驟零：讀取配置文件

實施前 Agent **必須**先嘗試讀取配置文件，以取代後續步驟中的互動式提問。

**查找順序（優先級由高到低）：**

1. **項目根目錄** `oidc-config.json`（使用者提供的實際配置）
2. **技能目錄** `oidc-config.example.json`（與本 SKILL.md 同目錄之範例配置 / 預設值）

**讀取規則：**
- 若項目根目錄存在 `oidc-config.json`，以該文件為準（**實際配置**）
- 若不存在，讀取 `oidc-config.example.json` 作為預設值
- 配置文件中的**空字串 `""`、`null`、缺失欄位**視為「未配置」，Agent 須以 **AskQuestion** 向使用者補齊（**例外**：`sso_login_button_text` 空或缺失時採 `oidc-config.example.json` 之預設字串，無須寫入 `.env`）
- 後續步驟中凡標注「**讀取配置：`欄位路徑`**」者，均引用本配置文件中的對應鍵值

**配置欄位速查表：**

| 欄位路徑 | 類型 | 用於步驟 | 說明 |
|----------|------|----------|------|
| `oidc_params.OIDC_URI_ISSUER` | string | 一、七 | OIDC 發行者 URL |
| `oidc_params.OIDC_URI_TOKEN` | string | 一、七 | 權杖端點 URL |
| `oidc_params.OIDC_URI_INTROSPECTION` | string | 一、七 | 內省端點 URL |
| `oidc_params.OIDC_CLIENT_ID` | string | 一、七 | 客戶端 ID（**必填**） |
| `oidc_params.OIDC_CLIENT_SECRET` | string | 一、七 | 客戶端密鑰（**必填**） |
| `oidc_params.OIDC_CLIENT_SCOPE` | string | 一、七 | 授權範圍 |
| `oidc_params.OIDC_CLIENT_REDIRECT_URI` | string | 一、七 | 前端回調 URL（**必填**） |
| `backend_api_base_url` | string | 一、五、七 | 後端 API 完整基底 URL（**必填**） |
| `frontend_app_url` | string | 一、七 | 前端應用 URL |
| `sso_login_button_text` | string | 五（共存 UI） | 舊登入頁 OIDC／SSO 按鈕顯示文字；**勿**寫入 `.env`；實施時以 JSX **字面量**寫入（值取自本鍵；缺失或空則採範例文件預設 `SANFIELD PORTAL LOGIN`） |
| `integration_mode` | `"1"` \| `"2"` | 六 · 6.0 | 整合模式：1 共存 / 2 替換 |
| `post_auth_mode` | `"A"` \| `"B"` \| `"C"` | 六 · 6.1 | 認證後模式 |
| `local_user_config.table_name` | string | 六 · 6.1 (B/C) | 本地使用者表名 |
| `local_user_config.match_field.oidc_claim` | string | 六 · 6.1 (B/C) | 用於匹配的 OIDC claim（如 `sub`） |
| `local_user_config.match_field.local_column` | string | 六 · 6.1 (B/C) | 本地表對應的匹配欄位名 |
| `local_user_config.return_fields` | string[] | 六 · 6.1 (B/C) | 需回傳給前端的業務欄位列表 |
| `auto_create_user_config.role_field_name` | string | 六 · 6.1 (C) | 角色欄位名（如 `role`、`role_id`） |
| `auto_create_user_config.default_role_value` | any | 六 · 6.1 (C) | 新建使用者的預設角色值 |
| `auto_create_user_config.other_defaults` | object | 六 · 6.1 (C) | 其他新建必填欄位及預設值 |

> **範例文件**：[oidc-config.example.json](oidc-config.example.json)

---

### 步驟一：收集 OIDC 配置參數

**讀取配置：`oidc_params.*`、`backend_api_base_url`、`frontend_app_url`**

從步驟零載入的配置文件中讀取以下欄位。若欄位為空或缺失，使用 AskQuestion 向使用者補齊。

| 配置欄位路徑 | 說明 | 必填 |
|-------------|------|------|
| `oidc_params.OIDC_URI_ISSUER` | OIDC 發行者 URL | 是 |
| `oidc_params.OIDC_URI_TOKEN` | 權杖端點 URL | 是 |
| `oidc_params.OIDC_URI_INTROSPECTION` | 內省端點 URL | 是 |
| `oidc_params.OIDC_CLIENT_ID` | 客戶端 ID | 是 |
| `oidc_params.OIDC_CLIENT_SECRET` | 客戶端密鑰 | 是 |
| `oidc_params.OIDC_CLIENT_SCOPE` | 授權範圍 | 否（預設 `openid profile offline_access`） |
| `oidc_params.OIDC_CLIENT_REDIRECT_URI` | 前端回調 URL | 是 |
| `backend_api_base_url` | 後端 API 完整基底 URL（協議 + 主機 + 埠 + 路徑前綴） | 是 |
| `frontend_app_url` | 前端應用 URL（用於 CORS 配置） | 是 |

另讀 **`sso_login_button_text`**（見步驟零速查表）：供整合模式 1 之舊登入頁 SSO 按鈕文案；實施時寫入 JSX 字面量，**不**寫入 `.env`。空或缺失時採 `oidc-config.example.json` 預設字串。

**驗證規則：**
- `backend_api_base_url` 必須以 `http://` 或 `https://` 開頭，**不可**僅為相對路徑
- `OIDC_CLIENT_REDIRECT_URI` 須為完整 URL，包含協議與埠號
- 任何標記為「是」的必填欄位若為空，Agent **必須**使用 AskQuestion 向使用者補齊後方可繼續

**與原項目對齊：** 實施時應對照專案既有 `.env`、axios `baseURL`、`vite.config`/`package.json` 代理等，使 **`backend_api_base_url`** 與既有後端請求 origin 一致；`frontend_app_url` 與實際前端訪問 origin 一致；步驟七寫入的 `.env` 與 `oidc-config.json` 同值。若原配置檔結構不適用，可在合適位置**另行**補齊環境變數（仍須滿足腳本所讀變數名）。詳見 [oidc-usage-guide.md](oidc-usage-guide.md)「與原項目配置對齊」。

---

### 步驟二：分析項目結構

1. 掃描項目目錄，識別前端（React）和後端（Node.js）子項目的位置
2. 確認各子項目的 `package.json` 位置
3. 識別後端的路由掛載方式（Express Router 結構）
4. 識別前端的路由系統（React Router 版本和配置方式）
5. 識別現有的登入邏輯和認證機制（需要被替換的部分）
6. 確認後端是否已存在 `openid-client`、`dotenv` 等依賴及其版本
7. **（關鍵）識別前端構建工具和環境變數慣例**：
   - 檢查 `package.json` 中的 `scripts` 和 `devDependencies`
   - `react-scripts` → CRA → 環境變數前綴 `REACT_APP_`，透過 `process.env` 訪問
   - `vite` → Vite → 環境變數前綴 `VITE_`，透過 `import.meta.env` 訪問
   - `next` → Next.js → 環境變數前綴 `NEXT_PUBLIC_`，透過 `process.env` 訪問
   - **記住此結果**，步驟五、七中所有環境變數引用都必須使用正確的前綴和訪問方式
8. **識別後端環境變數加載方式**：確認是否已安裝 `dotenv` 並在入口文件中調用 `require('dotenv').config()`，若無則在步驟三中安裝並配置
9. **（Vite）檢查 `vite.config` 之 `server.proxy`**：若為接入 OIDC 曾新增代理，**不得**使用 **`'/login'`** 作為指向後端的鍵（見**常見陷阱 · 6**）；僅允許 **`'/login/oidc'`** 前綴。
10. **（共存）檢查既有 axios 全域 401 攔截器**：併入 OIDC 時須排除舊帳密 **`/auth/login` 等**路徑之 401（見**常見陷阱 · 7**）。

---

### 步驟三：安裝依賴

先讀取前後端 `package.json`，逐項檢查已有依賴，**僅安裝缺少的**：

**後端依賴**（在後端項目目錄執行）：
```bash
# 核心依賴（必須）
npm install openid-client@^5.6.5

# 環境變數加載（若 package.json 中不存在 dotenv 則安裝）
npm install dotenv
```

若安裝了 `dotenv`，確認後端入口文件（如 `index.js`、`app.js`）頂部已有：
```javascript
require('dotenv').config()
```

**前端依賴**（確認已安裝，若無則安裝）：
```bash
npm install axios
```

執行完成後，列出安裝結果報告，包含：
- 已安裝的依賴名稱與版本
- 安裝失敗的依賴及原因
- 已存在而跳過的依賴

---

### 步驟四：後端 OIDC 實施

讀取 [scripts/backend/](scripts/backend/) 目錄下的腳本，根據項目結構調整後複製至對應位置。

#### 4.1 OIDC 工具類別

將 `scripts/backend/oidc-utils.js` 複製至後端 `utils/` 目錄。

**關鍵設計決策：**
- **端點配置優先於自動發現**：優先使用 `OIDC_URI_TOKEN` 等環境變數手動構建 Issuer，避免 `Issuer.discover()` 改寫端點地址（例如將 IP 轉為 localhost）
- **嚴格 redirect_uri**：所有方法固定使用 `OIDC_CLIENT_REDIRECT_URI` 配置值，不接受外部參數覆蓋，確保與 OIDC 提供者資料庫中註冊的回調地址完全一致
- 無需修改代碼，透過環境變數配置即可

#### 4.2 登入控制器

將 `scripts/backend/oidc-controller.js` 複製至後端 `controllers/` 目錄。

**關鍵調整：** 修正 `require('../utils/oidc-utils')` 的引入路徑。

**認證後擴展：** 檔內 **`postAuthHook`** 用於在取得 OIDC `userInfo` 後查詢／建立本地使用者並回傳 `localUserInfo`。步驟六 **6.1** 會依專案認證後模式（A/B/C）決定是否實作；詳見 [references/post-auth-patterns.md](references/post-auth-patterns.md)。

#### 4.3 認證中介軟體

將 `scripts/backend/oidc-middleware.js` 複製至後端 `middlewares/` 或 `routes/middlewares/` 目錄。

**關鍵調整：** 修正 `require('../utils/oidc-utils')` 的引入路徑。

#### 4.4 路由配置

將 `scripts/backend/oidc-routes.js` 複製至後端 `routes/` 目錄。

**關鍵調整：**
- 修正控制器和中介軟體的引入路徑
- 在主路由文件中掛載：`router.use('/login/oidc', require('./oidc-routes'))`

#### 4.5 保護現有 API 路由

**替換模式（Mode 2）：** 對所有需要認證的路由，將舊認證中介軟體替換為 OIDC 中介軟體：
```javascript
const oidcMiddleware = require('./middlewares/oidc-middleware')
router.get('/protected-api', oidcMiddleware.verifyAccessToken, controller.handler)
```

**共存模式（Mode 1）：** 保留舊認證中介軟體，新增一個「雙重驗證」中介軟體，依序嘗試 OIDC 驗證與舊驗證，任一通過即放行（**僅**用於受保護 API；**不**改寫舊登入 API 之本體邏輯，見步驟六 · 6.2）：
```javascript
const oidcMiddleware = require('./middlewares/oidc-middleware')
const legacyAuth = require('./middlewares/existing-auth-middleware')

function dualAuthMiddleware(req, res, next) {
  oidcMiddleware.verifyAccessToken(req, res, (oidcErr) => {
    if (!oidcErr) return next()
    legacyAuth(req, res, (legacyErr) => {
      if (!legacyErr) return next()
      return res.status(401).json({ error: '認證失敗' })
    })
  })
}

router.get('/protected-api', dualAuthMiddleware, controller.handler)
```
> **共存模式要點：** 以上為概念範例，實際實作需依專案現有中介軟體的錯誤處理方式調整。若舊中介軟體直接回應 401 而非調用 `next(err)`，則需包裝成可 fallthrough 的形式。

`/login/oidc` 和 `/login/oidc/callback` 這兩個端點不需要認證中介軟體。

---

### 步驟五：前端 OIDC 實施

讀取 [scripts/frontend/](scripts/frontend/) 目錄下的腳本，根據項目結構調整後複製。

> **重要**：腳本中的環境變數使用 `process.env.REACT_APP_*` 寫法（CRA 慣例）。
> 若步驟二識別到項目使用 **Vite**，必須將所有 `process.env.REACT_APP_*` 替換為 `import.meta.env.VITE_*`；
> 若使用 **Next.js**，替換為 `process.env.NEXT_PUBLIC_*`。
>
> **後端 URL**：`LoginPage` / `CallbackPage` 中的登入與回調請求**必須**解析為完整後端地址；禁止在生產代碼中僅使用 `'/login/oidc/callback'` 等相對路徑而未帶後端 origin。
>
> **權杖存儲**：維持 `auth-utils.js` 使用 `localStorage`（或改為項目 `store` 庫）；勿將 `access_token` 等改寫為 `sessionStorage`。

#### 5.1 認證工具

將 `scripts/frontend/auth-utils.js` 複製至前端 `src/utils/` 或 `src/components/SignIn/` 目錄。

若項目使用 `store` 函式庫管理 localStorage，將 `localStorage.getItem/setItem/removeItem` 替換為 `store.get/set/remove`。

#### 5.2 登入頁面

> **此步驟的操作方式取決於步驟六選擇的整合模式（共存 vs 替換）。** 兩種模式都需要先複製腳本，但後續步驟六會決定如何整合至現有登入流程。

將 `scripts/frontend/LoginPage.jsx` 複製至前端組件目錄。

**關鍵調整：**
- 確認 `REACT_APP_API_BASE_URL` 環境變數已設置
- 調整匯入路徑
- **Loading 組件替換**：頁面內建了通用的 `<OidcLoading />` 旋轉動畫。若項目已有 Loading/Loader 組件（如 MUI 的 CircularProgress 或項目自訂的 `<Loader fullPage />`），將 `<OidcLoading />` 替換為項目自身的組件以保持 UI 風格一致
- **登入失敗 UI**：見 **5.6**，優先導向原項目錯誤頁；否則依 5.6 使用簡易提示，並須含返回／重試

**共存模式（Mode 1）額外說明：**
- `LoginPage.jsx` 作為 **獨立的 OIDC 登入入口**（例如掛載在 `/oidc-login` 路由），**不替換**原有登入頁面
- 在原有登入頁面上新增 OIDC／SSO 按鈕，點擊後導向 OIDC 登入入口或直接跳轉 OIDC 授權 URL；**舊帳密表單與原登入邏輯與 OIDC 無關聯**，沿用原實作（詳見步驟六 · 6.2）
- **按鈕顯示文字**：讀取配置 **`sso_login_button_text`**（預設見 `oidc-config.example.json`，例：`SANFIELD PORTAL LOGIN`），於舊登入頁按鈕上以 **JSX 字串字面量** 寫入與配置相同之內容；**不要**使用 `.env` 或 `REACT_APP_*` 注入該文案
- 按鈕範例（在原有登入表單旁或下方添加；子節點字串請與 `sso_login_button_text` 一致）：
```jsx
<button type="button" onClick={() => window.location.href = '/oidc-login'}>
  SANFIELD PORTAL LOGIN
</button>
```
- 或直接跳轉後端 OIDC 端點：
```jsx
const API_BASE = process.env.REACT_APP_API_BASE_URL || ''
<button type="button" onClick={() => window.location.href = `${API_BASE}/login/oidc`}>
  SANFIELD PORTAL LOGIN
</button>
```

#### 5.3 回調頁面

將 `scripts/frontend/CallbackPage.jsx` 複製至前端組件目錄。

**關鍵調整：**
- 確認 `auth-utils.js` 的匯入路徑正確
- 若後端回傳 `localUserInfo`（模式 B/C），技能腳本已將 `data.localUserInfo` 傳入 `storeAuthData`；純 OIDC 時該欄位可為空
- **Loading 組件替換**：同 5.2，將 `<OidcLoading />` 替換為項目自身的 Loading 組件
- **授權碼去重**：已內建 React.StrictMode 授權碼重複請求防護（透過 sessionStorage + useRef 雙重鎖定），無需額外處理
- **回調失敗 UI**：見 **5.6**（與 `LoginPage` 相同原則）；技能腳本內建錯誤區塊僅在無法依專案錯誤頁展示時作為簡易提示之起點

#### 5.4 API 攔截器

將 `scripts/frontend/api-interceptor.js` 複製至前端 `src/` 目錄。

兩種使用方式：
1. 使用預配置的 `apiClient`：`import apiClient from './api-interceptor'`
2. 套用至已有的 axios 實例：`import { setupInterceptors } from './api-interceptor'`

**關鍵調整（共存模式必查）：**
- 若項目**已有**全域 axios 實例（如 `src/api/client.js`），應將 **OIDC 相關攔截邏輯**（Bearer、`/login/oidc` 排除、401 處理）**合併進該實例**，避免雙實例行為不一致。
- **401 回應攔截器**須排除舊帳密登入／註冊路徑（腳本中以 `EXCLUDED_401_REDIRECT_PATHS` 標示），見上文**常見陷阱 · 7**。僅對「已登入後 API 回 401」觸發清除憑證與導向登入頁。

#### 5.5 前端路由配置

根據 React Router 版本（通常 v6）配置路由。**路由方案取決於步驟六選擇的整合模式。**

##### 替換模式（Mode 2）路由

**未登入時的路由（AuthNavigator）：**
```jsx
<Routes>
  <Route path="/callback" element={<CallbackPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

**已登入時的路由（MainNavigator）：** 保持現有業務路由不變。

**App.js 根組件邏輯：**
```jsx
import { isLoggedIn } from './utils/auth-utils'

const App = () => {
  return isLoggedIn() ? <MainNavigator /> : <AuthNavigator />
}
```

##### 共存模式（Mode 1）路由

**保留原有登入路由，新增 OIDC 相關路由：**
```jsx
<Routes>
  <Route path="/callback" element={<CallbackPage />} />
  <Route path="/oidc-login" element={<LoginPage />} />
  <Route path="/login" element={<OriginalLoginPage />} />
  {/* ...其他原有路由保持不變... */}
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

**App.js 根組件邏輯（共存模式）：**
```jsx
import { isLoggedIn as isOidcLoggedIn } from './utils/auth-utils'

const App = () => {
  // 需同時檢查舊登入狀態與 OIDC 登入狀態
  const loggedIn = isOidcLoggedIn() || isLegacyLoggedIn()
  return loggedIn ? <MainNavigator /> : <AuthNavigator />
}
```

> **共存模式要點：**
> - 原有登入頁面（`/login`）保持不變，但須在頁面上新增「SSO 登入」按鈕（見 5.2）；**原帳密登入流程與 OIDC 分離**，沿用原邏輯（步驟六 · 6.2）
> - 新增 `/oidc-login` 路由對應 OIDC 專用 LoginPage（自動跳轉 OIDC 提供者）
> - `/callback` 路由處理 OIDC 回調（與替換模式相同）
> - 應用外殼若需判斷「已登入」：舊判斷與 OIDC `isLoggedIn()` **邏輯或**即可；**勿**改寫舊頁內部判斷（步驟六 · 6.2）

##### 通用注意事項（兩種模式皆適用）

**防止循環跳轉的關鍵：**
- `/callback` 路由必須在 `*` 萬用路由之前
- `LoginPage` 以整頁導向至後端 `/login/oidc`；`oidc_return_url` 勿寫入 `/oidc-login` 自身（腳本已排除），避免登入成功後跳回 OIDC 入口形成循環
- OIDC 登入／回調失敗時之展示與導覽須遵守 **5.6 登入失敗處理**（優先原錯誤頁、禁止改原錯誤頁本體、須有返回）；避免無提示直接循環跳轉

**防止授權碼重複請求（React.StrictMode）：**
- `CallbackPage` 使用 `useRef` + `sessionStorage` 雙重鎖定，確保同一個授權碼只會發送一次後端請求
- 即使 StrictMode 在開發模式下 unmount/remount 組件，第二次 mount 會檢測到 `sessionStorage` 中已有該 code 的記錄而跳過

#### 5.6 登入失敗處理（必須遵守）

適用於 **`LoginPage.jsx`**、**`CallbackPage.jsx`** 及 OIDC 流程相關錯誤（例如 IdP 回傳 `error`／`error_description`、回調 API 非成功、模式 B 之 403 等）。

1. **優先使用原項目錯誤頁**  
   若專案已存在錯誤／結果頁（如 `/error`、`/result`、與全域錯誤處理對應之路由或既有展示元件），登入失敗時應**導向該頁**並依專案慣例傳遞錯誤訊息（query、`location.state`、既有事件總線等）。  
   **禁止**為適配 OIDC 而**修改原錯誤頁組件之本體**（不得變更其 JSX 結構、樣式、既有業務邏輯）；僅得由 `LoginPage`／`CallbackPage` 或其他**新建**之 OIDC 周邊程式，以導覽方式**使用**該頁。

2. **無原錯誤頁或無法在不改原頁前提下使用時**  
   若專案**無**錯誤頁，或無法在不修改原錯誤頁的前提下完成導向與訊息展示，則可新增**獨立**之簡易登入失敗提示（例如專用 `OidcAuthError` 組件，或沿用技能腳本內建之最小錯誤 UI 並補上 **5.6 第 3 點** 之返回能力）。**勿**為此去改動既有錯誤頁檔案內容。

3. **返回／重試（兩種情況皆須具備）**  
   無論採原錯誤頁或簡易提示，皆須提供使用者**可返回**之路徑：例如返回 `/login` 或 `/oidc-login`、返回首頁、或「重新嘗試登入」等；避免困在無出口之錯誤狀態。

4. **文檔**  
   於 **`oidc-history.md`** 註明採用「原錯誤頁導向」或「簡易提示」及主要返回路徑。

---

### 步驟六：整合模式實施

#### 6.0 選擇整合模式 — **必須首先執行，不可跳過**

**讀取配置：`integration_mode`**

從配置文件讀取 `integration_mode` 欄位值（`"1"` 或 `"2"`）。若欄位有效，直接採用並記錄於 `oidc-history.md`。若欄位缺失、為空或值不合法，Agent **必須**使用 **AskQuestion** 請使用者明確選擇。**不得**在未確定整合模式前進入 6.1。

**合法值與說明：**

| `integration_mode` | 名稱 | 說明 |
|---------------------|------|------|
| `"1"` | **共存模式** | 保留現有帳號密碼登入，**同時**新增 OIDC（SSO）作為第二種登入方式。使用者可自行選擇登入途徑。適用於漸進遷移或需同時支援內外部使用者的場景 |
| `"2"` | **替換模式** | 移除現有帳號密碼登入，**完全**改用 OIDC 流程。所有使用者統一透過 OIDC 提供者認證。適用於全面切換至 SSO 的場景 |

---

#### 6.1 識別認證後模式（Post-Auth）— **必須執行，不可跳過**

**讀取配置：`post_auth_mode`、`local_user_config.*`、`auto_create_user_config.*`**

> 本小節與整合模式（1 / 2）**正交**——無論共存或替換，OIDC 登入成功後的本地使用者處理邏輯均需決定。

從配置文件讀取 `post_auth_mode` 欄位值（`"A"`、`"B"` 或 `"C"`）。若欄位有效，直接採用並記錄於 `oidc-history.md`。若欄位缺失、為空或值不合法，Agent **必須**使用 **AskQuestion** 請使用者選擇。**不得**在未確定認證後模式前進入 6.2 / 6.3。

**合法值與說明：**

| `post_auth_mode` | 說明 |
|-------------------|------|
| `"A"` | 不需要查詢本地庫，僅使用 OIDC 返回的 `userInfo`（模式 A：純 OIDC） |
| `"B"` | 以 OIDC claim 查詢本地使用者表，**使用者必須已存在**，否則拒絕登入 |
| `"C"` | 查無本地使用者時**自動建立**一筆主檔，再回傳業務欄位 |

**若為 B 或 C — 讀取 `local_user_config`：**

從配置文件讀取以下欄位，若有效則直接使用，若缺失則搜尋專案代碼或以 AskQuestion 補齊：

| 配置欄位路徑 | 說明 | 範例值 |
|-------------|------|--------|
| `local_user_config.table_name` | 本地使用者表名 | `"app_users"` |
| `local_user_config.match_field.oidc_claim` | 用於匹配的 OIDC claim 名稱 | `"sub"` |
| `local_user_config.match_field.local_column` | 本地表中對應的匹配欄位 | `"oidc_sub"` |
| `local_user_config.return_fields` | 需回傳給前端的業務欄位列表 | `["id", "department", "role"]` |

配置就緒後：
1. 在目標專案中搜尋既有登入／使用者查詢邏輯（Grep：`SELECT.*FROM.*user`、`findUser`、`getUserBy`、`checkIsValidUser` 等），與配置交叉驗證。
2. 讀取 [references/post-auth-patterns.md](references/post-auth-patterns.md) 中對應模式之範例，將虛構表名與欄位替換為**配置文件中的實際值**，填入後端 **`oidc-controller.js` 的 `postAuthHook`**。
3. 確認前端 **`CallbackPage`** 已將 `data.localUserInfo` 傳入 **`storeAuthData`**（技能腳本已內建）。
4. 業務組件如需顯示本地欄位，使用 **`getLocalUserInfo()`**（見 `auth-utils.js`）。

**若為 C — 額外讀取 `auto_create_user_config`：**

從配置文件讀取自動建立使用者的預設值。若欄位缺失或為空，Agent **必須**使用 AskQuestion 向使用者補齊（不得臆測）：

| 配置欄位路徑 | 說明 | 範例值 |
|-------------|------|--------|
| `auto_create_user_config.role_field_name` | 角色欄位名 | `"role"` |
| `auto_create_user_config.default_role_value` | 新建帳號的預設角色值 | `"USER"` |
| `auto_create_user_config.other_defaults` | 其他新建必填欄位及預設值（物件） | `{"status": "active"}` |

> 若程式碼中已有明確常數（如 `DEFAULT_ROLE = 'user'`）且與配置一致，可引用程式碼結論並在文檔註明出處；**仍建議**向使用者確認生產環境是否與程式預設一致。

**若為 A：** 維持 `postAuthHook` 為 `return null`（或等價不查庫）；回應中的 `localUserInfo` 為 `null`。`local_user_config` 與 `auto_create_user_config` 可忽略。仍須完成下方 **6.2 / 6.3** 全部項目。

> 技能庫**不**預置任何真實專案的表結構；不限定資料庫或 ORM，由 Agent 依目標專案適配。

---

#### 6.2 整合模式 1：共存模式 — **僅在 6.0 選擇模式 1 時執行**

> 核心原則：**保留舊登入頁面與舊認證路徑**，在此基礎上**新增** OIDC 作為第二種登入選項。不得刪除舊登入功能。

> **舊登入與 OIDC 分離（必須遵守）：** 帳密／原認證通路**沿用原專案邏輯**，與 OIDC **無業務耦合**。禁止在舊登入表單、舊登入 API 呼叫鏈、舊 token 儲存與舊 axios 攔截器**內部**嵌入 OIDC 流程（`postAuthHook`、`/login/oidc`、`CallbackPage`、`auth-utils` 之 OIDC 專用邏輯等）；僅允許在舊頁上增加**獨立**之 SSO 入口（連至 `/oidc-login` 或後端 OIDC 端點），以及在外殼／受保護 API 層依下文明示方式銜接。

##### 6.2.1 前端整合

1. **在原有登入頁面新增 OIDC 入口**：
   - 在舊登入表單的適當位置（通常在表單下方或旁邊）新增按鈕；**按鈕文字**為配置 **`sso_login_button_text`**，以 JSX **字面量**寫入（勿用 `.env`），預設見 `oidc-config.example.json`
   - 按鈕點擊後導向 `/oidc-login`（使用 `LoginPage.jsx`）或直接跳轉後端 OIDC 端點
   - **原有帳密表單、提交 handler、請求後端舊登入 API、寫入舊憑證之流程一律維持原專案實作**，不因 OIDC 而改寫或與 OIDC 模組互相呼叫
   - 視覺上建議用分隔線（如「—— 或 ——」）區分兩種登入方式

2. **新增 OIDC 路由**（不替換原有路由）：
   - 新增 `/oidc-login` 路由指向 `LoginPage`（OIDC 跳轉頁）
   - 新增 `/callback` 路由指向 `CallbackPage`（OIDC 回調頁）
   - **原有 `/login` 路由保持不變**，仍指向舊登入頁面

3. **已登入判斷（僅限應用外殼）**：
   - 根組件等**外殼**若需「任一方式已登入即進入主站」，以**原專案既有**之舊登入判斷（如 `isLegacyLoggedIn()`）與 OIDC `isLoggedIn()` 做**邏輯或（OR）** 即可
   - **不得**修改舊登入頁面**內部**之已登入判斷實作；舊頁內仍只依原專案規則運作

4. **登出**：
   - **舊登出**：仍只執行原專案登出（原 API、原清除舊憑證），**不得**改寫舊登出實作以依賴 OIDC
   - 若產品要求「一次登出兩邊都清」，僅得在**外層**（如全域登出按鈕）於舊登出成功**之後**再呼叫 `clearAuthData()` 等 OIDC 清除，**不得**將兩套邏輯合併進舊登出函式內部

5. **API 請求（前端）**：
   - 舊登入產生之請求仍走**原 axios 實例**與原 header／token 規則
   - OIDC 登入後之請求走技能 **`api-interceptor.js`**（或專案為 OIDC 另設之實例）
   - **禁止**在舊業務攔截器內加入 OIDC 授權碼交換、回調或強依賴 OIDC 之邏輯

##### 6.2.2 後端整合

1. **保留舊認證中介軟體與路由**：不得移除或停用原有帳密登入的 API 端點；**舊登入處理器不得改為呼叫 OIDC 或共用 OIDC 之 `postAuthHook` 流程**
2. **新增 OIDC 路由**：按步驟四掛載 `/login/oidc` 系列路由（與舊路由並存，彼此獨立）
3. **保護 API 路由**：使用步驟 4.5 中的「雙重驗證」中介軟體，使受保護端點同時接受舊 token 和 OIDC token（僅為**驗證層**併行，舊登入**請求路徑**本身仍不經 OIDC）

##### 6.2.3 全局驗證

1. **（關鍵）全局搜索驗證導入路徑**：新增文件後，搜索確認無重複定義或命名衝突
2. **驗證兩條登入路徑**：分別測試帳密登入與 OIDC 登入；帳密路徑須與接入前**行為一致**（未與 OIDC 耦合）
3. **驗證應用外殼**：以舊判斷 **OR** OIDC `isLoggedIn()` 進入主站時，兩種登入各能獨立成功；舊登入頁內部邏輯未被 OIDC 改寫

---

#### 6.3 整合模式 2：替換模式 — **僅在 6.0 選擇模式 2 時執行**

> 核心原則：**移除舊登入介面與舊認證路徑**，完全改為 OIDC 流程。不得保留並行舊登入頁。

以下項目與認證後模式（A / B / C）無關，**選 A、B、C 任一者**均必須全部執行：

1. **移除舊的登入頁面/表單**：用 `LoginPage`（OIDC 跳轉）替換；舊帳密表單、舊 `/login` 實作須廢止或改為僅導向 OIDC
2. **移除舊的認證 API 調用**：用 OIDC 流程替換
3. **更新登出邏輯**：使用 `clearAuthData()` 或 `signOut()`
4. **更新已登入檢查**：使用 `isLoggedIn()`（僅檢查 `access_token`）
5. **更新 API 調用**：確保所有 API 使用帶攔截器的 axios 實例
6. **清理**：移除不再使用的登入相關組件、樣式、資源文件
7. **（關鍵）全局搜索驗證導入路徑**：每次刪除或重命名文件後，在整個前端/後端項目中搜索被刪除文件的文件名（使用 Grep 工具），修正所有殘留的 `import` / `require` 引用，確保指向正確的新文件

---

### 步驟七：環境配置

**讀取配置：`oidc_params.*`、`backend_api_base_url`、`frontend_app_url`**

**須與原項目既有 API 基底、構建工具前綴對齊**（見 [oidc-usage-guide.md](oidc-usage-guide.md)「與原項目配置對齊」），避免僅複製範例而與實際環境不符。

**填寫原則（必須遵守）：**

- **實際 `.env`**：凡後端／前端運行 OIDC 與 API 請求**所需**、且於步驟零／步驟一（`oidc-config.json` 或經 AskQuestion 補齊）**已取得之鍵值**，**須全部寫入**對應子專案之 `.env`，**包括** `OIDC_CLIENT_SECRET` 等敏感欄位；**不得**因敏感而擅自省略，導致 `process.env`／建置時讀取缺失。
- **禁止編造**：**不得**在 `.env` 中新增使用者配置**未出現、未約定**之變數名；**不得**以臆測、文檔範例或佔位字串**冒充**使用者未提供之真值。若某必填鍵配置中仍為空，須先補齊（AskQuestion 或更新 `oidc-config.json`）再寫入，**不可**自行填假值。
- **`sso_login_button_text`**：僅供共存模式按鈕 UI，**不**列入 `.env`／`.env.example`（見步驟五 · 5.2）。
- **`.env.example`**：僅列與上述相同之**鍵名**及佔位符／說明，鍵集合應與實際寫入 `.env` 之 OIDC／API 基底相關鍵一致，**不應**多出配置流程未涉及之欄位。

#### 7.1 雙檔產出（必須）

對**後端子專目錄**與**前端子專目錄**分別產出下列兩類文件（若項目慣例檔名為 `env.example` 無前導點，可從慣例，但須在 `oidc-history.md` 註明）：

| 檔案 | 用途 | 版本庫 |
|------|------|--------|
| **`.env.example`** | 列出與 OIDC 接入相關之**全部鍵名**；敏感值僅能為佔位符（如 `your-oidc-client-secret`）；URL 可用說明性範例，供新成員複製為 `.env` 後再填真值 | **可提交**（不含真密鑰） |
| **`.env`** | 由 `oidc-config.json` 與步驟一之實際值填入，**本地／部署環境實際載入用**，須能直接啟動前後端並完成 OIDC 流程 | **不得提交**真密鑰；須確認已列於 `.gitignore`（若缺則補上） |

**安全與提示（Agent 應在實施摘要或對話中提醒使用者）：**

- `OIDC_CLIENT_SECRET`**僅**寫入後端 `.env`，**禁止**寫入前端 `.env`（帶 `REACT_APP_` / `VITE_` / `NEXT_PUBLIC_` 之變數會進入瀏覽器打包產物）。
- `.env` 與根目錄 `oidc-config.json` 若含密鑰，勿推送至公開遠端；生產環境建議以 Secret 管理、容器注入或 CI 變數取代本機明文檔。
- 團隊協作：自 `.env.example` 複製為 `.env` 後填入各自密鑰與環境專用 URL。

#### 7.2 後端 `.env.example`（佔位符）

```env
# OIDC — 複製為 .env 後替換為實際值（勿將含真密鑰之 .env 提交版本庫）
OIDC_URI_ISSUER=https://your-oidc-provider.example/oidc
OIDC_URI_TOKEN=https://your-oidc-provider.example/oidc/token
OIDC_URI_INTROSPECTION=https://your-oidc-provider.example/oidc/token/introspection
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-oidc-client-secret
OIDC_CLIENT_SCOPE=openid profile offline_access
OIDC_CLIENT_REDIRECT_URI=http://your-frontend-host:port/callback
```

#### 7.3 後端 `.env`（實際值）

由配置文件 `oidc_params` 填入；`OIDC_CLIENT_SECRET` 與 `oidc-config.json` 一致。

```env
# OIDC 配置（實際值來自 oidc-config.json 之 oidc_params）
OIDC_URI_ISSUER=https://passportuat.sanfield.com.hk/oidc
OIDC_URI_TOKEN=https://passportuat.sanfield.com.hk/oidc/token
OIDC_URI_INTROSPECTION=https://passportuat.sanfield.com.hk/oidc/token/introspection
OIDC_CLIENT_ID=sanfield-scaffoldnet
OIDC_CLIENT_SECRET=sanfield-scaffoldnet
OIDC_CLIENT_SCOPE=openid profile offline_access
OIDC_CLIENT_REDIRECT_URI=http://172.31.61.27:3000/callback
```

#### 7.4 前端 `.env.example` / `.env`

根據步驟二識別之前綴，**鍵名須與技能腳本一致**；`.env` 中 `REACT_APP_API_BASE_URL`（或 Vite/Next 對應項）之值須等於配置文件之 **`backend_api_base_url`**。

**CRA — `.env.example`：**
```env
# 後端 API 完整基底 URL（含協議、主機、埠、路徑前綴）
REACT_APP_API_BASE_URL=http://your-backend-host:port
```

**CRA — `.env`：**
```env
REACT_APP_API_BASE_URL=http://172.31.61.27:5000
```

**Vite — `.env.example`：**
```env
VITE_API_BASE_URL=http://your-backend-host:port
```

**Vite — `.env`：**
```env
VITE_API_BASE_URL=http://172.31.61.27:5000
```

**Next.js — `.env.example`：**
```env
NEXT_PUBLIC_API_BASE_URL=http://your-backend-host:port
```

**Next.js — `.env`：**
```env
NEXT_PUBLIC_API_BASE_URL=http://172.31.61.27:5000
```

以上範例 URL 須以步驟一實際值替換。

---

### 步驟八：生成接入分析文檔（必須執行）

**此步驟為必須步驟，不可跳過。** 在項目根目錄（與前後端子目錄同級）創建 `oidc-history.md` 文件。

執行以下操作收集資料並寫入文件：

1. **回顧前面所有步驟的操作**，收集以下資訊（主要來源為配置文件 `oidc-config.json` 與實施過程記錄）：
   - 配置文件中的 OIDC 參數（`oidc_params.*`，不記錄 CLIENT_SECRET）
   - 步驟三安裝的依賴名稱與版本
   - 步驟四、五中新增和修改的所有文件路徑
   - **步驟五 · 5.6** 登入失敗處理：原錯誤頁導向或簡易提示、是否**未**修改原錯誤頁本體、返回／重試路徑
   - 步驟七產出之後端／前端 `.env.example` 與 `.env` 路徑，以及 `.gitignore` 是否已排除 `.env`
   - **步驟六 · 6.0** 整合模式（配置 `integration_mode`：**1 共存／2 替換**）
   - **步驟六 · 6.1** 認證後模式（配置 `post_auth_mode`：**A／B／C**）
   - 若為 **模式 C**：`auto_create_user_config` 中的角色欄位名與預設值
   - 若選整合模式 1（共存）：記錄舊登入保留方式、SSO 入口按鈕位置、`sso_login_button_text` 實際採用字串、雙重驗證中介軟體實作
   - 若選整合模式 2（替換）：記錄被移除/替換的原有功能（含 **6.3** 舊登入頁／舊認證路徑）

2. **使用 Write 工具直接創建** `{項目根目錄}/oidc-history.md`，內容結構如下（用真實資料填寫，不要留佔位符）：

```markdown
# OIDC 接入分析文檔

## 基本資訊
| 項目 | 內容 |
|------|------|
| 接入日期 | {當天日期} |
| 項目名稱 | {項目名稱} |
| OIDC 提供者 | {OIDC_URI_ISSUER 的值} |
| 實施範圍 | 前端（React）+ 後端（Node.js/Express） |
| openid-client 版本 | {實際安裝的版本} |
| 整合模式（6.0） | {1 共存／2 替換，與配置文件或 AskQuestion 記錄一致} |
| 認證後模式（6.1） | {A／B／C，與 AskQuestion 記錄一致} |
| 模式 C：新建使用者角色預設 | {若適用：欄位名 + 預設值；非 C 則填「不適用」} |

## OIDC 配置參數
（列出步驟一收集到的所有參數及其值，CLIENT_SECRET 用 *** 遮蓋）

## 修改文件清單
### 後端修改
（表格列出每個修改/新增的後端文件及變更摘要）
### 前端修改
（表格列出每個修改/新增的前端文件及變更摘要）
### 配置文件修改
（表格列出後端／前端之 `.env.example`、`.env`、`.gitignore` 變更；註明 `.env` 是否已排除於版本庫）

## 新增文件清單
（表格列出所有新建的文件及其用途）

## 整合方式
（整合模式 1 共存：列出新增的 OIDC 入口位置、保留的舊登入元件、雙重驗證中介軟體；整合模式 2 替換：列出被廢棄的原有登入邏輯及對應的 OIDC 替代方案）

## 登入失敗處理（步驟五 · 5.6）
| 項目 | 內容 |
|------|------|
| 採用方式 | {原錯誤頁導向：路由或元件名／或「簡易提示（新建）」} |
| 原錯誤頁本體是否修改 | 否（必填） |
| 返回／重試路徑 | {例如 /login、/oidc-login、首頁、「重新嘗試」行為說明} |

## 依賴安裝報告
（表格列出安裝的依賴名稱、版本、狀態）

## 關鍵決策記錄
（記錄實施過程中的重要技術決策及其依據）

## 遇到的問題及解決方案
（若有則記錄，若無則寫「本次接入未遇到阻塞性問題」）
```

3. **創建完成後確認文件存在**：使用 Shell 工具檢查文件是否成功創建

> 參考完整模板結構：[oidc-history-template.md](oidc-history-template.md)

---

## 認證流程圖

```
使用者                  前端 React               後端 Node.js            OIDC 提供者
  │                        │                        │                      │
  ├─── 訪問應用 ──────────►│                        │                      │
  │                        ├─ 檢查 localStorage     │                      │
  │                        │  無 access_token       │                      │
  │                        ├─ 跳轉 /login ─────────►│                      │
  │                        │  window.location.href   │                      │
  │                        │                        ├─ GET /login/oidc     │
  │                        │                        ├─ 產生授權 URL ──────►│
  │◄────────────── 302 重新導向至 OIDC 登入頁面 ────────────────────────────┤
  ├─── 輸入帳號密碼 ──────────────────────────────────────────────────────►│
  │◄──────── 重新導向至 /callback?code=xxx&state=yyy ─────────────────────┤
  │                        │                        │                      │
  │                        ├─ /callback 頁面        │                      │
  │                        ├─ fetch 調用 ──────────►│                      │
  │                        │  GET /login/oidc/      │                      │
  │                        │  callback?code=...     │                      │
  │                        │                        ├─ 交換授權碼 ────────►│
  │                        │                        │◄── 返回 tokenSet ────┤
  │                        │                        ├─ 取得 userInfo ─────►│
  │                        │                        │◄── 返回使用者資訊 ───┤
  │                        │◄── 返回 tokens + user ─┤                      │
  │                        ├─ 存入 localStorage     │                      │
  │                        ├─ 跳轉至首頁            │                      │
  │◄─── 顯示應用頁面 ─────┤                        │                      │
```

---

## 故障排除

**授權碼交換失敗**
- 確認 `OIDC_CLIENT_REDIRECT_URI` 與在 OIDC 提供者處註冊的回調 URL **完全一致**（包括 IP、埠號，不能是 localhost 對應）
- 確認 `OIDC_CLIENT_ID` 和 `OIDC_CLIENT_SECRET` 正確
- redirect_uri 已鎖定為配置值，不會被請求參數覆蓋

**端點配置**
- 系統優先使用 `OIDC_URI_TOKEN`、`OIDC_URI_INTROSPECTION` 手動配置端點
- 僅在 `OIDC_URI_TOKEN` 未設置時才嘗試自動發現（`Issuer.discover()`）
- 自動發現可能改寫端點地址（如 IP→localhost），因此**強烈建議配置所有端點 URL**

**授權碼重複請求（React.StrictMode）**
- `CallbackPage` 已內建 `useRef` + `sessionStorage` 雙重去重機制
- 若仍出現重複請求，確認未在 `CallbackPage` 外層額外包裹會觸發重新渲染的邏輯

**循環跳轉**
- 確認前端路由中 `/callback` 在萬用路由 `*` 之前
- 確認 `CallbackPage` 對授權碼使用 `sessionStorage` 去重（StrictMode）；`LoginPage` 不依賴 `sessionStorage` 導向標記
- 確認 OIDC 回調 URL 指向前端 `/callback` 而非後端

**401 無限循環或錯密碼後行為異常**
- 確認請求攔截器對 OIDC 公開路徑的排除包含 `/login/oidc`、`/login/oidc/callback`（或等價寫法）
- **共存模式**：確認回應攔截器對 **`/auth/login`、`/auth/register`**（依專案路徑）之 401 **不**觸發「清除憑證並整頁重導」，見**常見陷阱 · 7**

**Vite 開發環境：`GET /login` 404**
- 檢查 `vite.config` 是否誤將 **`proxy['/login']`** 指向後端；應改為僅 **`'/login/oidc'`**，見**常見陷阱 · 6**

**環境變數未生效**
- 後端：確認已安裝 `dotenv` 並在入口文件頂部調用 `require('dotenv').config()`
- 前端：確認使用了正確的前綴（CRA → `REACT_APP_`，Vite → `VITE_`，Next.js → `NEXT_PUBLIC_`）
- Vite 項目必須使用 `import.meta.env.VITE_*` 而非 `process.env.REACT_APP_*`

**導入/引用錯誤（Module not found）**
- 替換舊登入文件後，其他文件中的 `import`/`require` 可能仍指向已刪除的舊文件
- 使用 Grep 全局搜索被刪除文件的名稱，逐一修正引用路徑

**登入後權杖立即消失**
- 確認未將 `access_token` 存入 `sessionStorage`；應使用 `localStorage` 或 `store` 庫

**OIDC 回調請求 404 或打到錯誤埠**
- 確認環境變數中的 API 基底為完整 URL（含協議與埠），且 `fetch`/axios 未單獨使用未帶 `baseURL` 的相對路徑

**共存模式：兩種登入方式衝突**
- 確認舊登入和 OIDC 登入存入 `localStorage` 的 key 不會互相覆蓋——若兩者都使用 `access_token` 作為 key，最後登入的方式會覆蓋前者（通常可接受）
- 若舊登入使用 Cookie 而 OIDC 使用 Bearer token，確認 API 中介軟體的檢查順序正確且不會誤判
- 應用外殼之「已登入」應為**原舊判斷**與 OIDC `isLoggedIn()` 之**邏輯或**；**勿**在舊登入模組內硬綁 OIDC 判斷（見步驟六 · 6.2）

**共存模式：登出不完整**
- 舊登出仍應**獨立**完成原專案流程；若需一併清除 OIDC，僅在**外層**於舊登出成功後再呼叫 `clearAuthData()`（見步驟六 · 6.2），勿將 OIDC 清除寫入舊登出函式內部
- 若舊登入有服務端 session，仍須先依原方式調用舊登出 API；再視需求清除 OIDC 端資料

**共存模式：雙重驗證中介軟體 fallthrough 失敗**
- 確認舊認證中介軟體在驗證失敗時調用 `next(err)` 而非直接 `res.status(401).send()`；若直接回應，需包裝為可 fallthrough 的版本
- 在 `dualAuthMiddleware` 中記錄日誌以協助排查哪一層驗證被觸發

## 腳本參考

- [oidc-config.example.json](oidc-config.example.json) — 配置文件範例（欄位名與本技能嚴格對應）
- [references/post-auth-patterns.md](references/post-auth-patterns.md) — 認證後模式（A/B/C）與 `postAuthHook` 填充範例
- [scripts/backend/oidc-utils.js](scripts/backend/oidc-utils.js) — OIDC 工具類別
- [scripts/backend/oidc-controller.js](scripts/backend/oidc-controller.js) — 登入控制器
- [scripts/backend/oidc-middleware.js](scripts/backend/oidc-middleware.js) — 認證中介軟體
- [scripts/backend/oidc-routes.js](scripts/backend/oidc-routes.js) — Express 路由
- [scripts/frontend/LoginPage.jsx](scripts/frontend/LoginPage.jsx) — 登入頁面
- [scripts/frontend/CallbackPage.jsx](scripts/frontend/CallbackPage.jsx) — 回調頁面
- [scripts/frontend/auth-utils.js](scripts/frontend/auth-utils.js) — 認證工具
- [scripts/frontend/api-interceptor.js](scripts/frontend/api-interceptor.js) — Axios 攔截器
