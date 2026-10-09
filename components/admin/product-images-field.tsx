"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Star, UploadCloud, X } from "lucide-react"
import { uploadImage } from "@/lib/api"
import { cn } from "@/lib/utils"

/** Matches ProductRequest.images (@Size(max = 12)) on the backend. */
export const MAX_PRODUCT_IMAGES = 12
/** Matches the 5MB limit enforced by /api/uploads/product-image. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]

/** One gallery picture: either already saved on the server, or a file waiting to be uploaded. */
export type ProductImageItem = {
  key: string
  /** Saved path (e.g. /uploads/products/x.jpg) or a local preview URL for a new file. */
  url: string
  file?: File
}

export function savedImageItems(paths: string[]): ProductImageItem[] {
  return [...new Set(paths.filter((path) => path && path !== "/placeholder.svg"))].map((path) => ({
    key: path,
    url: path,
  }))
}

/**
 * Upload the new files and return every image path in gallery order, plus the
 * paths created by this call so a failed save can remove them again.
 */
export async function uploadImageItems(items: ProductImageItem[]) {
  const paths: string[] = []
  const uploaded: string[] = []
  for (const item of items) {
    if (item.file) {
      const path = await uploadImage(item.file)
      uploaded.push(path)
      paths.push(path)
    } else {
      paths.push(item.url)
    }
  }
  return { paths, uploaded }
}

/**
 * Product gallery editor. Pictures can be added in several goes, removed one
 * at a time, and any picture can be made the cover (the first image, which is
 * what listings and the cart show).
 */
export function ProductImagesField({
  items,
  onChange,
  disabled = false,
}: {
  items: ProductImageItem[]
  onChange: (items: ProductImageItem[]) => void
  disabled?: boolean
}) {
  const [problem, setProblem] = useState<string | null>(null)
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Release local previews when the form goes away.
  useEffect(
    () => () => {
      itemsRef.current.forEach((item) => {
        if (item.file) URL.revokeObjectURL(item.url)
      })
    },
    [],
  )

  function addFiles(files: FileList | null) {
    if (!files?.length) return
    const room = MAX_PRODUCT_IMAGES - items.length
    const rejected: string[] = []
    const accepted: ProductImageItem[] = []
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} is not a PNG, JPG or WEBP image`)
      } else if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name} is larger than 5MB`)
      } else if (accepted.length >= room) {
        rejected.push(`${file.name} was skipped: a product can have at most ${MAX_PRODUCT_IMAGES} images`)
      } else {
        accepted.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          url: URL.createObjectURL(file),
          file,
        })
      }
    }
    setProblem(rejected.length ? rejected.join(". ") + "." : null)
    if (accepted.length) onChange([...items, ...accepted])
  }

  function remove(item: ProductImageItem) {
    if (item.file) URL.revokeObjectURL(item.url)
    setProblem(null)
    onChange(items.filter((current) => current.key !== item.key))
  }

  function makeCover(item: ProductImageItem) {
    onChange([item, ...items.filter((current) => current.key !== item.key)])
  }

  const full = items.length >= MAX_PRODUCT_IMAGES

  return (
    <div>
      <label
        className={cn(
          "group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/45 px-4 py-7 text-center transition-colors",
          disabled || full ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-secondary",
        )}
      >
        <UploadCloud className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          {items.length ? "Add more images" : "Choose images from computer"}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          PNG, JPG or WEBP, up to 5MB each. {items.length}/{MAX_PRODUCT_IMAGES} added.
        </span>
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          disabled={disabled || full}
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files)
            // Allow picking the same file again after removing it.
            event.target.value = ""
          }}
        />
      </label>

      {problem && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {problem}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <li key={item.key} className="relative overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative aspect-square">
                <Image
                  src={item.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized={Boolean(item.file)}
                />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Cover
                  </span>
                )}
                {item.file && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    New
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={disabled}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-white/95 text-foreground shadow hover:text-destructive disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(item)}
                  disabled={disabled}
                  className="flex min-h-9 w-full items-center justify-center gap-1 border-t border-border text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  <Star className="size-3.5" aria-hidden="true" /> Make cover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
