import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/backend"

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

const CATALOG_ADMIN_PATH = /^\/api\/admin\/(products|categories|banners)(\/|$)/

async function handle(request: NextRequest) {
  const response = await proxyToBackend(request)
  // A product the admin deletes or edits must leave every cached storefront page at once.
  if (request.method !== "GET" && response.ok && CATALOG_ADMIN_PATH.test(request.nextUrl.pathname)) {
    revalidateTag("catalog", { expire: 0 })
  }
  return response
}
