import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerChrome from '../components/CustomerChrome'
import Pagination from '../components/Pagination'
import { customerDevelopingPath } from '../constants/routes'
import { getApiBase } from '../lib/auth'
import {
  fetchFlavorCatalog,
  fetchShopProducts,
  formatVnd,
  pickRandom,
  productImageUrl,
  productSubtitle,
  shuffleArray,
} from '../lib/products'

const PAGE_SIZE = 8
const SUGGEST_COUNT = 6

function SuggestionCard({ product, onAdd }) {
  const img = productImageUrl(product, getApiBase())
  const isBestseller = (product.total_units_sold ?? 0) > 0

  return (
    <article className="snap-start shrink-0 w-[240px] bg-surface-container-lowest rounded-xl shadow-diffusion border border-outline-variant group cursor-pointer hover:-translate-y-1 transition-all duration-300">
      <div className="h-40 w-full rounded-t-[16px] bg-surface-container overflow-hidden relative">
        {img ? (
          <img alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={img} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-container/30 to-secondary-container/20">
            <span className="material-symbols-outlined text-outline text-[48px]">coffee</span>
          </div>
        )}
        {isBestseller && (
          <div className="absolute top-2 right-2 bg-secondary-container/90 text-on-secondary-container font-label-sm text-label-sm px-2 py-1 rounded-full backdrop-blur-sm">
            Bán chạy
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-label-md text-label-md text-on-surface line-clamp-1">{product.name}</h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-2">{productSubtitle(product)}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-label-md text-label-md text-primary">{formatVnd(product.price)}</span>
          <button
            type="button"
            onClick={onAdd}
            className="bg-surface text-primary border border-primary rounded-full p-1.5 hover:bg-primary hover:text-on-primary transition-colors active:scale-95"
            aria-label="Thêm vào giỏ"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function GridCard({ product, onAdd }) {
  const img = productImageUrl(product, getApiBase())

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-diffusion border border-outline-variant flex flex-col overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="h-48 w-full bg-surface-container relative overflow-hidden">
        {img ? (
          <img alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={img} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tertiary-container/40 to-surface-container-high">
            <span className="material-symbols-outlined text-outline text-[48px]">
              {product.product_type === 'equipment' ? 'blender' : 'coffee'}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-label-md text-label-md text-on-surface line-clamp-2">{product.name}</h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 line-clamp-2">{productSubtitle(product)}</p>
          {product.product_type === 'coffee' && product.flavor_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.flavor_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-tertiary font-label-sm text-label-sm border border-secondary-container/30"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-primary">{formatVnd(product.price)}</span>
          <button
            type="button"
            onClick={onAdd}
            className="bg-surface text-primary border-2 border-primary rounded-full w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors active:scale-95"
            aria-label="Thêm vào giỏ"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ShopPage({ productType }) {
  const navigate = useNavigate()
  const apiBase = getApiBase()
  const wip = customerDevelopingPath
  const isCoffee = productType === 'coffee'
  const title = isCoffee ? 'Coffee' : 'Dụng cụ pha chế'
  const searchPlaceholder = isCoffee
    ? 'Tìm kiếm cà phê, hạt, hương vị…'
    : 'Tìm kiếm dụng cụ pha chế…'

  const [gridLoading, setGridLoading] = useState(true)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [gridPool, setGridPool] = useState([])
  const [flavorCatalog, setFlavorCatalog] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState(() => new Set())
  const [expandedGroupIds, setExpandedGroupIds] = useState(() => new Set())
  const [page, setPage] = useState(1)

  const selectedTagKey = useMemo(
    () =>
      [...selectedTagIds]
        .sort((a, b) => a - b)
        .join(','),
    [selectedTagIds],
  )

  const onAddToCart = useCallback(() => navigate(wip('cart')), [navigate, wip])

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    async function loadSuggestions() {
      try {
        const products = await fetchShopProducts(apiBase, { productType })
        if (!cancelled) setSuggestions(pickRandom(products, SUGGEST_COUNT))
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }
    loadSuggestions()
    return () => {
      cancelled = true
    }
  }, [apiBase, productType])

  useEffect(() => {
    if (!isCoffee) return
    let cancelled = false
    async function loadCatalog() {
      try {
        const catalog = await fetchFlavorCatalog(apiBase)
        if (!cancelled) setFlavorCatalog(catalog)
      } catch {
        if (!cancelled) setFlavorCatalog([])
      }
    }
    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [apiBase, isCoffee])

  useEffect(() => {
    let cancelled = false
    async function loadGrid() {
      setGridLoading(true)
      setError('')
      try {
        const products = await fetchShopProducts(apiBase, {
          productType,
          search: searchQuery || undefined,
          flavorTagIds:
            isCoffee && selectedTagKey
              ? selectedTagKey.split(',').map((id) => Number(id))
              : undefined,
        })
        if (!cancelled) {
          setGridPool(shuffleArray(products))
          setPage(1)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Lỗi tải sản phẩm')
          setGridPool([])
        }
      } finally {
        if (!cancelled) setGridLoading(false)
      }
    }
    loadGrid()
    return () => {
      cancelled = true
    }
  }, [apiBase, productType, searchQuery, selectedTagKey, isCoffee])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return gridPool.slice(start, start + PAGE_SIZE)
  }, [gridPool, page])

  function toggleGroup(groupId) {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  function toggleTag(tagId) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  function clearTagFilters() {
    setSelectedTagIds(new Set())
    setExpandedGroupIds(new Set())
  }

  return (
    <CustomerChrome>
      <main className="flex-grow flex flex-col pt-stack-lg pb-stack-lg gap-stack-lg max-w-7xl mx-auto w-full">
        <section className="w-full">
          <div className="px-container-padding-mobile md:px-container-padding-desktop mb-stack-md flex items-end justify-between gap-4">
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
                {title}
              </h1>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-1">Gợi ý cho riêng bạn</h2>
            </div>
          </div>
          <div className="w-full overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory px-container-padding-mobile md:px-container-padding-desktop">
            <div className="flex gap-gutter w-max pr-4">
              {suggestions.length === 0 && !gridLoading && (
                <p className="font-body-md text-on-surface-variant px-2">Chưa có sản phẩm gợi ý.</p>
              )}
              {suggestions.map((p) => (
                <SuggestionCard key={`s-${p.id}`} product={p} onAdd={onAddToCart} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-container-padding-mobile md:px-container-padding-desktop flex flex-col gap-4">
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-tertiary">search</span>
            </div>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface rounded-full border-2 border-outline-variant focus:border-secondary-container focus:ring-0 text-on-surface font-body-md text-body-md placeholder-on-surface-variant transition-colors shadow-sm"
              placeholder={searchPlaceholder}
            />
          </div>

          {isCoffee && flavorCatalog.length > 0 && (
            <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={clearTagFilters}
                  className={`font-label-md text-label-md px-5 py-2 rounded-full shadow-md active:scale-95 transition-transform ${
                    selectedTagIds.size === 0
                      ? 'bg-primary text-on-primary'
                      : 'bg-secondary-container/20 text-tertiary border border-transparent hover:border-secondary-container'
                  }`}
                >
                  Tất cả
                </button>
                {flavorCatalog.map((group) => {
                  const expanded = expandedGroupIds.has(group.id)
                  const groupTagIds = group.tags?.map((t) => t.id) ?? []
                  const activeInGroup = groupTagIds.some((id) => selectedTagIds.has(id))
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`font-label-md text-label-md px-4 py-2 rounded-full border transition-all active:scale-95 ${
                        expanded || activeInGroup
                          ? 'bg-primary/15 text-primary border-primary'
                          : 'bg-secondary-container/20 text-tertiary border-transparent hover:border-secondary-container hover:bg-secondary-container/30'
                      }`}
                    >
                      {group.name}
                    </button>
                  )
                })}
              </div>
              {flavorCatalog.some((g) => expandedGroupIds.has(g.id)) && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/50">
                  {flavorCatalog
                    .filter((g) => expandedGroupIds.has(g.id))
                    .map((group) => (
                      <div key={group.id}>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-2">{group.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {(group.tags ?? []).length === 0 && (
                            <span className="font-body-md text-on-surface-variant text-sm">Chưa có tag trong nhóm này.</span>
                          )}
                          {(group.tags ?? []).map((tag) => {
                            const on = selectedTagIds.has(tag.id)
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`font-label-sm text-label-sm px-3 py-1.5 rounded-full border transition-colors ${
                                  on
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:border-secondary'
                                }`}
                              >
                                {tag.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="px-container-padding-mobile md:px-container-padding-desktop flex flex-col">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Khám phá Menu</h2>
          {error && <p className="text-error font-body-md mb-4">{error}</p>}
          {gridLoading && (
            <p className="text-center font-body-md text-on-surface-variant py-8">Đang tải…</p>
          )}
          {!gridLoading && pageItems.length === 0 && (
            <p className="text-center font-body-md text-on-surface-variant py-12">Không tìm thấy sản phẩm phù hợp.</p>
          )}
          {!gridLoading && pageItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
              {pageItems.map((p) => (
                <GridCard key={p.id} product={p} onAdd={onAddToCart} />
              ))}
            </div>
          )}
          <Pagination
            page={page}
            total={gridPool.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            className="mt-stack-md rounded-xl border border-outline-variant/40"
          />
        </section>
      </main>
    </CustomerChrome>
  )
}
