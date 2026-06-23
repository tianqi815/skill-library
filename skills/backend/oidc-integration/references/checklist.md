# OIDC Pre-Merge Checklist

## Security

- [ ] No real client secrets in repo or skill copies
- [ ] HTTPS in production redirect URIs
- [ ] Tokens not logged to console

## Frontend

- [ ] Correct env prefix for build tool
- [ ] Full backend URL for OIDC callback API calls
- [ ] Vite proxy excludes SPA `/login` route

## Backend

- [ ] openid-client version pinned
- [ ] Callback URL matches OIDC server registration
- [ ] 401 interceptor excludes login/register endpoints
