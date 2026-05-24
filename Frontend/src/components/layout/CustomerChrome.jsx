import { Link, useNavigate } from 'react-router-dom'
import CustomerAppBar from './CustomerAppBar'
import { useCart } from '../../context/CartContext'
import {
  CUSTOMER_CART,
  CUSTOMER_HOME,
  CUSTOMER_PROFILE,
  CUSTOMER_ORDERS,
  customerDevelopingPath,
} from '../../constants/routes'

export default function CustomerChrome({ activeNav = 'home', showBack = false, backTo, children }) {
  const navigate = useNavigate()
  const wip = customerDevelopingPath
  const { itemCount } = useCart()
  const useHomeAppBar = activeNav === 'coffee' || activeNav === 'equipment'

  const personClass =
    activeNav === 'profile'
      ? 'p-2 text-primary font-bold border-b-2 border-primary pb-1 flex flex-col items-center'
      : 'p-2 text-on-surface-variant hover:text-primary transition-colors duration-200 hover:scale-95 transition-transform flex flex-col items-center'

  const cartClass =
    activeNav === 'cart'
      ? 'p-2 text-primary font-bold border-b-2 border-primary pb-1 flex flex-col items-center'
      : 'p-2 text-on-surface-variant hover:text-primary transition-colors duration-200 hover:scale-95 transition-transform'

  function goBack() {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <div
      className={`font-body-md min-h-screen flex flex-col antialiased ${
        useHomeAppBar ? 'bg-surface text-on-surface' : 'bg-background text-on-background'
      }`}
    >
      {useHomeAppBar ? (
        <CustomerAppBar activeShop={activeNav} />
      ) : (
        <header className="bg-background/80 backdrop-blur-md shadow-sm w-full sticky top-0 z-50">
          <div className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop h-16 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 min-w-0">
              {showBack && (
                <button
                  type="button"
                  onClick={goBack}
                  className="text-primary hover:text-secondary transition-colors duration-200 shrink-0"
                  aria-label="Quay lại"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              )}
              <Link
                to={CUSTOMER_HOME}
                className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary tracking-tight hover:opacity-80 transition-opacity truncate"
              >
                Meo Coffee
              </Link>
            </div>
            <div className="flex items-center gap-gutter text-primary shrink-0">
              <Link
                to={CUSTOMER_ORDERS}
                className={`p-2 ${
                  activeNav === 'orders'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                } transition-colors duration-200 hover:scale-95 transition-transform`}
                title="Lịch sử đơn hàng"
              >
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </Link>
              {activeNav === 'cart' ? (
                <span className={`${cartClass} relative`} title="Giỏ hàng">
                  <span className="material-symbols-outlined text-[24px] fill-icon">shopping_cart</span>
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </span>
              ) : (
                <Link to={CUSTOMER_CART} className={`${cartClass} relative`} title="Giỏ hàng">
                  <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
              )}
              {activeNav === 'profile' ? (
                <span className={personClass} title="Hồ sơ">
                  <span className="material-symbols-outlined text-[24px] fill-icon">person</span>
                </span>
              ) : (
                <Link to={CUSTOMER_PROFILE} className={personClass} title="Hồ sơ">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {children}

      <footer className="bg-surface-container-low border-t border-outline-variant w-full mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full py-stack-lg px-container-padding-mobile md:px-container-padding-desktop space-y-4 md:space-y-0 max-w-7xl mx-auto">
          <Link
            to={CUSTOMER_HOME}
            className="font-headline-md text-headline-md text-primary tracking-tight hover:opacity-80"
          >
            Meo Coffee
          </Link>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to={`${CUSTOMER_HOME}/developing?m=beans`} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">
              Our Beans
            </Link>
            <Link to={wip('cafe')} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">
              Cat Cafe
            </Link>
            <Link to={wip('shipping')} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">
              Shipping
            </Link>
            <Link to={wip('privacy')} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">
              Privacy
            </Link>
          </nav>
          <p className="font-label-md text-label-md text-on-surface-variant text-center md:text-right opacity-80">
            © 2005 MeoCoffee. VinhLee
          </p>
        </div>
      </footer>
    </div>
  )
}
