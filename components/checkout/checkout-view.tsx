"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { SafeImage as Image } from "@/components/safe-image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Minus, PencilLine, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { EmptyState } from "@/components/state-panels"
import { useStore } from "@/components/store-provider"
import { useStoreSettings } from "@/components/store-settings-provider"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { fetchApi } from "@/lib/api"
import { productHref } from "@/lib/catalog"
import { formatPrice } from "@/lib/data"
import { deliveryFee, OFFERS_DELIVERY, paymentLabel, type FulfillmentMethod } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import { orderWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp"

type CheckoutDetails = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  region: string
}

type AppliedCoupon = { code: string; discount: number; freeShipping: boolean }

type ConfirmedOrder = {
  orderNumber: string
  status: string
  payment: string
  shippingAddress: string
  subtotal: number
  delivery: number
  discount: number
  couponCode: string | null
  total: number
  items: { id: string; name: string; image: string; quantity: number; price: number }[]
  whatsappLink: string
  whatsappOpened: boolean
}

const emptyDetails: CheckoutDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  region: "",
}

/** Same rule the backend enforces on CreateOrderRequest.phone. */
// Brackets and the dash are escaped because browsers compile `pattern` with the RegExp `v` flag.
const PHONE_PATTERN = "[+0-9 \\(\\)\\-]{7,30}"

