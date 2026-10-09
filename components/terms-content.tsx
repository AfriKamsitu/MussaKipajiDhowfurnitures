"use client"

import { useStoreSettings } from "@/components/store-settings-provider"
import { OFFERS_DELIVERY } from "@/lib/pricing"

/**
 * Plain-language terms that describe what this storefront actually does.
 * Payment and delivery lines follow the store settings, so they stay true
 * when those settings change.
 */
export function TermsContent() {
  const settings = useStoreSettings()
  const payments = [
    settings.cashOnDeliveryEnabled && (OFFERS_DELIVERY ? "cash on delivery" : "payment on collection"),
    settings.bankTransferEnabled && "bank transfer",
  ].filter(Boolean) as string[]

  const sections = [
    {
      id: "orders",
      title: "Orders",
      points: [
        "You need an account to place an order. Prices are shown in " + settings.currency + ".",
        "Placing an order reserves the items for you. " + settings.storeName + " then contacts you, usually on WhatsApp, to confirm availability, " + (OFFERS_DELIVERY ? "delivery" : "collection") + " and payment.",
        "An order can be cancelled before it is shipped by contacting the store. Reserved stock is released when an order is cancelled.",
      ],
    },
    {
      id: "payment",
      title: "Payment",
      points: [
        "No payment is taken on this website.",
        payments.length
          ? "Payment is arranged directly with the store by " + payments.join(" or ") + "."
          : "Payment is arranged directly with the store when your order is confirmed.",
        "The order total shown at checkout is confirmed by the store when the order is placed.",
      ],
    },
    {
      id: "delivery",
      title: OFFERS_DELIVERY ? "Delivery and pickup" : "Collecting your order",
      points: !OFFERS_DELIVERY
        ? [
            "We do not deliver. Orders are collected from our store" + (settings.city ? " in " + settings.city : "") + ".",
            "We contact you when your order is ready and agree a collection time with you.",
          ]
        : [
        settings.estimatedDeliveryDays > 0
          ? "Delivery usually takes about " + settings.estimatedDeliveryDays + " days. This is an estimate, not a guarantee."
          : "Delivery times are confirmed with you when your order is confirmed.",
        settings.storePickupEnabled ? "You can choose to collect your order from the store at no delivery charge." : "",
        "Any delivery charge is shown at checkout before you place the order.",
      ].filter(Boolean),
    },
    {
      id: "privacy",
      title: "Your information",
      points: [
        "We store the details you give us: your name, email address, phone number, saved addresses and order history. We use them to process your orders and to contact you about them.",
        "Your cart, saved items and recently viewed products are kept in your own browser on this device.",
        "Marketing emails are sent only if you opt in, and you can opt out at any time from your account profile.",
        "If you sign in with Google or Facebook, we receive your name, email address and profile picture from that service.",
        "We do not sell your personal information.",
      ],
    },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      {sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={section.id + "-title"} className="scroll-mt-24">
          <h2 id={section.id + "-title"} className="text-lg font-semibold text-foreground">
            {section.title}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            {section.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
