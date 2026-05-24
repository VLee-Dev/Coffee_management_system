import { useCallback, useEffect, useMemo, useState } from 'react'
import searchIcon from '../assets/search_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import AdminUserMenu from '../components/AdminUserMenu'
import Pagination from '../components/Pagination'
import { paginateSlice } from '../lib/pagination'

const INVENTORY_PAGE_SIZE = 9
import editIcon from '../assets/edit_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import deleteIcon from '../assets/delete_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import localCafeIcon from '../assets/local_cafe.svg'
import blenderIcon from '../assets/blender_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import heroFallback from '../assets/meocam.jfif'
import { getApiBase, getToken } from '../lib/auth'

const LOW_STOCK_THRESHOLD = 10
const ICON = 'h-5 w-5 icon-dark'

function nowDatetimeLocalValue() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToIso(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function isoToDatetimeLocal(iso) {
  if (!iso) return nowDatetimeLocalValue()
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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

function resolveImageUrl(url) {
  if (!url) return heroFallback
  return url.startsWith('http') ? url : `${getApiBase()}${url}`
}

function stockStatus(stock) {
  const qty = Number(stock || 0)
  if (qty <= 0) return { label: 'Hết hàng', tone: 'error', low: true }
  if (qty < LOW_STOCK_THRESHOLD) return { label: 'Sắp hết hàng! Cần nhập thêm.', tone: 'error', low: true }
  return { label: 'Đang ổn định', tone: 'ok', low: false }
}

function defaultImportForm() {
  return {
    product_id: '',
    quantity: '',
    note: '',
    imported_at: nowDatetimeLocalValue(),
  }
}

export default function AdminInventory() {
  const apiBase = getApiBase()
  const token = getToken()
  const maxDatetimeLocal = nowDatetimeLocalValue()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState('coffee')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [importLogs, setImportLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [importForm, setImportForm] = useState(defaultImportForm)
  const [submitting, setSubmitting] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [editLogForm, setEditLogForm] = useState({ quantity: '', note: '', imported_at: '' })
  const [deletingLog, setDeletingLog] = useState(null)
  const [page, setPage] = useState(1)
  const [detailProduct, setDetailProduct] = useState(null) // product for detail/edit modal
  const [detailForm, setDetailForm] = useState({
    name: '', price: '', stock_quantity: 0, description: '',
  })
  const [detailImagePreview, setDetailImagePreview] = useState(null)
  const [detailSaving, setDetailSaving] = useState(false)
  const [detailUploading, setDetailUploading] = useState(false)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('sort', 'stock_asc')
    params.set('limit', '100')
    if (productType) params.set('product_type', productType)
    if (search.trim()) params.set('search', search.trim())
    return params.toString()
  }, [search, productType])

  const inventoryTotalPages = Math.max(1, Math.ceil(products.length / INVENTORY_PAGE_SIZE) || 1)
  const paginatedProducts = paginateSlice(products, page, INVENTORY_PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [productType, search])

  useEffect(() => {
    if (page > inventoryTotalPages) setPage(inventoryTotalPages)
  }, [page, inventoryTotalPages])

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
      ...defaultImportForm(),
      product_id: product ? String(product.id) : '',
    })
    setShowImportModal(true)
  }

  function openDetailModal(product) {
    setDetailProduct(product)
    setDetailForm({
      name: product.name || '',
      price: product.price || '',
      stock_quantity: product.stock_quantity ?? 0,
      description: product.description || '',
    })
    setDetailImagePreview(product.image_url ? resolveImageUrl(product.image_url) : null)
  }

  async function uploadDetailImage(file) {
    if (!file) return null
    setDetailUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return data.url
    } catch (err) {
      alert('Lỗi upload ảnh: ' + err.message)
      return null
    } finally {
      setDetailUploading(false)
    }
  }

  async function handleDetailSave() {
    if (!detailProduct) return
    setDetailSaving(true)
    try {
      const body = {}
      if (detailForm.name) body.name = detailForm.name
      if (detailForm.price !== '') body.price = Number(detailForm.price)
      if (detailForm.stock_quantity != null) body.stock_quantity = Math.max(0, Number(detailForm.stock_quantity) || 0)
      if (detailForm.description != null) body.description = detailForm.description

      const res = await fetch(`${apiBase}/products/${detailProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Cập nhật thất bại')
      }
      setDetailProduct(null)
      await loadProducts()
    } catch (err) {
      alert(err.message)
    } finally {
      setDetailSaving(false)
    }
  }

  function validateImportDatetime(value) {
    if (!value) return 'Vui lòng chọn ngày giờ nhập'
    if (value > maxDatetimeLocal) return 'Thời điểm nhập không được vượt quá hiện tại'
    return null
  }

  async function handleImportSubmit() {
    const productId = Number(importForm.product_id)
    const quantity = Number(importForm.quantity)
    const dateError = validateImportDatetime(importForm.imported_at)

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
          imported_at: datetimeLocalToIso(importForm.imported_at),
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

  function openEditLog(log) {
    setEditingLog(log)
    setEditLogForm({
      quantity: String(log.quantity),
      note: log.note || '',
      imported_at: isoToDatetimeLocal(log.imported_at),
    })
  }

  async function handleEditLogSubmit() {
    if (!editingLog) return
    const quantity = Number(editLogForm.quantity)
    const dateError = validateImportDatetime(editLogForm.imported_at)
    if (!quantity || quantity <= 0) {
      alert('Số lượng phải lớn hơn 0')
      return
    }
    if (dateError) {
      alert(dateError)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/inventory/logs/${editingLog.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity,
          note: editLogForm.note || null,
          imported_at: datetimeLocalToIso(editLogForm.imported_at),
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Cập nhật thất bại')
      }
      setEditingLog(null)
      await loadProducts()
      await loadImportHistory()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteLog() {
    if (!deletingLog) return
    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/inventory/logs/${deletingLog.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status !== 204) {
        const txt = await res.text()
        throw new Error(txt || 'Xóa thất bại')
      }
      setDeletingLog(null)
      await loadProducts()
      await loadImportHistory()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-container-padding-desktop h-16 z-40 bg-surface shadow-sm flex-shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center gap-stack-md">
          <div className="relative flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant/40 focus-within:border-secondary-container transition-colors">
            <img src={searchIcon} alt="" className={`${ICON} mr-2`} />
            <input
              className="bg-transparent border-none outline-none w-64 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70"
              placeholder="Tìm kiếm kho..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-stack-md">
          <div className="font-headline-md text-headline-md font-bold text-primary hidden sm:block">Meo Coffee</div>
          <AdminUserMenu />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-container-padding-mobile md:p-container-padding-desktop bg-background">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-stack-md mb-stack-lg">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2">Quản lý kho</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
              Tổng quan số lượng sản phẩm
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <button
              type="button"
              onClick={() => openImportModal()}
              className="px-stack-lg py-2.5 bg-secondary-container text-on-secondary-container rounded-full font-label-md font-bold shadow-sm hover:scale-95 transition-transform"
            >
              Nhập kho
            </button>
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-stack-lg py-2.5 bg-primary text-on-primary rounded-full font-label-md font-bold shadow-sm hover:scale-95 transition-transform"
            >
              Lịch sử nhập hàng
            </button>
          </div>
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
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-stack-md p-stack-md">
            {paginatedProducts.map((p) => {
              const status = stockStatus(p.stock_quantity)
              const unit = stockUnit(p.product_type)
              const icon = p.product_type === 'equipment' ? blenderIcon : localCafeIcon

              return (
                <article
                  key={p.id}
                  onClick={() => openDetailModal(p)}
                  className={`rounded-xl p-stack-md flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md relative overflow-hidden cursor-pointer ${
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
                        <img src={icon} alt="" className={`h-5 w-5 ${status.low ? '' : 'icon-dark'}`} />
                      </div>
                      <h3 className="font-body-lg text-body-lg font-semibold text-on-surface truncate">{p.name}</h3>
                    </div>
                    {(p.flavor_tags?.length > 0 || p.flavor) && (
                      <span className="shrink-0 px-2 py-1 bg-surface-container text-on-surface-variant rounded-full font-label-sm text-label-sm max-w-[140px] truncate" title={p.flavor_tags?.map((t) => t.name).join(', ') || p.flavor}>
                        {p.flavor_tags?.length
                          ? p.flavor_tags.map((t) => t.name).join(', ')
                          : p.flavor}
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
                    <button
                      type="button"
                      onClick={() => openImportModal(p)}
                      className="mt-3 text-sm font-label-md text-primary hover:underline font-semibold"
                    >
                      + Nhập kho
                    </button>
                  </div>
                </article>
              )
            })}
            {!products.length && (
              <p className="col-span-full text-on-surface-variant font-body-md">Không có sản phẩm trong kho này.</p>
            )}
          </div>
          {products.length > INVENTORY_PAGE_SIZE && (
            <Pagination
              page={page}
              total={products.length}
              pageSize={INVENTORY_PAGE_SIZE}
              onPageChange={setPage}
            />
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
                <label className="font-label-md text-on-surface-variant">Ngày giờ nhập</label>
                <input
                  type="datetime-local"
                  max={maxDatetimeLocal}
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
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">{log.product_name}</p>
                        <p className="font-label-sm text-on-surface-variant mt-1">
                          {formatDateTime(log.imported_at)}
                          {log.creator_name ? ` · ${log.creator_name}` : ''}
                        </p>
                        {log.note && (
                          <p className="font-label-sm text-on-surface-variant mt-1 italic">{log.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="font-headline-md text-primary">
                          +{log.quantity} {stockUnit(log.product_type)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditLog(log)}
                          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-highest"
                          aria-label="Sửa"
                        >
                          <img src={editIcon} alt="" className="h-[18px] w-[18px] icon-dark" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingLog(log)}
                          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-error-container/30"
                          aria-label="Xóa"
                        >
                          <img src={deleteIcon} alt="" className="h-[18px] w-[18px] icon-dark" />
                        </button>
                      </div>
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

      {editingLog && (
        <div className="fixed inset-0 z-[110] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-md rounded-[24px] shadow-2xl border border-outline-variant/30 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-on-surface">Sửa lịch sử nhập</h2>
              <p className="font-label-sm text-on-surface-variant mt-1">{editingLog.product_name}</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Ngày giờ nhập</label>
                <input
                  type="datetime-local"
                  max={maxDatetimeLocal}
                  value={editLogForm.imported_at}
                  onChange={(e) => setEditLogForm((f) => ({ ...f, imported_at: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Số lượng</label>
                <input
                  type="number"
                  min={1}
                  value={editLogForm.quantity}
                  onChange={(e) => setEditLogForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Ghi chú</label>
                <input
                  type="text"
                  value={editLogForm.note}
                  onChange={(e) => setEditLogForm((f) => ({ ...f, note: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                />
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-6 py-2.5 rounded-full font-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleEditLogSubmit}
                className="px-8 py-2.5 bg-primary text-on-primary rounded-full font-label-md shadow-md disabled:opacity-60"
              >
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingLog && (
        <div className="fixed inset-0 z-[110] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-md rounded-[24px] shadow-2xl p-8 border border-outline-variant/30 flex flex-col gap-6">
            <div className="text-center">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Xóa bản ghi nhập?</h3>
              <p className="text-on-surface-variant font-body-md">
                {deletingLog.product_name} · +{deletingLog.quantity} {stockUnit(deletingLog.product_type)}
                <br />
                {formatDateTime(deletingLog.imported_at)}
              </p>
              <p className="text-error font-label-sm mt-2">Kho sản phẩm sẽ giảm tương ứng.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingLog(null)}
                className="flex-1 py-3 rounded-full font-label-md text-on-surface-variant bg-surface-container-high"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteLog}
                className="flex-1 py-3 rounded-full font-label-md text-on-error bg-error disabled:opacity-60"
              >
                {submitting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailProduct && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-lg max-h-[90vh] rounded-[24px] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low flex justify-between items-center gap-4">
              <h2 className="font-headline-md text-headline-md text-on-surface">Chi tiết sản phẩm</h2>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="text-on-surface-variant hover:text-on-surface text-2xl leading-none px-2"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
              {detailImagePreview && (
                <img
                  src={detailImagePreview}
                  alt={detailForm.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Tên sản phẩm</label>
                  <input
                    value={detailForm.name}
                    onChange={(e) => setDetailForm((f) => ({ ...f, name: e.target.value }))}
                    className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                    placeholder="Tên sản phẩm"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Giá (VND)</label>
                  <input
                    inputMode="numeric"
                    value={detailForm.price}
                    onChange={(e) => setDetailForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, '') }))}
                    className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                    placeholder="Giá"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Số lượng tồn kho</label>
                  <input
                    type="number"
                    min={0}
                    value={detailForm.stock_quantity}
                    onChange={(e) => setDetailForm((f) => ({ ...f, stock_quantity: Math.max(0, Number(e.target.value) || 0) }))}
                    className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Ảnh sản phẩm</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0]
                      if (!file) return
                      setDetailImagePreview(URL.createObjectURL(file))
                      const uploaded = await uploadDetailImage(file)
                      if (uploaded) {
                        setDetailForm((f) => ({ ...f, image_url: uploaded }))
                        setDetailImagePreview(resolveImageUrl(uploaded))
                      }
                    }}
                    className="bg-surface-container border-none rounded-xl px-4 py-2 text-body-md"
                    disabled={detailUploading}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Mô tả</label>
                <textarea
                  value={detailForm.description}
                  onChange={(e) => setDetailForm((f) => ({ ...f, description: e.target.value }))}
                  className="bg-surface-container border-none rounded-xl px-4 py-3 font-body-md resize-none"
                  placeholder="Mô tả sản phẩm"
                  rows="3"
                />
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2">
                <p className="font-label-md text-on-surface-variant">Thông tin thêm</p>
                <div className="flex justify-between font-body-sm text-on-surface">
                  <span>Loại:</span>
                  <span className="font-semibold">{detailProduct.product_type === 'coffee' ? 'Coffee' : 'Dụng cụ pha coffee'}</span>
                </div>
                <div className="flex justify-between font-body-sm text-on-surface">
                  <span>Đã bán:</span>
                  <span className="font-semibold">{detailProduct.total_units_sold ?? 0} {stockUnit(detailProduct.product_type)}</span>
                </div>
                {detailProduct.flavor_tags?.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-1 mt-1">
                    {detailProduct.flavor_tags.map((tag) => (
                      <span key={tag.id} className="bg-secondary-container/20 text-tertiary font-label-sm text-label-sm px-2.5 py-1 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                {detailProduct.brewing_method && (
                  <div className="flex justify-end mt-1">
                    <span className="bg-primary-container/20 text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full">
                      {detailProduct.brewing_method}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-6 py-2.5 rounded-full font-label-md text-on-surface-variant hover:bg-surface-container-high"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={detailSaving}
                onClick={handleDetailSave}
                className="px-8 py-2.5 bg-primary text-on-primary rounded-full font-label-md shadow-md disabled:opacity-60"
              >
                {detailSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
