import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Clock3, MapPin } from "lucide-react"
import { EditorialSiteHeader as SiteHeader } from "@/components/editorial-site-header"
import { EditorialSiteFooter as SiteFooter } from "@/components/editorial-site-footer"
import { WhatsAppContactIcon } from "@/components/whatsapp-button"
import { ContactForm } from "@/components/contact/contact-form"
import { ContactChannels, ContactHeroActions, WorkshopAddress } from "@/components/contact/contact-settings"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Paje Dhow Furniture about products, custom furniture, orders, and workshop visits in Bwejuu, Zanzibar.",
}

export default function ContactPage() {
  return (
    <div className="buyer-editorial-shell flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <WhatsAppContactIcon />

      <main id="main-content" className="flex-1">
        <section className="relative isolate flex min-h-[560px] items-end overflow-hidden sm:min-h-[520px]">
          <Image
            src="/about-outdoor-seat.jpeg"
            alt="Handcrafted wooden outdoor furniture made by Paje Dhow Furniture"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-center transition-transform duration-[1600ms] hover:scale-[1.02]"
          />
          <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />

          <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 text-white sm:px-6 sm:pb-16 lg:px-8">
            <nav className="mb-8 flex items-center gap-2 text-sm text-white/70" aria-label="Breadcrumb">
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">Contact</span>
            </nav>

            <div className="max-w-3xl animate-fade-up">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8c7ae]">Contact</p>
              <h1 className="mt-4 max-w-[14ch] text-3xl font-semibold leading-[1.12] sm:max-w-2xl sm:text-5xl sm:leading-tight lg:text-6xl">
                Let&apos;s create something that belongs in your space.
              </h1>
              <p className="mt-5 max-w-[34ch] text-base leading-7 text-white/80 sm:max-w-xl sm:text-lg">
                Speak with our Bwejuu team about handcrafted furniture, a custom piece, or an existing order.
              </p>
              <ContactHeroActions />
            </div>
          </div>
        </section>

        <section className="bg-card py-14 sm:py-20">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-20 lg:px-8">
            <div className="reveal-up">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Tell us what you need</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">Send us a message</h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                Share the piece, dimensions, finish, quantity, or project details you have in mind. Our team will
                continue the conversation with you directly.
              </p>
              <div className="mt-8 rounded-lg border border-border bg-background p-5 shadow-soft sm:p-7">
                <ContactForm />
              </div>
            </div>

            <aside className="lg:border-l lg:border-border lg:pl-12" aria-label="Contact details">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-sage">Contact directly</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">Talk with our team</h2>
              <ContactChannels />
            </aside>
          </div>
        </section>

        <section className="bg-accent py-14 text-accent-foreground sm:py-20" id="visit-workshop">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center lg:gap-14 lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Our workshop</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Visit us in Bwejuu</h2>
              <div className="mt-7 space-y-5 text-sm leading-6 text-white">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                  <WorkshopAddress />
                </div>
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p>
                    <span className="block font-semibold text-white">Workshop hours</span>
                    Sunday-Thursday, 8:00-19:00
                    <br />
                    Friday, 7:00-16:00
                    <br />
                    Saturday by appointment
                  </p>
                </div>
              </div>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=QG48%2BWHW%2C+Bwejuu%2C+Zanzibar"
                target="_blank"
                rel="noreferrer"
                className="interactive-press mt-8 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-primary hover:text-white"
              >
                Get directions <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="aspect-[16/10] min-h-[300px] overflow-hidden rounded-lg border border-white/15 bg-white/5 shadow-elevated">
              <iframe
                title="Map showing Paje Dhow Furniture at QG48+WHW, Bwejuu"
                src="https://www.google.com/maps?q=QG48%2BWHW%2C%20Bwejuu%2C%20Zanzibar&output=embed"
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
