import type { PublicStoreSettings } from "@/components/store-settings-provider"

/**
 * The store does not deliver: customers collect their furniture. While this
 * is false the storefront shows no delivery options, charges or estimates and
 * every order is placed for collection. Set it to true to bring delivery back.
 */
export const OFFERS_DELIVERY: boolean = false

export type FulfillmentMethod = "DELIVERY" | "PICKUP"

/** Wording shown to buyers for the payment methods the backend knows. */
export function paymentLabel(method: string) {
  if (!OFFERS_DELIVERY && method.toLowerCase() === "cash on delivery") return "Pay on collection"
  return method
}

/** Buyer-facing names for order statuses; without delivery an order is collected, not shipped. */
export function orderStatusLabel(status: string) {
  if (OFFERS_DELIVERY) return status
  if (status === "Shipped") return "Ready for collection"
  if (status === "Delivered") return "Collected"
  return status
}

type DeliverySettings = Pick<PublicStoreSettings, "flatShippingRate" | "freeShippingThreshold">

/**
 * Estimate of the delivery charge, mirroring OrderService.create on the
 * backend: pickup is free, orders at or above the free-shipping threshold are
 * free, everything else pays the flat rate. The server recomputes the charge
 * when the order is placed and its figure is the one that counts.
 */
export function deliveryFee(
  settings: DeliverySettings,
  subtotal: number,
  method: FulfillmentMethod = "DELIVERY",
) {
  if (!OFFERS_DELIVERY || method === "PICKUP") return 0
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) return 0
  return Math.max(0, settings.flatShippingRate)
}
