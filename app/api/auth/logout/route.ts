import { NextRequest, NextResponse } from "next/server"
import { clearRefreshCookie, isSameOriginRequest } from "@/lib/backend"

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Cross-site logout requests are not allowed." }, { status: 403 })
  }
  const response = NextResponse.json({ message: "Signed out." }, { headers: { "Cache-Control": "no-store" } })
  clearRefreshCookie(response, request)
  return response
}
