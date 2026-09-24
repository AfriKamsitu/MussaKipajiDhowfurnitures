import type { MetadataRoute } from "next"
import { getPublishedProductSlugs } from "@/lib/store-settings-server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
  const now = new Date()
  const staticPages = ["", "/shop", "/offers", "/about", "/contact"].map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }))
  const productSlugs = await getPublishedProductSlugs()
  const products = productSlugs.map((slug) => ({
    url: `${origin}/product/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))
  return [...staticPages, ...products]
}
