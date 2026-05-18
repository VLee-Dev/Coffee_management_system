import { Link, useSearchParams } from 'react-router-dom'
import { CUSTOMER_HOME } from '../constants/routes'

const LABELS = {
  coffee: 'Cà phê',
  equipment: 'Dụng cụ',
  cart: 'Giỏ hàng',
  account: 'Tài khoản',
  avatar: 'Ảnh đại diện',
  payment: 'Thanh toán',
  notifications: 'Thông báo',
  beans: 'Hạt cà phê',
  cafe: 'Cat Cafe',
  shipping: 'Vận chuyển',
  privacy: 'Quyền riêng tư',
  product: 'Sản phẩm',
}

export default function Developing() {
  const [params] = useSearchParams()
  const key = params.get('m') || ''
  const title = LABELS[key] || 'Trang này'

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col">
      <header className="border-b border-outline-variant/40 px-container-padding-mobile md:px-container-padding-desktop py-4 flex items-center justify-between gap-4">
        <Link
          to={CUSTOMER_HOME}
          className="font-headline-md text-headline-md text-primary font-bold hover:opacity-80 transition-opacity"
        >
          Meo Coffee
        </Link>
        <Link
          to={CUSTOMER_HOME}
          className="font-label-md text-label-md text-secondary hover:text-primary transition-colors"
        >
          ← Về trang chủ
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-container-padding-mobile py-stack-lg text-center max-w-md mx-auto gap-stack-md">
        <span className="material-symbols-outlined text-5xl text-primary" aria-hidden>
          construction
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tính năng đang được phát triển. Nội dung sẽ được bổ sung sau.
        </p>
      </main>
    </div>
  )
}
