import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Clock3, MapPin } from "lucide-react"

import { ContactForm } from "@/components/contact/contact-form"
import { ContactHero } from "@/components/contact/contact-hero"
import { ContactChannels, WorkshopAddress } from "@/components/contact/contact-settings"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Kipaji Dhow Furniture about products, custom furniture, orders, and workshop visits in Bwejuu, Zanzibar.",
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <ContactHero />

        <section id="contact-form" className="scroll-mt-[var(--site-header-height)] border-t border-border bg-white px-4 py-10 sm:px-6 sm:py-14 lg:px-[60px] lg:py-20">
          <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)] lg:gap-24">
            <div className="animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
                01 · Start a conversation
              </p>
              <h2 className="mt-4 max-w-[18ch] text-2xl font-medium leading-tight tracking-[-0.02em] text-[#2a211b] sm:text-3xl lg:mt-6 lg:text-4xl">
                Good work starts with a{" "}
                <span className="font-light italic text-[#6b2b2b]">question.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[15px] font-light leading-7 text-[#6f6358] lg:mt-8">
                Share the dimensions, finish, quantity, or feeling you have in mind. We will keep
                the conversation direct and human.
              </p>
              <div className="mt-6 border-t border-black/12 pt-6 lg:mt-10 lg:pt-8">
                <ContactForm />
              </div>
            </div>

            <aside
              className="hidden lg:block lg:border-l lg:border-black/12 lg:pl-12"
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
          className="scroll-mt-[var(--site-header-height)] bg-[#6b2b2b] px-4 py-12 text-[#f6f0e6] sm:px-6 sm:py-16 lg:px-[60px] lg:py-32"
          id="visit-workshop"
        >
          <div className="mx-auto grid max-w-[1320px] gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center md:gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d9b98a]">
                03 · Visit the workshop
              </p>
              <h2 className="mt-4 max-w-[18ch] text-2xl font-medium leading-tight tracking-[-0.02em] sm:text-3xl lg:mt-5 lg:text-4xl">
                See where it <span className="font-light italic text-[#d9b98a]">begins.</span>
              </h2>

              <div className="mt-6 space-y-4 text-sm font-light leading-6 text-white/72 lg:mt-9 lg:space-y-5">
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
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 border border-white/30 px-5 sm:w-auto lg:mt-9 text-xs font-bold uppercase tracking-[0.16em] transition hover:border-[#d9b98a] hover:text-[#d9b98a]"
              >
                Get directions
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="h-[280px] w-full min-w-0 overflow-hidden border border-white/15 bg-white/5 shadow-elevated md:h-[340px] lg:aspect-[16/10] lg:h-auto lg:min-h-[300px]">
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
