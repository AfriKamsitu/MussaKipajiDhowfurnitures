const isProduction = process.env.NODE_ENV === "production"
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://accounts.google.com https://connect.facebook.net https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://graph.facebook.com https://*.vercel-insights.com",
  "frame-src 'self' https://accounts.google.com https://www.facebook.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
    : []),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This folder is the project root; without this Next.js picks up a stray lockfile in the user profile.
  turbopack: { root: import.meta.dirname },
  // The on-disk dev cache breaks when a cloud-synced folder (OneDrive) offloads its files
  // ("Failed to open database", os error 388), so development keeps its cache in memory.
  experimental: { turbopackFileSystemCacheForDev: false },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
