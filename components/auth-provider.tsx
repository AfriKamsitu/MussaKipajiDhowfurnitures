"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  ApiError,
  AUTH_SESSION_EXPIRED_EVENT,
  fetchApi,
  getAuthToken,
  refreshAuthToken,
  setAuthToken,
} from "@/lib/api"

export type Address = {
  id: string
  label: string
  fullName: string
  phone: string
  street: string
  city: string
  region: string
  isDefault: boolean
}

export type Order = {
  id: string
  date: string
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Pending"
  total: number
  items: { name: string; image: string; quantity: number; price: number; productId?: string }[]
}

export type Role = "admin" | "customer"

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: Role
  createdAt: string
  marketingOptIn: boolean
  addresses: Address[]
  orders: Order[]
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  signUp: (data: { name: string; email: string; password: string; marketingOptIn: boolean }) => Promise<{ error?: string; role?: Role }>
  signIn: (data: { email: string; password: string; marketingOptIn?: boolean }) => Promise<{ error?: string; role?: Role }>
  signInWithProvider: (
    provider: "google" | "facebook",
    token?: string,
    marketingOptIn?: boolean,
  ) => Promise<{ error?: string; role?: Role; redirected?: boolean }>
  signOut: () => void
  updateProfile: (data: Partial<Pick<User, "name" | "email" | "phone" | "avatar" | "marketingOptIn">>) => Promise<void>
  addAddress: (address: Omit<Address, "id">) => Promise<void>
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>
  removeAddress: (id: string) => Promise<void>
  addOrder: (order: Order) => void
  refreshOrders: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const USER_KEY = "pajedhow.user"

type BackendUser = {
  id?: string
  name?: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  createdAt?: string
  marketingOptIn?: boolean
  addresses?: Array<{
    id?: number | string
    label?: string
    fullName?: string
    phone?: string
    street?: string
    city?: string
    region?: string
    isDefault?: boolean
  }>
}

type AuthResponse = {
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresInMs?: number
  user?: BackendUser
}

function normalizeRole(role: unknown): Role {
  const value = String(role ?? "").toUpperCase()
  if (value.includes("ADMIN")) return "admin"
  return "customer"
}

function mapAddress(raw: NonNullable<BackendUser["addresses"]>[number]): Address {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    label: raw.label ?? "Address",
    fullName: raw.fullName ?? "",
    phone: raw.phone ?? "",
    street: raw.street ?? "",
    city: raw.city ?? "",
    region: raw.region ?? "",
    isDefault: Boolean(raw.isDefault),
  }
}

function toUser(raw: BackendUser, orders: Order[] = []): User {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    phone: raw.phone,
    avatar: raw.avatar,
    role: normalizeRole(raw.role),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    marketingOptIn: Boolean(raw.marketingOptIn),
    addresses: Array.isArray(raw.addresses) ? raw.addresses.map(mapAddress) : [],
    orders,
  }
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function setStoredUser(user: User | null) {
  if (typeof window === "undefined") return
  try {
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(USER_KEY)
    }
  } catch {
    /* ignore localStorage failures */
  }
}

