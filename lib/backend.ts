import { NextRequest, NextResponse } from "next/server"

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
])

/**
 * Forward the incoming request to the real backend, preserving method, path, query, body, and auth headers.
 * Path is the Next.js pathname (e.g. `/api/products`) appended to BACKEND_URL.
 */
export async function proxyToBackend(request: NextRequest): Promise<NextResponse> {
  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    return gatewayError(
      "Backend is not configured. Set BACKEND_URL in your environment.",
      503,
    )
  }

  const target = `${backendUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
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
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer()
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

    const buffer = await upstream.arrayBuffer()
    return new NextResponse(buffer, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error"
    return gatewayError(`Failed to reach backend at ${backendUrl}: ${detail}`, 502)
  }
}
