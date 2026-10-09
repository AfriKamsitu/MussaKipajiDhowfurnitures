import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Clock3, MapPin } from "lucide-react"

import { ContactForm } from "@/components/contact/contact-form"
import { ContactHero } from "@/components/contact/contact-hero"
import { ContactChannels, WorkshopAddress } from "@/components/contact/contact-settings"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { WhatsAppContactIcon } from "@/components/whatsapp-button"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Kipaji Dhow Furniture about products, custom furniture, orders, and workshop visits in Bwejuu, Zanzibar.",
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <WhatsAppContactIcon />

      <main id="main-content" className="flex-1">
        <ContactHero />

        <section id="contact-form" className="scroll-mt-[var(--site-header-height)] border-t border-border bg-white px-5 py-14 sm:px-10 sm:py-20 lg:px-[60px]">
          <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)] lg:gap-24">
            <div className="animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
                01 · Start a conversation
              </p>
              <h2 className="mt-6 max-w-[18ch] text-3xl sm:text-4xl font-medium leading-tight tracking-[-0.02em] text-[#2a211b]">
                Good work starts with a{" "}
                <span className="font-light italic text-[#6b2b2b]">question.</span>
              </h2>
              <p className="mt-8 max-w-xl text-[15px] font-light leading-7 text-[#6f6358]">
                Share the dimensions, finish, quantity, or feeling you have in mind. We will keep
                the conversation direct and human.
              </p>
              <div className="mt-10 border-t border-black/12 pt-8">
                <ContactForm />
              </div>
            </div>

            <aside
              className="border-t border-black/12 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0"
              aria-label="Contact details"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
                02 · Direct lines
              </p>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.05em] text-[#2a211b]">
                Talk with the workshop.
              </h2>
              <ContactChannels />
              <div className="mt-10 border-t border-black/12 pt-6 text-sm font-light leading-7 text-[#6f6358]">
                <p>
                  For custom furniture and hospitality projects, include a sketch or rough
                  dimensions when you can.
                </p>
                <Link
                  href="/shop"
                  className="group mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6b2b2b]"
                >
                  See current pieces
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="bg-[#6b2b2b] px-5 py-20 text-[#f6f0e6] sm:px-10 sm:py-28 lg:px-[60px] lg:py-32"
          id="visit-workshop"
        >
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center lg:gap-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d9b98a]">
                03 · Visit the workshop
              </p>
              <h2 className="mt-5 max-w-[18ch] text-3xl sm:text-4xl font-medium leading-tight tracking-[-0.02em]">
                See where it <span className="font-light italic text-[#d9b98a]">begins.</span>
              </h2>

              <div className="mt-9 space-y-5 text-sm font-light leading-6 text-white/72">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-[#d9b98a]" />
                  <WorkshopAddress />
                </div>
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-[#d9b98a]" />
                  <p>
                    <span className="block font-medium text-white">Workshop hours</span>
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
                className="mt-9 inline-flex min-h-12 items-center gap-3 border border-white/30 px-5 text-xs font-bold uppercase tracking-[0.16em] transition hover:border-[#d9b98a] hover:text-[#d9b98a]"
              >
                Get directions
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="h-[300px] w-full min-w-0 overflow-hidden border sm:aspect-[16/10] sm:h-auto sm:min-h-[300px] border-white/15 bg-white/5 shadow-elevated">
              <iframe
                title="Map showing Kipaji Dhow Furniture at QG48+WHW, Bwejuu"
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
