import type { PublicStoreSettings } from "@/components/store-settings-provider"

export type FulfillmentMethod = "DELIVERY" | "PICKUP"

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
  if (method === "PICKUP") return 0
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) return 0
  return Math.max(0, settings.flatShippingRate)
}
