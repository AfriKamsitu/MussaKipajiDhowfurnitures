import { NextRequest } from "next/server"
import { getBackendUrl, proxyToBackend } from "@/lib/backend"
import { NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const socialUrl =
    process.env.BACKEND_SOCIAL_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCIAL_AUTH_URL?.trim()

  if (!getBackendUrl() && !socialUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "Backend is not configured. Set BACKEND_URL or BACKEND_SOCIAL_AUTH_URL.",
        data: null,
      },
      { status: 503 },
    )
  }

  // The shared gateway strips refresh tokens from JSON and stores them in the
  // same HttpOnly cookie for both the default and dedicated social endpoints.
  return proxyToBackend(request, socialUrl || undefined)
}
