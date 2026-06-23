---
name: oidc-integration
description: >-
  Integrates self-hosted OIDC Server for React frontend and Node.js Express backend using openid-client v5.
  Use when implementing SSO, login flows, OIDC callbacks, or replacing legacy auth with OIDC.
  Supports coexist mode (legacy + OIDC) and replace mode (OIDC only).
license: MIT
compatibility: cursor, claude-code, windsurf
paths:
  - "src/auth/**/*.ts"
  - "src/auth/**/*.tsx"
  - "server/**/*.js"
  - "server/**/*.ts"
metadata:
  author: skill-library
  version: "1.0.0"
  category: backend
  tags: [oidc, auth, express, react, sso]
  updated: "2026-06-23"
---

# OIDC Integration

Integrates a **self-hosted OIDC Server** with React frontend and Node.js + Express + openid-client v5.x.

> Scope: self-hosted OIDC only. Not for Auth0, Keycloak cloud, Azure AD, or Okta-specific SDKs.

## When to Use

- User asks to add SSO or OIDC login
- Replacing or coexisting with legacy username/password auth
- Backend API token validation via OIDC introspection

## Common Pitfalls

1. **Missing dependencies**: Verify `openid-client`, `dotenv`, `axios` in target `package.json`
2. **Env prefix mismatch**: CRA=`REACT_APP_`, Vite=`VITE_` + `import.meta.env`, Next=`NEXT_PUBLIC_`
3. **Broken imports after replace mode**: Search globally after deleting old auth files
4. **Token storage**: Use `localStorage` or app store for tokens; never `sessionStorage` for auth tokens
5. **Relative API paths**: Use full backend base URL (e.g. `https://api.example.com`), not `/login/oidc/callback` alone
6. **Vite proxy**: Proxy `/login/oidc` only, not entire `/login` (breaks SPA login page)
7. **401 on login endpoint**: Do not treat login-form 401 as session expiry in global axios interceptors

## Workflow

```
Task Progress:
- [ ] Step 0: Read oidc-config.json or oidc-config.example.json
- [ ] Step 1: Collect OIDC parameters
- [ ] Step 2: Analyze project structure (CRA/Vite/Next, Express routes)
- [ ] Step 3: Install dependencies
- [ ] Step 4: Backend OIDC routes and middleware
- [ ] Step 5: Frontend callback and token handling
- [ ] Step 6: Coexist or replace mode
- [ ] Step 7: Environment configuration
- [ ] Step 8: Document integration summary
```

## Configuration

Look for config in this order:

1. Project root `oidc-config.json` (actual values)
2. Skill `oidc-config.example.json` (placeholders)

Use placeholders for secrets in docs:

- Issuer: `https://sso.example.com`
- Redirect URI: `https://app.example.com/auth/callback`
- Client ID/Secret: from secure env, never committed

## Backend (Express)

- Register routes: `/login/oidc`, `/login/oidc/callback`
- Use openid-client `Issuer.discover(issuerUrl)` then `client.callback()`
- Store tokens per project convention; validate via introspection endpoint when required

## Frontend (React)

- Redirect user to authorization URL
- Handle callback route; exchange code via backend (never expose client secret in frontend)
- Persist tokens in `localStorage` or secure store wrapper
- Attach `Authorization: Bearer` on API calls

## Additional Resources

- See [references/checklist.md](references/checklist.md) for pre-merge verification
