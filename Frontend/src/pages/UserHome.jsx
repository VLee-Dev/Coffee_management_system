import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../assets/meocam.jfif'
import {
  CUSTOMER_HOME,
  CUSTOMER_PROFILE,
  CUSTOMER_SHOP_COFFEE,
  CUSTOMER_SHOP_EQUIPMENT,
  customerDevelopingPath,
} from '../constants/routes'
import { clearToken, fetchCurrentUser, getApiBase, getToken } from '../lib/auth'

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

function productImageUrl(product, apiBase) {
  if (!product?.image_url) return null
  const u = product.image_url
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const base = apiBase.replace(/\/$/, '')
  if (u.startsWith('/')) return `${base}${u}`
  return `${base}/${u}`
}

function padSlots(arr, n) {
  const out = [...(arr || [])]
  while (out.length < n) out.push(null)
  return out.slice(0, n)
}

const DESC_FALLBACK = 'Meo Coffee chất lượng từ trái tim <3'

function productDescription(product) {
  if (!product) return ''
  const t = product.description?.trim()
  return t || DESC_FALLBACK
}

function FeaturedCard({ product, wide, onAddToCart }) {
  const img = product ? productImageUrl(product, getApiBase()) : null
  const isCoffee = product?.product_type === 'coffee'
  const flavorTags = isCoffee && Array.isArray(product.flavor_tags) ? product.flavor_tags : []

  const imageBlock = (
    <div
      className={`relative overflow-hidden bg-surface-container-high ${
        wide ? 'md:w-1/2 h-48 md:h-auto' : 'h-48'
      }`}
    >
      {img ? (
        <img
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          src={img}
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br opacity-90 ${
            wide ? 'from-primary-container/40 to-secondary-container/30' : 'from-tertiary-container/50 to-primary-fixed/40'
          }`}
        />
      )}
    </div>
  )

  const body = (
    <div className={`${wide ? 'md:w-1/2 p-6 flex flex-col justify-center' : 'p-6 flex flex-col flex-grow'}`}>
      <h3 className="font-headline-md text-[20px] text-on-surface mb-2">
        {product?.name || 'Sắp cập nhật'}
      </h3>
      {product && (
        <p className="font-body-md text-body-md text-on-surface-variant mb-2 line-clamp-3">{productDescription(product)}</p>
      )}
      {flavorTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2" aria-label="Hương vị">
          {flavorTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full border border-outline-variant/60 bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-on-surface"
              title={tag.group_name || undefined}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      {product && (
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Đã bán: {product.total_units_sold}</p>
      )}
      <div
        className={`mt-auto flex items-center justify-between ${wide ? '' : 'pt-4 border-t border-outline-variant/20'}`}
      >
        <span className="font-bold text-primary">{product ? vnd.format(Number(product.price)) : '—'}</span>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!product}
          className={
            wide
              ? 'bg-primary text-on-primary p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40'
              : 'text-primary border border-outline-variant p-2 rounded-full hover:bg-surface-container transition-colors disabled:opacity-40'
          }
          aria-label="Thêm vào giỏ"
        >
          <span className="material-symbols-outlined">add_shopping_cart</span>
        </button>
      </div>
    </div>
  )

  return (
    <article
      className={`group bg-surface-container-lowest rounded-[24px] overflow-hidden flex flex-col shadow-diffusion hover:shadow-diffusion-hover transition-all duration-300 border border-outline-variant/30 ${
        wide ? 'md:flex-row md:col-span-2' : 'md:col-span-1'
      }`}
    >
      {imageBlock}
      {body}
    </article>
  )
}

export default function UserHome() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [featured, setFeatured] = useState(null)
  const [featError, setFeatError] = useState(null)
  const [featLoading, setFeatLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const user = await fetchCurrentUser(getToken())
      if (!cancelled && user?.full_name) setName(user.full_name)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadFeatured() {
      setFeatLoading(true)
      setFeatError(null)
      try {
        const res = await fetch(`${getApiBase()}/products/featured-collection`)
        if (!res.ok) throw new Error('Không tải được bộ sưu tập')
        const data = await res.json()
        if (!cancelled) setFeatured(data)
      } catch (e) {
        if (!cancelled) setFeatError(e.message || 'Lỗi mạng')
      } finally {
        if (!cancelled) setFeatLoading(false)
      }
    }
    loadFeatured()
    return () => {
      cancelled = true
    }
  }, [])

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  const wip = customerDevelopingPath
  const coffeeSlots = padSlots(featured?.coffee, 2)
  const equipmentSlots = padSlots(featured?.equipment, 2)

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      <nav className="sticky bg-background/80 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop h-16 top-0 z-50">
        <div className="flex items-center space-x-8">
          <Link
            to={CUSTOMER_HOME}
            className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary tracking-tight hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            Meo Coffee
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to={CUSTOMER_SHOP_COFFEE} className="font-label-md text-on-surface hover:text-primary transition-colors">
              Coffee
            </Link>
            <Link to={CUSTOMER_SHOP_EQUIPMENT} className="font-label-md text-on-surface hover:text-primary transition-colors">
              Dụng cụ
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 text-primary">
          <button
            type="button"
            title="Giỏ hàng"
            onClick={() => navigate(wip('cart'))}
            className="hover:text-secondary transition-colors duration-200 active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container flex items-center justify-center"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
          <Link
            to={CUSTOMER_PROFILE}
            title="Tài khoản"
            className="hover:text-secondary transition-colors duration-200 active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container flex items-center justify-center"
          >
            <span className="material-symbols-outlined">person</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:inline font-label-md text-label-md text-on-surface-variant hover:text-primary px-2"
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      <main className="flex-grow w-full px-container-padding-mobile md:px-container-padding-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg">
        {name && (
          <p className="font-body-md text-on-surface-variant text-center md:text-left">
            Xin chào, <span className="font-semibold text-on-surface">{name}</span>
          </p>
        )}

        <section className="w-full h-[40vh] md:h-[350px] relative rounded-[32px] overflow-hidden shadow-diffusion bg-surface-container-high group">
          <img
            alt="Meo Coffee"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-tint/60 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-on-primary">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container/80 backdrop-blur-sm text-on-secondary-container font-label-sm text-label-sm mb-4 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[16px] mr-1.5">pets</span>
              Cozy Companionship
            </span>
            <h1 className="font-display-lg text-display-lg text-surface-bright drop-shadow-md max-w-lg mb-2">
              Brewed with Whiskers
            </h1>
            <p className="font-body-lg text-body-lg text-surface-container-low max-w-md drop-shadow-sm opacity-90">
              Experience the soft-tactile warmth of our signature blends, crafted for perfect lazy afternoons.
            </p>
          </div>
        </section>

        <section className="space-y-stack-md pt-8">
          <div className="flex flex-col items-center space-y-2 mb-6">
            <h2 className="font-headline-md text-headline-md text-primary w-full text-center">Bộ Sưu Tập Nổi Bật</h2>
          </div>

          {featLoading && (
            <p className="text-center font-body-md text-on-surface-variant py-8">Đang tải bộ sưu tập…</p>
          )}
          {featError && !featLoading && (
            <p className="text-center text-error font-body-md py-4">{featError}</p>
          )}

          {!featLoading && !featError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter md:gap-stack-lg">
              <h3 className="font-label-md text-label-md text-on-surface-variant md:col-span-3 text-center md:text-left">
                Coffee
              </h3>
              <FeaturedCard
                key={coffeeSlots[0] ? `c0-${coffeeSlots[0].id}` : 'c0-empty'}
                product={coffeeSlots[0]}
                wide
                onAddToCart={() => navigate(wip('product'))}
              />
              <FeaturedCard
                key={coffeeSlots[1] ? `c1-${coffeeSlots[1].id}` : 'c1-empty'}
                product={coffeeSlots[1]}
                wide={false}
                onAddToCart={() => navigate(wip('product'))}
              />

              <h3 className="font-label-md text-label-md text-on-surface-variant md:col-span-3 text-center md:text-left pt-2">
                Dụng cụ pha chế
              </h3>
              <FeaturedCard
                key={equipmentSlots[0] ? `e0-${equipmentSlots[0].id}` : 'e0-empty'}
                product={equipmentSlots[0]}
                wide={false}
                onAddToCart={() => navigate(wip('product'))}
              />
              <FeaturedCard
                key={equipmentSlots[1] ? `e1-${equipmentSlots[1].id}` : 'e1-empty'}
                product={equipmentSlots[1]}
                wide
                onAddToCart={() => navigate(wip('product'))}
              />
            </div>
          )}
        </section>
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant mt-auto flex flex-col md:flex-row justify-between items-center w-full py-stack-lg px-container-padding-mobile md:px-container-padding-desktop space-y-4 md:space-y-0 text-on-surface-variant font-label-md text-label-md">
        <div className="flex flex-col md:flex-row items-center md:space-x-8 space-y-4 md:space-y-0">
          <span className="font-headline-md text-headline-md text-primary font-bold">Meo Coffee</span>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <li>
              <Link to={wip('beans')} className="text-on-surface-variant hover:text-secondary transition-colors">
                Our Beans
              </Link>
            </li>
            <li>
              <Link to={wip('cafe')} className="text-on-surface-variant hover:text-secondary transition-colors">
                Cat Cafe
              </Link>
            </li>
            <li>
              <Link to={wip('shipping')} className="text-on-surface-variant hover:text-secondary transition-colors">
                Shipping
              </Link>
            </li>
            <li>
              <Link to={wip('privacy')} className="text-on-surface-variant hover:text-secondary transition-colors">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center md:text-right opacity-80">
          <button
            type="button"
            onClick={handleLogout}
            className="sm:hidden font-label-md text-primary hover:text-secondary underline-offset-2 hover:underline"
          >
            Đăng xuất
          </button>
          <span>© 2005 MeoCoffee. VinhLee</span>
        </div>
      </footer>
    </div>
  )
}
