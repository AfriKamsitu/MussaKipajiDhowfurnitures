import { NextRequest, NextResponse } from "next/server"
import {
  attachRefreshCookie,
  clearRefreshCookie,
  getBackendUrl,
  isSameOriginRequest,
  REFRESH_COOKIE_NAME,
} from "@/lib/backend"

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-site refresh requests are not allowed." }, { status: 403 })
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  if (!refreshToken) {
    return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 })
  }

  const backendUrl = getBackendUrl()
  if (!backendUrl) return NextResponse.json({ message: "Backend is not configured." }, { status: 503 })

  try {
    const upstream = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    const payload = (await upstream.json().catch(() => null)) as Record<string, unknown> | null
    if (!upstream.ok || !payload) {
      const sessionExpired = upstream.status === 400 || upstream.status === 401 || upstream.status === 403
      const response = NextResponse.json(
        {
          message: sessionExpired
            ? "Your session has expired. Please sign in again."
            : typeof payload?.message === "string"
              ? payload.message
              : "The authentication service could not renew your session.",
        },
        { status: sessionExpired ? 401 : upstream.status || 503 },
      )
      // A temporary upstream outage must not destroy a still-valid session.
      if (sessionExpired) clearRefreshCookie(response, request)
      return response
    }

    const rotatedRefreshToken = typeof payload.refreshToken === "string" ? payload.refreshToken : null
    delete payload.refreshToken
    const response = NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    })
    if (rotatedRefreshToken) attachRefreshCookie(response, rotatedRefreshToken, request)
    return response
  } catch {
    return NextResponse.json({ message: "Unable to refresh the session." }, { status: 503 })
  }
}
