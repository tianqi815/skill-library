const { introspectAccessToken } = require('../utils/oidc-utils')

function extractBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return null
  }
  return header.slice('Bearer '.length).trim()
}

async function verifyAccessToken(req, res, next) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Missing access token' })
    }

    const introspection = await introspectAccessToken(token)
    if (!introspection || introspection.active !== true) {
      return res.status(401).json({ error: 'Invalid or expired access token' })
    }

    req.oidc = {
      token,
      introspection,
      sub: introspection.sub || null,
    }
    return next()
  } catch (err) {
    console.error('OIDC token verification failed:', err)
    return res.status(401).json({ error: 'Token verification failed' })
  }
}

module.exports = {
  verifyAccessToken,
}
