# 认证后模式（Post-Auth）与 postAuthHook

OIDC 登录成功后，`oidc-controller.js` 中的 `postAuthHook` 负责查询或创建本地用户，并返回 `localUserInfo` 给前端。

## 模式 A：纯 OIDC

不查询本地库，仅使用 OIDC `userInfo`。

```javascript
async function postAuthHook(userInfo) {
  return null
}
```

响应中 `localUserInfo` 为 `null`。前端 `CallbackPage` 仍可正常存储 `access_token` 等 OIDC 数据。

## 模式 B：必须已存在本地用户

以 OIDC claim 匹配本地表；用户不存在则拒绝登录（返回 403）。

```javascript
async function postAuthHook(userInfo) {
  const claim = userInfo[process.env.OIDC_MATCH_CLAIM || 'sub']
  if (!claim) {
    const err = new Error('Missing OIDC claim for local user lookup')
    err.status = 403
    throw err
  }

  // Replace with project DB/ORM lookup
  const localUser = await db.query(
    'SELECT id, department, role FROM app_users WHERE oidc_sub = ? LIMIT 1',
    [claim]
  )

  if (!localUser) {
    const err = new Error('Local user not found')
    err.status = 403
    throw err
  }

  return {
    id: localUser.id,
    department: localUser.department,
    role: localUser.role,
  }
}
```

将 `app_users`、`oidc_sub`、`return_fields` 替换为 `oidc-config.json` 中 `local_user_config` 的实际值。

## 模式 C：自动创建本地用户

查无用户时插入一条记录，再返回业务字段。

```javascript
async function postAuthHook(userInfo) {
  const claim = userInfo.sub
  let localUser = await findUserByOidcSub(claim)

  if (!localUser) {
    localUser = await createUser({
      oidc_sub: claim,
      role: process.env.DEFAULT_ROLE || 'USER',
      status: 'active',
      // other_defaults from oidc-config.json auto_create_user_config
    })
  }

  return {
    id: localUser.id,
    department: localUser.department,
    role: localUser.role,
  }
}
```

将字段名与默认值替换为 `auto_create_user_config` 中的配置。

## 前端配合

- `CallbackPage` 将 `data.localUserInfo` 传入 `storeAuthData`（脚本已内建）。
- 业务组件通过 `getLocalUserInfo()`（`auth-utils.js`）读取本地字段。

## 实施检查清单

- [ ] `post_auth_mode` 已从 `oidc-config.json` 读取并记录于 `oidc-history.md`
- [ ] 模式 B/C：`match_field` 与 `return_fields` 已替换为项目实际表结构
- [ ] 模式 C：`auto_create_user_config` 默认值已向用户确认
- [ ] 403 错误在 `CallbackPage` 按 5.6 登录失败处理展示
