import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerChrome from '../components/CustomerChrome'
import { useCart } from '../context/CartContext'
import { CUSTOMER_CHECKOUT, CUSTOMER_HOME, CUSTOMER_PRODUCT_DETAIL } from '../constants/routes'
import { SHIPPING_FEE } from '../lib/orders'
import { getApiBase } from '../lib/auth'
import {
  fetchShopProducts,
  formatVnd,
  pickRandom,
  productImageUrl,
  productSubtitle,
} from '../lib/products'

const SUGGEST_COUNT = 6

function CartSuggestionCard({ product, onAdd }) {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const img = productImageUrl(product, apiBase)

  return (
    <article className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-diffusion p-4 flex flex-col gap-3 group hover:border-primary/30 transition-colors duration-300 cursor-pointer" onClick={() => navigate(`${CUSTOMER_PRODUCT_DETAIL}/${product.id}`)}>
      <div className="aspect-square rounded-lg overflow-hidden bg-surface-container-low">
        {img ? (
          <img
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={img}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-container/30 to-secondary-container/20">
            <span className="material-symbols-outlined text-outline text-[40px]">coffee</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow">
        <h3 className="font-label-md text-body-md text-on-surface line-clamp-1">{product.name}</h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-2 mt-1">
          {productSubtitle(product)}
        </p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="font-label-md text-label-md text-primary">{formatVnd(product.price)}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAdd(product) }}
          className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors active:scale-95 shadow-sm"
          aria-label={`Thêm ${product.name} vào giỏ`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>
    </article>
  )
}

function CartLineItem({ item, apiBase, onToggleSelect, onQuantity, onRemove }) {
  const img = item.product ? productImageUrl(item.product, apiBase) : null

  return (
    <div
      className={`bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-diffusion p-4 flex flex-row items-center gap-4 ${
        !item.selected ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          className="cart-checkbox"
          checked={item.selected}
          onChange={() => onToggleSelect(item.localId)}
          aria-label={`Chọn ${item.name}`}
        />
      </div>
      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
        {img ? (
          <img alt="" className="w-full h-full object-cover" src={img} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-outline text-[32px]">coffee</span>
          </div>
        )}
      </div>
      <div className="flex-grow flex flex-col justify-between min-h-[6rem] py-1">
        <div>
          <h3 className="font-headline-md text-body-lg text-on-surface">{item.name}</h3>
          {item.flavorTags?.length > 0 && (
            <div className="flex gap-2 mt-1 flex-wrap">
              {item.flavorTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary-container/20 text-tertiary font-label-sm text-label-sm px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="font-label-md text-label-md text-primary mt-2">{formatVnd(item.price)}</div>
      </div>
      <div className="flex flex-col items-end justify-between min-h-[6rem] py-1">
        <button
          type="button"
          onClick={() => onRemove(item.localId)}
          className="text-outline hover:text-error transition-colors"
          aria-label={`Xóa ${item.name}`}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
        <div className="flex items-center bg-surface rounded-full border border-surface-container-highest p-1 gap-2">
          <button
            type="button"
            onClick={() => onQuantity(item.localId, -1)}
            disabled={item.quantity <= 1}
            className="w-6 h-6 flex items-center justify-center text-primary hover:bg-surface-container rounded-full transition-colors disabled:opacity-40"
            aria-label="Giảm số lượng"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <span className="font-label-md text-label-md w-4 text-center">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onQuantity(item.localId, 1)}
            className="w-6 h-6 flex items-center justify-center text-primary hover:bg-surface-container rounded-full transition-colors"
            aria-label="Tăng số lượng"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const { items: cartItems, addProduct, toggleSelect, changeQuantity, removeItem, cartProductIdsKey } =
    useCart()

  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(true)

  const loadSuggestions = useCallback(async () => {
    setSuggestLoading(true)
    try {
      const [coffee, equipment] = await Promise.all([
        fetchShopProducts(apiBase, { productType: 'coffee' }),
        fetchShopProducts(apiBase, { productType: 'equipment' }),
      ])
      const pool = [...coffee, ...equipment]
      const inCart = new Set(
        cartProductIdsKey ? cartProductIdsKey.split(',').map((id) => Number(id)) : [],
      )
      const available = pool.filter((p) => !inCart.has(p.id))
      setSuggestions(pickRandom(available.length > 0 ? available : pool, SUGGEST_COUNT))
    } catch {
      setSuggestions([])
    } finally {
      setSuggestLoading(false)
    }
  }, [apiBase, cartProductIdsKey])

  useEffect(() => {
    const t = setTimeout(() => {
      loadSuggestions()
    }, 0)
    return () => clearTimeout(t)
  }, [loadSuggestions])

  const selectedItems = cartItems.filter((i) => i.selected)
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const selectedCount = selectedItems.reduce((n, i) => n + i.quantity, 0)
  const hasSelection = selectedCount > 0
  const total = hasSelection ? subtotal + SHIPPING_FEE : 0

  return (
    <CustomerChrome activeNav="cart" showBack backTo={CUSTOMER_HOME}>
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg flex flex-col md:flex-row gap-stack-lg">
        <section className="flex-1 flex flex-col gap-stack-md min-w-0">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">
            Giỏ hàng
          </h1>

          {cartItems.length === 0 && (
            <p className="font-body-md text-on-surface-variant py-8 text-center">Giỏ hàng trống.</p>
          )}

          {cartItems.map((item) => (
            <CartLineItem
              key={item.localId}
              item={item}
              apiBase={apiBase}
              onToggleSelect={toggleSelect}
              onQuantity={changeQuantity}
              onRemove={removeItem}
            />
          ))}

          <section className="mt-stack-lg">
            <h2 className="font-headline-md text-headline-md text-primary mb-4">Gợi ý</h2>
            {suggestLoading && (
              <p className="font-body-md text-on-surface-variant">Đang tải gợi ý…</p>
            )}
            {!suggestLoading && suggestions.length === 0 && (
              <p className="font-body-md text-on-surface-variant">Chưa có sản phẩm gợi ý.</p>
            )}
            {!suggestLoading && suggestions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-md">
                {suggestions.map((p) => (
                  <CartSuggestionCard key={`sug-${p.id}`} product={p} onAdd={addProduct} />
                ))}
              </div>
            )}
          </section>
        </section>

        <aside className="w-full md:w-[380px] flex-shrink-0 sticky bottom-0 md:top-24 self-end md:self-start bg-surface-container-lowest md:bg-transparent p-4 md:p-0 border-t md:border-none border-outline-variant z-40">
          <div className="bg-surface-container-lowest rounded-xl md:border md:border-surface-container-highest md:shadow-diffusion p-0 md:p-6 flex flex-col gap-4">
            <div className="hidden md:block">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-4 border-b border-surface-variant pb-2">
                Tóm tắt đơn hàng
              </h2>
              <div className="flex justify-between items-center py-2">
                <span className="font-body-md text-body-md text-on-surface-variant">
                  Tạm tính ({selectedCount} sản phẩm)
                </span>
                <span className="font-label-md text-label-md text-on-surface">{formatVnd(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-variant pb-4">
                <span className="font-body-md text-body-md text-on-surface-variant">Phí giao hàng</span>
                <span className="font-label-md text-label-md text-on-surface">
                  {hasSelection ? formatVnd(SHIPPING_FEE) : formatVnd(0)}
                </span>
              </div>
            </div>
            <div className="flex md:flex-col justify-between items-center md:items-stretch gap-4">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface-variant md:hidden">Tổng cộng</span>
                <div className="flex justify-between items-end md:items-center pt-2 gap-4">
                  <span className="hidden md:inline font-headline-md text-body-lg text-on-surface">Tổng cộng</span>
                  <span className="font-headline-md text-headline-md text-primary">{formatVnd(total)}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => navigate(CUSTOMER_CHECKOUT)}
                className="bg-primary text-on-primary font-label-md text-label-md py-3 px-8 rounded-full hover:scale-95 transition-transform shadow-diffusion-hover flex-shrink-0 md:w-full md:mt-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </aside>
      </main>
    </CustomerChrome>
  )
}
