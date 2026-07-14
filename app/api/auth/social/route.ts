import { NextRequest } from "next/server"
import { getBackendUrl, proxyToBackend } from "@/lib/backend"
import { NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const socialUrl =
    process.env.BACKEND_SOCIAL_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCIAL_AUTH_URL?.trim()

  // Dedicated social auth URL takes precedence; otherwise forward via the standard gateway path.
  if (socialUrl) {
    const body = await request.arrayBuffer()
    const headers = new Headers({ "Content-Type": "application/json" })
    const auth = request.headers.get("authorization")
    if (auth) headers.set("authorization", auth)

    try {
      const upstream = await fetch(socialUrl, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
      })
      const buffer = await upstream.arrayBuffer()
      return new NextResponse(buffer, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
      })
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error"
      return NextResponse.json(
        { success: false, message: `Failed to reach social auth backend: ${detail}`, data: null },
        { status: 502 },
      )
    }
  }

  if (!getBackendUrl()) {
    return NextResponse.json(
      {
        success: false,
        message: "Backend is not configured. Set BACKEND_URL or BACKEND_SOCIAL_AUTH_URL.",
        data: null,
      },
      { status: 503 },
    )
  }

  return proxyToBackend(request)
}
