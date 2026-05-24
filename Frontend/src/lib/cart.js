const STORAGE_KEY = 'meo-cart-v1'

export function cartItemFromProduct(product) {
  return {
    localId: `p-${product.id}`,
    productId: product.id,
    name: product.name,
    price: Number(product.price),
    quantity: 1,
    selected: true,
    flavorTags: product.flavor_tags?.map((t) => t.name) ?? [],
    product,
  }
}

export function loadCartItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCartItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* quota / private mode */
  }
}
