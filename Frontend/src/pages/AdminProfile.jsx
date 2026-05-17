import { useEffect, useState } from 'react'
import personIcon from '../assets/person.svg'
import AdminUserMenu from '../components/AdminUserMenu'
import { fetchCurrentUser, getApiBase, getToken } from '../lib/auth'

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
}

export default function AdminProfile() {
  const apiBase = getApiBase()
  const token = getToken()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchCurrentUser(token)
        if (!data) throw new Error('Không tải được thông tin tài khoản')
        if (!cancelled) setUser(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')

    const { current_password, new_password, confirm_password } = passwordForm
    if (!current_password || !new_password) {
      setPasswordError('Vui lòng điền đầy đủ mật khẩu')
      return
    }
    if (new_password.length < 6) {
      setPasswordError('Mật khẩu mới tối thiểu 6 ký tự')
      return
    }
    if (new_password !== confirm_password) {
      setPasswordError('Mật khẩu mới và xác nhận không khớp')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password, new_password }),
      })
      if (!res.ok) {
        let detail = 'Đổi mật khẩu thất bại'
        try {
          const data = await res.json()
          detail = data.detail || detail
        } catch {
          const txt = await res.text()
          if (txt) detail = txt
        }
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
      }
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordMsg('Đã đổi mật khẩu thành công')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-container-padding-desktop h-16 z-40 bg-surface shadow-sm flex-shrink-0 border-b border-outline-variant/20">
        <h1 className="font-headline-md text-headline-md text-on-surface">Thông tin cá nhân</h1>
        <AdminUserMenu />
      </header>

      <main className="flex-1 overflow-y-auto p-container-padding-mobile md:p-container-padding-desktop pb-24">
        <div className="max-w-xl mx-auto flex flex-col gap-stack-lg mt-6">
          {loading && <p className="text-on-surface-variant font-body-md">Đang tải...</p>}
          {error && <p className="text-error font-label-md">{error}</p>}

          {!loading && user && (
            <>
              <section className="bg-surface-bright border border-outline-variant/40 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
                    <img src={personIcon} alt="" className="h-7 w-7 icon-dark" />
                  </div>
                  <div>
                    <p className="font-headline-md text-headline-md text-on-surface">{user.full_name}</p>
                    <p className="font-body-md text-on-surface-variant mt-0.5">{user.email}</p>
                  </div>
                </div>

                <dl className="flex flex-col gap-4">
                  <div>
                    <dt className="font-label-sm text-on-surface-variant">Vai trò</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/40 text-primary font-label-md font-semibold border border-primary-container">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </dd>
                  </div>
                  {user.phone && (
                    <div>
                      <dt className="font-label-sm text-on-surface-variant">Số điện thoại</dt>
                      <dd className="font-body-md text-on-surface mt-1">{user.phone}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-label-sm text-on-surface-variant">Email</dt>
                    <dd className="font-body-md text-on-surface mt-1">{user.email}</dd>
                  </div>
                </dl>
              </section>

              <section className="bg-surface-bright border border-outline-variant/40 rounded-2xl p-6 shadow-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Đổi mật khẩu</h2>
                <p className="font-label-sm text-on-surface-variant mb-6">
                  Dùng mật khẩu mạnh, tối thiểu 6 ký tự.
                </p>

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="current_password" className="font-label-md text-on-surface-variant">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      id="current_password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, current_password: e.target.value }))
                      }
                      className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="new_password" className="font-label-md text-on-surface-variant">
                      Mật khẩu mới
                    </label>
                    <input
                      id="new_password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                      className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="confirm_password" className="font-label-md text-on-surface-variant">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      id="confirm_password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))
                      }
                      className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {passwordError && <p className="text-error font-label-md">{passwordError}</p>}
                  {passwordMsg && <p className="text-primary font-label-md">{passwordMsg}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 px-8 py-3 bg-primary text-on-primary rounded-full font-label-md font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 self-start"
                  >
                    {submitting ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}
