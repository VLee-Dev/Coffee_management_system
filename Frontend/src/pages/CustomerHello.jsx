import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import petIcon from '../assets/iconpet.svg'
import { clearToken, fetchCurrentUser, getToken } from '../lib/auth'

export default function CustomerHello() {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  useEffect(() => {
    async function load() {
      const user = await fetchCurrentUser(getToken())
      if (user?.full_name) setName(user.full_name)
    }
    load()
  }, [])

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-container-padding-mobile gap-stack-lg">
      <img src={petIcon} alt="" className="w-16 h-16" />
      <h1 className="font-display-lg text-display-lg text-primary">Hello</h1>
      {name && (
        <p className="font-body-lg text-on-surface-variant">
          Xin chào, <span className="font-semibold text-on-surface">{name}</span>
        </p>
      )}
      <p className="font-body-md text-on-surface-variant text-center max-w-sm">
        Khu mua sắm Meo Coffee đang được phát triển.
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="px-8 py-3 bg-primary text-on-primary rounded-full font-label-md shadow-md hover:scale-[0.98] transition-transform"
      >
        Đăng xuất
      </button>
    </main>
  )
}
