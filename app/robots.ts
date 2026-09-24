import type { MetadataRoute } from "next"
import { getServerStoreSettings } from "@/lib/store-settings-server"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getServerStoreSettings()
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")

  return {
    rules: settings.searchIndexingEnabled
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin/", "/account/", "/api/", "/checkout"],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${origin}/sitemap.xml`,
  }
}
