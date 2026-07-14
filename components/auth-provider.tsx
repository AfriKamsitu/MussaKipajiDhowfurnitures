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
import { fetchApi, getAuthToken, setAuthToken } from "@/lib/api"

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
  items: { name: string; image: string; quantity: number; price: number }[]
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
  addresses: Address[]
  orders: Order[]
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  signUp: (data: { name: string; email: string; password: string }) => Promise<{ error?: string; role?: Role }>
  signIn: (data: { email: string; password: string }) => Promise<{ error?: string; role?: Role }>
  signInWithProvider: (
    provider: "google" | "facebook",
    token?: string,
  ) => Promise<{ error?: string; role?: Role; redirected?: boolean }>
  signOut: () => void
  updateProfile: (data: Partial<Pick<User, "name" | "email" | "phone" | "avatar">>) => void
  addAddress: (address: Omit<Address, "id">) => void
  updateAddress: (id: string, address: Partial<Address>) => void
  removeAddress: (id: string) => void
  addOrder: (order: Order) => void
  refreshOrders: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type BackendUser = {
  id?: string
  name?: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  createdAt?: string
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
    addresses: Array.isArray(raw.addresses) ? raw.addresses.map(mapAddress) : [],
    orders,
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
    try {
      const orders = await fetchApi<Record<string, unknown>[]>("/api/account/orders")
      return Array.isArray(orders) ? orders.map(mapOrder) : []
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const me = await fetchApi<BackendUser>("/api/auth/me")
        const orders = await loadOrders()
        setUser(toUser(me, orders))
      } catch {
        setAuthToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [loadOrders])

  const applyAuthResponse = useCallback(
    async (payload: AuthResponse) => {
      if (payload.accessToken) setAuthToken(payload.accessToken)
      if (!payload.user) throw new Error("Authentication response missing user.")
      const orders = await loadOrders()
      const next = toUser(payload.user, orders)
      setUser(next)
      return next.role
    },
    [loadOrders],
  )

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ name, email, password }) => {
      try {
        const payload = await fetchApi<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
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
    async ({ email, password }) => {
      try {
        const payload = await fetchApi<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
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
    async (provider, token) => {
      try {
        let providerToken = token
        if (!providerToken) {
          const { requestSocialProviderToken } = await import("@/lib/social-auth")
          providerToken = await requestSocialProviderToken(provider)
        }

        const payload = await fetchApi<AuthResponse>("/api/auth/social", {
          method: "POST",
          body: JSON.stringify({ provider, token: providerToken }),
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
    setUser(null)
  }, [])

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    (data) => {
      if (!user) return
      const next = { ...user, ...data }
      setUser(next)
      fetchApi("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }).catch(() => {})
    },
    [user],
  )

  const addAddress = useCallback<AuthContextValue["addAddress"]>(
    async (address) => {
      if (!user) return
      try {
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
        setUser({ ...user, addresses })
      } catch {
        /* leave UI unchanged on failure */
      }
    },
    [user],
  )

  const updateAddress = useCallback<AuthContextValue["updateAddress"]>(
    async (id, data) => {
      if (!user) return
      const current = user.addresses.find((a) => a.id === id)
      if (!current) return
      const body = { ...current, ...data }
      try {
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
        setUser({ ...user, addresses })
      } catch {
        /* ignore */
      }
    },
    [user],
  )

  const removeAddress = useCallback<AuthContextValue["removeAddress"]>(
    async (id) => {
      if (!user) return
      const previous = user
      setUser({ ...user, addresses: user.addresses.filter((a) => a.id !== id) })
      try {
        await fetchApi(`/api/account/addresses/${id}`, { method: "DELETE" })
      } catch {
        setUser(previous)
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
