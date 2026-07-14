type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const TOKEN_KEY = "pajedhow.token"

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl()
  const token = getAuthToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  }

  if (token && !(headers as Record<string, string>).Authorization) {
    ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? String(payload.message)
        : `Request failed with ${response.status}`
    throw new Error(message)
  }

  // Support both enveloped { success, data } and raw JSON from the backend.
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return payload.data as T
  }

  return payload as T
}
