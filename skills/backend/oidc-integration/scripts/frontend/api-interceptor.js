import axios from 'axios'
import { clearAuthData, getAccessToken } from './auth-utils'

const API_BASE = process.env.REACT_APP_API_BASE_URL || ''

export const EXCLUDED_401_REDIRECT_PATHS = [
  '/auth/login',
  '/auth/register',
]

const PUBLIC_PATH_PREFIXES = [
  '/login/oidc',
]

function isPublicPath(url) {
  if (!url) return false
  return PUBLIC_PATH_PREFIXES.some((prefix) => url.includes(prefix))
}

function shouldSkip401Redirect(url) {
  if (!url) return false
  return EXCLUDED_401_REDIRECT_PATHS.some((path) => url.includes(path))
}

const apiClient = axios.create({
  baseURL: API_BASE,
})

export function setupInterceptors(instance = apiClient) {
  instance.interceptors.request.use((config) => {
    if (isPublicPath(config.url)) {
      return config
    }
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status
      const requestUrl = error?.config?.url || ''

      if (status === 401 && !shouldSkip401Redirect(requestUrl) && !isPublicPath(requestUrl)) {
        clearAuthData()
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }
  )

  return instance
}

setupInterceptors(apiClient)

export default apiClient
