import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import menuIcon from '../assets/menu_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import logoutIcon from '../assets/logout_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import personIcon from '../assets/person.svg'
import { clearToken } from '../lib/auth'

export default function AdminUserMenu() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  function goProfile() {
    setIsOpen(false)
    navigate('/admin/profile')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors flex items-center justify-center"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <img src={menuIcon} alt="menu" className="h-5 w-5 icon-dark" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-bright border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={goProfile}
              className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-colors"
            >
              <img src={personIcon} alt="" className="h-5 w-5 icon-dark" />
              <span className="font-label-md">Thông tin cá nhân</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-error-container/20 hover:text-error rounded-lg transition-colors"
            >
              <img src={logoutIcon} alt="" className="h-5 w-5 icon-dark" />
              <span className="font-label-md">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
