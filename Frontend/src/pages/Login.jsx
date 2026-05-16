import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../assets/meocam.jfif'
import petIcon from '../assets/iconpet.svg'
import { clearToken, fetchCurrentUser, getApiBase, isAdmin } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const apiBase = getApiBase()
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)

      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Đăng nhập thất bại')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.access_token)

      const user = await fetchCurrentUser(data.access_token)
      if (!user) {
        clearToken()
        throw new Error('Đăng nhập thất bại')
      }

      if (isAdmin(user)) {
        navigate('/admin/products', { replace: true })
      } else {
        navigate('/hello', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="w-full min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      <section className="hidden md:flex md:w-1/2 bg-surface-container-low relative flex-col justify-end overflow-hidden pb-6 px-10 pt-80">
        <img
          alt="Meo Coffee hero"
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 -translate-y-[12%] scale-110"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/30 to-transparent" />
        <div className="relative z-10 max-w-lg">
          <h1 className="font-display-lg text-surface-bright mb-stack-md text-headline-lg">
            Chào mừng đến với Meo Coffee - Thiên đường mua sắm coffee
          </h1>
          <p className="font-body-lg text-body-lg text-surface-variant">
            Nơi hội tụ những hạt cà phê thượng hạng và không gian ấm áp dành riêng cho bạn.
          </p>
        </div>
      </section>

      <section className="w-full md:w-1/2 flex items-center justify-center p-container-padding-mobile md:p-container-padding-desktop bg-background">
        <div className="w-full max-w-md space-y-stack-lg">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-stack-md">
              <img src={petIcon} alt="" className="w-10 h-10" />
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Meo Coffee</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Đăng nhập để tiếp tục hành trình hương vị.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-stack-md bg-surface-container-lowest p-stack-lg rounded-[24px] diffusion-shadow border border-surface-container">
            <div className="space-y-stack-sm">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="username">
                Email
              </label>
              <input
                className="w-full bg-background border-2 border-outline-variant text-on-background rounded-xl px-4 py-3 font-body-md text-body-md focus:border-secondary-container focus:ring-0 transition-colors placeholder:text-outline-variant/60"
                id="username"
                name="username"
                placeholder="Nhập tài khoản"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-stack-sm">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                Mật khẩu
              </label>
              <input
                className="w-full bg-background border-2 border-outline-variant text-on-background rounded-xl px-4 py-3 font-body-md text-body-md focus:border-secondary-container focus:ring-0 transition-colors placeholder:text-outline-variant/60"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input className="w-4 h-4 text-primary border-outline-variant rounded bg-background focus:ring-primary focus:ring-offset-background" id="remember" type="checkbox" />
                <label className="ml-2 font-body-md text-body-md text-on-surface-variant" htmlFor="remember">
                  Ghi nhớ tôi
                </label>
              </div>
              <a className="font-label-md text-label-md text-primary hover:text-secondary transition-colors" href="#">
                Quên mật khẩu?
              </a>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-full hover:bg-surface-tint hover:scale-[0.98] transition-all duration-200 mt-stack-md diffusion-shadow-active">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            {error && <p className="text-red-600 mt-2">{error}</p>}
          </form>

          <p className="text-center font-body-md text-body-md text-on-surface-variant pt-stack-sm">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-label-md text-label-md text-primary hover:text-secondary transition-colors ml-1">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
