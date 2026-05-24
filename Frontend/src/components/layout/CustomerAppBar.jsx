import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import {
  CUSTOMER_CART,
  CUSTOMER_HOME,
  CUSTOMER_ORDERS,
  CUSTOMER_PROFILE,
  CUSTOMER_SHOP_COFFEE,
  CUSTOMER_SHOP_EQUIPMENT,
} from '../../constants/routes'
import { clearToken } from '../../lib/auth'

/**
 * App bar khách hàng — cùng layout với màn hình Home.
 * @param {'coffee'|'equipment'|null} [activeShop] — danh mục shop đang mở (đổi màu link)
 * @param {boolean} [showLogout]
 */
export default function CustomerAppBar({ activeShop = null, showLogout = false }) {
  const navigate = useNavigate()
  const { itemCount } = useCart()

  function shopLinkClass(key) {
    const base = 'font-label-md hover:text-primary transition-colors'
    return activeShop === key ? `${base} text-primary font-semibold` : `${base} text-on-surface`
  }

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="sticky bg-background/80 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop h-16 top-0 z-50">
      <div className="flex items-center space-x-8 min-w-0">
        <Link
          to={CUSTOMER_HOME}
          className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary tracking-tight hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          Meo Coffee
        </Link>
        <div className="hidden md:flex space-x-6 shrink-0">
          <Link to={CUSTOMER_SHOP_COFFEE} className={shopLinkClass('coffee')}>
            Coffee
          </Link>
          <Link to={CUSTOMER_SHOP_EQUIPMENT} className={shopLinkClass('equipment')}>
            Dụng cụ
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3 text-primary shrink-0">
        <button
          type="button"
          title="Lịch sử đơn hàng"
          onClick={() => navigate(CUSTOMER_ORDERS)}
          className="hover:text-secondary transition-colors duration-200 active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined">receipt_long</span>
        </button>
        <button
          type="button"
          title="Giỏ hàng"
          onClick={() => navigate(CUSTOMER_CART)}
          className="relative hover:text-secondary transition-colors duration-200 active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
        <Link
          to={CUSTOMER_PROFILE}
          title="Tài khoản"
          className="hover:text-secondary transition-colors duration-200 active:scale-95 transition-transform p-2 rounded-full hover:bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined">person</span>
        </Link>
        {showLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary px-2 whitespace-nowrap"
          >
            Đăng xuất
          </button>
        )}
      </div>
    </nav>
  )
}
