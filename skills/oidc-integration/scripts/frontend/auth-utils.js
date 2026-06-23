const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'
const LOCAL_USER_INFO_KEY = 'local_user_info'

export function isLoggedIn() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY))
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getUserInfo() {
  const raw = localStorage.getItem(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getLocalUserInfo() {
  const raw = localStorage.getItem(LOCAL_USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeAuthData({
  access_token,
  refresh_token,
  userInfo,
  localUserInfo,
}) {
  if (access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  }
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  }
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  }
  if (localUserInfo) {
    localStorage.setItem(LOCAL_USER_INFO_KEY, JSON.stringify(localUserInfo))
  }
}

export function clearAuthData() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  localStorage.removeItem(LOCAL_USER_INFO_KEY)
}

export function signOut() {
  clearAuthData()
}
