import { useEffect } from 'react'

const API_BASE = process.env.REACT_APP_API_BASE_URL || ''

function OidcLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div>Redirecting to sign in...</div>
    </div>
  )
}

export default function LoginPage() {
  useEffect(() => {
    const returnUrl = window.location.pathname === '/oidc-login'
      ? window.location.origin + '/'
      : window.location.href

    const params = new URLSearchParams()
    if (returnUrl && !returnUrl.includes('/oidc-login')) {
      params.set('oidc_return_url', returnUrl)
    }

    const query = params.toString()
    const target = `${API_BASE}/login/oidc${query ? `?${query}` : ''}`
    window.location.replace(target)
  }, [])

  return <OidcLoading />
}

export { OidcLoading }
