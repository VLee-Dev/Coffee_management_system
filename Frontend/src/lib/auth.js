export function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
}

export function getToken() {
  return localStorage.getItem('access_token')
}

export function clearToken() {
  localStorage.removeItem('access_token')
}

export async function fetchCurrentUser(token = getToken()) {
  if (!token) return null
  const res = await fetch(`${getApiBase()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export function isAdmin(user) {
  return user?.role === 'admin'
}

export async function authFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${getApiBase()}${url}`, {
    ...options,
    headers,
  })
  if (res.status === 401) {
    const err = new Error('Phiên đăng nhập hết hạn')
    err.code = 'AUTH'
    throw err
  }
  return res
}
