import { Link, useNavigate } from 'react-router-dom'
import { CUSTOMER_HOME, CUSTOMER_PROFILE, customerDevelopingPath } from '../constants/routes'

export default function CustomerChrome({ activeNav = 'home', children }) {
  const navigate = useNavigate()
  const wip = customerDevelopingPath

  const personClass =
    activeNav === 'profile'
      ? 'p-2 text-primary font-bold border-b-2 border-primary pb-1 flex flex-col items-center'
      : 'p-2 text-on-surface-variant hover:text-primary transition-colors duration-200 hover:scale-95 transition-transform flex flex-col items-center'

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <header className="bg-background/80 backdrop-blur-md shadow-sm w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop h-16 max-w-7xl mx-auto">
          <Link
            to={CUSTOMER_HOME}
            className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary tracking-tight hover:opacity-80 transition-opacity"
          >
            Meo Coffee
          </Link>
          <div className="flex items-center gap-gutter text-primary">
            <button
              type="button"
              title="Giỏ hàng"
              onClick={() => navigate(wip('cart'))}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors duration-200 hover:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            </button>
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
            <Link to={wip('beans')} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">
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
