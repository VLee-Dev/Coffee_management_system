import { useCallback, useEffect, useState } from 'react'
import AdminUserMenu from '../components/AdminUserMenu'
import Pagination from '../components/Pagination'
import { getApiBase, getToken } from '../lib/auth'

const PAGE_SIZE = 10

const STATUS_CONFIG = {
  pending: {
    label: 'Chờ xử lý',
    className: 'bg-surface-variant text-on-surface-variant border-outline-variant/30',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-secondary-container/30 text-on-secondary-container border-secondary-container/40',
  },
  shipping: {
    label: 'Đang giao',
    className: 'bg-primary-container text-on-primary-container border-primary-container',
  },
  completed: {
    label: 'Đã hoàn thành',
    className: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-error-container text-on-error-container border-error-container',
  },
}

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`
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

function customerInitial(name) {
  const t = (name || '').trim()
  return t ? t[0].toUpperCase() : '?'
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full font-label-sm text-label-sm border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

export default function AdminOrders() {
  const apiBase = getApiBase()
  const token = getToken()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(null) // { orderId, orderCode }

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(PAGE_SIZE))
      if (search.trim()) params.set('search', search.trim())
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`${apiBase}/orders?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error('Không tải được danh sách đơn hàng')
      const data = await res.json()
      setOrders(data.items || [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(err.message)
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [apiBase, page, search, statusFilter, token])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  function handleStatusFilterChange(e) {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  async function patchStatus(orderId, status) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`${apiBase}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Cập nhật thất bại')
      }
      const updated = await res.json()
      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  function toggleRow(orderId) {
    setExpandedId((id) => (id === orderId ? null : orderId))
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-container-padding-desktop h-16 z-40 bg-surface shadow-sm flex-shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-full px-gutter py-unit w-full max-w-md focus-within:border-secondary transition-colors shadow-[0_2px_8px_rgba(75,54,33,0.04)]">
          <span className="material-symbols-outlined text-outline mr-unit text-[22px]">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 outline-none w-full font-body-md text-body-md text-on-surface placeholder:text-outline"
            placeholder="Tìm kiếm mã đơn, khách hàng..."
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <AdminUserMenu />
      </header>

      <div className="flex-1 overflow-y-auto p-container-padding-mobile md:p-container-padding-desktop flex flex-col gap-stack-lg min-h-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-stack-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-unit">Quản lý đơn hàng</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Theo dõi và xử lý các đơn hàng cà phê thơm ngon.
            </p>
          </div>
          <div className="flex gap-stack-sm self-start">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="appearance-none flex items-center gap-unit px-gutter py-unit border border-outline-variant bg-surface-container-lowest text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container-low shadow-[0_2px_8px_rgba(75,54,33,0.04)] transition-all cursor-pointer pr-8"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
                expand_more
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-unit px-gutter py-unit border border-outline-variant bg-surface-container-lowest text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container-low shadow-[0_2px_8px_rgba(75,54,33,0.04)] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Xuất file
            </button>
          </div>
        </div>

        {error && <p className="text-error font-label-md">{error}</p>}

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_24px_rgba(75,54,33,0.06)] overflow-hidden flex flex-col flex-1 min-h-[400px]">
          <div className="grid grid-cols-12 gap-gutter px-container-padding-mobile py-stack-md bg-surface-container-low border-b border-outline-variant/60 font-label-md text-label-md text-on-surface-variant">
            <div className="col-span-2">Mã đơn</div>
            <div className="col-span-3">Khách hàng</div>
            <div className="col-span-4">Sản phẩm chính</div>
            <div className="col-span-2 text-right">Tổng tiền</div>
            <div className="col-span-1 text-center">Trạng thái</div>
          </div>

          <div className="flex flex-col flex-1 divide-y divide-outline-variant/30">
            {loading && (
              <p className="p-container-padding-mobile text-on-surface-variant font-body-md">Đang tải...</p>
            )}
            {!loading && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <span
                  className="material-symbols-outlined text-[64px] text-outline-variant/60 mb-4"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  receipt_long
                </span>
                <p className="font-headline-md text-on-surface">Chưa có đơn hàng</p>
                <p className="font-body-md text-on-surface-variant mt-2 max-w-sm">
                  Đơn hàng từ khách sẽ hiển thị tại đây sau khi hệ thống đặt hàng được cấu hình.
                </p>
              </div>
            )}
            {!loading &&
              orders.map((order) => {
                const expanded = expandedId === order.id
                const transitions = VALID_TRANSITIONS[order.status] || []
                return (
                  <div key={order.id} className={expanded ? 'flex flex-col bg-surface-bright shadow-[inset_0_4px_12px_rgba(75,54,33,0.03)] border-l-4 border-l-primary' : ''}>
                    <button
                      type="button"
                      onClick={() => toggleRow(order.id)}
                      className={`grid grid-cols-12 gap-gutter px-container-padding-mobile py-stack-md items-center w-full text-left transition-colors ${
                        expanded ? '' : 'hover:bg-surface-container-low cursor-pointer group'
                      }`}
                    >
                      <div className={`col-span-2 font-label-md text-label-md text-primary ${!expanded ? 'group-hover:text-primary-container' : ''}`}>
                        #{order.order_code}
                      </div>
                      <div className="col-span-3 flex items-center gap-stack-sm min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-tertiary-container/30 flex items-center justify-center text-on-tertiary-container font-label-md text-label-md">
                          {customerInitial(order.receiver_name)}
                        </div>
                        <span className={`font-body-md text-body-md text-on-surface truncate ${expanded ? 'font-semibold' : ''}`}>
                          {order.receiver_name}
                        </span>
                      </div>
                      <div className="col-span-4 font-body-md text-body-md text-on-surface-variant truncate">
                        {order.items_summary}
                      </div>
                      <div className={`col-span-2 text-right font-label-md text-label-md text-on-surface ${expanded ? 'font-semibold' : ''}`}>
                        {formatVnd(order.total_amount)}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <StatusBadge status={order.status} />
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-container-padding-mobile pb-stack-md pt-unit">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg p-stack-md rounded-lg bg-surface-container-lowest border border-outline-variant/50 relative overflow-hidden">
                          <span
                            className="material-symbols-outlined absolute -bottom-4 -right-4 text-[80px] text-surface-container-high rotate-12 pointer-events-none"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            pets
                          </span>
                          <div className="flex flex-col gap-unit relative z-10">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                              Thông tin giao hàng
                            </span>
                            <div className="font-body-md text-body-md text-on-surface flex items-start gap-unit">
                              <span className="material-symbols-outlined text-[18px] text-outline mt-0.5">location_on</span>
                              <span>{order.receiver_address}</span>
                            </div>
                            <div className="font-body-md text-body-md text-on-surface flex items-center gap-unit">
                              <span className="material-symbols-outlined text-[18px] text-outline">call</span>
                              <span>{order.receiver_phone}</span>
                            </div>
                            <p className="font-label-sm text-on-surface-variant mt-2">
                              Freeship — demo không thu phí vận chuyển
                            </p>
                          </div>
                          <div className="flex flex-col gap-unit relative z-10">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                              Thời gian đặt
                            </span>
                            <div className="font-body-md text-body-md text-on-surface flex items-center gap-unit">
                              <span className="material-symbols-outlined text-[18px] text-outline">calendar_today</span>
                              <span>{formatDateTime(order.created_at)}</span>
                            </div>
                            {order.items?.length > 0 && (
                              <>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mt-unit">
                                  Sản phẩm
                                </span>
                                <ul className="font-body-md text-body-md text-on-surface space-y-1">
                                  {order.items.map((item) => (
                                    <li key={item.id} className="flex justify-between gap-2">
                                      <span>
                                        {item.product_name} x{item.quantity}
                                      </span>
                                      <span className="text-on-surface-variant shrink-0">
                                        {formatVnd(item.subtotal)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            <div className="flex flex-wrap justify-end items-center gap-stack-sm mt-stack-md pt-stack-sm border-t border-outline-variant/40">
                              {transitions.includes('cancelled') && (
                                <button
                                  type="button"
                                  disabled={updatingId === order.id}
                                  onClick={() => setShowCancelModal({ orderId: order.id, orderCode: order.order_code })}
                                  className="px-4 py-2 border border-outline text-tertiary rounded-full font-label-md text-label-md hover:bg-surface-container-low transition-colors disabled:opacity-60"
                                >
                                  Hủy đơn
                                </button>
                              )}
                              {transitions.filter(s => s !== 'cancelled').length > 0 ? (
                                <div className="flex items-center gap-stack-sm">
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) patchStatus(order.id, e.target.value)
                                    }}
                                    disabled={updatingId === order.id}
                                    className="appearance-none border border-outline bg-surface-container-low text-on-surface rounded-full px-4 py-2 font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer"
                                  >
                                    <option value="" disabled>Chọn trạng thái</option>
                                    {transitions.filter(s => s !== 'cancelled').map((s) => (
                                      <option key={s} value={s}>
                                        {STATUS_CONFIG[s]?.label || s}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : !transitions.includes('cancelled') ? (
                                <span className="text-on-surface-variant font-label-md text-label-md italic">Không có thao tác</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>

          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            label={
              total === 0
                ? 'Chưa có đơn hàng'
                : undefined
            }
          />
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-sm rounded-[24px] shadow-2xl p-8 border border-outline-variant/30 flex flex-col gap-6">
            <div className="w-16 h-16 bg-error-container/30 text-error rounded-full flex items-center justify-center self-center">
              <span className="material-symbols-outlined text-[32px]">cancel</span>
            </div>
            <div className="text-center">
              <h3 className="font-headline-md text-on-surface mb-2">Xác nhận hủy đơn?</h3>
              <p className="font-body-md text-on-surface-variant">
                Bạn có chắc muốn hủy đơn <span className="font-bold text-primary">#{showCancelModal.orderCode}</span>? Thao tác này sẽ hoàn kho cho sản phẩm.
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
                disabled={updatingId === showCancelModal.orderId}
                onClick={() => {
                  patchStatus(showCancelModal.orderId, 'cancelled')
                  setShowCancelModal(null)
                }}
                className="flex-1 py-3 rounded-full font-label-md text-on-error bg-error shadow-md hover:shadow-lg transition-all btn-squish disabled:opacity-60"
              >
                {updatingId === showCancelModal.orderId ? 'Đang hủy...' : 'Có, hủy ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
