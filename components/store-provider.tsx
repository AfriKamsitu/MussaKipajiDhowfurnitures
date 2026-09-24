"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { Product } from "@/lib/data"

const CART_KEY = "furnicraft.cart"
const WISHLIST_KEY = "furnicraft.wishlist"
const RECENTLY_VIEWED_KEY = "furnicraft.recently-viewed"
const RECENTLY_VIEWED_LIMIT = 8

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export type CartItem = {
  product: Product
  quantity: number
  color?: string
}

function cartLimit(product: Product) {
  if (product.stock == null || !Number.isFinite(product.stock)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor(product.stock))
}

type StoreContextValue = {
  cart: CartItem[]
  wishlist: Product[]
  recentlyViewed: Product[]
  cartCount: number
  cartTotal: number
  wishlistCount: number
  addToCart: (product: Product, quantity?: number, color?: string) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleWishlist: (product: Product) => void
  isInWishlist: (id: string) => boolean
  recordRecentlyViewed: (product: Product) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    setCart(
      load<CartItem[]>(CART_KEY, [])
        .map((item) => ({
          ...item,
          quantity: Math.min(
            cartLimit(item.product),
            Math.max(0, Math.floor(Number(item.quantity) || 0)),
          ),
        }))
        .filter((item) => item.product?.id && item.quantity > 0),
    )
    setWishlist(load<Product[]>(WISHLIST_KEY, []))
    setRecentlyViewed(
      load<Product[]>(RECENTLY_VIEWED_KEY, [])
        .filter((product) => product?.id)
        .slice(0, RECENTLY_VIEWED_LIMIT),
    )
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  }, [wishlist, hydrated])

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed))
    }
  }, [recentlyViewed, hydrated])

  function addToCart(product: Product, quantity = 1, color?: string) {
    setCart((prev) => {
      const requested = Math.max(1, Math.floor(quantity))
      const limit = cartLimit(product)
      if (limit === 0) return prev
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: Math.min(limit, item.quantity + requested),
                color: color ?? item.color,
              }
            : item,
        )
      }
      return [...prev, { product, quantity: Math.min(limit, requested), color }]
    })
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === id
            ? {
                ...item,
                quantity: Math.min(cartLimit(item.product), Math.max(0, Math.floor(quantity))),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function clearCart() {
    setCart([])
  }

  function toggleWishlist(product: Product) {
    setWishlist((prev) =>
      prev.some((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product],
    )
  }

  function isInWishlist(id: string) {
    return wishlist.some((p) => p.id === id)
  }

  const recordRecentlyViewed = useCallback((product: Product) => {
    setRecentlyViewed((current) => [
      product,
      ...current.filter((item) => item.id !== product.id),
    ].slice(0, RECENTLY_VIEWED_LIMIT))
  }, [])

  const value: StoreContextValue = {
    cart,
    wishlist,
    recentlyViewed,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    cartTotal: cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    wishlistCount: wishlist.length,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    recordRecentlyViewed,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
