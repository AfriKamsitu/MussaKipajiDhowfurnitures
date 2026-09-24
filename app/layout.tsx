import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { StoreProvider } from '@/components/store-provider'
import { AuthProvider } from '@/components/auth-provider'
import { AppSplash } from '@/components/app-splash'
import { StoreSettingsProvider } from '@/components/store-settings-provider'
import { getServerStoreSettings } from '@/lib/store-settings-server'
import './globals.css'
import './alibaba-fonts.css'
import './editorial.css'

function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    return new URL(configured)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerStoreSettings()
  return {
    metadataBase: appOrigin(),
    title: {
      default: settings.metaTitle,
      template: `%s | ${settings.storeName}`,
    },
    description: settings.metaDescription,
    robots: {
      index: settings.searchIndexingEnabled,
      follow: settings.searchIndexingEnabled,
    },
    icons: {
      icon: settings.logoUrl,
      apple: settings.logoUrl,
    },
    openGraph: {
      type: 'website',
      title: settings.metaTitle,
      description: settings.metaDescription,
      siteName: settings.storeName,
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#263228',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="light bg-background"
    >
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[120] -translate-y-24 rounded-sm bg-white px-4 py-2 text-sm font-bold text-[#11130f] shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#c5a274] focus:ring-offset-2 focus:ring-offset-[#11130f]"
        >
          Skip to content
        </a>
        <AppSplash />
        <AuthProvider>
          <StoreSettingsProvider>
            <StoreProvider>{children}</StoreProvider>
          </StoreSettingsProvider>
        </AuthProvider>
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}
