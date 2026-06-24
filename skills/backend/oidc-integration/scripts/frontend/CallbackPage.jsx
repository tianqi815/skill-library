import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storeAuthData } from '../utils/auth-utils'
import { OidcLoading } from './LoginPage'

const API_BASE = process.env.REACT_APP_API_BASE_URL || ''

function callbackStorageKey(search) {
  return `oidc_callback_done:${search}`
}

function OidcAuthError({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <p style={{ color: '#b91c1c' }}>{message}</p>
      <button type="button" onClick={onRetry}>Retry sign in</button>
    </div>
  )
}

export default function CallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const authError = searchParams.get('error')
    if (authError) {
      setError(searchParams.get('error_description') || authError)
      return
    }

    const code = searchParams.get('code')
    if (!code) {
      setError('Missing authorization code')
      return
    }

    const search = searchParams.toString()
    const storageKey = callbackStorageKey(search)
    if (sessionStorage.getItem(storageKey) === '1') {
      navigate('/', { replace: true })
      return
    }

    const run = async () => {
      try {
        const response = await fetch(`${API_BASE}/login/oidc/callback?${search}`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'OIDC callback failed')
        }

        storeAuthData({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          userInfo: data.userInfo,
          localUserInfo: data.localUserInfo,
        })

        sessionStorage.setItem(storageKey, '1')
        const target = data.returnUrl && !String(data.returnUrl).includes('/callback')
          ? data.returnUrl
          : '/'
        navigate(target, { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OIDC sign-in failed')
      }
    }

    void run()
  }, [navigate, searchParams])

  if (error) {
    return (
      <OidcAuthError
        message={error}
        onRetry={() => navigate('/login', { replace: true })}
      />
    )
  }

  return <OidcLoading />
}
