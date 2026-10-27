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
  // Only site paths and web addresses can be shown; anything else (such as a
  // file path from someone's computer) would make next/image throw.
  const usable = typeof src === "string" ? /^(\/|https?:\/\/|data:image\/|blob:)/.test(src.trim()) : Boolean(src)

  useEffect(() => setFailed(false), [src])

  return <Image {...props} alt={alt} src={failed || !usable ? PLACEHOLDER : src} onError={() => setFailed(true)} />
}
