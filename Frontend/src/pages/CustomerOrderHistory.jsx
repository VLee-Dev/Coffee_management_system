import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CustomerChrome from '../components/CustomerChrome'
import { CUSTOMER_CART, CUSTOMER_HOME } from '../constants/routes'
import { getApiBase } from '../lib/auth'
import { fetchMyOrders } from '../lib/orders'
import { formatVnd } from '../lib/products'

const STATUS_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    className: 'bg-surface-variant text-on-surface-variant',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-secondary-container/30 text-on-secondary-container',
  },
  shipping: {
    label: 'Đang giao',
    className: 'bg-primary-container/30 text-on-primary-container',
  },
  completed: {
    label: 'Đã hoàn thành',
    className: 'bg-surface-container-high text-on-surface',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-error-container/30 text-on-error-container',
  },
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

function PaymentBadge({ method }) {
  return (
    <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
      {method === 'qr' ? (
        <>
          <span className="material-symbols-outlined text-[14px]">qr_code</span>
          QR Code
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-[14px]">payments</span>
          COD
        </>
      )}
    </span>
  )
}

export default function CustomerOrderHistory() {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(null) // order object

  async function cancelOrder(orderId) {
    setCancellingId(orderId)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${apiBase}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Hủy đơn thất bại')
      }
      const updated = await res.json()
      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
      setShowCancelModal(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setCancellingId(null)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchMyOrders(apiBase)
        setOrders(data.items || [])
        setTotal(data.total ?? 0)
      } catch (err) {
        setError(err.message || 'Không tải được lịch sử đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiBase])

  function toggleRow(orderId) {
    setExpandedId((id) => (id === orderId ? null : orderId))
  }

  return (
    <CustomerChrome activeNav="orders" showBack backTo={CUSTOMER_HOME}>
      <main className="flex-grow w-full max-w-3xl mx-auto pt-stack-lg pb-stack-lg px-container-padding-mobile md:px-container-padding-desktop">
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-stack-lg">
          Lịch sử đơn hàng
        </h1>

        {error && (
          <div className="bg-error-container/20 border border-error-container/30 rounded-2xl p-stack-md mb-stack-lg">
            <p className="font-body-md text-on-error-container">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline animate-pulse">
              hourglass_empty
            </span>
            <p className="font-body-md text-on-surface-variant mt-4">Đang tải...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span
              className="material-symbols-outlined text-6xl text-outline-variant/60 mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              receipt_long
            </span>
            <h2 className="font-headline-md text-on-surface mb-2">Chưa có đơn hàng nào</h2>
            <p className="font-body-md text-on-surface-variant mb-6 max-w-sm">
              Hãy khám phá và đặt những ly cà phê thơm ngon từ Meo Coffee nhé!
            </p>
            <Link
              to={CUSTOMER_HOME}
              className="bg-primary text-on-primary font-label-md px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Khám phá cà phê
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const expanded = expandedId === order.id
              return (
                <div
                  key={order.id}
                  className={`bg-surface-container-lowest rounded-2xl border transition-all ${
                    expanded
                      ? 'border-primary/30 shadow-[0_4px_16px_rgba(147,75,0,0.08)]'
                      : 'border-outline-variant/50 hover:border-primary/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleRow(order.id)}
                    className="w-full p-4 text-left hover:bg-surface-container-low transition-colors rounded-2xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-label-md text-label-md text-primary font-bold">
                            #{order.order_code}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="font-body-sm text-on-surface-variant">
                          {formatDateTime(order.created_at)}
                        </p>
                        <p className="font-body-sm text-on-surface-variant mt-0.5 truncate">
                          {order.items_summary}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-label-lg text-label-lg text-primary font-bold">
                          {formatVnd(order.total_amount)}
                        </p>
                        <p className="flex items-center justify-end gap-1 mt-1">
                          <PaymentBadge method={order.payment_method} />
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <span className="material-symbols-outlined text-[18px] text-outline">
                        {expanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-outline-variant/30">
                      <div className="flex items-start gap-2 mt-3 mb-3">
                        <span className="material-symbols-outlined text-[18px] text-outline mt-0.5">
                          location_on
                        </span>
                        <div>
                          <p className="font-label-sm text-on-surface-variant">Địa chỉ giao hàng</p>
                          <p className="font-body-sm text-on-surface">{order.receiver_address}</p>
                          <p className="font-body-sm text-on-surface mt-0.5">
                            {order.receiver_name} · {order.receiver_phone}
                          </p>
                        </div>
                      </div>

                      <div className="bg-surface-container-low rounded-xl p-3">
                        <p className="font-label-sm text-on-surface-variant mb-2">Sản phẩm đã đặt</p>
                        <ul className="flex flex-col gap-2">
                          {order.items?.map((item) => (
                            <li key={item.id} className="flex justify-between items-center">
                              <span className="font-body-sm text-on-surface">
                                {item.product_name} x{item.quantity}
                              </span>
                              <span className="font-body-sm text-on-surface-variant">
                                {formatVnd(item.subtotal)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-outline-variant/30">
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            Tổng cộng
                          </span>
                          <span className="font-label-md text-label-md text-primary font-bold">
                            {formatVnd(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => setShowCancelModal(order)}
                          className="mt-3 w-full py-2.5 border border-error/40 text-error rounded-full font-label-md text-label-md hover:bg-error-container/20 transition-colors disabled:opacity-60"
                        >
                          {cancellingId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <p className="text-center font-body-sm text-on-surface-variant mt-3 flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          Đơn hàng đang chờ xác nhận. Vui lòng chờ trong giây lát.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-sm rounded-[24px] shadow-2xl p-8 border border-outline-variant/30 flex flex-col gap-6">
            <div className="w-16 h-16 bg-error-container/30 text-error rounded-full flex items-center justify-center self-center">
              <span className="material-symbols-outlined text-[32px]">cancel</span>
            </div>
            <div className="text-center">
              <h3 className="font-headline-md text-on-surface mb-2">Hủy đơn hàng?</h3>
              <p className="font-body-md text-on-surface-variant">
                Bạn có chắc muốn hủy đơn <span className="font-bold text-primary">#{showCancelModal.order_code}</span>? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 py-3 rounded-full font-label-md text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors"
              >
                Không, giữ đơn
              </button>
              <button
                disabled={cancellingId === showCancelModal.id}
                onClick={() => cancelOrder(showCancelModal.id)}
                className="flex-1 py-3 rounded-full font-label-md text-on-error bg-error shadow-md hover:shadow-lg transition-all btn-squish disabled:opacity-60"
              >
                {cancellingId === showCancelModal.id ? 'Đang hủy...' : 'Có, hủy ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerChrome>
  )
}
