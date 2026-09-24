// Central WhatsApp contact helper for Paje Dhow Furniture.
// All "contact seller" actions across the store route through here.

export const WHATSAPP_NUMBER = "255762082422"
export const WHATSAPP_DISPLAY = "+255 762 082 422"
let runtimeWhatsappNumber = WHATSAPP_NUMBER

/** Keep customer WhatsApp actions in sync with the latest public store settings. */
export function setRuntimeWhatsappNumber(value?: string) {
  const normalized = String(value ?? "").replace(/\D/g, "")
  runtimeWhatsappNumber = normalized || WHATSAPP_NUMBER
}

export type WhatsAppProduct = {
  id: string
  name: string
  price?: number
  image?: string
  productUrl?: string
}

export type WhatsAppOrderItem = WhatsAppProduct & {
  quantity: number
}

/** Convert uploaded image and product paths into links the seller can open from WhatsApp. */
export function storefrontUrl(path?: string): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")
  const origin = configured || (typeof window !== "undefined" ? window.location.origin : undefined)
  if (!origin) return path
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Build a wa.me deep link with an optional pre-filled message.
 * Works on both mobile (opens the app) and desktop (opens WhatsApp Web).
 */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${runtimeWhatsappNumber}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

/** Open WhatsApp in a new tab/window with the given message. */
export function openWhatsApp(message?: string) {
  if (typeof window === "undefined") return
  window.open(whatsappUrl(message), "_blank", "noopener,noreferrer")
}

/** Standard enquiry message for a specific product. */
export function productEnquiryMessage(product: WhatsAppProduct): string {
  const lines = [
    "Hello Paje Dhow Furniture,",
    `I'm interested in *${product.name}*.`,
  ]
  if (product.id) lines.push(`Product ref: ${product.id}`)
  const imageUrl = storefrontUrl(product.image)
  if (imageUrl) lines.push(`Product image: ${imageUrl}`)
  const productUrl = storefrontUrl(product.productUrl)
  if (productUrl) lines.push(`Product page: ${productUrl}`)
  lines.push("Could you share availability, final price and delivery details?")
  return lines.join("\n")
}

export function orderWhatsAppMessage({
  orderNumber,
  customerName,
  customerEmail,
  phone,
  shippingAddress,
  items,
  productTotal,
  deliveryFee,
  orderTotal,
  formatAmount,
}: {
  orderNumber?: string
  customerName: string
  customerEmail: string
  phone: string
  shippingAddress: string
  items: WhatsAppOrderItem[]
  productTotal: number
  deliveryFee?: number
  orderTotal?: number
  formatAmount: (amount: number) => string
}): string {
  const lines = [
    "Hello Paje Dhow Furniture,",
    `I would like to confirm order *${orderNumber || "New order"}*.`,
    "",
  ]

  items.forEach((item, index) => {
    lines.push(`*${index + 1}. ${item.name}*`)
    if (item.id) lines.push(`Product ref: ${item.id}`)
    lines.push(`Quantity: ${item.quantity}`)
    if (item.price != null) lines.push(`Item total: ${formatAmount(item.price * item.quantity)}`)
    const imageUrl = storefrontUrl(item.image)
    if (imageUrl) lines.push(`Image: ${imageUrl}`)
    const productUrl = storefrontUrl(item.productUrl)
    if (productUrl) lines.push(`Product page: ${productUrl}`)
    lines.push("")
  })

  lines.push(`Products total: *${formatAmount(productTotal)}*`)
  lines.push(
    deliveryFee == null
      ? "Delivery fee: To be confirmed on WhatsApp"
      : `Delivery fee: *${deliveryFee === 0 ? "Free / pickup" : formatAmount(deliveryFee)}*`,
  )
  if (orderTotal != null) lines.push(`Order total: *${formatAmount(orderTotal)}*`)
  lines.push(`Name: ${customerName}`)
  lines.push(`Email: ${customerEmail}`)
  lines.push(`Phone: ${phone}`)
  lines.push(`Delivery address: ${shippingAddress}`)
  return lines.join("\n")
}
