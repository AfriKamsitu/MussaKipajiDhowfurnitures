"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock3, Mail, MapPin, Phone, type LucideIcon } from "lucide-react"
import { useStoreSettings } from "@/components/store-settings-provider"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { whatsappUrl } from "@/lib/whatsapp"

type Channel = {
  key: string
  label: string
  value: string
  hint: string
  href: string
  external?: boolean
  icon: LucideIcon | typeof WhatsAppGlyph
}

/**
 * Contact page hero: a clear heading, the two fastest ways to reach the
 * store, and one card per contact channel. Phone, email, WhatsApp number and
 * address all come from the store settings managed in the admin panel.
 */
export function ContactHero() {
  const settings = useStoreSettings()
  const address = [settings.addressLine1, settings.addressLine2, settings.city, settings.country]
    .filter(Boolean)
    .join(", ")
  const whatsapp = whatsappUrl(`Hello ${settings.storeName}, I would like to ask about your furniture.`)
  const phoneHref = `tel:${settings.storePhone.replace(/[^\d+]/g, "")}`

  const channels: Channel[] = [
    settings.storePhone && {
      key: "phone",
      label: "Call us",
      value: settings.storePhone,
      hint: "Speak to the workshop",
      href: phoneHref,
      icon: Phone,
    },
    settings.whatsappNumber && {
      key: "whatsapp",
      label: "WhatsApp",
      value: "Chat with us",
      hint: "Send photos or measurements",
      href: whatsapp,
      external: true,
      icon: WhatsAppGlyph,
    },
    settings.storeEmail && {
      key: "email",
      label: "Email",
      value: settings.storeEmail,
      hint: "For quotes and orders",
      href: `mailto:${settings.storeEmail}`,
      icon: Mail,
    },
    {
      key: "visit",
      label: "Visit",
      value: address || "Our workshop",
      hint: "Map and opening hours",
      href: "#visit-workshop",
      icon: MapPin,
    },
  ].filter(Boolean) as Channel[]

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 lg:pb-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-foreground">
            Contact
          </span>
        </nav>

        <div className="mt-4 grid items-stretch gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="flex flex-col justify-center lg:py-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">Contact us</p>
            <h1 className="mt-3 text-balance text-[1.75rem] font-light leading-[1.15] tracking-[0.005em] text-foreground sm:text-[2.1rem] lg:text-5xl">
              We&apos;re here to help with your furniture.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground lg:text-base lg:leading-7">
              Ask about a product, a custom piece or an existing order. Our team replies as soon as the workshop
              is open.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:mt-7">
              <a href="#contact-form" className="sf-btn sf-btn-primary">
                {/* Short label so the two buttons fit side by side on a phone. */}
                Message us
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </a>
              {settings.whatsappNumber && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="sf-btn sf-btn-outline">
                  <WhatsAppGlyph className="size-4 text-[#1a9d4c]" />
                  WhatsApp
                </a>
              )}
            </div>

            <p className="mt-5 flex items-start gap-2.5 border-t border-border pt-4 text-[13px] leading-6 text-muted-foreground sm:text-sm lg:mt-7 lg:pt-5">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="font-semibold text-foreground">Workshop hours: </span>
                Sunday–Thursday 8:00–19:00 · Friday 7:00–16:00 · Saturday by appointment
              </span>
            </p>
          </div>

          <div className="relative min-h-[200px] overflow-hidden bg-secondary sm:min-h-[260px] md:min-h-[360px] lg:min-h-[460px]">
            <Image
              src="/about-outdoor-seat.jpeg"
              alt={`Handcrafted wooden outdoor furniture made by ${settings.storeName}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 620px"
              className="object-cover"
            />
            {address && (
              <a
                href="#visit-workshop"
                className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-white/95 px-4 py-3 sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-xs"
              >
                <span className="grid size-9 shrink-0 place-items-center bg-primary text-primary-foreground">
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Find us</span>
                  <span className="block truncate text-sm font-semibold text-foreground">{address}</span>
                </span>
              </a>
            )}
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-px border border-border bg-border sm:mt-8 lg:mt-10 lg:grid-cols-[1fr_1fr_1.45fr_1fr]">
          {channels.map((channel) => (
            <li
              key={channel.key}
              className={`min-w-0 bg-white ${channel.key === "email" || channel.key === "visit" ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <a
                href={channel.href}
                {...(channel.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="group flex h-full items-start gap-3 p-3.5 transition-colors hover:bg-[#f6f5f3] sm:gap-3.5 sm:p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <channel.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {channel.label}
                  </span>
                  <span className="mt-1 block break-words text-sm font-semibold text-foreground group-hover:text-primary">
                    {channel.value}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{channel.hint}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