function mapOrder(raw: Record<string, unknown>): Order {
  const status = String(raw.status ?? "Pending")
  const pretty =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, " ")
  return {
    id: String(raw.orderNumber ?? raw.id ?? ""),
    date: String(raw.createdAt ?? ""),
    status: pretty as Order["status"],
    total: Number(raw.total ?? 0),
    items: Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[]).map((item) => ({
          productId: item.productId != null ? String(item.productId) : undefined,
          name: String(item.name ?? ""),
          image: String(item.image ?? "/placeholder.svg"),
          quantity: Number(item.quantity ?? 1),
          price: Number(item.price ?? 0),
        }))
      : [],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async (): Promise<Order[]> => {
    const orders = await fetchApi<Record<string, unknown>[]>("/api/account/orders")
    return Array.isArray(orders) ? orders.map(mapOrder) : []
  }, [])

  useEffect(() => {
    const clearSession = () => {
      setAuthToken(null)
      setStoredUser(null)
      setUser(null)
    }
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, clearSession)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, clearSession)
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    const cachedUser = getStoredUser()

    if (!token && !cachedUser) {
      setLoading(false)
      return
    }

    if (cachedUser) {
      setUser(cachedUser)
    }

    ;(async () => {
      try {
        if (!token && !(await refreshAuthToken())) {
          return
        }
        const me = await fetchApi<BackendUser>("/api/auth/me")
        // Order history belongs to buyer accounts; the API refuses it for admins.
        const orders = normalizeRole(me.role) === "admin" ? [] : await loadOrders().catch(() => cachedUser?.orders ?? [])
        const next = toUser(me, orders)
        setUser(next)
        setStoredUser(next)
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setAuthToken(null)
          setStoredUser(null)
          setUser(null)
          return
        }
        if (!cachedUser) {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [loadOrders])

  const applyAuthResponse = useCallback(
    async (payload: AuthResponse) => {
      if (payload.accessToken) setAuthToken(payload.accessToken)
      if (!payload.user) throw new Error("Authentication response missing user.")
      const orders = normalizeRole(payload.user.role) === "admin" ? [] : await loadOrders().catch(() => [])
      const next = toUser(payload.user, orders)
      setUser(next)
      setStoredUser(next)
      return next.role
    },
    [loadOrders],
  )

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ name, email, password, marketingOptIn }) => {
      try {
        const payload = await fetchApi<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, marketingOptIn }),
        })
        const role = await applyAuthResponse(payload)
        return { role }
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Registration failed." }
      }
    },
    [applyAuthResponse],
  )

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async ({ email, password, marketingOptIn }) => {
      try {
        const payload = await fetchApi<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, marketingOptIn }),
        })
        const role = await applyAuthResponse(payload)
        return { role }
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Invalid email or password." }
      }
    },
    [applyAuthResponse],
  )

  const signInWithProvider = useCallback<AuthContextValue["signInWithProvider"]>(
    async (provider, token, marketingOptIn) => {
      try {
        let providerToken = token
        if (!providerToken) {
          const { requestSocialProviderToken } = await import("@/lib/social-auth")
          providerToken = await requestSocialProviderToken(provider)
        }

        const payload = await fetchApi<AuthResponse>("/api/auth/social", {
          method: "POST",
          body: JSON.stringify({ provider, token: providerToken, marketingOptIn }),
        })
        const role = await applyAuthResponse(payload)
        // Social accounts are always BUYER on the backend.
        return { role: role === "admin" ? "customer" : role }
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Social sign-in failed." }
      }
    },
    [applyAuthResponse],
  )

  const signOut = useCallback(() => {
    setAuthToken(null)
    setStoredUser(null)
    setUser(null)
    fetch("/api/auth/logout", { method: "POST", cache: "no-store" }).catch(() => {})
  }, [])

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (data) => {
      if (!user) throw new Error("You must be signed in to update your profile.")
      const updated = await fetchApi<BackendUser>("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      })
      const next = toUser(updated, user.orders)
      setUser(next)
      setStoredUser(next)
    },
    [user],
  )

  const addAddress = useCallback<AuthContextValue["addAddress"]>(
    async (address) => {
      if (!user) throw new Error("You must be signed in to add an address.")
      const created = await fetchApi<{
          id: number | string
          label?: string
          fullName?: string
          phone?: string
          street?: string
          city?: string
          region?: string
          isDefault?: boolean
      }>("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify(address),
      })
      const mapped = mapAddress(created)
      const addresses = mapped.isDefault
        ? [...user.addresses.map((a) => ({ ...a, isDefault: false })), mapped]
        : [...user.addresses, mapped]
      const next = { ...user, addresses }
      setUser(next)
      setStoredUser(next)
    },
    [user],
  )

  const updateAddress = useCallback<AuthContextValue["updateAddress"]>(
    async (id, data) => {
      if (!user) throw new Error("You must be signed in to update an address.")
      const current = user.addresses.find((a) => a.id === id)
      if (!current) throw new Error("Address not found.")
      const body = { ...current, ...data }
      const updated = await fetchApi<typeof body>(`/api/account/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      })
      let addresses = user.addresses.map((a) =>
        a.id === id ? mapAddress(updated as Parameters<typeof mapAddress>[0]) : a,
      )
      if (data.isDefault) {
        addresses = addresses.map((a) => (a.id === id ? a : { ...a, isDefault: false }))
      }
      const next = { ...user, addresses }
      setUser(next)
      setStoredUser(next)
    },
    [user],
  )

  const removeAddress = useCallback<AuthContextValue["removeAddress"]>(
    async (id) => {
      if (!user) throw new Error("You must be signed in to remove an address.")
      const previous = user
      const next = { ...user, addresses: user.addresses.filter((a) => a.id !== id) }
      setUser(next)
      setStoredUser(next)
      try {
        await fetchApi(`/api/account/addresses/${id}`, { method: "DELETE" })
      } catch {
        setUser(previous)
        setStoredUser(previous)
        throw new Error("The address could not be removed. Please try again.")
      }
    },
    [user],
  )

  const addOrder = useCallback<AuthContextValue["addOrder"]>(
    (order) => {
      if (!user) return
      setUser({ ...user, orders: [order, ...user.orders] })
    },
    [user],
  )

  const refreshOrders = useCallback(async () => {
    if (!user) return
    const orders = await loadOrders()
    setUser({ ...user, orders })
  }, [user, loadOrders])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      signInWithProvider,
      signOut,
      updateProfile,
      addAddress,
      updateAddress,
      removeAddress,
      addOrder,
      refreshOrders,
    }),
    [
      user,
      loading,
      signUp,
      signIn,
      signInWithProvider,
      signOut,
      updateProfile,
      addAddress,
      updateAddress,
      removeAddress,
      addOrder,
      refreshOrders,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
