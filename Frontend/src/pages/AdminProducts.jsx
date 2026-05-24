import { useEffect, useMemo, useState } from 'react'
import searchIcon from '../assets/search_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import AdminUserMenu from '../components/AdminUserMenu'
import Pagination from '../components/Pagination'
import FlavorTagPicker from '../components/FlavorTagPicker'
import BrewingMethodPicker, { getBrewingMethodLabel } from '../components/BrewingMethodPicker'
import { paginateSlice } from '../lib/pagination'
import addIcon from '../assets/add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'

const PRODUCTS_PAGE_SIZE = 8
import addCircleIcon from '../assets/add_circle_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import editIcon from '../assets/edit_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import deleteIcon from '../assets/delete_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import localCafeIcon from '../assets/local_cafe.svg'
import blenderIcon from '../assets/blender_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import heroFallback from '../assets/meocam.jfif'

function formatVnd(value) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('vi-VN')}đ`
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState('coffee')
  const apiBase = import.meta.env.VITE_API_BASE_URL 
  const token = localStorage.getItem('access_token')
  const [categories, setCategories] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    price: '',
    category_id: null,
    product_type: 'coffee',
    flavor: '',
    flavor_tag_ids: [],
    brewing_method: '',
    description: '',
    stock_quantity: 0,
    image_url: '',
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [page, setPage] = useState(1)

  function resolveImageUrl(url) {
    if (!url) return heroFallback
    return url.startsWith('http') ? url : `${apiBase}${url}`
  }

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (productType) params.set('product_type', productType)
    return params.toString()
  }, [search, productType])

  const productTotalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PAGE_SIZE) || 1)
  const paginatedProducts = paginateSlice(products, page, PRODUCTS_PAGE_SIZE)
  const showAddCard = page === productTotalPages

  useEffect(() => {
    setPage(1)
  }, [productType, search])

  useEffect(() => {
    if (page > productTotalPages) setPage(productTotalPages)
  }, [page, productTotalPages])

  function resetForm(pt = productType) {
    const defaultCategoryId = (categories && categories.length)
      ? (pt === 'coffee' ? (categories.find(c => c.name && c.name.toLowerCase() === 'coffee')?.id || categories[0].id) : categories[0].id)
      : null
    setForm({
      name: '',
      price: '',
      category_id: defaultCategoryId,
      product_type: pt,
      flavor: '',
      flavor_tag_ids: [],
      brewing_method: '',
      description: '',
      stock_quantity: 0,
      image_url: '',
    })
    setImagePreview(null)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const url = queryString ? `${apiBase}/products?${queryString}` : `${apiBase}/products`
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) throw new Error('Không tải được danh sách sản phẩm')
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [apiBase, queryString, token])

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${apiBase}/categories`)
        if (!res.ok) return
        const data = await res.json()
        setCategories(data)
        if (data.length && !form.category_id) setForm((s) => ({ ...s, category_id: data[0].id }))
      } catch (err) {
        console.error(err)
      }
    }
    loadCategories()
  }, [apiBase])

  async function uploadImageFile(file) {
    if (!file) return null
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
      console.error(err)
      alert('Lỗi upload ảnh: ' + err.message)
      return null
    }
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-container-padding-desktop h-16 z-40 bg-surface shadow-sm sticky top-0 flex-shrink-0 border-b border-outline-variant/20">
        <div className="flex items-center gap-stack-md w-full max-w-md">
          <div className="flex items-center bg-surface-container rounded-full px-4 py-2 w-full border border-transparent focus-within:border-secondary-container focus-within:bg-surface-bright transition-colors shadow-inner">
            <img src={searchIcon} alt="" className="h-5 w-5 mr-2 icon-dark" />
            <input
              className="bg-transparent border-none outline-none w-full font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70"
              placeholder="Tìm kiếm sản phẩm..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <AdminUserMenu />
      </header>

      <div className="flex-1 overflow-y-auto p-container-padding-mobile md:p-container-padding-desktop pb-24">
        <div className="max-w-7xl mx-auto flex flex-col gap-stack-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-md mt-4">
            <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2">
              Quản lý sản phẩm
              <img src={localCafeIcon} alt="" className="h-8 w-8 opacity-50 icon-dark" />
            </h1>
            <button
              type="button"
              onClick={() => {
                resetForm(productType)
                setShowAddModal(true)
              }}
              className="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full shadow-[0_4px_14px_rgba(75,54,33,0.15)] flex items-center gap-2 active:scale-[0.98] transition-all hover:shadow-[0_6px_20px_rgba(75,54,33,0.2)] border border-primary-container self-start sm:self-auto"
            >
              <img src={addIcon} alt="" className="h-5 w-5 brightness-0 invert opacity-90" />
              {productType === 'coffee' ? 'Thêm Coffee' : 'Thêm Dụng cụ pha coffee'}
            </button>
          </div>

          <div className="flex gap-stack-lg border-b border-outline-variant/40">
            <button
              type="button"
              onClick={() => { setProductType('coffee'); resetForm('coffee'); setEditingProduct(null); setDeletingProduct(null); }}
              className={`font-label-md text-[16px] pb-3 -mb-[2px] relative flex items-center gap-2 ${productType === 'coffee' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Coffee
              <img src={localCafeIcon} alt="" className="h-4 w-4 icon-dark" />
            </button>
            <button
              type="button"
              onClick={() => { setProductType('equipment'); resetForm('equipment'); setEditingProduct(null); setDeletingProduct(null); }}
              className={`font-label-md text-[16px] pb-3 flex items-center gap-2 ${productType === 'equipment' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Dụng cụ pha coffee
              <img src={blenderIcon} alt="" className="h-4 w-4 icon-dark" />
            </button>
          </div>

          {error && <p className="text-error font-label-md">{error}</p>}

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-stack-md lg:gap-stack-lg p-stack-md">
            {loading && <div className="col-span-full text-on-surface-variant">Đang tải...</div>}
            {!loading && paginatedProducts.map((p) => {
              const lowStock = Number(p.stock_quantity || 0) <= 5
              return (
                <div
                  key={p.id}
                  className="bg-surface-bright border border-outline-variant rounded-xl shadow-[0_8px_24px_rgba(75,54,33,0.06)] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(75,54,33,0.1)] transition-all duration-300 group"
                >
                  <div className="h-48 w-full bg-surface-container relative overflow-hidden">
                    <img
                      src={resolveImageUrl(p.image_url)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div
                      className={`absolute top-2 right-2 bg-surface-bright/90 backdrop-blur-sm px-2 py-1 rounded-full font-label-sm text-label-sm shadow-sm ${lowStock ? 'border border-error text-error' : 'text-on-surface'}`}
                    >
                      Kho: {p.stock_quantity ?? 0}
                    </div>
                  </div>
                  <div className="p-stack-md flex flex-col flex-1 gap-2 bg-gradient-to-b from-surface-bright to-surface">
                    <h3 className="font-headline-md text-[18px] leading-[24px] font-bold text-on-surface">{p.name}</h3>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {(p.flavor_tags || []).map((tag) => (
                        <span
                          key={tag.id}
                          className="bg-secondary-container/20 text-tertiary font-label-sm text-label-sm px-2.5 py-1 rounded-full border border-secondary-container/30"
                          title={tag.group_name}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {p.brewing_method && (
                        <span className="bg-primary-container/20 text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full border border-primary-container/30">
                          {getBrewingMethodLabel(p.brewing_method)}
                        </span>
                      )}
                      {!p.flavor_tags?.length && !p.brewing_method && p.flavor && (
                        <span className="bg-secondary-container/20 text-tertiary font-label-sm text-label-sm px-2.5 py-1 rounded-full border border-secondary-container/30">
                          {p.flavor}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/30">
                      <span className="font-body-md text-[18px] font-bold text-primary">{formatVnd(p.price)}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors"
                          onClick={() => {
                            setEditingProduct(p)
                            setForm({
                              name: p.name || '',
                              price: p.price || '',
                              category_id: p.category_id || (categories[0] && categories[0].id),
                              product_type: p.product_type || 'coffee',
                              flavor: p.flavor || '',
                              flavor_tag_ids: (p.flavor_tags || []).map((t) => t.id),
                              brewing_method: p.brewing_method || '',
                              description: p.description || '',
                              stock_quantity: p.stock_quantity || 0,
                              image_url: p.image_url || '',
                            })
                            setImagePreview(p.image_url ? resolveImageUrl(p.image_url) : null)
                            setShowEditModal(true)
                          }}
                        >
                          <img src={editIcon} alt="edit" className="h-[18px] w-[18px] icon-dark" />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                          onClick={() => { setDeletingProduct(p); setShowDeleteModal(true) }}
                        >
                          <img src={deleteIcon} alt="delete" className="h-[18px] w-[18px] icon-dark" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {!loading && products.length === 0 && (
              <div className="col-span-full text-on-surface-variant">Không có sản phẩm</div>
            )}

            {!loading && showAddCard && (
            <button
              type="button"
              onClick={() => {
                resetForm(productType)
                setShowAddModal(true)
              }}
              className="bg-surface-container-low border-2 border-dashed border-outline-variant/50 rounded-xl overflow-hidden flex flex-col items-center justify-center p-stack-lg hover:bg-surface-container-high hover:border-primary-container transition-all duration-300 group min-h-[260px] md:min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-full bg-surface-bright flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm text-tertiary">
                <img src={addCircleIcon} alt="add" className="h-8 w-8 icon-dark" />
              </div>
              <span className="font-headline-md text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">
                {productType === 'coffee' ? 'Thêm sản phẩm mới' : 'Thêm dụng cụ mới'}
              </span>
            </button>
            )}
          </div>
          {!loading && products.length > PRODUCTS_PAGE_SIZE && (
            <Pagination
              page={page}
              total={products.length}
              pageSize={PRODUCTS_PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
          </div>
        </div>
      </div>
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-lg max-h-[90vh] rounded-[24px] shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-on-surface">{productType === 'coffee' ? 'Thêm Sản phẩm Mới' : 'Thêm Dụng cụ Mới'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">×</button>
            </div>
            <div className="p-6 flex flex-col gap-6 overflow-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Tên sản phẩm</label>
                  <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="Nhập tên sản phẩm" type="text"/>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Giá</label>
                  <div className="flex items-center gap-2">
                    <input inputMode="numeric" value={form.price} onChange={(e)=>setForm(f=>({...f,price:e.target.value.replace(/[^0-9]/g,'')}))} className="flex-1 bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="Nhập giá" type="text"/>
                    <span className="text-on-surface-variant font-label-md">VND</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Loại sản phẩm</label>
                  <input readOnly value={productType === 'coffee' ? 'Coffee' : 'Dụng cụ pha coffee'} className="bg-surface-container border-none rounded-xl px-4 py-3 text-body-md opacity-90 pr-4" aria-readonly="true" />
                </div>
                {productType === 'coffee' ? (
                  <FlavorTagPicker
                    value={form.flavor_tag_ids}
                    onChange={(ids) => setForm((f) => ({ ...f, flavor_tag_ids: ids }))}
                  />
                ) : (
                  <BrewingMethodPicker
                    value={form.brewing_method}
                    onChange={(val) => setForm((f) => ({ ...f, brewing_method: val }))}
                  />
                )}
                {productType === 'coffee' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-on-surface-variant">Khối lượng / túi</label>
                    <input 
                    value={form.weight || '250g'} 
                    readOnly 
                    className="bg-surface-container border-none rounded-xl px-4 py-3 text-body-md" 
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Số lượng kho</label>
                  <input value={form.stock_quantity} onChange={(e)=>{
                    const v = e.target.value === '' ? 0 : Number(e.target.value)
                    setForm(f=>({...f,stock_quantity: Math.max(0, isNaN(v) ? 0 : v)}))
                  }} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="0" type="number"/>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-on-surface-variant">Ảnh sản phẩm</label>
                  <input type="file" accept="image/*" onChange={async (e)=>{
                    const file = e.target.files && e.target.files[0]
                    if(!file) return
                    setImagePreview(URL.createObjectURL(file))
                    const uploaded = await uploadImageFile(file)
                    if(uploaded) setForm(f=>({...f, image_url: uploaded}))
                  }} className="bg-surface-container border-none rounded-xl px-4 py-2 text-body-md" />
                  {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 w-40 h-28 object-cover rounded-md" />}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Mô tả</label>
                <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md resize-none" placeholder="Nhập mô tả" rows="3"></textarea>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-3">
              <button onClick={()=>setShowAddModal(false)} className="px-6 py-2.5 rounded-full font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors">Hủy</button>
              <button onClick={async ()=>{
                try{
                  const body = {
                    category_id: form.category_id,
                    name: form.name,
                    description: form.description,
                    price: Number(form.price),
                    stock_quantity: Math.max(0, Number(form.stock_quantity) || 0),
                    flavor: productType === 'equipment' ? null : (form.flavor || null),
                    flavor_tag_ids: productType === 'coffee' ? form.flavor_tag_ids : [],
                    product_type: productType,
                    image_url: form.image_url || null,
                    brewing_method: productType === 'equipment' ? (form.brewing_method || null) : null,
                  }
                  const res = await fetch(`${apiBase}/products`, {method:'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined }, body: JSON.stringify(body)})
                  if(!res.ok){ const txt = await res.text(); throw new Error(txt || 'Failed') }
                  setShowAddModal(false)
                  const refreshed = await (await fetch(`${apiBase}/products?product_type=${productType}`, {headers: token?{Authorization:`Bearer ${token}`}:undefined})).json()
                  setProducts(refreshed)
                }catch(err){ console.error(err); alert('Lỗi khi tạo sản phẩm: '+ err.message) }
              }} className="px-8 py-2.5 bg-primary text-on-primary rounded-full font-label-md shadow-md hover:shadow-lg transition-all btn-squish">Lưu Sản phẩm</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-lg max-h-[90vh] rounded-[24px] shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
              <h2 className="font-headline-md text-headline-md text-on-surface">Chỉnh sửa Sản phẩm</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">×</button>
            </div>
            <div className="p-6 flex flex-col gap-6 overflow-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Tên sản phẩm</label>
                  <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="Nhập tên sản phẩm" type="text"/>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Giá</label>
                  <div className="flex items-center gap-2">
                    <input inputMode="numeric" value={form.price} onChange={(e)=>setForm(f=>({...f,price:e.target.value.replace(/[^0-9]/g,'')}))} className="flex-1 bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="Nhập giá" type="text"/>
                    <span className="text-on-surface-variant font-label-md">VND</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Loại sản phẩm</label>
                  <select value={form.product_type} onChange={(e)=>setForm(f=>({...f,product_type:e.target.value}))} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md appearance-none pr-4 bg-no-repeat" style={{backgroundImage: 'none'}}>
                    <option value="coffee">Coffee</option>
                    <option value="equipment">Dụng cụ pha coffee</option>
                  </select>
                </div>
                {((editingProduct && editingProduct.product_type === 'coffee') || productType === 'coffee') ? (
                  <FlavorTagPicker
                    value={form.flavor_tag_ids}
                    onChange={(ids) => setForm((f) => ({ ...f, flavor_tag_ids: ids }))}
                  />
                ) : (
                  <BrewingMethodPicker
                    value={form.brewing_method}
                    onChange={(val) => setForm((f) => ({ ...f, brewing_method: val }))}
                  />
                )}
                {((editingProduct && editingProduct.product_type === 'coffee') || productType === 'coffee') && (
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-on-surface-variant">Khối lượng / túi</label>
                    <input 
                    value={form.weight || '250g'} 
                    readOnly 
                    className="bg-surface-container border-none rounded-xl px-4 py-3 text-body-md" 
                    />
                    </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface-variant">Số lượng kho</label>
                  <input value={form.stock_quantity} onChange={(e)=>{
                    const v = e.target.value === '' ? 0 : Number(e.target.value)
                    setForm(f=>({...f,stock_quantity: Math.max(0, isNaN(v) ? 0 : v)}))
                  }} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md" placeholder="0" type="number"/>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-label-md text-on-surface-variant">Ảnh sản phẩm</label>
                  <input type="file" accept="image/*" onChange={async (e)=>{
                    const file = e.target.files && e.target.files[0]
                    if(!file) return
                    setImagePreview(URL.createObjectURL(file))
                    const uploaded = await uploadImageFile(file)
                    if(uploaded) setForm(f=>({...f, image_url: uploaded}))
                  }} className="bg-surface-container border-none rounded-xl px-4 py-2 text-body-md" />
                  {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 w-40 h-28 object-cover rounded-md" />}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Mô tả</label>
                <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} className="bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-body-md resize-none" placeholder="Nhập mô tả" rows="3"></textarea>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-3">
              <button onClick={()=>setShowEditModal(false)} className="px-6 py-2.5 rounded-full font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors">Hủy</button>
              <button onClick={async ()=>{
                try{
                  const body = {}
                  if(form.category_id!=null) body.category_id = form.category_id
                  if(form.name) body.name = form.name
                  if(form.description!=null) body.description = form.description
                  if(form.price!='') body.price = Number(form.price)
                  if(form.stock_quantity!=null) body.stock_quantity = Math.max(0, Number(form.stock_quantity) || 0)
                  const pt = form.product_type || editingProduct.product_type
                  if (pt === 'coffee') body.flavor_tag_ids = form.flavor_tag_ids || []
                  if (pt === 'equipment') {
                    body.brewing_method = form.brewing_method || null
                  }
                  if(form.product_type) body.product_type = form.product_type
                  if(form.image_url!=null) body.image_url = form.image_url || null
                  const res = await fetch(`${apiBase}/products/${editingProduct.id}`, {method:'PATCH', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined }, body: JSON.stringify(body)})
                  if(!res.ok){ const txt = await res.text(); throw new Error(txt || 'Failed') }
                  setShowEditModal(false)
                  const refreshed = await (await fetch(`${apiBase}/products?product_type=${productType}`, {headers: token?{Authorization:`Bearer ${token}`}:undefined})).json()
                  setProducts(refreshed)
                }catch(err){ console.error(err); alert('Lỗi khi cập nhật sản phẩm: '+ err.message) }
              }} className="px-8 py-2.5 bg-primary text-on-primary rounded-full font-label-md shadow-md hover:shadow-lg transition-all btn-squish">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-container-padding-mobile">
          <div className="bg-surface-bright w-full max-w-md rounded-[24px] shadow-2xl p-8 border border-outline-variant/30 flex flex-col gap-6">
            <div className="w-16 h-16 bg-error-container/30 text-error rounded-full flex items-center justify-center self-center">
              <img src={deleteIcon} alt="del" className="h-8 w-8 icon-dark" />
            </div>
            <div className="text-center">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Xác nhận xóa?</h3>
              <p className="text-on-surface-variant">Bạn có muốn xóa sản phẩm tên <span className="font-bold text-on-surface text-primary">{deletingProduct.name}</span> không? Thao tác này không thể hoàn tác.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setShowDeleteModal(false)} className="flex-1 py-3 rounded-full font-label-md text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors">Không</button>
              <button onClick={async ()=>{
                try{
                  const res = await fetch(`${apiBase}/products/${deletingProduct.id}`, {method:'DELETE', headers: { Authorization: token ? `Bearer ${token}` : undefined }})
                  if(res.status!==204) {
                    let msg = 'Xóa sản phẩm thất bại'
                    try {
                      const data = await res.json()
                      msg = typeof data.detail === 'string' ? data.detail : msg
                    } catch {
                      const txt = await res.text()
                      if (txt) msg = txt
                    }
                    throw new Error(msg)
                  }
                  setShowDeleteModal(false)
                  const refreshed = await (await fetch(`${apiBase}/products?product_type=${productType}`, {headers: token?{Authorization:`Bearer ${token}`}:undefined})).json()
                  setProducts(refreshed)
                }catch(err){ console.error(err); alert('Lỗi khi xóa sản phẩm: '+ err.message) }
              }} className="flex-1 py-3 rounded-full font-label-md text-on-error bg-error shadow-md hover:shadow-lg transition-all btn-squish">Có, Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

