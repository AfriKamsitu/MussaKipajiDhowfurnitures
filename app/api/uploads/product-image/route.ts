import { randomUUID } from "crypto"
import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend"

export const runtime = "nodejs"

const MAX_BYTES = 5 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_BYTES + 1024 * 1024
const ALLOWED_FOLDERS = new Set(["products", "banners", "branding"])
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])
const LOCAL_UPLOAD_PATTERN = /^\/uploads\/(products|banners|branding)\/([0-9a-f-]{36})\.(jpg|png|webp)$/i

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status })
}

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  if (mimeType === "image/png") {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return buffer.length >= png.length && buffer.subarray(0, png.length).equals(png)
  }
  if (mimeType === "image/webp") {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString("ascii") === "RIFF"
      && buffer.subarray(8, 12).toString("ascii") === "WEBP"
  }
  return false
}

async function requireAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) {
    return jsonError("Admin authentication is required.", 401)
  }

  const backendUrl = getBackendUrl()
  if (!backendUrl) return jsonError("Backend is not configured.", 503)

  try {
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: authorization, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    const payload = (await response.json().catch(() => null)) as
      | { role?: string; data?: { role?: string }; message?: string }
      | null

    if (response.status === 401) {
      return jsonError("Your admin session has expired. Please sign in again.", 401)
    }
    if (response.status === 403) {
      return jsonError("Your account no longer has administrator access.", 403)
    }
    if (!response.ok) {
      return jsonError(
        response.status >= 500
          ? "The authentication service is temporarily unavailable. Please try again."
          : payload?.message || "Administrator access could not be verified.",
        response.status >= 500 ? 503 : response.status,
      )
    }

    const user = payload?.data ?? payload
    if (!String(user?.role ?? "").toUpperCase().includes("ADMIN")) {
      return jsonError("Only administrators can upload images.", 403)
    }
    return null
  } catch {
    return jsonError("Unable to verify administrator access right now. Please try again.", 503)
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > MAX_REQUEST_BYTES) return jsonError("Upload request is too large.", 413)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError("Invalid multipart upload.", 400)
  }

  const file = formData.get("file")
  const folder = String(formData.get("folder") || "products").trim().toLowerCase()

  if (!(file instanceof File) || file.size === 0) return jsonError("Image file is required.", 400)
  if (!ALLOWED_FOLDERS.has(folder)) return jsonError("Invalid upload destination.", 400)
  if (!ALLOWED_TYPES.has(file.type)) return jsonError("Only JPG, PNG, and WEBP images are allowed.", 400)
  if (file.size > MAX_BYTES) return jsonError("Image must be 5MB or smaller.", 413)

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!hasValidSignature(buffer, file.type)) {
    return jsonError("The uploaded file does not contain a valid image.", 400)
  }

  const ext = ALLOWED_TYPES.get(file.type)
  const filename = `${randomUUID()}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder)
  const diskPath = path.join(uploadDir, filename)

  await mkdir(uploadDir, { recursive: true })
  await writeFile(diskPath, buffer, { flag: "wx" })

  return NextResponse.json({ path: `/uploads/${folder}/${filename}` }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const payload = (await request.json().catch(() => null)) as { paths?: unknown } | null
  if (!Array.isArray(payload?.paths) || payload.paths.length > 20) {
    return jsonError("One to twenty upload paths are required.", 400)
  }

  const uploadRoot = path.resolve(process.cwd(), "public", "uploads")
  const paths = payload.paths.filter((value): value is string => typeof value === "string")
  if (paths.length !== payload.paths.length || paths.some((value) => !LOCAL_UPLOAD_PATTERN.test(value))) {
    return jsonError("Only generated local upload paths can be removed.", 400)
  }

  await Promise.all(paths.map(async (publicPath) => {
    const match = LOCAL_UPLOAD_PATTERN.exec(publicPath)
    if (!match) return
    const diskPath = path.resolve(uploadRoot, match[1], `${match[2]}.${match[3].toLowerCase()}`)
    if (!diskPath.startsWith(`${uploadRoot}${path.sep}`)) return
    try {
      await unlink(diskPath)
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : ""
      if (code !== "ENOENT") throw error
    }
  }))

  return new NextResponse(null, { status: 204 })
}
