"use client"

import { ArrowUpRight, Mail, Phone } from "lucide-react"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { useStoreSettings } from "@/components/store-settings-provider"
import { whatsappUrl } from "@/lib/whatsapp"

function telephoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`
}

export function ContactChannels() {
  const settings = useStoreSettings()
  const channels = [
    {
      icon: Phone,
      title: "Call the workshop",
      value: settings.storePhone,
      detail: "For orders, availability, and project advice",
      href: telephoneHref(settings.storePhone),
    },
    {
      icon: Mail,
      title: "Email our team",
      value: settings.storeEmail,
      detail: "For specifications, quotations, and partnerships",
      href: `mailto:${settings.storeEmail}`,
    },
    {
      icon: WhatsAppGlyph,
      title: "WhatsApp",
      value: "Start a conversation",
      detail: "The quickest way to discuss furniture and orders",
      href: whatsappUrl("Hello Paje Dhow Furniture, I would like to discuss furniture with your team."),
    },
  ]

  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {channels.map((item) => (
        <a
          key={item.title}
          href={item.href}
          target={item.href.startsWith("https://") ? "_blank" : undefined}
          rel={item.href.startsWith("https://") ? "noreferrer" : undefined}
          className="group flex gap-4 py-5 transition-transform duration-300 hover:translate-x-1"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-sage/12 text-brand-sage transition-colors group-hover:bg-brand-sage group-hover:text-white">
            <item.icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {item.title}
            </span>
            <span className="mt-1 block break-words font-semibold text-foreground transition-colors group-hover:text-primary">
              {item.value}
            </span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.detail}</span>
          </span>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </a>
      ))}
    </div>
  )
}

export function WorkshopAddress() {
  const settings = useStoreSettings()
  const address = [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.country,
  ].filter(Boolean)

  return (
    <p>
      <span className="block font-semibold text-white">{settings.storeName}</span>
      {address.length ? address.join(", ") : "Bwejuu, Zanzibar, Tanzania"}
    </p>
  )
}
