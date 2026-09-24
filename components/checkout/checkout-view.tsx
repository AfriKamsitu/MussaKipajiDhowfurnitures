"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, Minus, PencilLine, Plus, Trash2, Truck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { fetchApi } from "@/lib/api"
import { formatPrice } from "@/lib/data"
import { orderWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp"

const inputClass = "min-h-11 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(40,25,18,0.03)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground focus:border-primary/55 focus:bg-white focus:ring-4 focus:ring-primary/10"
type CheckoutDetails = { firstName: string; lastName: string; email: string; phone: string; address: string; city: string; region: string }
const emptyDetails: CheckoutDetails = { firstName: "", lastName: "", email: "", phone: "", address: "", city: "", region: "" }

export function CheckoutView() {
  const storeSettings = useStoreSettings()
  const router = useRouter()
  const pathname = usePathname()
  const { cart, cartTotal, clearCart, removeFromCart, updateQuantity } = useStore()
  const { user, loading, addOrder } = useAuth()
  const [placed, setPlaced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails)
  const [detailsReady, setDetailsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY")
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery")
  const submissionKeyRef = useRef<string | null>(null)
  const submissionInFlightRef = useRef(false)
  const freeDelivery = storeSettings.freeShippingThreshold > 0 && cartTotal >= storeSettings.freeShippingThreshold
  const estimatedDelivery = fulfillmentMethod === "PICKUP" || freeDelivery ? 0 : storeSettings.flatShippingRate
  const total = cartTotal + estimatedDelivery
  const resolvedPaymentMethods = useMemo(() => {
    const methods = [
      ...(storeSettings.cashOnDeliveryEnabled ? ["Cash on Delivery"] : []),
      ...(storeSettings.bankTransferEnabled ? ["Bank Transfer"] : []),
    ]
    return methods.length ? methods : ["WhatsApp confirmation"]
  }, [storeSettings.bankTransferEnabled, storeSettings.cashOnDeliveryEnabled])

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?redirect=${encodeURIComponent(pathname || "/checkout")}`)
  }, [loading, pathname, router, user])

  useEffect(() => {
    if (!user || detailsReady) return
    const [firstName = "", ...lastNameParts] = user.name.trim().split(/\s+/)
    setDetails({ ...emptyDetails, firstName, lastName: lastNameParts.join(" "), email: user.email, phone: user.phone || "" })
    setDetailsReady(true)
  }, [detailsReady, user])

  useEffect(() => {
    if (!resolvedPaymentMethods.includes(paymentMethod)) setPaymentMethod(resolvedPaymentMethods[0])
  }, [paymentMethod, resolvedPaymentMethods])

  function updateDetail(field: keyof CheckoutDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }))
  }

  function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/checkout")}`)
      return
    }
    if (user.role === "admin") {
      router.replace("/admin")
      return
    }
    setError(null)
    setReviewing(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function placeOrder() {
    if (!user || user.role === "admin" || cart.length === 0 || submissionInFlightRef.current) return
    submissionInFlightRef.current = true
    const submissionKey = submissionKeyRef.current ?? crypto.randomUUID()
    submissionKeyRef.current = submissionKey
    const customerName = `${details.firstName} ${details.lastName}`.trim()
    const phone = details.phone.trim()
    const shippingAddress = fulfillmentMethod === "PICKUP"
      ? `Store pickup at ${[storeSettings.addressLine1, storeSettings.addressLine2, storeSettings.city, storeSettings.country].filter(Boolean).join(", ")}`
      : [details.address, details.city, details.region].map((value) => value.trim()).filter(Boolean).join(", ")
    const whatsappWindow = window.open("about:blank", "paje-dhow-order")
    setSaving(true)
    setError(null)
    try {
      const created = await fetchApi<Record<string, unknown>>("/api/account/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          phone,
          shippingAddress,
          payment: paymentMethod,
          delivery: estimatedDelivery,
          fulfillmentMethod,
          idempotencyKey: submissionKey,
          items: cart.map((item) => {
            const numericId = Number(item.product.id)
            return { productId: Number.isInteger(numericId) && numericId > 0 ? numericId : null, name: item.product.name, image: item.product.image, price: item.product.price, quantity: item.quantity }
          }),
        }),
      })
      const orderNumber = String(created.orderNumber || created.id || "New order")
      const createdAt = String(created.createdAt || new Date().toISOString())
      const confirmedItems = Array.isArray(created.items)
        ? (created.items as Record<string, unknown>[]).map((item) => {
            const productId = String(item.productId ?? "")
            const cartProduct = cart.find((entry) => entry.product.id === productId)?.product
            return { id: productId, name: String(item.name ?? cartProduct?.name ?? "Product"), image: String(item.image ?? cartProduct?.image ?? "/placeholder.svg"), quantity: Number(item.quantity ?? 1), price: Number(item.price ?? 0), productUrl: `/product/${cartProduct?.slug || productId}` }
          })
        : cart.map((item) => ({ id: item.product.id, name: item.product.name, image: item.product.image, quantity: item.quantity, price: item.product.price, productUrl: `/product/${item.product.slug || item.product.id}` }))
      const confirmedSubtotal = Number(created.subtotal ?? confirmedItems.reduce((sum, item) => sum + item.price * item.quantity, 0))
      const confirmedTotal = Number(created.total ?? confirmedSubtotal)
      const confirmedDelivery = Number(created.delivery ?? Math.max(0, confirmedTotal - confirmedSubtotal))
      addOrder({ id: orderNumber, date: createdAt, status: "Pending", total: confirmedTotal, items: confirmedItems.map(({ name, image, quantity, price }) => ({ name, image, quantity, price })) })
      const message = orderWhatsAppMessage({ orderNumber, customerName, customerEmail: user.email, phone, shippingAddress, items: confirmedItems, productTotal: confirmedSubtotal, deliveryFee: confirmedDelivery, orderTotal: confirmedTotal, formatAmount: (amount) => formatPrice(amount, storeSettings.currency) })
      const destination = whatsappUrl(message)
      if (whatsappWindow) {
        whatsappWindow.opener = null
        whatsappWindow.location.href = destination
      } else window.location.href = destination
      setPlaced(true)
      submissionKeyRef.current = null
      clearCart()
      window.setTimeout(() => router.push("/account/orders"), 3500)
    } catch (err) {
      whatsappWindow?.close()
      setError(err instanceof Error ? err.message : "The order could not be saved. Please try again.")
    } finally {
      submissionInFlightRef.current = false
      setSaving(false)
    }
  }

  if (loading || !user) return <div className="surface-premium rounded-3xl p-12 text-center text-sm text-muted-foreground">Please login or register before placing an order.</div>
  if (user.role === "admin") return (
    <div className="surface-premium rounded-3xl p-10 text-center sm:p-14">
      <h2 className="text-xl font-black text-foreground">Admin accounts cannot place buyer orders.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Use a customer account for shopping, or manage orders from the admin panel.</p>
      <Link href="/admin" className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-accent">Go to Admin Panel</Link>
    </div>
  )
  if (placed) return (
    <div className="surface-premium flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary"><CheckCircle2 className="size-8" /></span>
      <h2 className="text-2xl font-bold text-foreground">Order Placed!</h2>
      <p className="max-w-sm text-sm text-muted-foreground">Your order is saved and WhatsApp has opened with every product and image link. Redirecting to your orders...</p>
      <Link href="/shop" className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent">Continue Shopping</Link>
    </div>
  )
  if (cart.length === 0) return (
    <div className="surface-premium flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-20 text-center">
      <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
      <p className="text-sm text-muted-foreground">Add items before checking out.</p>
      <Link href="/shop" className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent">Browse Products</Link>
    </div>
  )

  return (
    <form onSubmit={handleReview} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="grid gap-6">
        {!reviewing ? (
          <section className="surface-premium rounded-2xl p-5 sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-black text-foreground"><span className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent"><Truck className="size-5" /></span> Shipping Information</h2>
            {storeSettings.storePickupEnabled && (
              <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Choose delivery or pickup</legend>
                {[
                  { value: "DELIVERY" as const, label: "Delivery", detail: `Usually ${storeSettings.estimatedDeliveryDays} days` },
                  { value: "PICKUP" as const, label: "Store pickup", detail: "Collect from the workshop" },
                ].map((option) => (
                  <label key={option.value} className={`cursor-pointer rounded-lg border p-4 ${fulfillmentMethod === option.value ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                    <input type="radio" name="fulfillmentMethod" value={option.value} checked={fulfillmentMethod === option.value} onChange={() => setFulfillmentMethod(option.value)} className="mr-2 accent-[var(--primary)]" />
                    <span className="text-sm font-semibold text-foreground">{option.label}</span>
                    <span className="mt-1 block pl-6 text-xs text-muted-foreground">{option.detail}</span>
                  </label>
                ))}
              </fieldset>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-foreground">First Name<input required name="firstName" className={`${inputClass} mt-1.5`} value={details.firstName} onChange={(event) => updateDetail("firstName", event.target.value)} placeholder="John" /></label>
              <label className="text-sm font-medium text-foreground">Last Name<input required name="lastName" className={`${inputClass} mt-1.5`} value={details.lastName} onChange={(event) => updateDetail("lastName", event.target.value)} placeholder="Doe" /></label>
              <label className="text-sm font-medium text-foreground">Email<input required name="email" type="email" className={`${inputClass} mt-1.5`} value={details.email} readOnly /></label>
              <label className="text-sm font-medium text-foreground">Phone<input required name="phone" type="tel" className={`${inputClass} mt-1.5`} value={details.phone} onChange={(event) => updateDetail("phone", event.target.value)} placeholder="+255 700 000 000" /></label>
              {fulfillmentMethod === "DELIVERY" && <>
                <label className="text-sm font-medium text-foreground sm:col-span-2">Address<input required name="address" className={`${inputClass} mt-1.5`} value={details.address} onChange={(event) => updateDetail("address", event.target.value)} placeholder="Street or village" /></label>
                <label className="text-sm font-medium text-foreground">City<input required name="city" className={`${inputClass} mt-1.5`} value={details.city} onChange={(event) => updateDetail("city", event.target.value)} placeholder="Bwejuu" /></label>
                <label className="text-sm font-medium text-foreground">Region<input required name="region" className={`${inputClass} mt-1.5`} value={details.region} onChange={(event) => updateDetail("region", event.target.value)} placeholder="Zanzibar" /></label>
              </>}
            </div>
          </section>
        ) : (
          <section className="surface-premium rounded-2xl border-primary/30 p-6 shadow-elevated">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Final review</p><h2 className="mt-1 text-xl font-semibold text-foreground">Check your order before sending</h2><p className="mt-2 text-sm text-muted-foreground">Nothing has been placed yet. You can still edit your details or products.</p></div>
              <button type="button" onClick={() => setReviewing(false)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"><PencilLine className="size-4" /> Edit details</button>
            </div>
            <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Customer</dt><dd className="mt-1 font-medium text-foreground">{details.firstName} {details.lastName}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd className="mt-1 font-medium text-foreground">{details.phone}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 break-words font-medium text-foreground">{details.email}</dd></div>
              <div><dt className="text-muted-foreground">{fulfillmentMethod === "PICKUP" ? "Collection" : "Delivery address"}</dt><dd className="mt-1 font-medium text-foreground">{fulfillmentMethod === "PICKUP" ? "Store pickup" : [details.address, details.city, details.region].filter(Boolean).join(", ")}</dd></div>
              <div><dt className="text-muted-foreground">Payment</dt><dd className="mt-1 font-medium text-foreground">{paymentMethod}</dd></div>
            </dl>
          </section>
        )}
        <section className="surface-premium rounded-2xl p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-xl font-black text-foreground"><span className="flex size-10 items-center justify-center rounded-full bg-[#25D366]/12 text-[#169c47]"><MessageCircle className="size-5" /></span> Confirm Order on WhatsApp</h2>
          <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold text-foreground">Payment method</legend>
            {resolvedPaymentMethods.map((method) => <label key={method} className={`cursor-pointer rounded-lg border px-4 py-3 text-sm ${paymentMethod === method ? "border-primary bg-primary/5" : "border-border"}`}><input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="mr-2 accent-[var(--primary)]" /><span className="font-semibold text-foreground">{method}</span></label>)}
          </fieldset>
          <div className="mt-5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/8 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"><WhatsAppGlyph className="size-6" /></span><div><p className="font-bold text-foreground">No online payment is required on the website.</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">After your final review, WhatsApp opens with every product and your delivery details so the shop can confirm availability, delivery, and payment directly with you.</p></div></div></div>
        </section>
      </div>

      <div className="surface-premium h-fit rounded-2xl p-5 shadow-premium sm:p-6 lg:sticky lg:top-40">
        <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Order summary</p><h2 className="mt-1 text-xl font-black text-foreground">Your order</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Change quantities or remove products before confirmation.</p></div><Link href="/cart" className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">Edit cart</Link></div>
        <div className="mt-4 grid gap-4">
          {cart.map((item) => (
            <div key={item.product.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary"><Image src={item.product.image || "/placeholder.svg"} alt={item.product.name} fill sizes="56px" className="object-cover" /></div>
              <div className="min-w-0"><span className="line-clamp-2 text-sm font-medium text-foreground">{item.product.name}</span><div className="mt-2 flex w-fit items-center rounded-md border border-border"><button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label={`Decrease ${item.product.name} quantity`} className="flex size-7 items-center justify-center transition-colors hover:bg-secondary"><Minus className="size-3" /></button><span className="w-8 text-center text-xs font-semibold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.product.stock != null && item.quantity >= item.product.stock} aria-label={`Increase ${item.product.name} quantity`} className="flex size-7 items-center justify-center transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"><Plus className="size-3" /></button></div></div>
              <div className="flex h-full flex-col items-end justify-between gap-2"><button type="button" onClick={() => removeFromCart(item.product.id)} aria-label={`Remove ${item.product.name} from order`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button><span className="whitespace-nowrap text-sm font-semibold text-primary">{formatPrice(item.product.price * item.quantity, storeSettings.currency)}</span></div>
            </div>
          ))}
        </div>
        <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium text-foreground">{formatPrice(cartTotal, storeSettings.currency)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="text-right font-medium text-foreground">{fulfillmentMethod === "PICKUP" ? "Store pickup" : estimatedDelivery === 0 ? "Free" : formatPrice(estimatedDelivery, storeSettings.currency)}</dd></div>
          <div className="mt-1 flex justify-between border-t border-border pt-3 text-base"><dt className="font-semibold text-foreground">Total</dt><dd className="font-bold text-primary">{formatPrice(total, storeSettings.currency)}</dd></div>
        </dl>
        {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        {reviewing ? <><button type="button" onClick={placeOrder} disabled={saving} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#1ebe5b] disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <WhatsAppGlyph className="size-4" />}{saving ? "Saving Order..." : "Confirm Order on WhatsApp"}</button><button type="button" onClick={() => setReviewing(false)} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> Return to edit details</button></> : <button type="submit" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-accent-glow transition-all hover:-translate-y-0.5 hover:bg-accent">Review Order</button>}
      </div>
    </form>
  )
}