export function CheckoutView() {
  const settings = useStoreSettings()
  const { currency } = settings
  const router = useRouter()
  const pathname = usePathname()
  const { cart, cartTotal, hydrated, clearCart, removeFromCart, updateQuantity } = useStore()
  const { user, loading, addOrder } = useAuth()
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null)
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails)
  const [detailsReady, setDetailsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chosenMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("DELIVERY")
  // Collection only: the choice is not offered and every order is placed for collection.
  const fulfillmentMethod: FulfillmentMethod = OFFERS_DELIVERY
    ? chosenMethod
    : settings.storePickupEnabled
      ? "PICKUP"
      : "DELIVERY"
  const collecting = !OFFERS_DELIVERY || fulfillmentMethod === "PICKUP"
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery")
  // One key per checkout attempt: a retry after a network failure returns the same order.
  const submissionKeyRef = useRef<string | null>(null)
  const submissionInFlightRef = useRef(false)

  // Coupon: the server quotes the discount for the current subtotal and applies it for real on the order.
  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const appliedCode = coupon?.code

  const estimatedDelivery = coupon?.freeShipping ? 0 : deliveryFee(settings, cartTotal, fulfillmentMethod)
  const discount = Math.min(coupon?.discount ?? 0, cartTotal)
  const total = cartTotal - discount + estimatedDelivery

  const quoteCoupon = useCallback(async (code: string, subtotal: number) => {
    const quote = await fetchApi<Record<string, unknown>>("/api/account/coupons/quote", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    })
    return {
      code: String(quote.code ?? code),
      discount: Number(quote.discount ?? 0),
      freeShipping: Boolean(quote.freeShipping),
    }
  }, [])

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code || couponBusy) return
    setCouponBusy(true)
    setCouponError(null)
    try {
      setCoupon(await quoteCoupon(code, cartTotal))
      setCouponInput("")
    } catch (err) {
      setCoupon(null)
      setCouponError(err instanceof Error ? err.message : "This coupon could not be applied.")
    } finally {
      setCouponBusy(false)
    }
  }

  // A percentage discount depends on the subtotal, so it is re-quoted when the cart changes.
  useEffect(() => {
    if (!appliedCode) return
    let active = true
    quoteCoupon(appliedCode, cartTotal)
      .then((next) => {
        if (active) setCoupon(next)
      })
      .catch((err) => {
        if (!active) return
        setCoupon(null)
        setCouponError(err instanceof Error ? err.message : "This coupon can no longer be applied.")
      })
    return () => {
      active = false
    }
  }, [appliedCode, cartTotal, quoteCoupon])
  const paymentMethods = useMemo(() => {
    const methods = [
      ...(settings.cashOnDeliveryEnabled ? ["Cash on Delivery"] : []),
      ...(settings.bankTransferEnabled ? ["Bank Transfer"] : []),
    ]
    return methods.length ? methods : ["WhatsApp confirmation"]
  }, [settings.bankTransferEnabled, settings.cashOnDeliveryEnabled])

  // The cart lives in this browser, so it is still here after signing in.
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?redirect=${encodeURIComponent(pathname || "/checkout")}`)
  }, [loading, pathname, router, user])

  useEffect(() => {
    if (!user || detailsReady) return
    const [firstName = "", ...lastNameParts] = user.name.trim().split(/\s+/)
    const saved = user.addresses.find((address) => address.isDefault) ?? user.addresses[0]
    setDetails({
      firstName,
      lastName: lastNameParts.join(" "),
      email: user.email,
      phone: saved?.phone || user.phone || "",
      address: saved?.street ?? "",
      city: saved?.city ?? "",
      region: saved?.region ?? "",
    })
    setDetailsReady(true)
  }, [detailsReady, user])

  useEffect(() => {
    if (!paymentMethods.includes(paymentMethod)) setPaymentMethod(paymentMethods[0])
  }, [paymentMethod, paymentMethods])

  useEffect(() => {
    if (OFFERS_DELIVERY && !settings.storePickupEnabled && fulfillmentMethod === "PICKUP") setFulfillmentMethod("DELIVERY")
  }, [fulfillmentMethod, settings.storePickupEnabled])

  function updateDetail(field: keyof CheckoutDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }))
  }

  function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setReviewing(true)
    window.scrollTo({ top: 0 })
  }

  const pickupAddress = [settings.addressLine1, settings.addressLine2, settings.city, settings.country]
    .filter(Boolean)
    .join(", ")
  const shippingAddress =
    collecting
      ? `Collection from the store${pickupAddress ? `, ${pickupAddress}` : ""}`
      : [details.address, details.city, details.region]
          .map((value) => value.trim())
          .filter(Boolean)
          .join(", ")

  async function placeOrder() {
    if (!user || user.role === "admin" || cart.length === 0 || submissionInFlightRef.current) return
    submissionInFlightRef.current = true
    const submissionKey = submissionKeyRef.current ?? crypto.randomUUID()
    submissionKeyRef.current = submissionKey
    const customerName = `${details.firstName} ${details.lastName}`.trim()
    const phone = details.phone.trim()
    // Opened during the click so popup blockers allow it; filled in once the order is saved.
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
          couponCode: coupon?.code ?? null,
          items: cart.map((item) => {
            const numericId = Number(item.product.id)
            return {
              productId: Number.isInteger(numericId) && numericId > 0 ? numericId : null,
              name: item.product.name,
              image: item.product.image,
              price: item.product.price,
              quantity: item.quantity,
            }
          }),
        }),
      })

      // Everything shown from here on is what the backend recorded, not the local estimate.
      const orderNumber = String(created.orderNumber || created.id || "")
      const items = Array.isArray(created.items)
        ? (created.items as Record<string, unknown>[]).map((item) => {
            const id = String(item.productId ?? "")
            const cartProduct = cart.find((entry) => entry.product.id === id)?.product
            return {
              id,
              name: String(item.name ?? cartProduct?.name ?? "Product"),
              image: String(item.image ?? cartProduct?.image ?? "/placeholder.svg"),
              quantity: Number(item.quantity ?? 1),
              price: Number(item.price ?? 0),
              productUrl: cartProduct ? productHref(cartProduct) : `/product/${id}`,
            }
          })
        : []
      const subtotal = Number(created.subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0))
      const orderTotal = Number(created.total ?? subtotal)
      const orderDiscount = Number(created.discount ?? 0)
      const delivery = Number(created.delivery ?? Math.max(0, orderTotal - subtotal + orderDiscount))

      addOrder({
        id: orderNumber,
        date: String(created.createdAt || new Date().toISOString()),
        status: "Pending",
        total: orderTotal,
        items: items.map(({ name, image, quantity, price }) => ({ name, image, quantity, price })),
      })

      const whatsappLink = whatsappUrl(
        orderWhatsAppMessage({
          orderNumber,
          customerName,
          customerEmail: user.email,
          phone,
          shippingAddress,
          items,
          productTotal: subtotal,
          deliveryFee: delivery,
          orderTotal,
          formatAmount: (amount) => formatPrice(amount, currency),
        }),
      )
      if (whatsappWindow) {
        whatsappWindow.opener = null
        whatsappWindow.location.href = whatsappLink
      }

      setConfirmed({
        orderNumber,
        status: String(created.status ?? "PENDING"),
        payment: String(created.payment ?? paymentMethod),
        shippingAddress: String(created.shippingAddress ?? shippingAddress),
        subtotal,
        delivery,
        discount: orderDiscount,
        couponCode: created.couponCode ? String(created.couponCode) : null,
        total: orderTotal,
        items,
        whatsappLink,
        whatsappOpened: Boolean(whatsappWindow),
      })
      submissionKeyRef.current = null
      clearCart()
      window.scrollTo({ top: 0 })
    } catch (err) {
      whatsappWindow?.close()
      setError(
        err instanceof Error
          ? `${err.message} Your order was not placed.`
          : "The order could not be saved. Please try again.",
      )
    } finally {
      submissionInFlightRef.current = false
      setSaving(false)
    }
  }

  if (confirmed) {
    return (
      <section aria-labelledby="order-confirmed" className="sf-card mx-auto max-w-2xl p-5 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-success" aria-hidden="true" />
          <div>
            <h2 id="order-confirmed" className="text-xl font-bold text-foreground">
              Order placed
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Order <span className="font-bold text-foreground">{confirmed.orderNumber}</span> is saved with status{" "}
              <span className="font-bold capitalize text-foreground">{confirmed.status.toLowerCase()}</span>.
              {" "}The store will contact you to confirm {OFFERS_DELIVERY ? "delivery" : "collection"} and payment.
            </p>
          </div>
        </div>

        <ul className="mt-5 divide-y divide-border border-y border-border">
          {confirmed.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                <Image src={item.image || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="line-clamp-1 font-semibold text-foreground">{item.name}</span>
                <span className="text-muted-foreground">Qty {item.quantity}</span>
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(item.price * item.quantity, currency)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold">{formatPrice(confirmed.subtotal, currency)}</dd>
          </div>
          {confirmed.discount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Discount{confirmed.couponCode ? ` (${confirmed.couponCode})` : ""}
              </dt>
              <dd className="font-semibold text-success">-{formatPrice(confirmed.discount, currency)}</dd>
            </div>
          )}
          {(OFFERS_DELIVERY || confirmed.delivery > 0) && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-semibold">
                {confirmed.delivery > 0 ? formatPrice(confirmed.delivery, currency) : "Free"}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">{formatPrice(confirmed.total, currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="font-semibold">{paymentLabel(confirmed.payment)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">{OFFERS_DELIVERY ? "Deliver to" : "Collection"}</dt>
            <dd className="text-right font-semibold">{confirmed.shippingAddress}</dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <a
            href={confirmed.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="sf-btn bg-[#1a9d4c] text-white hover:bg-[#15803d]"
          >
            <WhatsAppGlyph className="size-4" />
            {confirmed.whatsappOpened ? "Open WhatsApp again" : "Send order on WhatsApp"}
          </a>
          <Link href="/account/orders" className="sf-btn sf-btn-outline">
            Track this order
          </Link>
        </div>
        <Link href="/shop" className="sf-btn sf-btn-ghost mt-2 w-full">
          Continue shopping
        </Link>
      </section>
    )
  }

  if (loading || !user || !hydrated) {
    return (
      <div role="status" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <span className="sr-only">{loading || !hydrated ? "Loading checkout" : "Redirecting to sign in"}</span>
        <div className="sf-skeleton h-80" />
        <div className="sf-skeleton h-64" />
      </div>
    )
  }

  if (user.role === "admin") {
    return (
      <EmptyState
        title="Admin accounts cannot place orders"
        description="Use a customer account for shopping, or manage orders from the admin panel."
      >
        <Link href="/admin" className="sf-btn sf-btn-primary">
          Go to admin panel
        </Link>
      </EmptyState>
    )
  }

  if (cart.length === 0) {
    return (
      <EmptyState title="Your cart is empty" description="Add furniture to your cart before checking out.">
        <Link href="/shop" className="sf-btn sf-btn-primary">
          Shop furniture
        </Link>
      </EmptyState>
    )
  }

  const fulfillmentOptions = [
    {
      value: "DELIVERY" as const,
      label: "Delivery",
      detail: settings.estimatedDeliveryDays > 0 ? `About ${settings.estimatedDeliveryDays} days` : "",
    },
    { value: "PICKUP" as const, label: "Store pickup", detail: pickupAddress },
  ]

  return (
    <form onSubmit={handleReview} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="grid gap-5">
        <ol className="flex items-center gap-2 text-sm" aria-label="Checkout steps">
          {[OFFERS_DELIVERY ? "Delivery & payment" : "Details & payment", "Review & place order"].map((step, index) => {
            const active = Number(reviewing) === index
            return (
              <li key={step} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                {index > 0 && <span className="h-px w-6 bg-input" aria-hidden="true" />}
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-bold",
                    active || (reviewing && index === 0)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn(active ? "font-bold text-foreground" : "text-muted-foreground")}>{step}</span>
              </li>
            )
          })}
        </ol>

        {!reviewing ? (
          <>
            <section className="sf-card p-4 sm:p-6" aria-labelledby="checkout-delivery">
              <h2 id="checkout-delivery" className="text-base font-bold text-foreground sm:text-lg">
                {OFFERS_DELIVERY ? "Delivery" : "Your details"}
              </h2>
              {!OFFERS_DELIVERY && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Orders are collected from our store{pickupAddress ? ` in ${pickupAddress}` : ""}. We will contact you
                  when yours is ready.
                </p>
              )}
              {OFFERS_DELIVERY && settings.storePickupEnabled && (
                <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
                  <legend className="sr-only">Choose delivery or pickup</legend>
                  {fulfillmentOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer gap-2.5 rounded-lg border p-3",
                        fulfillmentMethod === option.value ? "border-primary bg-primary/5" : "border-input",
                      )}
                    >
                      <input
                        type="radio"
                        name="fulfillmentMethod"
                        value={option.value}
                        checked={fulfillmentMethod === option.value}
                        onChange={() => setFulfillmentMethod(option.value)}
                        className="mt-1 accent-[var(--primary)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-foreground">{option.label}</span>
                        {option.detail && (
                          <span className="block text-xs text-muted-foreground">{option.detail}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sf-label">
                  First name
                  <input required name="firstName" autoComplete="given-name" maxLength={50} className="sf-input mt-1 font-normal" value={details.firstName} onChange={(event) => updateDetail("firstName", event.target.value)} />
                </label>
                <label className="sf-label">
                  Last name
                  <input required name="lastName" autoComplete="family-name" maxLength={49} className="sf-input mt-1 font-normal" value={details.lastName} onChange={(event) => updateDetail("lastName", event.target.value)} />
                </label>
                <label className="sf-label">
                  Email
                  <input name="email" type="email" readOnly className="sf-input mt-1 bg-secondary font-normal text-muted-foreground" value={details.email} />
                </label>
                <label className="sf-label">
                  Phone
                  <input required name="phone" type="tel" autoComplete="tel" pattern={PHONE_PATTERN} title="7 to 30 digits; you may include +, spaces, brackets and dashes" className="sf-input mt-1 font-normal" value={details.phone} onChange={(event) => updateDetail("phone", event.target.value)} placeholder="+255 700 000 000" />
                </label>
                {!collecting && (
                  <>
                    <label className="sf-label sm:col-span-2">
                      Address
                      <input required name="address" autoComplete="street-address" maxLength={250} className="sf-input mt-1 font-normal" value={details.address} onChange={(event) => updateDetail("address", event.target.value)} placeholder="Street, building or village" />
                    </label>
                    <label className="sf-label">
                      City
                      <input required name="city" autoComplete="address-level2" maxLength={100} className="sf-input mt-1 font-normal" value={details.city} onChange={(event) => updateDetail("city", event.target.value)} />
                    </label>
                    <label className="sf-label">
                      Region
                      <input required name="region" autoComplete="address-level1" maxLength={100} className="sf-input mt-1 font-normal" value={details.region} onChange={(event) => updateDetail("region", event.target.value)} />
                    </label>
                  </>
                )}
              </div>
            </section>

            <section className="sf-card p-4 sm:p-6" aria-labelledby="checkout-payment">
              <h2 id="checkout-payment" className="text-base font-bold text-foreground sm:text-lg">
                Payment
              </h2>
              <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
                <legend className="sr-only">Payment method</legend>
                {paymentMethods.map((method) => (
                  <label
                    key={method}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm font-bold text-foreground",
                      paymentMethod === method ? "border-primary bg-primary/5" : "border-input",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-[var(--primary)]"
                    />
                    {paymentLabel(method)}
                  </label>
                ))}
              </fieldset>
              <p className="mt-3 text-xs text-muted-foreground">
                No payment is taken on this website. After you place the order, WhatsApp opens so the store can confirm
                availability, {OFFERS_DELIVERY ? "delivery" : "collection"} and payment with you.
              </p>
            </section>
          </>
        ) : (
          <section className="sf-card p-4 sm:p-6" aria-labelledby="checkout-review">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="checkout-review" className="text-base font-bold text-foreground sm:text-lg">
                  Review your order
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Nothing has been placed yet.</p>
              </div>
              <button type="button" onClick={() => setReviewing(false)} className="sf-btn sf-btn-outline sf-btn-sm">
                <PencilLine className="size-4" aria-hidden="true" /> Edit details
              </button>
            </div>
            <dl className="mt-4 grid gap-x-8 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="font-semibold text-foreground">{details.firstName} {details.lastName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-semibold text-foreground">{details.phone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-words font-semibold text-foreground">{details.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{collecting ? "Collection" : "Delivery address"}</dt>
                <dd className="font-semibold text-foreground">{shippingAddress}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="font-semibold text-foreground">{paymentLabel(paymentMethod)}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>

      {/* While reviewing, phones and tablets get the place-order panel first. */}
      <aside
        aria-label="Order summary"
        className={cn("sf-card sf-sticky-below-header p-4 sm:p-5", reviewing && "max-lg:order-first")}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">Order summary</h2>
          <Link href="/cart" className="text-[13px] font-semibold text-primary hover:underline">
            Edit cart
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {cart.map((item) => (
            <li key={item.product.id} className="flex gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                <Image src={item.product.image || "/placeholder.svg"} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.product.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div role="group" aria-label={`Quantity of ${item.product.name}`} className="flex items-center border border-input">
                    <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease quantity" className="grid size-8 place-items-center hover:bg-secondary">
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.product.stock != null && item.quantity >= item.product.stock} aria-label="Increase quantity" className="grid size-8 place-items-center hover:bg-secondary disabled:opacity-40">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.product.id)} aria-label={`Remove ${item.product.name}`} className="grid size-8 place-items-center text-muted-foreground hover:bg-secondary hover:text-deal">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatPrice(item.product.price * item.quantity, currency)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold text-foreground">{formatPrice(cartTotal, currency)}</dd>
          </div>
          {coupon && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Coupon {coupon.code}
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null)
                    setCouponError(null)
                  }}
                  className="ml-2 text-[13px] font-semibold text-primary hover:underline"
                >
                  Remove
                </button>
              </dt>
              <dd className="font-semibold text-success">
                {coupon.freeShipping ? (OFFERS_DELIVERY ? "Free delivery" : "Applied") : `-${formatPrice(discount, currency)}`}
              </dd>
            </div>
          )}
          {OFFERS_DELIVERY && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{fulfillmentMethod === "PICKUP" ? "Store pickup" : "Delivery"}</dt>
              <dd className="font-semibold text-foreground">
                {estimatedDelivery > 0 ? formatPrice(estimatedDelivery, currency) : "Free"}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{formatPrice(total, currency)}</dd>
          </div>
        </dl>

        {!coupon && (
          <div className="mt-3">
            <label htmlFor="checkout-coupon" className="sf-label">
              Coupon code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="checkout-coupon"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  // Enter applies the code instead of submitting the checkout form.
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void applyCoupon()
                  }
                }}
                maxLength={40}
                autoComplete="off"
                className="sf-input min-w-0 flex-1 font-normal"
                placeholder="Enter code"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={!couponInput.trim() || couponBusy}
                className="sf-btn sf-btn-outline shrink-0"
              >
                {couponBusy ? "Checking…" : "Apply"}
              </button>
            </div>
          </div>
        )}
        {couponError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {couponError}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        {reviewing ? (
          <button type="button" onClick={placeOrder} disabled={saving} className="sf-btn sf-btn-primary mt-4 w-full">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {saving ? "Placing order…" : "Place your order"}
          </button>
        ) : (
          <button type="submit" className="sf-btn sf-btn-primary mt-4 w-full">
            Continue to review
          </button>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          The final total is confirmed by the store when the order is placed.
        </p>
      </aside>
    </form>
  )
}
