import type { Product } from "@/lib/data"

type ImageSignature = {
  digest: string
  histogram: number[]
  luminance: number[]
  average: [number, number, number]
  aspectRatio: number
}

export type ImageSearchMatch = {
  product: Product
  exact: boolean
  score: number
}

const GRID_SIZE = 16
const HISTOGRAM_BINS = 4
const signatureCache = new Map<string, Promise<ImageSignature>>()

export async function findSimilarProducts(
  file: File,
  products: Product[],
  onProgress?: (completed: number, total: number) => void,
): Promise<ImageSearchMatch[]> {
  const query = await createSignature(file)
  const candidates = products.filter((product) => Boolean(product.image))
  const matches: ImageSearchMatch[] = []
  let nextIndex = 0
  let completed = 0

  async function worker() {
    while (nextIndex < candidates.length) {
      const product = candidates[nextIndex++]
      try {
        const signature = await productSignature(product.image)
        const exact = query.digest === signature.digest
        matches.push({
          product,
          exact,
          score: exact ? 1 : similarity(query, signature),
        })
      } catch {
        // A broken catalog image should not stop the rest of the comparison.
      } finally {
        completed++
        onProgress?.(completed, candidates.length)
      }
    }
  }

  const concurrency = Math.min(4, Math.max(candidates.length, 1))
  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  return matches
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score)
    .slice(0, 8)
}

function productSignature(source: string) {
  const cached = signatureCache.get(source)
  if (cached) return cached

  const pending = fetch(source, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load catalog image: ${response.status}`)
      return response.blob()
    })
    .then(createSignature)

  signatureCache.set(source, pending)
  pending.catch(() => signatureCache.delete(source))
  return pending
}

async function createSignature(blob: Blob): Promise<ImageSignature> {
  if (!blob.type.startsWith("image/")) throw new Error("The selected file is not an image.")

  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = GRID_SIZE
  canvas.height = GRID_SIZE
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) {
    bitmap.close()
    throw new Error("Image comparison is not supported by this browser.")
  }

  context.drawImage(bitmap, 0, 0, GRID_SIZE, GRID_SIZE)
  const aspectRatio = bitmap.width / Math.max(bitmap.height, 1)
  const pixels = context.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data
  const histogram = Array.from({ length: HISTOGRAM_BINS ** 3 }, () => 0)
  const luminance: number[] = []
  let red = 0
  let green = 0
  let blue = 0
  let visiblePixels = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255
    const r = pixels[index] * alpha + 255 * (1 - alpha)
    const g = pixels[index + 1] * alpha + 255 * (1 - alpha)
    const b = pixels[index + 2] * alpha + 255 * (1 - alpha)
    red += r
    green += g
    blue += b
    visiblePixels++
    luminance.push((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255)

    const rBin = Math.min(HISTOGRAM_BINS - 1, Math.floor((r / 256) * HISTOGRAM_BINS))
    const gBin = Math.min(HISTOGRAM_BINS - 1, Math.floor((g / 256) * HISTOGRAM_BINS))
    const bBin = Math.min(HISTOGRAM_BINS - 1, Math.floor((b / 256) * HISTOGRAM_BINS))
    histogram[rBin * HISTOGRAM_BINS ** 2 + gBin * HISTOGRAM_BINS + bBin]++
  }

  bitmap.close()
  const divisor = Math.max(visiblePixels, 1)
  const digest = await sha256(blob)
  return {
    digest,
    histogram: histogram.map((count) => count / divisor),
    luminance,
    average: [red / divisor / 255, green / divisor / 255, blue / divisor / 255],
    aspectRatio: blob.size > 0 ? aspectRatio : 1,
  }
}

async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function similarity(left: ImageSignature, right: ImageSignature) {
  const histogramDistance = left.histogram.reduce(
    (total, value, index) => total + Math.abs(value - right.histogram[index]),
    0,
  )
  const histogramScore = clamp(1 - histogramDistance / 2)

  const luminanceError = left.luminance.reduce((total, value, index) => {
    const difference = value - right.luminance[index]
    return total + difference * difference
  }, 0) / left.luminance.length
  const luminanceScore = clamp(1 - Math.sqrt(luminanceError))

  const colorError = Math.sqrt(
    left.average.reduce((total, value, index) => {
      const difference = value - right.average[index]
      return total + difference * difference
    }, 0) / 3,
  )
  const colorScore = clamp(1 - colorError)
  const aspectScore = clamp(1 - Math.abs(Math.log(left.aspectRatio / right.aspectRatio)) / 2)

  return histogramScore * 0.45 + luminanceScore * 0.35 + colorScore * 0.15 + aspectScore * 0.05
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}
