import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import petIcon from '../assets/iconpet.svg'
import coffeeIcon from '../assets/local_cafe.svg'
import personIcon from '../assets/person.svg'
import lockIcon from '../assets/lock.svg'
import mailIcon from '../assets/mail.svg'
import callIcon from '../assets/call.svg'
import arrowForwardIcon from '../assets/arrow_forward.svg'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone: phone || null,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Register failed')
      }

      await response.json()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-background min-h-screen flex items-center justify-center p-container-padding-mobile md:p-container-padding-desktop antialiased text-on-background relative overflow-hidden w-full">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-tertiary-container/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg shadow-on-background/5 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.03] flex flex-wrap justify-around items-around z-0 overflow-hidden">
          <img src={petIcon} alt="" className="w-14 h-14 m-4 -rotate-12" />
          <img src={petIcon} alt="" className="w-14 h-14 m-8 rotate-12" />
          <img src={petIcon} alt="" className="w-14 h-14 m-2 mt-12 -rotate-6" />
          <img src={petIcon} alt="" className="w-14 h-14 m-6 mt-16 rotate-6" />
          <img src={petIcon} alt="" className="w-14 h-14 m-4 -rotate-12" />
        </div>

        <div className="relative z-10 p-stack-lg flex flex-col items-center">
          <div className="text-center mb-stack-lg w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded-full mb-stack-sm text-primary">
              <img src={coffeeIcon} alt="" className="w-10 h-10" />
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight">Meo Coffee</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-unit">Cùng tạo không gian ấm cúng nhé!</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-stack-md">
            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-label-md text-on-surface-variant ml-unit" htmlFor="username">
                Họ và Tên
              </label>
              <div className="relative">
                <img src={personIcon} alt="" className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-outline focus:border-secondary-container focus:ring-0 transition-colors"
                  id="username"
                  name="username"
                  placeholder="Tên của bạn"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-label-md text-on-surface-variant ml-unit" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <img src={lockIcon} alt="" className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-outline focus:border-secondary-container focus:ring-0 transition-colors"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-label-md text-on-surface-variant ml-unit" htmlFor="email">
                Email-Tài khoản đăng nhập
              </label>
              <div className="relative">
                <img src={mailIcon} alt="" className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-outline focus:border-secondary-container focus:ring-0 transition-colors"
                  id="email"
                  name="email"
                  placeholder="meo@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-unit mb-unit">
              <label className="font-label-md text-label-md text-on-surface-variant ml-unit" htmlFor="phone">
                Số điện thoại (có thể bỏ trống)
              </label>
              <div className="relative">
                <img src={callIcon} alt="" className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-background border-2 border-surface-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-outline focus:border-secondary-container focus:ring-0 transition-colors"
                  id="phone"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-full shadow-md shadow-primary/20 hover:scale-[0.98] hover:bg-surface-tint active:scale-95 transition-all duration-200 mt-stack-sm flex items-center justify-center gap-2">
              <span>{loading ? 'Đang xử lý...' : 'Đăng ký'}</span>
              {!loading && <img src={arrowForwardIcon} alt="" className="h-4 w-4" />}
            </button>

            {error && <p className="text-red-600 mt-2">{error}</p>}
          </form>

          <div className="mt-stack-lg text-center w-full pt-stack-md border-t border-outline-variant/30">
            <span className="font-body-md text-body-md text-on-surface-variant">Đã có tài khoản? </span>
            <Link to="/login" className="font-label-md text-label-md text-primary hover:text-secondary-container transition-colors inline-flex items-center gap-1">
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
