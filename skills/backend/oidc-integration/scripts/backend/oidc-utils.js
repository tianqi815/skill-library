const { Issuer, generators } = require('openid-client')

let cachedClient = null

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getRedirectUri() {
  return requiredEnv('OIDC_CLIENT_REDIRECT_URI')
}

async function getOidcClient() {
  if (cachedClient) {
    return cachedClient
  }

  const issuerUrl = requiredEnv('OIDC_URI_ISSUER')
  const tokenEndpoint = process.env.OIDC_URI_TOKEN
  const introspectionEndpoint = process.env.OIDC_URI_INTROSPECTION

  let issuer
  if (tokenEndpoint) {
    issuer = new Issuer({
      issuer: issuerUrl,
      token_endpoint: tokenEndpoint,
      introspection_endpoint: introspectionEndpoint || undefined,
    })
  } else {
    issuer = await Issuer.discover(issuerUrl)
  }

  cachedClient = new issuer.Client({
    client_id: requiredEnv('OIDC_CLIENT_ID'),
    client_secret: requiredEnv('OIDC_CLIENT_SECRET'),
    redirect_uris: [getRedirectUri()],
    response_types: ['code'],
  })

  return cachedClient
}

function createAuthState() {
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)
  const state = generators.state()
  const nonce = generators.nonce()

  return { codeVerifier, codeChallenge, state, nonce }
}

async function buildAuthorizationUrl({ returnUrl } = {}) {
  const client = await getOidcClient()
  const authState = createAuthState()
  const scope = process.env.OIDC_CLIENT_SCOPE || 'openid profile offline_access'

  const authorizationUrl = client.authorizationUrl({
    scope,
    state: authState.state,
    nonce: authState.nonce,
    code_challenge: authState.codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: getRedirectUri(),
  })

  return { authorizationUrl, authState, returnUrl: returnUrl || null }
}

async function exchangeAuthorizationCode(req, authState) {
  const client = await getOidcClient()
  const params = client.callbackParams(req)

  const tokenSet = await client.callback(getRedirectUri(), params, {
    state: authState.state,
    nonce: authState.nonce,
    code_verifier: authState.codeVerifier,
  })

  const userInfo = await client.userinfo(tokenSet.access_token)
  return { tokenSet, userInfo }
}

async function introspectAccessToken(accessToken) {
  const client = await getOidcClient()
  if (!client.introspect) {
    throw new Error('OIDC client does not support token introspection')
  }
  return client.introspect(accessToken)
}

module.exports = {
  getOidcClient,
  getRedirectUri,
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  introspectAccessToken,
}
