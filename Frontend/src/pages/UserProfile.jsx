import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import petAvatar from '../assets/iconpet.svg'
import CustomerChrome from '../components/CustomerChrome'
import { customerDevelopingPath } from '../constants/routes'
import { clearToken, fetchCurrentUser, getApiBase, getToken } from '../lib/auth'

const ROLE_LABELS = {
  customer: 'Thành viên Meo Coffee',
  admin: 'Quản trị viên',
}

function profileBadges(user) {
  const badges = []
  if (user?.role) badges.push(ROLE_LABELS[user.role] || user.role)
  return badges
}

function PreferenceCard({ icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface-container-lowest rounded-[20px] p-stack-md border border-surface-container-highest shadow-diffusion hover:shadow-diffusion-hover transition-all duration-200 flex items-center justify-between group text-left w-full hover:scale-[0.98]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <div>
          <div className="font-label-md text-label-md text-on-surface">{title}</div>
          <div className="font-body-md text-on-surface-variant text-sm">{subtitle}</div>
        </div>
      </div>
      <span className="material-symbols-outlined text-outline group-hover:text-primary">chevron_right</span>
    </button>
  )
}

export default function UserProfile() {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const token = getToken()
  const wip = customerDevelopingPath

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [role, setRole] = useState('customer')
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const user = await fetchCurrentUser(token)
        if (!user) throw new Error('Không tải được hồ sơ')
        if (!cancelled) {
          setForm({
            full_name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
          })
          setRole(user.role || 'customer')
        }
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

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaveMsg('')
    setError('')
    if (!form.full_name.trim()) {
      setError('Họ và tên không được để trống')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        }),
      })
      if (!res.ok) {
        let detail = 'Lưu thất bại'
        try {
          const data = await res.json()
          detail = data.detail || detail
        } catch {
          /* ignore */
        }
        throw new Error(detail)
      }
      const user = await res.json()
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      })
      setRole(user.role || role)
      setSaveMsg('Đã lưu thay đổi')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

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
    setChangingPassword(true)
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
          /* ignore */
        }
        throw new Error(detail)
      }
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordMsg('Đã đổi mật khẩu')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  const badges = profileBadges({ role, address: form.address })
  const addressSubtitle = form.address?.trim()
    ? form.address.trim().length > 40
      ? `${form.address.trim().slice(0, 40)}…`
      : form.address.trim()
    : 'Chưa có địa chỉ — cập nhật ở form trên'

  return (
    <CustomerChrome activeNav="profile">
      <main className="flex-grow w-full max-w-3xl mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg">
        <div className="mb-stack-lg text-center">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-stack-sm">
            Hồ sơ của bạn
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Quản lý thông tin tài khoản Meo Coffee của bạn.
          </p>
        </div>

        {loading && (
          <p className="text-center font-body-md text-on-surface-variant py-12">Đang tải hồ sơ…</p>
        )}

        {!loading && (
          <>
            {error && (
              <p className="mb-stack-md text-center text-error font-body-md" role="alert">
                {error}
              </p>
            )}
            {saveMsg && (
              <p className="mb-stack-md text-center text-primary font-label-md" role="status">
                {saveMsg}
              </p>
            )}

            <div className="bg-surface-container-lowest rounded-[24px] border border-surface-container-highest shadow-diffusion p-container-padding-mobile md:p-container-padding-desktop mb-stack-lg relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-surface-container rounded-full opacity-50 blur-xl" aria-hidden />
              <div className="flex flex-col md:flex-row gap-stack-lg items-start">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-4 border-surface-container bg-surface-container-high flex items-center justify-center mb-stack-md overflow-hidden relative shadow-inner">
                    <img src={petAvatar} alt="" className="w-20 h-20 object-contain" />
                    <button
                      type="button"
                      onClick={() => navigate(wip('avatar'))}
                      className="absolute bottom-0 left-0 right-0 bg-primary/80 backdrop-blur-sm text-on-primary py-1 font-label-sm text-label-sm flex items-center justify-center gap-1 hover:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Sửa ảnh
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {badges.map((label) => (
                      <span
                        key={label}
                        className="px-3 py-1 bg-secondary-container/20 text-tertiary font-label-sm text-label-sm rounded-full border border-secondary-container/30"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  <form className="space-y-stack-md" onSubmit={handleSaveProfile}>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-unit" htmlFor="fullName">
                        Họ và tên
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                          person
                        </span>
                        <input
                          id="fullName"
                          className="w-full pl-10 pr-4 py-3 bg-surface border-2 border-surface-container-highest rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-0 transition-colors"
                          type="text"
                          value={form.full_name}
                          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-unit" htmlFor="email">
                        Email
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                          mail
                        </span>
                        <input
                          id="email"
                          className="w-full pl-10 pr-4 py-3 bg-surface-container border-2 border-surface-container-highest rounded-xl font-body-md text-body-md text-on-surface-variant cursor-not-allowed"
                          type="email"
                          value={form.email}
                          readOnly
                          aria-readonly="true"
                        />
                      </div>
                      <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">Email không thể thay đổi.</p>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-unit" htmlFor="phone">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                          call
                        </span>
                        <input
                          id="phone"
                          className="w-full pl-10 pr-4 py-3 bg-surface border-2 border-surface-container-highest rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-0 transition-colors"
                          type="tel"
                          placeholder="Thêm số điện thoại"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-unit" htmlFor="address">
                        Địa chỉ giao hàng
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-outline pointer-events-none">
                          location_on
                        </span>
                        <textarea
                          id="address"
                          rows={2}
                          className="w-full pl-10 pr-4 py-3 bg-surface border-2 border-surface-container-highest rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-0 transition-colors resize-y min-h-[80px]"
                          placeholder="Số nhà, đường, quận, thành phố…"
                          value={form.address}
                          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="pt-stack-sm flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-primary text-on-primary font-label-md text-label-md rounded-full shadow-md hover:scale-95 hover:shadow-diffusion-hover transition-all duration-200 disabled:opacity-60"
                      >
                        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md mt-stack-lg">Đổi mật khẩu</h2>
            <div className="bg-surface-container-lowest rounded-[24px] border border-surface-container-highest shadow-diffusion p-container-padding-mobile md:p-stack-lg mb-stack-lg">
              <form className="space-y-stack-md max-w-md" onSubmit={handleChangePassword}>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Mật khẩu hiện tại"
                  className="w-full px-4 py-3 bg-surface border-2 border-surface-container-highest rounded-xl font-body-md focus:outline-none focus:border-secondary"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full px-4 py-3 bg-surface border-2 border-surface-container-highest rounded-xl font-body-md focus:outline-none focus:border-secondary"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full px-4 py-3 bg-surface border-2 border-surface-container-highest rounded-xl font-body-md focus:outline-none focus:border-secondary"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
                />
                {passwordError && <p className="text-error font-body-md">{passwordError}</p>}
                {passwordMsg && <p className="text-primary font-label-md">{passwordMsg}</p>}
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-3 bg-secondary text-on-secondary font-label-md rounded-full hover:opacity-90 disabled:opacity-60"
                >
                  {changingPassword ? 'Đang xử lý…' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            </div>

            <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Tùy chọn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-stack-lg">
              <PreferenceCard
                icon="location_on"
                title="Địa chỉ giao hàng"
                subtitle={addressSubtitle}
                onClick={() => document.getElementById('address')?.focus()}
              />
              <PreferenceCard
                icon="payments"
                title="Phương thức thanh toán"
                subtitle="QR — đang phát triển"
                onClick={() => navigate(wip('payment'))}
              />
            </div>

            <div className="mt-stack-lg flex justify-center pb-stack-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="px-8 py-3 bg-surface border-2 border-outline font-label-md text-label-md text-on-surface-variant rounded-full hover:bg-error-container hover:text-error hover:border-error transition-colors flex items-center gap-2 hover:scale-[0.98] shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Đăng xuất
              </button>
            </div>
          </>
        )}
      </main>
    </CustomerChrome>
  )
}
