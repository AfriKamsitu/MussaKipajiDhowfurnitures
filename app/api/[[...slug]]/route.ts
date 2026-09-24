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

async function handle(request: NextRequest) {
  return proxyToBackend(request)
}
