import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import searchIcon from '../assets/search_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import menuIcon from '../assets/menu_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import logoutIcon from '../assets/logout_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import localCafeIcon from '../assets/local_cafe.svg'
import blenderIcon from '../assets/blender_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import { clearToken, getApiBase, getToken } from '../lib/auth'

const LOW_STOCK_THRESHOLD = 10

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stockUnit(productType) {
  return productType === 'equipment' ? 'chiếc' : 'gói'
}

function stockStatus(stock) {
  const qty = Number(stock || 0)
  if (qty <= 0) return { label: 'Hết hàng', tone: 'error', low: true }
  if (qty <= LOW_STOCK_THRESHOLD) return { label: 'Sắp hết hàng! Cần nhập thêm.', tone: 'error', low: true }
  return { label: 'Đang ổn định', tone: 'ok', low: false }
}

export default function AdminInventory() {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const token = getToken()
  const today = todayInputValue()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState('coffee')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [importLogs, setImportLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [importForm, setImportForm] = useState({
    product_id: '',
    quantity: '',
    note: '',
    imported_at: today,
  })
  const [submitting, setSubmitting] = useState(false)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('sort', 'stock_asc')
    params.set('limit', '100')
    if (productType) params.set('product_type', productType)
    if (search.trim()) params.set('search', search.trim())
    return params.toString()
  }, [search, productType])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiBase}/products?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error('Không tải được dữ liệu kho')
      const data = await res.json()
      const sorted = [...data].sort(
        (a, b) => Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0),
      )
      setProducts(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiBase, queryString, token])

  const loadImportHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('change_type', 'import')
      params.set('product_type', productType)
      params.set('limit', '100')
      const res = await fetch(`${apiBase}/inventory/logs?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error('Không tải được lịch sử nhập hàng')
      setImportLogs(await res.json())
    } catch (err) {
      alert(err.message)
      setImportLogs([])
    } finally {
      setHistoryLoading(false)
    }
  }, [apiBase, productType, token])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    if (showHistoryModal) loadImportHistory()
  }, [showHistoryModal, loadImportHistory])

  function openImportModal(product = null) {
    setImportForm({
      product_id: product ? String(product.id) : '',
      quantity: '',
      note: '',
      imported_at: today,
    })
    setShowImportModal(true)
  }

  function validateImportDate(dateStr) {
    if (!dateStr) return 'Vui lòng chọn ngày nhập'
    if (dateStr > today) return 'Ngày nhập không được vượt quá ngày hiện tại'
    return null
  }

  async function handleImportSubmit() {
    const productId = Number(importForm.product_id)
    const quantity = Number(importForm.quantity)
    const dateError = validateImportDate(importForm.imported_at)

    if (!productId || !quantity || quantity <= 0) {
      alert('Chọn sản phẩm và nhập số lượng hợp lệ')
      return
    }
    if (dateError) {
      alert(dateError)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          change_type: 'import',
          quantity,
          note: importForm.note || null,
          imported_at: importForm.imported_at,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Nhập kho thất bại')
      }
      setShowImportModal(false)
      await loadProducts()
      if (showHistoryModal) await loadImportHistory()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-container-padding-desktop h-16 z-40 bg-surface shadow-sm flex-shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center gap-stack-md">
          <div className="relative flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant/40 focus-within:border-secondary-container transition-colors">
            <img src={searchIcon} alt="" className="h-5 w-5 mr-2 opacity-70" />
            <input
              className="bg-transparent border-none outline-none w-64 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70"
              placeholder="Tìm kiếm kho..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-stack-md relative">
          <div className="font-headline-md text-headline-md font-bold text-primary hidden sm:block">Meo Coffee</div>
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
          >
            <img src={menuIcon} alt="menu" className="h-5 w-5 opacity-80" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-bright border border-outline-variant rounded-xl shadow-lg z-50 py-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors"
              >
                <img src={logoutIcon} alt="" className="h-5 w-5" />
                <span className="font-label-md">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-container-padding-mobile md:p-container-padding-desktop bg-background">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-stack-md mb-stack-lg">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">Quản lý kho</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
              Tổng quan số lượng sản phẩm
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-stack-lg py-2.5 bg-primary text-on-primary rounded-full font-label-md font-bold shadow-sm hover:scale-95 transition-transform self-start"
          >
            Lịch sử nhập hàng
          </button>
        </div>

        <div className="flex gap-stack-sm mb-stack-lg flex-wrap">
          <button
            type="button"
            onClick={() => setProductType('coffee')}
            className={`px-stack-md py-2 rounded-full font-label-md border transition-all ${
              productType === 'coffee'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
            }`}
          >
            Coffee
          </button>
          <button
            type="button"
            onClick={() => setProductType('equipment')}
            className={`px-stack-md py-2 rounded-full font-label-md border transition-all ${
              productType === 'equipment'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
            }`}
          >
            Dụng cụ pha coffee
          </button>
        </div>

        {error && <p className="text-error font-label-md mb-stack-md">{error}</p>}
        {loading && <p className="text-on-surface-variant font-body-md">Đang tải...</p>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-stack-md">
            {products.map((p) => {
              const status = stockStatus(p.stock_quantity)
              const unit = stockUnit(p.product_type)
              const icon = p.product_type === 'equipment' ? blenderIcon : localCafeIcon

              return (
                <article
                  key={p.id}
                  className={`rounded-xl p-stack-md flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md relative overflow-hidden ${
                    status.low
                      ? 'bg-error-container/20 border-2 border-error/50'
                      : 'bg-surface-container-lowest border border-outline-variant'
                  }`}
                >
                  {status.low && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-error/10 rounded-bl-full flex justify-end items-start p-2 pointer-events-none">
                      <span className="text-error font-bold text-lg">!</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-stack-sm relative z-10 gap-2">
                    <div className="flex items-center gap-stack-sm min-w-0">
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg bg-surface-container flex items-center justify-center ${
                          status.low ? 'text-error' : 'text-primary'
                        }`}
                      >
                        <img src={icon} alt="" className="h-5 w-5" />
                      </div>
                      <h3 className="font-body-lg text-body-lg font-semibold text-on-surface truncate">{p.name}</h3>
                    </div>
                    {p.flavor && (
                      <span className="shrink-0 px-2 py-1 bg-surface-container text-on-surface-variant rounded-full font-label-sm text-label-sm">
                        {p.flavor}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto relative z-10">
                    <p
                      className={`font-display-lg text-display-lg font-bold ${
                        status.low ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {p.stock_quantity ?? 0}{' '}
                      <span className="font-body-md text-on-surface-variant font-medium">{unit}</span>
                    </p>
                    <div
                      className={`flex items-center gap-1 mt-1 font-label-sm text-label-sm ${
                        status.tone === 'error' ? 'text-error' : 'text-outline'
                      }`}
                    >
                      <span>{status.tone === 'ok' ? '✓' : '↓'}</span>
                      <span className={status.low ? 'font-bold' : ''}>{status.label}</span>
                    </div>
                    {status.low && (
                      <button
                        type="button"
                        onClick={() => openImportModal(p)}
                        className="mt-3 text-sm font-label-md text-primary hover:underline"
                      >
                        + Nhập thêm ngay
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
            {!products.length && (
              <p className="col-span-full text-on-surface-variant font-body-md">Không có sản phẩm trong kho này.</p>
            )}
          </div>
        )}
      </main>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-md rounded-[24px] shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-on-surface">Nhập kho</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Sản phẩm</label>
                <select
                  value={importForm.product_id}
                  onChange={(e) => setImportForm((f) => ({ ...f, product_id: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                >
                  <option value="">— Chọn sản phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (hiện: {p.stock_quantity} {stockUnit(p.product_type)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Ngày nhập</label>
                <input
                  type="date"
                  max={today}
                  value={importForm.imported_at}
                  onChange={(e) => setImportForm((f) => ({ ...f, imported_at: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Số lượng nhập</label>
                <input
                  type="number"
                  min={1}
                  value={importForm.quantity}
                  onChange={(e) => setImportForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                  placeholder="VD: 50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Ghi chú (tuỳ chọn)</label>
                <input
                  type="text"
                  value={importForm.note}
                  onChange={(e) => setImportForm((f) => ({ ...f, note: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                  placeholder="Lô hàng, nhà cung cấp..."
                />
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-6 py-2.5 rounded-full font-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleImportSubmit}
                className="px-8 py-2.5 bg-primary text-on-primary rounded-full font-label-md shadow-md disabled:opacity-60"
              >
                {submitting ? 'Đang lưu...' : 'Xác nhận nhập'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-2xl max-h-[85vh] rounded-[24px] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center gap-4">
              <h2 className="font-headline-md text-headline-md text-on-surface">Lịch sử nhập hàng</h2>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-2xl leading-none px-2"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {historyLoading && <p className="text-on-surface-variant font-body-md">Đang tải...</p>}
              {!historyLoading && importLogs.length === 0 && (
                <p className="text-on-surface-variant font-body-md text-center py-8">Chưa có lịch sử nhập hàng.</p>
              )}
              {!historyLoading && importLogs.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {importLogs.map((log) => (
                    <li
                      key={log.id}
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">{log.product_name}</p>
                        <p className="font-label-sm text-on-surface-variant mt-1">
                          Ngày nhập: {formatDateTime(log.imported_at)}
                          {log.creator_name ? ` · ${log.creator_name}` : ''}
                        </p>
                        {log.note && (
                          <p className="font-label-sm text-on-surface-variant mt-1 italic">{log.note}</p>
                        )}
                      </div>
                      <span className="font-headline-md text-primary shrink-0">
                        +{log.quantity} {stockUnit(log.product_type)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-8 py-2.5 rounded-full font-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
