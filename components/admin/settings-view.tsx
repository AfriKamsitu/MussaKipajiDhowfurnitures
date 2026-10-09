"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Settings2,
  Share2,
  ShieldAlert,
  Store,
  Truck,
  UploadCloud,
} from "lucide-react"
import { ApiError, fetchApi, uploadImage } from "@/lib/api"
import { cn } from "@/lib/utils"

type SettingsState = {
  version: number
  storeName: string
  tagline: string
  storeEmail: string
  storePhone: string
  currency: "TZS" | "USD" | "KES"
  timezone: string
  logoUrl: string
  addressLine1: string
  addressLine2: string
  city: string
  country: string
  businessRegistrationNumber: string
  cashOnDeliveryEnabled: boolean
  bankTransferEnabled: boolean
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  flatShippingRate: number
  freeShippingThreshold: number
  estimatedDeliveryDays: number
  storePickupEnabled: boolean
  metaTitle: string
  metaDescription: string
  searchIndexingEnabled: boolean
  senderName: string
  senderEmail: string
  orderNotificationEmail: string
  orderConfirmationEnabled: boolean
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string
  whatsappNumber: string
  maintenanceMode: boolean
  maintenanceMessage: string
  updatedBy: string
  updatedAt: string | null
}

type EditableKey = Exclude<keyof SettingsState, "updatedBy" | "updatedAt">
type SectionId = "general" | "store" | "payments" | "shipping" | "seo" | "email" | "social" | "maintenance"
type Notice = { type: "success" | "error" | "warning"; text: string }

const initialSettings: SettingsState = {
  version: 0,
  storeName: "Kipaji Dhow Furniture",
  tagline: "Handcrafted furniture for beautiful spaces",
  storeEmail: "pajedhowfurniture@gmail.com",
  storePhone: "+255 762 082 422",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  logoUrl: "/kipaji-dhow-furniture-logo.jpg",
  addressLine1: "",
  addressLine2: "",
  city: "Zanzibar",
  country: "Tanzania",
  businessRegistrationNumber: "",
  cashOnDeliveryEnabled: true,
  bankTransferEnabled: false,
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  flatShippingRate: 0,
  freeShippingThreshold: 0,
  estimatedDeliveryDays: 5,
  storePickupEnabled: true,
  metaTitle: "Kipaji Dhow Furniture",
  metaDescription: "Discover handcrafted furniture from Kipaji Dhow Furniture.",
  searchIndexingEnabled: true,
  senderName: "Kipaji Dhow Furniture",
  senderEmail: "pajedhowfurniture@gmail.com",
  orderNotificationEmail: "pajedhowfurniture@gmail.com",
  orderConfirmationEnabled: true,
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  whatsappNumber: "255762082422",
  maintenanceMode: false,
  maintenanceMessage: "We are improving the store. Please check back shortly.",
  updatedBy: "System",
  updatedAt: null,
}

const sections: {
  id: SectionId
  label: string
  description: string
  icon: React.ElementType
}[] = [
  { id: "general", label: "General", description: "Identity and localization", icon: Settings2 },
  { id: "store", label: "Store information", description: "Address and legal details", icon: Building2 },
  { id: "payments", label: "Payments", description: "Accepted payment methods", icon: CreditCard },
  { id: "shipping", label: "Shipping", description: "Rates and delivery options", icon: Truck },
  { id: "seo", label: "SEO", description: "Search appearance", icon: Search },
  { id: "email", label: "Email", description: "Sender and notifications", icon: Mail },
  { id: "social", label: "Social links", description: "Public contact channels", icon: Share2 },
  { id: "maintenance", label: "Maintenance", description: "Store availability", icon: ShieldAlert },
]

const timezones = [
  "Africa/Dar_es_Salaam",
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Kigali",
  "Africa/Johannesburg",
  "UTC",
]

const labelCls = "mb-1.5 block text-sm font-medium text-foreground"
const inputCls =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-secondary/70 disabled:text-muted-foreground"

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  danger,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description: string
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? (danger ? "bg-destructive" : "bg-primary") : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  )
}

function SectionHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function formatLastSaved(value: string | null) {
  if (!value) return "Not saved yet"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Saved"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
}

export function SettingsView() {
  const [active, setActive] = useState<SectionId>("general")
  const [settings, setSettings] = useState<SettingsState>(initialSettings)
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialSettings))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditableKey, string>>>({})
  const [hasConflict, setHasConflict] = useState(false)

  const isDirty = useMemo(() => JSON.stringify(settings) !== savedSnapshot, [savedSnapshot, settings])
  const activeSection = sections.find((section) => section.id === active) ?? sections[0]

  async function loadSettings(showNotice = false) {
    setLoading(true)
    setHasConflict(false)
    try {
      const data = await fetchApi<SettingsState>("/api/admin/settings")
      const normalized = { ...initialSettings, ...data }
      setSettings(normalized)
      setSavedSnapshot(JSON.stringify(normalized))
      setFieldErrors({})
      setNotice(showNotice ? { type: "success", text: "Latest settings loaded." } : null)
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Could not load system settings.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!isDirty) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnBeforeLeaving)
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving)
  }, [isDirty])

  function update<K extends EditableKey>(key: K, value: SettingsState[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setNotice(null)
  }

  function validate() {
    const errors: Partial<Record<EditableKey, string>> = {}
    const required: Array<[EditableKey, string]> = [
      ["storeName", "Store name is required."],
      ["tagline", "Tagline is required."],
      ["storeEmail", "Store email is required."],
      ["storePhone", "Store phone is required."],
      ["logoUrl", "A store logo is required."],
      ["city", "City is required."],
      ["country", "Country is required."],
      ["metaTitle", "SEO title is required."],
      ["metaDescription", "SEO description is required."],
      ["senderName", "Sender name is required."],
      ["senderEmail", "Sender email is required."],
      ["orderNotificationEmail", "Notification email is required."],
      ["whatsappNumber", "WhatsApp number is required."],
      ["maintenanceMessage", "A maintenance message is required."],
    ]
    required.forEach(([key, message]) => {
      if (!String(settings[key]).trim()) errors[key] = message
    })

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    ;(["storeEmail", "senderEmail", "orderNotificationEmail"] as EditableKey[]).forEach((key) => {
      if (String(settings[key]).trim() && !emailPattern.test(String(settings[key]))) {
        errors[key] = "Enter a valid email address."
      }
    })

    ;(["facebookUrl", "instagramUrl", "tiktokUrl"] as EditableKey[]).forEach((key) => {
      const value = String(settings[key]).trim()
      if (value && !/^https?:\/\/.+/i.test(value)) {
        errors[key] = "Use a full URL beginning with http:// or https://."
      }
    })

    if (!settings.cashOnDeliveryEnabled && !settings.bankTransferEnabled) {
      errors.cashOnDeliveryEnabled = "Keep at least one payment method enabled."
    }
    if (settings.bankTransferEnabled) {
      if (!settings.bankName.trim()) errors.bankName = "Bank name is required."
      if (!settings.bankAccountName.trim()) errors.bankAccountName = "Account name is required."
      if (!settings.bankAccountNumber.trim()) errors.bankAccountNumber = "Account number is required."
    }
    if (settings.flatShippingRate < 0) errors.flatShippingRate = "Rate cannot be negative."
    if (settings.freeShippingThreshold < 0) errors.freeShippingThreshold = "Threshold cannot be negative."
    if (settings.estimatedDeliveryDays < 1 || settings.estimatedDeliveryDays > 60) {
      errors.estimatedDeliveryDays = "Delivery time must be between 1 and 60 days."
    }
    if (settings.metaTitle.length > 70) errors.metaTitle = "Keep the SEO title within 70 characters."
    if (settings.metaDescription.length > 170) {
      errors.metaDescription = "Keep the SEO description within 170 characters."
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      const invalidKey = Object.keys(errors)[0] as EditableKey
      const sectionByField: Partial<Record<EditableKey, SectionId>> = {
        storeName: "general",
        tagline: "general",
        storeEmail: "general",
        storePhone: "general",
        logoUrl: "general",
        city: "store",
        country: "store",
        cashOnDeliveryEnabled: "payments",
        bankName: "payments",
        bankAccountName: "payments",
        bankAccountNumber: "payments",
        flatShippingRate: "shipping",
        freeShippingThreshold: "shipping",
        estimatedDeliveryDays: "shipping",
        metaTitle: "seo",
        metaDescription: "seo",
        senderName: "email",
        senderEmail: "email",
        orderNotificationEmail: "email",
        facebookUrl: "social",
        instagramUrl: "social",
        tiktokUrl: "social",
        whatsappNumber: "social",
        maintenanceMessage: "maintenance",
      }
      setActive(sectionByField[invalidKey] ?? active)
      setNotice({ type: "error", text: "Review the highlighted fields before saving." })
      return false
    }
    return true
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setHasConflict(false)
    if (!validate()) return

    setSaving(true)
    try {
      const data = await fetchApi<SettingsState>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      })
      const normalized = { ...settings, ...data }
      setSettings(normalized)
      setSavedSnapshot(JSON.stringify(normalized))
      window.dispatchEvent(new CustomEvent("store-settings-updated", { detail: normalized }))
      setNotice({ type: "success", text: "System settings saved successfully." })
    } catch (error) {
      const conflict = error instanceof ApiError && error.status === 409
      setHasConflict(conflict)
      setNotice({
        type: conflict ? "warning" : "error",
        text: error instanceof Error ? error.message : "Could not save system settings.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setNotice(null)
    try {
      const path = await uploadImage(file, "branding")
      update("logoUrl", path)
      setNotice({ type: "success", text: "Logo uploaded. Save changes to publish it." })
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Logo upload failed." })
    } finally {
      setUploading(false)
    }
  }

  function discardChanges() {
    const snapshot = JSON.parse(savedSnapshot) as SettingsState
    setSettings(snapshot)
    setFieldErrors({})
    setHasConflict(false)
    setNotice({ type: "success", text: "Unsaved changes were discarded." })
  }

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-xl border border-border bg-card shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-foreground">Loading system settings</p>
          <p className="mt-1 text-xs text-muted-foreground">Fetching the latest saved configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={saveSettings}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full",
              isDirty ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
            )}
          >
            {isDirty ? <Clock3 className="size-4.5" /> : <CheckCircle2 className="size-4.5" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isDirty ? "You have unsaved changes" : "All changes are saved"}
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated {formatLastSaved(settings.updatedAt)}
              {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={discardChanges}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="size-4" />
            Discard
          </button>
          <button
            type="submit"
            disabled={!isDirty || saving || uploading}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={cn(
            "mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
            notice.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
            notice.type === "error" && "border-red-200 bg-red-50 text-red-800",
            notice.type === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
          )}
        >
          <span className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            {notice.text}
          </span>
          {(hasConflict || (notice.type === "error" && !isDirty)) && (
            <button
              type="button"
              onClick={() => void loadSettings(true)}
              className={cn(
                "inline-flex items-center gap-2 self-start rounded-md px-3 py-1.5 text-xs font-semibold text-white",
                hasConflict ? "bg-amber-900" : "bg-red-800",
              )}
            >
              <RefreshCw className="size-3.5" />
              {hasConflict ? "Load latest version" : "Try again"}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="rounded-xl border border-border bg-card p-2 shadow-sm lg:self-start">
          {sections.map((section) => {
            const Icon = section.icon
            const selected = active === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                  selected
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{section.label}</span>
                  <span className="block truncate text-xs opacity-75">{section.description}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <SectionHeading
            title={activeSection.label}
            description={activeSection.description}
            icon={activeSection.icon}
          />

          {active === "general" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Store name" required error={fieldErrors.storeName}>
                    <input
                      value={settings.storeName}
                      onChange={(event) => update("storeName", event.target.value)}
                      className={inputCls}
                      maxLength={120}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Tagline" required error={fieldErrors.tagline} hint="Shown alongside your brand in customer-facing experiences.">
                    <input
                      value={settings.tagline}
                      onChange={(event) => update("tagline", event.target.value)}
                      className={inputCls}
                      maxLength={160}
                    />
                  </Field>
                </div>
                <Field label="Store email" required error={fieldErrors.storeEmail}>
                  <input
                    type="email"
                    value={settings.storeEmail}
                    onChange={(event) => update("storeEmail", event.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Store phone" required error={fieldErrors.storePhone}>
                  <input
                    type="tel"
                    value={settings.storePhone}
                    onChange={(event) => update("storePhone", event.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Store currency" required>
                  <select
                    value={settings.currency}
                    onChange={(event) => update("currency", event.target.value as SettingsState["currency"])}
                    className={cn(inputCls, "appearance-none")}
                  >
                    <option value="TZS">TZS — Tanzanian Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="KES">KES — Kenyan Shilling</option>
                  </select>
                </Field>
                <Field label="Time zone" required>
                  <select
                    value={settings.timezone}
                    onChange={(event) => update("timezone", event.target.value)}
                    className={cn(inputCls, "appearance-none")}
                  >
                    {timezones.map((timezone) => (
                      <option key={timezone} value={timezone}>{timezone}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div>
                <Field label="Store logo" required error={fieldErrors.logoUrl} hint="JPG, PNG, or WEBP up to 5 MB.">
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="mx-auto flex size-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
                      {settings.logoUrl ? (
                        <Image
                          src={settings.logoUrl}
                          alt="Current store logo"
                          width={112}
                          height={112}
                          className="size-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <Store className="size-10 text-muted-foreground" />
                      )}
                    </div>
                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                      {uploading ? "Uploading..." : "Upload new logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(event) => void handleLogoUpload(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {active === "store" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Address line 1" hint="Street, building, or area">
                  <input
                    value={settings.addressLine1}
                    onChange={(event) => update("addressLine1", event.target.value)}
                    className={inputCls}
                    placeholder="Street or neighbourhood"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address line 2" hint="Optional landmark or unit">
                  <input
                    value={settings.addressLine2}
                    onChange={(event) => update("addressLine2", event.target.value)}
                    className={inputCls}
                    placeholder="Landmark, suite, or floor"
                  />
                </Field>
              </div>
              <Field label="City" required error={fieldErrors.city}>
                <input value={settings.city} onChange={(event) => update("city", event.target.value)} className={inputCls} />
              </Field>
              <Field label="Country" required error={fieldErrors.country}>
                <input value={settings.country} onChange={(event) => update("country", event.target.value)} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Business registration number" hint="Optional internal legal reference">
                  <input
                    value={settings.businessRegistrationNumber}
                    onChange={(event) => update("businessRegistrationNumber", event.target.value)}
                    className={inputCls}
                    placeholder="Registration or tax reference"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-800">
                <MapPin className="mt-0.5 size-5 shrink-0" />
                <p className="text-sm">Use the customer-facing location customers should see on invoices, messages, and store information.</p>
              </div>
            </div>
          )}

          {active === "payments" && (
            <div className="space-y-5">
              <Toggle
                checked={settings.cashOnDeliveryEnabled}
                onChange={(value) => update("cashOnDeliveryEnabled", value)}
                label="Cash on delivery"
                description="Allow customers to pay when their furniture is delivered."
              />
              {fieldErrors.cashOnDeliveryEnabled && (
                <p className="text-xs font-medium text-destructive">{fieldErrors.cashOnDeliveryEnabled}</p>
              )}
              <Toggle
                checked={settings.bankTransferEnabled}
                onChange={(value) => update("bankTransferEnabled", value)}
                label="Bank transfer"
                description="Show bank transfer as an available payment option."
              />
              <div className={cn("grid gap-5 rounded-xl border border-border p-4 sm:grid-cols-2", !settings.bankTransferEnabled && "opacity-60")}>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-sm font-semibold text-foreground">Bank transfer details</p>
                  <p className="text-xs text-muted-foreground">These details remain restricted to authenticated administrators.</p>
                </div>
                <Field label="Bank name" required={settings.bankTransferEnabled} error={fieldErrors.bankName}>
                  <input
                    value={settings.bankName}
                    onChange={(event) => update("bankName", event.target.value)}
                    className={inputCls}
                    disabled={!settings.bankTransferEnabled}
                  />
                </Field>
                <Field label="Account name" required={settings.bankTransferEnabled} error={fieldErrors.bankAccountName}>
                  <input
                    value={settings.bankAccountName}
                    onChange={(event) => update("bankAccountName", event.target.value)}
                    className={inputCls}
                    disabled={!settings.bankTransferEnabled}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Account number" required={settings.bankTransferEnabled} error={fieldErrors.bankAccountNumber}>
                    <input
                      value={settings.bankAccountNumber}
                      onChange={(event) => update("bankAccountNumber", event.target.value)}
                      className={inputCls}
                      disabled={!settings.bankTransferEnabled}
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {active === "shipping" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={`Flat shipping rate (${settings.currency})`} required error={fieldErrors.flatShippingRate}>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={settings.flatShippingRate}
                  onChange={(event) => update("flatShippingRate", Number(event.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field
                label={`Free shipping threshold (${settings.currency})`}
                required
                error={fieldErrors.freeShippingThreshold}
                hint="Use 0 to disable threshold-based free shipping."
              >
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={settings.freeShippingThreshold}
                  onChange={(event) => update("freeShippingThreshold", Number(event.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Estimated delivery time" required error={fieldErrors.estimatedDeliveryDays} hint="Typical number of days, from 1 to 60.">
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.estimatedDeliveryDays}
                    onChange={(event) => update("estimatedDeliveryDays", Number(event.target.value))}
                    className={cn(inputCls, "pr-14")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Toggle
                  checked={settings.storePickupEnabled}
                  onChange={(value) => update("storePickupEnabled", value)}
                  label="Store pickup"
                  description="Let customers arrange pickup directly from your store."
                />
              </div>
            </div>
          )}

          {active === "seo" && (
            <div className="space-y-6">
              <Field label="Search title" required error={fieldErrors.metaTitle}>
                <input
                  value={settings.metaTitle}
                  onChange={(event) => update("metaTitle", event.target.value)}
                  className={inputCls}
                  maxLength={70}
                />
                <p className={cn("mt-1.5 text-right text-xs", settings.metaTitle.length > 60 ? "text-amber-700" : "text-muted-foreground")}>
                  {settings.metaTitle.length}/70
                </p>
              </Field>
              <Field label="Meta description" required error={fieldErrors.metaDescription}>
                <textarea
                  rows={4}
                  value={settings.metaDescription}
                  onChange={(event) => update("metaDescription", event.target.value)}
                  className={cn(inputCls, "resize-y")}
                  maxLength={170}
                />
                <p className={cn("mt-1.5 text-right text-xs", settings.metaDescription.length > 160 ? "text-amber-700" : "text-muted-foreground")}>
                  {settings.metaDescription.length}/170
                </p>
              </Field>
              <Toggle
                checked={settings.searchIndexingEnabled}
                onChange={(value) => update("searchIndexingEnabled", value)}
                label="Allow search engine indexing"
                description="Keep enabled for the live storefront. Disable while preparing a private launch."
              />
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search preview</p>
                <p className="truncate text-lg font-medium text-blue-700">{settings.metaTitle || "Store title"}</p>
                <p className="mt-0.5 text-sm text-emerald-700">pajedhowfurniture.com</p>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {settings.metaDescription || "Your store description will appear here."}
                </p>
              </div>
            </div>
          )}

          {active === "email" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Sender name" required error={fieldErrors.senderName}>
                <input value={settings.senderName} onChange={(event) => update("senderName", event.target.value)} className={inputCls} />
              </Field>
              <Field label="Sender email" required error={fieldErrors.senderEmail}>
                <input type="email" value={settings.senderEmail} onChange={(event) => update("senderEmail", event.target.value)} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Order notification email" required error={fieldErrors.orderNotificationEmail} hint="New order notifications are directed to this inbox.">
                  <input
                    type="email"
                    value={settings.orderNotificationEmail}
                    onChange={(event) => update("orderNotificationEmail", event.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Toggle
                  checked={settings.orderConfirmationEnabled}
                  onChange={(value) => update("orderConfirmationEnabled", value)}
                  label="Customer order confirmations"
                  description="Send a confirmation message after a customer successfully places an order."
                />
              </div>
              <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm font-semibold text-foreground">Delivery credentials</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  SMTP or email-provider secrets belong in the secured server environment and are intentionally never exposed in this admin form.
                </p>
              </div>
            </div>
          )}

          {active === "social" && (
            <div className="grid gap-5">
              <Field label="Facebook URL" error={fieldErrors.facebookUrl}>
                <input
                  type="url"
                  value={settings.facebookUrl}
                  onChange={(event) => update("facebookUrl", event.target.value)}
                  className={inputCls}
                  placeholder="https://facebook.com/your-page"
                />
              </Field>
              <Field label="Instagram URL" error={fieldErrors.instagramUrl}>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={(event) => update("instagramUrl", event.target.value)}
                  className={inputCls}
                  placeholder="https://instagram.com/your-account"
                />
              </Field>
              <Field label="TikTok URL" error={fieldErrors.tiktokUrl}>
                <input
                  type="url"
                  value={settings.tiktokUrl}
                  onChange={(event) => update("tiktokUrl", event.target.value)}
                  className={inputCls}
                  placeholder="https://tiktok.com/@your-account"
                />
              </Field>
              <Field label="WhatsApp number" required error={fieldErrors.whatsappNumber} hint="Use the international format, for example 255762082422.">
                <input
                  type="tel"
                  value={settings.whatsappNumber}
                  onChange={(event) => update("whatsappNumber", event.target.value)}
                  className={inputCls}
                  placeholder="255762082422"
                />
              </Field>
            </div>
          )}

          {active === "maintenance" && (
            <div className="space-y-6">
              <div
                className={cn(
                  "rounded-xl border p-5",
                  settings.maintenanceMode
                    ? "border-red-200 bg-red-50"
                    : "border-emerald-200 bg-emerald-50",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      settings.maintenanceMode ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {settings.maintenanceMode ? <ShieldAlert className="size-5" /> : <Globe2 className="size-5" />}
                  </span>
                  <div>
                    <p className={cn("font-semibold", settings.maintenanceMode ? "text-red-900" : "text-emerald-900")}>
                      Storefront is {settings.maintenanceMode ? "in maintenance mode" : "available"}
                    </p>
                    <p className={cn("mt-1 text-sm", settings.maintenanceMode ? "text-red-700" : "text-emerald-700")}>
                      {settings.maintenanceMode
                        ? "Customers will see your maintenance message after this setting is saved."
                        : "Customers can browse and place orders normally."}
                    </p>
                  </div>
                </div>
              </div>
              <Toggle
                checked={settings.maintenanceMode}
                onChange={(value) => update("maintenanceMode", value)}
                label="Enable maintenance mode"
                description="Temporarily pause the customer storefront while administrators continue to work."
                danger
              />
              <Field label="Customer message" required error={fieldErrors.maintenanceMessage} hint={`${settings.maintenanceMessage.length}/300 characters`}>
                <textarea
                  rows={4}
                  value={settings.maintenanceMessage}
                  onChange={(event) => update("maintenanceMessage", event.target.value)}
                  className={cn(inputCls, "resize-y")}
                  maxLength={300}
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
