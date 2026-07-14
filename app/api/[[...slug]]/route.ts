import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl, proxyToBackend } from "@/lib/backend"

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}

export async function PUT(request: NextRequest) {
  return handle(request)
}

export async function PATCH(request: NextRequest) {
  return handle(request)
}

export async function DELETE(request: NextRequest) {
  return handle(request)
}

async function handle(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/^\/api\/?/, "")
  const segments = pathname.split("/").filter(Boolean)

  // Local health check: confirms the Next.js gateway process is up (does not require backend).
  if (!segments.length || segments[0] === "health") {
    return NextResponse.json({
      success: true,
      message: "API gateway is running",
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        project: "Pajedhow Furnitures",
        backendConfigured: Boolean(getBackendUrl()),
      },
    })
  }

  return proxyToBackend(request)
}
