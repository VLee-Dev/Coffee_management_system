import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { fetchCurrentUser, getToken, isAdmin } from '../../lib/auth'

export default function CustomerRoute({ children }) {
  const [status, setStatus] = useState('loading')
  const location = useLocation()

  useEffect(() => {
    let alive = true
    setStatus('loading')

    async function verify() {
      const token = getToken()
      if (!token) {
        if (alive) setStatus('unauthenticated')
        return
      }
      const user = await fetchCurrentUser(token)
      if (!alive) return
      if (!user) {
        setStatus('unauthenticated')
        return
      }
      if (isAdmin(user)) {
        setStatus('admin')
        return
      }
      setStatus('allowed')
    }

    verify()
    return () => {
      alive = false
    }
  }, [location.pathname])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant font-body-md">
        Đang tải...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (status === 'admin') {
    return <Navigate to="/admin/products" replace />
  }

  return children
}
