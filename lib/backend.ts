import { NextRequest, NextResponse } from "next/server"

export const REFRESH_COOKIE_NAME = "pajedhow.refresh"
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60
const MAX_REQUEST_BYTES = 6 * 1024 * 1024
const UPSTREAM_TIMEOUT_MS = 12_000
const AUTH_RESPONSE_PATHS = new Set([
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/social",
  "/api/auth/refresh",
])
const AUTH_MUTATION_PATHS = new Set([
  ...AUTH_RESPONSE_PATHS,
  "/api/auth/password-reset/request",
  "/api/auth/password-reset/confirm",
])

/**
 * Resolve the upstream backend base URL (no trailing slash).
 * Prefer server-only BACKEND_URL; NEXT_PUBLIC_BACKEND_URL is a convenient fallback.
 */
export function getBackendUrl(): string | null {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    ""

  if (!raw) return null
  return raw.replace(/\/$/, "")
}

function gatewayError(message: string, status: number) {
  return NextResponse.json({ success: false, message, data: null }, { status })
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "cookie",
  // Undici rejects this request header instead of forwarding it.
  "expect",
  // Browser CORS applies at this same-origin gateway, not on the
  // server-to-server hop to Spring Boot.
  "origin",
])

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null
}

function configuredAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

function requestUsesHttps(request: NextRequest) {
  const forwardedProtocol = firstForwardedValue(request.headers.get("x-forwarded-proto"))
  if (forwardedProtocol) return forwardedProtocol.toLowerCase() === "https"
  if (request.nextUrl.protocol === "https:") return true
  return configuredAppUrl()?.protocol === "https:"
}

/**
 * Validate browser-only auth mutations without assuming Next.js sees the public
 * protocol/host directly. Reverse proxies commonly expose those through
 * X-Forwarded-* headers.
 */
export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true

  let suppliedOrigin: URL
  try {
    suppliedOrigin = new URL(origin)
  } catch {
    return false
  }

  const acceptedOrigins = new Set<string>([request.nextUrl.origin])
  const appUrl = configuredAppUrl()
  if (appUrl) acceptedOrigins.add(appUrl.origin)

  const forwardedHost =
    firstForwardedValue(request.headers.get("x-forwarded-host"))
    ?? firstForwardedValue(request.headers.get("host"))
  const forwardedProtocol =
    firstForwardedValue(request.headers.get("x-forwarded-proto"))
    ?? request.nextUrl.protocol.replace(":", "")

  if (forwardedHost && /^(https?|wss?)$/i.test(forwardedProtocol)) {
    const httpProtocol = forwardedProtocol.toLowerCase().replace(/^ws/, "http")
    try {
      acceptedOrigins.add(new URL(`${httpProtocol}://${forwardedHost}`).origin)
    } catch {
      return false
    }
  }

  return acceptedOrigins.has(suppliedOrigin.origin)
}

export function attachRefreshCookie(response: NextResponse, token: string, request: NextRequest) {
  response.cookies.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: requestUsesHttps(request),
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
    priority: "high",
  })
}

export function clearRefreshCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: requestUsesHttps(request),
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
    priority: "high",
  })
}

/**
 * Forward the incoming request to the real backend, preserving method, path, query, body, and auth headers.
 * Path is the Next.js pathname (e.g. `/api/products`) appended to BACKEND_URL.
 */
export async function proxyToBackend(
  request: NextRequest,
  absoluteTarget?: string,
): Promise<NextResponse> {
  const backendUrl = getBackendUrl()
  if (!backendUrl && !absoluteTarget) {
    return gatewayError(
      "Backend is not configured. Set BACKEND_URL in your environment.",
      503,
    )
  }

  const target = absoluteTarget || `${backendUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
  if (
    request.method === "POST"
    && AUTH_MUTATION_PATHS.has(request.nextUrl.pathname)
    && !isSameOriginRequest(request)
  ) {
    return gatewayError("Cross-site authentication requests are not allowed.", 403)
  }

  const declaredLength = Number(request.headers.get("content-length") || 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return gatewayError("Request body is too large.", 413)
  }
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer()
    if (body.byteLength > MAX_REQUEST_BYTES) {
      return gatewayError("Request body is too large.", 413)
    }
    if (body.byteLength > 0) {
      init.body = body
    }
  }

  try {
    const upstream = await fetch(target, init)
    const responseHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      if (HOP_BY_HOP.has(key.toLowerCase())) return
      // Let Next set content-encoding / length from the body we return.
      if (key.toLowerCase() === "content-encoding") return
      responseHeaders.set(key, value)
    })

    if (upstream.status === 204 || upstream.status === 304) {
      responseHeaders.delete("content-type")
      return new NextResponse(null, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      })
    }

    const buffer = await upstream.arrayBuffer()
    if (upstream.ok && AUTH_RESPONSE_PATHS.has(request.nextUrl.pathname)) {
      try {
        const payload = JSON.parse(Buffer.from(buffer).toString("utf8")) as Record<string, unknown>
        const refreshToken = typeof payload.refreshToken === "string" ? payload.refreshToken : null
        if (refreshToken) {
          delete payload.refreshToken
          responseHeaders.set("Cache-Control", "no-store")
          const response = NextResponse.json(payload, {
            status: upstream.status,
            headers: responseHeaders,
          })
          attachRefreshCookie(response, refreshToken, request)
          return response
        }
      } catch {
        // Preserve non-JSON upstream responses unchanged.
      }
    }
    return new NextResponse(buffer, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[backend-gateway] Upstream request failed.", {
      method: request.method,
      path: request.nextUrl.pathname,
      error,
    })
    const timedOut = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError")
    return gatewayError(
      timedOut
        ? "The backend service took too long to respond. Please try again."
        : "The backend service is temporarily unavailable. Please try again.",
      timedOut ? 504 : 502,
    )
  }
}
