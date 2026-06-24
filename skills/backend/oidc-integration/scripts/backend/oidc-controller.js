const {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
} = require('../utils/oidc-utils')

const authSessions = new Map()

/**
 * Post-auth hook: query or create local user after OIDC userInfo is obtained.
 * Return null for mode A (pure OIDC). See references/post-auth-patterns.md.
 */
async function postAuthHook(userInfo) {
  return null
}

function rememberAuthState(state, payload) {
  authSessions.set(state, payload)
}

function consumeAuthState(state) {
  const payload = authSessions.get(state)
  if (payload) {
    authSessions.delete(state)
  }
  return payload
}

async function startOidcLogin(req, res) {
  try {
    const returnUrl = typeof req.query.oidc_return_url === 'string'
      ? req.query.oidc_return_url
      : null

    const { authorizationUrl, authState } = await buildAuthorizationUrl({ returnUrl })
    rememberAuthState(authState.state, { authState, returnUrl })
    return res.redirect(authorizationUrl)
  } catch (err) {
    console.error('OIDC login start failed:', err)
    return res.status(500).json({ error: 'Failed to start OIDC login' })
  }
}

async function handleOidcCallback(req, res) {
  try {
    const params = req.query || {}
    if (params.error) {
      return res.status(400).json({
        error: params.error,
        error_description: params.error_description || null,
      })
    }

    const state = params.state
    if (!state) {
      return res.status(400).json({ error: 'Missing state parameter' })
    }

    const session = consumeAuthState(state)
    if (!session) {
      return res.status(400).json({ error: 'Invalid or expired OIDC state' })
    }

    const { tokenSet, userInfo } = await exchangeAuthorizationCode(req, session.authState)
    const localUserInfo = await postAuthHook(userInfo)

    return res.json({
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token || null,
      expires_in: tokenSet.expires_in || null,
      token_type: tokenSet.token_type || 'Bearer',
      userInfo,
      localUserInfo,
      returnUrl: session.returnUrl,
    })
  } catch (err) {
    console.error('OIDC callback failed:', err)
    const status = err.status || 500
    return res.status(status).json({
      error: err.message || 'OIDC callback failed',
    })
  }
}

module.exports = {
  postAuthHook,
  startOidcLogin,
  handleOidcCallback,
}
