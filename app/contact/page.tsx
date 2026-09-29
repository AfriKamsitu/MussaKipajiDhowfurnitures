import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Clock3, MapPin } from "lucide-react"

import { ContactForm } from "@/components/contact/contact-form"
import {
  ContactChannels,
  ContactHeroActions,
  WorkshopAddress,
} from "@/components/contact/contact-settings"
import { EditorialSiteFooter as SiteFooter } from "@/components/editorial-site-footer"
import { EditorialSiteHeader as SiteHeader } from "@/components/editorial-site-header"
import { WhatsAppContactIcon } from "@/components/whatsapp-button"

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
        <section className="relative isolate min-h-[700px] overflow-hidden bg-[#11130f] text-[#f1eee6] sm:min-h-[660px]">
          <div className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
            <Image
              src="/about-outdoor-seat.jpeg"
              alt="Handcrafted wooden outdoor furniture made by Paje Dhow Furniture"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover opacity-60 lg:opacity-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#11130f_0%,rgba(17,19,15,0.78)_42%,rgba(17,19,15,0.18)_100%)]" />
          </div>

          <div className="relative mx-auto flex min-h-[700px] max-w-[1440px] flex-col justify-between px-5 py-10 sm:px-10 sm:py-14 lg:min-h-[660px] lg:px-[60px] lg:py-16">
            <nav
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white/90">Contact</span>
            </nav>

            <div className="max-w-2xl animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#c5a274]">
                Come by · Write · Call
              </p>
              <h1 className="mt-6 max-w-[10ch] text-[clamp(3.7rem,7vw,6.8rem)] font-medium leading-[0.88] tracking-[-0.07em]">
                Let&apos;s make room for something{" "}
                <span className="font-light italic text-[#c5a274]">lasting.</span>
              </h1>
              <p className="mt-8 max-w-xl text-[15px] font-light leading-7 text-white/68 sm:text-base">
                Tell us about the piece, the room, or the project you are imagining. Our Bwejuu team
                will take it from there.
              </p>
              <ContactHeroActions />
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-10 sm:py-28 lg:px-[60px] lg:py-36">
          <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)] lg:gap-24">
            <div className="animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b5e3b]">
                01 · Start a conversation
              </p>
              <h2 className="mt-6 max-w-[10ch] text-[clamp(3rem,5vw,5.4rem)] font-medium leading-[0.91] tracking-[-0.06em] text-[#11130f]">
                Good work starts with a{" "}
                <span className="font-light italic text-[#9b5e3b]">question.</span>
              </h2>
              <p className="mt-8 max-w-xl text-[15px] font-light leading-7 text-[#66675f]">
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
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b5e3b]">
                02 · Direct lines
              </p>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.05em] text-[#11130f]">
                Talk with the workshop.
              </h2>
              <ContactChannels />
              <div className="mt-10 border-t border-black/12 pt-6 text-sm font-light leading-7 text-[#66675f]">
                <p>
                  For custom furniture and hospitality projects, include a sketch or rough
                  dimensions when you can.
                </p>
                <Link
                  href="/shop"
                  className="group mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#263228]"
                >
                  See current pieces
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="bg-[#263228] px-5 py-20 text-[#f1eee6] sm:px-10 sm:py-28 lg:px-[60px] lg:py-32"
          id="visit-workshop"
        >
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center lg:gap-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
                03 · Visit the workshop
              </p>
              <h2 className="mt-5 max-w-[9ch] text-[clamp(3rem,5vw,5.2rem)] font-medium leading-[0.92] tracking-[-0.06em]">
                See where it <span className="font-light italic text-[#c5a274]">begins.</span>
              </h2>

              <div className="mt-9 space-y-5 text-sm font-light leading-6 text-white/72">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-[#c5a274]" />
                  <WorkshopAddress />
                </div>
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-[#c5a274]" />
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
                className="mt-9 inline-flex min-h-12 items-center gap-3 border border-white/30 px-5 text-xs font-bold uppercase tracking-[0.16em] transition hover:border-[#c5a274] hover:text-[#c5a274]"
              >
                Get directions
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="aspect-[16/10] min-h-[300px] overflow-hidden border border-white/15 bg-white/5 shadow-elevated">
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
