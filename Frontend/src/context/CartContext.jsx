import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { cartItemFromProduct, loadCartItems, saveCartItems } from '../lib/cart'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCartItems())

  useEffect(() => {
    saveCartItems(items)
  }, [items])

  const addProduct = useCallback((product) => {
    if (!product?.id) return
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1, selected: true } : i,
        )
      }
      return [...prev, cartItemFromProduct(product)]
    })
  }, [])

  const toggleSelect = useCallback((localId) => {
    setItems((prev) =>
      prev.map((i) => (i.localId === localId ? { ...i, selected: !i.selected } : i)),
    )
  }, [])

  const changeQuantity = useCallback((localId, delta) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.localId !== localId) return i
        return { ...i, quantity: Math.max(1, i.quantity + delta) }
      }),
    )
  }, [])

  const removeItem = useCallback((localId) => {
    setItems((prev) => prev.filter((i) => i.localId !== localId))
  }, [])

  const removeSelectedItems = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.selected))
  }, [])

  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items])

  const cartProductIdsKey = useMemo(
    () =>
      items
        .map((i) => i.productId)
        .filter((id) => id != null)
        .sort((a, b) => a - b)
        .join(','),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addProduct,
      toggleSelect,
      changeQuantity,
      removeItem,
      removeSelectedItems,
      itemCount,
      cartProductIdsKey,
    }),
    [items, addProduct, toggleSelect, changeQuantity, removeItem, removeSelectedItems, itemCount, cartProductIdsKey],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
