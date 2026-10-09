import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { CinematicPage } from "@/components/about/cinematic-page"
import { Breadcrumb, PageShell } from "@/components/page-shell"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Kipaji Dhow Furniture started in 2019 in Nungwi, Zanzibar, and now works from Bwejuu, giving old dhow timber a second life as furniture.",
}

/**
 * The story is told as short chapters that scroll over the workshop film.
 * Every chapter has the same shape (label, heading, one or two paragraphs)
 * so the page reads as one continuous piece.
 */
const chapters = [
  {
    label: "How it began",
    title: "A small workshop by the sea.",
    paragraphs: [
      "Kipaji Dhow Furniture started in 2019 in Nungwi, on the north coast of Zanzibar, where dhows have been built and repaired by hand for generations. We began with a few tools, a few boards and one idea: the wood from these boats is too good to waste.",
      "The first pieces went to neighbours and friends. They told others, and the orders kept coming. Today we work from Bwejuu, on the island's south-east coast.",
    ],
  },
  {
    label: "The wood",
    title: "Timber that has already crossed the ocean.",
    paragraphs: [
      "A dhow spends its life in sun, wind and salt water. When a boat is finally retired, its hardwood is denser, darker and more beautiful than the day it was cut.",
      "We give that timber a second life. Every board is cleaned, dried and shaped by hand, and we keep the marks the sea left behind: old nail holes, weathered grain, the curve of a hull. No two pieces are ever the same.",
    ],
  },
  {
    label: "The makers",
    title: "Made by Zanzibari hands.",
    paragraphs: [
      "Our furniture is made by local carpenters who learned their craft on this island. Joints are cut and fitted by hand, surfaces are finished slowly, and nothing leaves the workshop until the person who made it is proud of it.",
      "Buying a piece keeps that skill working here in Zanzibar, and carries a little of the island into your home.",
    ],
  },
  {
    label: "What we make",
    title: "Furniture for the way you live.",
    paragraphs: [
      "Tables, beds, chairs, cabinets, doors and custom pieces for homes, villas, lodges and restaurants. Choose from the pieces in our shop, or tell us about your space and we will build to fit it.",
    ],
  },
]

const facts = [
  ["2019", "Started in Nungwi"],
  ["Bwejuu", "Our workshop today"],
  ["By hand", "Every single piece"],
]

const label = "text-[10px] font-bold uppercase tracking-[0.28em] text-[#d9b98a]"
const chapterTitle = "mt-5 text-3xl font-medium leading-tight tracking-[-0.02em] text-[#f6f0e6] sm:text-4xl lg:text-[2.75rem]"
const body = "text-[15px] font-light leading-8 text-white/80 sm:text-base"

export default function AboutPage() {
  return (
    <PageShell className="max-w-none px-0 pb-0 pt-0 sm:px-0 sm:pb-0 sm:pt-0 lg:px-0">
      <CinematicPage>
        <section className="cine-hero" aria-labelledby="about-hero-title">
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: "About" }]}
            className="cine-hero__line mb-auto text-white/60 [&_a:hover]:text-white [&_span]:text-white"
          />

          <div className="cine-hero__copy">
            <p className={`cine-hero__line ${label}`}>Our story · Zanzibar</p>
            <h1
              id="about-hero-title"
              className="cine-hero__line mt-6 max-w-[14ch] text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[1] tracking-[-0.03em] text-[#f6f0e6]"
            >
              Old dhows.
              <br />
              <span className="font-light italic text-[#d9b98a]">New life.</span>
            </h1>
            <p className={`cine-hero__line mt-7 max-w-xl ${body}`}>
              We turn the timber of retired sailing dhows into furniture made by hand in Zanzibar, built to be used
              every day and kept for a lifetime.
            </p>
          </div>

          <dl className="cine-hero__line mt-10 grid grid-cols-3 border-t border-white/20 sm:mt-14">
            {facts.map(([value, caption]) => (
              <div key={caption} className="border-r border-white/20 py-5 pr-2 last:border-r-0 sm:pl-6 sm:first:pl-0">
                <dt className="sr-only">{caption}</dt>
                <dd className="text-xl font-medium tracking-[-0.03em] text-[#f6f0e6] sm:text-3xl">{value}</dd>
                <dd className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/60" aria-hidden="true">
                  {caption}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {chapters.map((chapter, index) => (
          <section
            key={chapter.label}
            aria-labelledby={`about-chapter-${index}`}
            className="border-b border-white/15 py-20 sm:py-28 lg:py-36"
          >
            <Reveal>
              {/* A soft dark panel keeps the words readable while the film moves behind them. */}
              <div className="mx-auto max-w-3xl bg-black/35 px-6 py-9 backdrop-blur-[2px] sm:px-10 sm:py-12">
                <p className={label}>
                  {String(index + 1).padStart(2, "0")} · {chapter.label}
                </p>
                <h2 id={`about-chapter-${index}`} className={chapterTitle}>
                  {chapter.title}
                </h2>
                <div className="mt-7 space-y-5">
                  {chapter.paragraphs.map((paragraph) => (
                    <p key={paragraph} className={body}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        ))}

        <section aria-labelledby="about-visit" className="py-20 text-center sm:py-28 lg:py-36">
          <Reveal>
            <div className="mx-auto max-w-3xl bg-black/35 px-6 py-10 backdrop-blur-[2px] sm:px-10 sm:py-14">
              <p className={label}>Visit us · Bwejuu</p>
              <h2 id="about-visit" className={chapterTitle}>
                Come and see the work take shape.
              </h2>
              <p className={`mx-auto mt-6 max-w-xl ${body}`}>
                You are welcome at the workshop. See the timber, meet the makers and choose your piece in person.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex min-h-12 items-center gap-3 bg-[#f6f0e6] px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#2a211b] transition-colors hover:bg-[#d9b98a]"
                >
                  Shop the furniture
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center border border-white/50 px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#f6f0e6] transition-colors hover:bg-white/10"
                >
                  Plan a visit
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </CinematicPage>
    </PageShell>
  )
}
