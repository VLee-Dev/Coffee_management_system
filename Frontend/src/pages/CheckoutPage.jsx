import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import qrImage from '../assets/qr.jpg'
import CustomerChrome from '../components/CustomerChrome'
import { useCart } from '../context/CartContext'
import { CUSTOMER_CART, CUSTOMER_HOME } from '../constants/routes'
import { fetchCurrentUser, getApiBase, getToken } from '../lib/auth'
import { BANK_INFO, createCheckout, SHIPPING_FEE } from '../lib/orders'
import { formatVnd, productImageUrl } from '../lib/products'

const DISTRICTS = [
  { value: 'Ba Đình', label: 'Ba Đình' },
  { value: 'Hoàn Kiếm', label: 'Hoàn Kiếm' },
  { value: 'Hai Bà Trưng', label: 'Hai Bà Trưng' },
  { value: 'Đống Đa', label: 'Đống Đa' },
  { value: 'Tây Hồ', label: 'Tây Hồ' },
  { value: 'Cầu Giấy', label: 'Cầu Giấy' },
  { value: 'Thanh Xuân', label: 'Thanh Xuân' },
  { value: 'Hoàng Mai', label: 'Hoàng Mai' },
  { value: 'Long Biên', label: 'Long Biên' },
  { value: 'Nam Từ Liêm', label: 'Nam Từ Liêm' },
  { value: 'Bắc Từ Liêm', label: 'Bắc Từ Liêm' },
]

