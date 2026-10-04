"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock3, LogIn, MessageCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { fetchApi } from "@/lib/api"
import { setRuntimeWhatsappNumber } from "@/lib/whatsapp"

export type PublicStoreSettings = {
  storeName: string
  tagline: string
  storeEmail: string
  storePhone: string
  currency: string
  timezone: string
  logoUrl: string
  addressLine1: string
  addressLine2: string
  city: string
  country: string
  cashOnDeliveryEnabled: boolean
  bankTransferEnabled: boolean
  flatShippingRate: number
  freeShippingThreshold: number
  estimatedDeliveryDays: number
  storePickupEnabled: boolean
  metaTitle: string
  metaDescription: string
  searchIndexingEnabled: boolean
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string
  whatsappNumber: string
  maintenanceMode: boolean
  maintenanceMessage: string
}

export const defaultStoreSettings: PublicStoreSettings = {
  storeName: "Paje Dhow Furniture",
  tagline: "Handcrafted furniture for beautiful spaces",
  storeEmail: "pajedhowfurniture@gmail.com",
  storePhone: "+255 762 082 422",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  logoUrl: "/paje-dhow-furniture-logo.jpeg",
  addressLine1: "",
  addressLine2: "",
  city: "Zanzibar",
  country: "Tanzania",
  cashOnDeliveryEnabled: true,
  bankTransferEnabled: false,
  flatShippingRate: 0,
  freeShippingThreshold: 0,
  estimatedDeliveryDays: 5,
  storePickupEnabled: true,
  metaTitle: "Paje Dhow Furniture",
  metaDescription: "Discover handcrafted furniture from Paje Dhow Furniture.",
  searchIndexingEnabled: true,
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  whatsappNumber: "255762082422",
  maintenanceMode: false,
  maintenanceMessage: "We are improving the store. Please check back shortly.",
}

const StoreSettingsContext = createContext<PublicStoreSettings>(defaultStoreSettings)

export function useStoreSettings() {
  return useContext(StoreSettingsContext)
}

function MaintenanceScreen({ settings }: { settings: PublicStoreSettings }) {
  const whatsapp = settings.whatsappNumber.replace(/\D/g, "")
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-secondary/40 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-7 text-center shadow-elevated sm:p-10">
        <Image
          src={settings.logoUrl || defaultStoreSettings.logoUrl}
          alt={`${settings.storeName} logo`}
          width={96}
          height={96}
          className="mx-auto size-24 rounded-2xl object-cover shadow-soft"
          unoptimized
          priority
        />
        <span className="mx-auto mt-6 flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock3 className="size-5" />
        </span>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">Scheduled maintenance</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{settings.storeName} will be back soon</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          {settings.maintenanceMessage}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <MessageCircle className="size-4" />
              Contact us
            </a>
          )}
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            <LogIn className="size-4" />
            Administrator sign in
          </Link>
        </div>
      </section>
    </main>
  )
}

export function StoreSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode
  /** Settings read on the server; lets the first render show real content. */
  initialSettings?: Partial<PublicStoreSettings> | null
}) {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<PublicStoreSettings>(() => ({
    ...defaultStoreSettings,
    ...(initialSettings ?? {}),
  }))
  const [resolved, setResolved] = useState(Boolean(initialSettings))

  useEffect(() => {
    let active = true
    if (initialSettings?.whatsappNumber) setRuntimeWhatsappNumber(initialSettings.whatsappNumber)
    fetchApi<PublicStoreSettings>("/api/config/store")
      .then((data) => {
        if (active) {
          setSettings({ ...defaultStoreSettings, ...data })
          setRuntimeWhatsappNumber(data.whatsappNumber)
        }
      })
      .catch(() => {
        // The storefront remains usable with safe local defaults if config is unavailable.
      })
      .finally(() => {
        if (active) setResolved(true)
      })

    function handleSettingsUpdated(event: Event) {
      const customEvent = event as CustomEvent<Partial<PublicStoreSettings>>
      if (customEvent.detail) {
        setSettings((current) => ({ ...current, ...customEvent.detail }))
        setRuntimeWhatsappNumber(customEvent.detail.whatsappNumber)
        setResolved(true)
      }
    }
    window.addEventListener("store-settings-updated", handleSettingsUpdated)
    return () => {
      active = false
      window.removeEventListener("store-settings-updated", handleSettingsUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial settings are a first-render seed only
  }, [])

  const value = useMemo(() => settings, [settings])
  const bypassMaintenance =
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    user?.role === "admin"

  return (
    <StoreSettingsContext.Provider value={value}>
      {(!resolved || (settings.maintenanceMode && authLoading)) && !bypassMaintenance ? (
        <div className="grid min-h-screen place-items-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-label="Loading store" />
        </div>
      ) : settings.maintenanceMode && !bypassMaintenance ? (
        <MaintenanceScreen settings={settings} />
      ) : (
        children
      )}
    </StoreSettingsContext.Provider>
  )
}
