const DESC_FALLBACK = 'Meo Coffee chất lượng từ trái tim <3'

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function productImageUrl(product, apiBase) {
  if (!product?.image_url) return null
  const u = product.image_url
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const base = apiBase.replace(/\/$/, '')
  if (u.startsWith('/')) return `${base}${u}`
  return `${base}/${u}`
}

export function formatVnd(price) {
  return vnd.format(Number(price))
}

export function productDescription(product) {
  if (!product) return ''
  const t = product.description?.trim()
  return t || DESC_FALLBACK
}

export function productSubtitle(product) {
  if (!product) return ''
  if (product.product_type === 'coffee' && product.flavor_tags?.length) {
    return product.flavor_tags
      .slice(0, 3)
      .map((t) => t.name)
      .join(', ')
  }
  const f = product.flavor?.trim()
  if (f) return f
  return productDescription(product).slice(0, 60)
}

/** Fisher–Yates; mutates copy */
export function shuffleArray(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickRandom(items, n) {
  return shuffleArray(items).slice(0, n)
}

export async function fetchShopProducts(apiBase, { productType, search, flavorTagIds, status = 'active' }) {
  const params = new URLSearchParams()
  params.set('product_type', productType)
  params.set('status', status)
  params.set('limit', '500')
  if (search?.trim()) params.set('search', search.trim())
  if (flavorTagIds?.length) {
    flavorTagIds.forEach((id) => params.append('flavor_tag_ids', String(id)))
  }
  const res = await fetch(`${apiBase}/products?${params}`)
  if (!res.ok) throw new Error('Không tải được sản phẩm')
  return res.json()
}

export async function fetchFlavorCatalog(apiBase) {
  const res = await fetch(`${apiBase}/flavors/catalog`)
  if (!res.ok) throw new Error('Không tải được nhóm hương vị')
  return res.json()
}
