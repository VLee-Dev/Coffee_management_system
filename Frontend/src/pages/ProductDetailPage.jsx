import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CustomerChrome from '../components/layout/CustomerChrome'
import { useCart } from '../context/CartContext'
import { CUSTOMER_CART } from '../constants/routes'
import { formatVnd, productImageUrl, productSubtitle, productDescription } from '../lib/products'
import { getApiBase } from '../lib/auth'
import { getBrewingMethodLabel } from '../components/BrewingMethodPicker'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const { addProduct } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${apiBase}/products/${productId}`)
        if (!res.ok) throw new Error('Không tải được sản phẩm')
        const data = await res.json()
        if (!cancelled) setProduct(data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Lỗi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [apiBase, productId])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    addProduct({ ...product, quantity: undefined })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }, [product, addProduct])

  function increment() {
    setQuantity((q) => Math.min(q + 1, 99))
  }

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function handleAddMultiple() {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addProduct(product)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const img = product ? productImageUrl(product, apiBase) : null
  const isCoffee = product?.product_type === 'coffee'
  const outOfStock = !product || product.status === 'out_of_stock' || product.stock_quantity <= 0

  if (loading) {
    return (
      <CustomerChrome activeNav={isCoffee ? 'coffee' : 'equipment'} showBack backTo={-1}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-body-md text-on-surface-variant">Đang tải sản phẩm…</p>
        </div>
      </CustomerChrome>
    )
  }

  if (error || !product) {
    return (
      <CustomerChrome activeNav="home" showBack backTo={-1}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <span className="material-symbols-outlined text-6xl text-outline">error</span>
          <p className="font-body-md text-error">{error || 'Sản phẩm không tồn tại'}</p>
        </div>
      </CustomerChrome>
    )
  }

  return (
    <CustomerChrome activeNav={isCoffee ? 'coffee' : 'equipment'} showBack backTo={-1}>
      <main className="w-full max-w-5xl mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden bg-surface-container-high aspect-[3/4] md:aspect-[4/5] max-h-[480px] md:max-h-[560px]">
            {img ? (
              <img
                alt={product.name}
                className="w-full h-full object-cover"
                src={img}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-outline text-[96px]">
                  {isCoffee ? 'coffee' : 'blender'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-stack-md">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-1">
                {isCoffee ? 'Cà phê' : 'Dụng cụ pha chế'}
              </p>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                {product.name}
              </h1>
            </div>

            <p className="font-headline-md text-headline-md text-primary">{formatVnd(product.price)}</p>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {outOfStock ? (
                <span className="px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm">
                  Hết hàng
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                  Còn {product.stock_quantity} sản phẩm
                </span>
              )}
            </div>

            {/* Brewing method */}
            {product.brewing_method && (
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Cách pha</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm border border-primary-container/30">
                    {getBrewingMethodLabel(product.brewing_method)}
                  </span>
                </div>
              </div>
            )}

            {/* Flavor tags (coffee) */}
            {isCoffee && product.flavor_tags?.length > 0 && (
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Hương vị</p>
                <div className="flex flex-wrap gap-2">
                  {product.flavor_tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 rounded-full bg-secondary-container/20 text-tertiary font-label-sm text-label-sm border border-secondary-container/30"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Mô tả</p>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed italic text-on-surface-variant">
                {productDescription(product)}
              </p>
            </div>

            {/* Quantity selector */}
            <div className="mt-auto pt-4 border-t border-outline-variant/30">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">Số lượng</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface rounded-full border border-surface-container-highest overflow-hidden">
                  <button
                    type="button"
                    onClick={decrement}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Giảm"
                  >
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </button>
                  <span className="w-12 text-center font-label-md text-label-md text-on-surface select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={increment}
                    disabled={quantity >= Math.min(product.stock_quantity, 99)}
                    className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Tăng"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  (tối đa {Math.min(product.stock_quantity, 99)})
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddMultiple}
                disabled={outOfStock}
                className="flex-1 bg-primary text-on-primary font-label-md text-label-md py-3 px-6 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                Thêm vào giỏ ({quantity})
              </button>
              <button
                type="button"
                onClick={() => navigate(CUSTOMER_CART)}
                className="flex-1 bg-surface-container text-on-surface font-label-md text-label-md py-3 px-6 rounded-full border border-outline-variant hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                Xem giỏ hàng
              </button>
            </div>

            {added && (
              <div className="flex items-center gap-2 text-secondary bg-secondary-container/20 rounded-xl p-3 animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <p className="font-label-md text-label-md text-on-secondary-container">
                  Đã thêm {quantity} sản phẩm vào giỏ hàng!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </CustomerChrome>
  )
}