function OrderLineSummary({ item, apiBase }) {
  const img = item.product ? productImageUrl(item.product, apiBase) : null
  const lineTotal = item.price * item.quantity

  return (
    <div className="flex justify-between items-center gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center text-primary">
          {img ? (
            <img alt="" className="w-full h-full object-cover" src={img} />
          ) : (
            <span className="material-symbols-outlined">
              {item.product?.product_type === 'equipment' ? 'blender' : 'coffee'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-label-md text-label-md text-on-surface font-bold line-clamp-1">{item.name}</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">x{item.quantity}</p>
        </div>
      </div>
      <p className="font-body-md text-body-md font-bold text-on-surface shrink-0">{formatVnd(lineTotal)}</p>
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const { items, removeSelectedItems } = useCart()

  const selectedItems = useMemo(() => items.filter((i) => i.selected), [items])
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = subtotal + SHIPPING_FEE

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('qr')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (selectedItems.length === 0 && !success) {
      navigate(CUSTOMER_CART, { replace: true })
    }
  }, [selectedItems.length, success, navigate])

  useEffect(() => {
    let alive = true
    async function guardAndProfile() {
      const user = await fetchCurrentUser()
      if (!alive) return
      if (!user) {
        navigate('/login', {
          replace: true,
          state: { authMessage: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' },
        })
        return
      }
      if (user.phone) setPhone(user.phone)
      if (user.address) setAddress(user.address)
    }
    guardAndProfile()
    return () => {
      alive = false
    }
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!phone.trim() || !address.trim() || !district) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng')
      return
    }

    setSubmitting(true)
    try {
      const result = await createCheckout(apiBase, {
        receiver_phone: phone.trim(),
        receiver_address: address.trim(),
        district,
        payment_method: paymentMethod,
        shipping_fee: SHIPPING_FEE,
        items: selectedItems.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      })
      removeSelectedItems()
      setSuccess(result)
    } catch (err) {
      if (err.code === 'AUTH') {
        navigate('/login', { replace: true, state: { authMessage: err.message } })
        return
      }
      setError(err.message || 'Không tạo được đơn hàng')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <CustomerChrome activeNav="cart" showBack backTo={CUSTOMER_HOME}>
        <main className="flex-grow max-w-lg mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg text-center flex flex-col items-center gap-stack-md">
          <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
          <h1 className="font-headline-lg text-headline-lg text-primary">Đặt hàng thành công!</h1>
          <p className="font-body-md text-on-surface-variant">
            Mã đơn: <span className="font-bold text-on-surface">{success.order_code}</span>
          </p>
          <p className="font-body-md text-on-surface-variant">
            Tổng thanh toán: <span className="font-bold text-primary">{formatVnd(success.total_amount)}</span>
          </p>
          <p className="font-body-md text-on-surface-variant text-sm">
            Đơn hàng đã được gửi tới quản trị viên. Bạn có thể theo dõi trạng thái qua Meo Coffee.
          </p>
          <Link
            to={CUSTOMER_HOME}
            className="mt-4 bg-primary text-on-primary font-label-md px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Về trang chủ
          </Link>
        </main>
      </CustomerChrome>
    )
  }

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <CustomerChrome activeNav="cart" showBack backTo={CUSTOMER_CART}>
      <main className="flex-grow w-full max-w-7xl mx-auto pt-stack-lg pb-stack-lg px-container-padding-mobile md:px-container-padding-desktop">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-stack-lg">
          Xác nhận thanh toán
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg items-start">
          <div className="lg:col-span-7 flex flex-col gap-stack-lg">
            <section className="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-stack-lg shadow-diffusion">
              <h2 className="font-headline-md text-headline-md text-primary-container font-bold mb-stack-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                Thông tin giao hàng
              </h2>
              <div className="flex flex-col gap-stack-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="phone">
                    Số điện thoại (SĐT)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="w-full bg-background border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:border-secondary-container focus:ring-0 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="address">
                    Địa chỉ nhận hàng
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã"
                    className="w-full bg-background border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:border-secondary-container focus:ring-0 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="district">
                    Quận
                  </label>
                  <div className="relative">
                    <select
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full appearance-none bg-background border-2 border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface focus:border-secondary-container focus:ring-0 outline-none"
                    >
                      <option value="">Chọn Quận</option>
                      {DISTRICTS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-stack-lg shadow-diffusion">
              <h2 className="font-headline-md text-headline-md text-primary-container font-bold mb-stack-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Phương thức thanh toán
              </h2>
              <div className="flex flex-col gap-stack-md">
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                    paymentMethod === 'qr'
                      ? 'border-primary bg-primary/5 hover:bg-primary/10'
                      : 'border-outline-variant bg-background hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="qr"
                    checked={paymentMethod === 'qr'}
                    onChange={() => setPaymentMethod('qr')}
                    className="mt-1 w-5 h-5 text-primary border-outline-variant"
                  />
                  <div className="flex-1">
                    <span className="font-label-md text-label-md font-bold text-on-surface block mb-1">
                      Chuyển khoản ngân hàng
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant text-sm">
                      Thanh toán an toàn qua mã QR.
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                </label>

                {paymentMethod === 'qr' && (
                  <div className="bg-surface-container rounded-xl p-stack-md flex flex-col items-center gap-stack-md mx-0 sm:mx-4 border border-outline-variant border-dashed">
                    <img
                      alt="Mã QR thanh toán Meo Coffee"
                      className="w-48 h-48 object-contain rounded-lg shadow-sm bg-white"
                      src={qrImage}
                    />
                    <div className="text-center">
                      <p className="font-body-md text-body-md font-bold text-on-surface mb-1">
                        Ngân hàng: {BANK_INFO.bankName}
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        STK: <span className="font-bold text-primary">{BANK_INFO.accountNumber}</span>
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Chủ TK: {BANK_INFO.accountHolder}
                      </p>
                    </div>
                  </div>
                )}

                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant bg-background hover:border-primary/50 opacity-90'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 w-5 h-5 text-primary border-outline-variant"
                  />
                  <div className="flex-1">
                    <span className="font-label-md text-label-md font-bold text-on-surface block mb-1">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant text-sm">
                      Thanh toán bằng tiền mặt khi shipper giao tới.
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">local_atm</span>
                </label>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <section className="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-stack-lg shadow-diffusion flex flex-col">
              <h2 className="font-headline-md text-headline-md text-primary-container font-bold mb-stack-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Tóm tắt đơn hàng
              </h2>

              <div className="flex flex-col gap-4 mb-stack-lg border-b border-surface-variant pb-stack-md">
                {selectedItems.map((item) => (
                  <OrderLineSummary key={item.localId} item={item} apiBase={apiBase} />
                ))}
              </div>

              <div className="flex flex-col gap-3 mb-stack-lg">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="font-body-md text-body-md">Tạm tính</span>
                  <span className="font-body-md text-body-md font-bold">{formatVnd(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="font-body-md text-body-md">Phí giao hàng</span>
                  <span className="font-body-md text-body-md font-bold">{formatVnd(SHIPPING_FEE)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-surface-variant">
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">Tổng cộng</span>
                  <span className="font-headline-md text-headline-md font-bold text-primary">{formatVnd(total)}</span>
                </div>
              </div>

              {error && <p className="text-error font-body-md mb-3">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold py-4 rounded-full shadow-md transition-all hover:scale-[0.98] active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý…' : 'Xác nhận & Thanh toán'}
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </button>
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-4">
                Bằng việc xác nhận, bạn đồng ý với Điều khoản của Meo Coffee.
              </p>
            </section>
          </div>
        </form>
      </main>
    </CustomerChrome>
  )
}
