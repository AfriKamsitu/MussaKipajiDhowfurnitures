"use client"

import { useEffect, useState } from "react"
import Image, { type ImageProps } from "next/image"

const PLACEHOLDER = "/placeholder.svg"

/**
 * next/image that never shows a broken picture: a missing, empty or failing
 * source is replaced by the neutral furniture placeholder.
 */
export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false)
  const usable = typeof src === "string" ? src.trim() !== "" && src !== "undefined" && src !== "null" : Boolean(src)

  useEffect(() => setFailed(false), [src])

  return <Image {...props} alt={alt} src={failed || !usable ? PLACEHOLDER : src} onError={() => setFailed(true)} />
}
