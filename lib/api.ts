type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const TOKEN_KEY = "pajedhow.token"
export const AUTH_SESSION_EXPIRED_EVENT = "pajedhow:auth-session-expired"
let inMemoryAuthToken: string | null = null
let legacyTokenMigrated = false

type RefreshResult =
  | { ok: true }
  | { ok: false; error: ApiError }

let refreshPromise: Promise<RefreshResult> | null = null

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  if (!legacyTokenMigrated) {
    legacyTokenMigrated = true
    try {
      // One-time migration for sessions created before access tokens moved
      // to memory. The long-lived refresh credential remains HttpOnly.
      inMemoryAuthToken = window.localStorage.getItem(TOKEN_KEY)
      window.localStorage.removeItem(TOKEN_KEY)
    } catch {
      inMemoryAuthToken = null
    }
  }
  return inMemoryAuthToken
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return
  inMemoryAuthToken = token
  legacyTokenMigrated = true
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // The in-memory session remains usable when storage is unavailable.
  }
}

function expireBrowserSession() {
  setAuthToken(null)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null
  return payload?.message || fallback
}

async function refreshAuthSession(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      })

      if (!response.ok) {
        const expired = response.status === 401 || response.status === 403
        const message = await readErrorMessage(
          response,
          expired
            ? "Your session has expired. Please sign in again."
            : "Unable to renew your session right now. Please try again.",
        )
        const error = new ApiError(message, expired ? 401 : response.status)
        if (expired) expireBrowserSession()
        return { ok: false, error }
      }

      const payload = (await response.json().catch(() => null)) as { accessToken?: string } | null
      if (!payload?.accessToken) {
        return {
          ok: false,
          error: new ApiError("The authentication service returned an invalid response.", 502),
        }
      }

      setAuthToken(payload.accessToken)
      return { ok: true }
    } catch {
      return {
        ok: false,
        error: new ApiError("Unable to reach the authentication service. Please try again.", 503),
      }
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function refreshForRequest() {
  const result = await refreshAuthSession()
  if (!result.ok) throw result.error
}

export async function uploadImage(
  file: File,
  folder: "products" | "banners" | "branding" = "products",
  canRetry = true,
) {
  const token = getAuthToken()
  if (!token) {
    if (canRetry) {
      await refreshForRequest()
      return uploadImage(file, folder, false)
    }
    throw new ApiError("Admin authentication is required to upload images.", 401)
  }

  const body = new FormData()
  body.append("file", file)
  body.append("folder", folder)
  const response = await fetch("/api/uploads/product-image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => null)) as { path?: string; message?: string } | null
  if (response.status === 401 && canRetry) {
    await refreshForRequest()
    return uploadImage(file, folder, false)
  }
  if (!response.ok || !payload?.path) {
    throw new ApiError(payload?.message || "Failed to upload image.", response.status)
  }
  return payload.path
}

export async function deleteUploadedImages(paths: string[], canRetry = true): Promise<void> {
  const localPaths = [...new Set(paths.filter((value) => value.startsWith("/uploads/")))]
  if (!localPaths.length) return

  const token = getAuthToken()
  if (!token) {
    if (canRetry) {
      await refreshForRequest()
      return deleteUploadedImages(localPaths, false)
    }
    throw new ApiError("Admin authentication is required to remove images.", 401)
  }

  const response = await fetch("/api/uploads/product-image", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paths: localPaths }),
    cache: "no-store",
  })
  if (response.status === 401 && canRetry) {
    await refreshForRequest()
    return deleteUploadedImages(localPaths, false)
  }
  if (!response.ok) {
    throw new ApiError(
      await readErrorMessage(response, "Uploaded images could not be removed."),
      response.status,
    )
  }
}

export async function refreshAuthToken(): Promise<boolean> {
  return (await refreshAuthSession()).ok
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
  return fetchApiInternal<T>(path, init, true)
}

export async function downloadApiFile(
  path: string,
  canRefresh = true,
): Promise<{ blob: Blob; filename: string }> {
  const token = getAuthToken()
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  })

  if (response.status === 401 && canRefresh) {
    await refreshForRequest()
    return downloadApiFile(path, false)
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(payload?.message || `Download failed with ${response.status}`, response.status)
  }

  const disposition = response.headers.get("content-disposition") || ""
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const filename = encodedName ? decodeURIComponent(encodedName) : plainName || "report.csv"
  return { blob: await response.blob(), filename }
}

async function fetchApiInternal<T>(path: string, init: RequestInit | undefined, canRefresh: boolean): Promise<T> {
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

  const refreshablePath = path === "/api/auth/me" || !path.startsWith("/api/auth/")
  if (response.status === 401 && canRefresh && refreshablePath) {
    await refreshForRequest()
    return fetchApiInternal<T>(path, init, false)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? String(payload.message)
        : `Request failed with ${response.status}`
    throw new ApiError(message, response.status)
  }

  // Support both enveloped { success, data } and raw JSON from the backend.
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return payload.data as T
  }

  return payload as T
}
