import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Breadcrumb, PageShell } from "@/components/page-shell"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "About Us",
  description: "Paje Dhow Furniture started in 2019 in Nungwi, Zanzibar, and is now located in Bwejuu, Zanzibar.",
}

const principles = [
  {
    title: "Material",
    text: "We work with the grain, markings, and natural variations already present in the wood.",
  },
  {
    title: "Making",
    text: "Patient joinery and careful finishing give every piece strength without hiding its story.",
  },
  {
    title: "Community",
    text: "Local production supports skilled work and keeps customers close to the people making for them.",
  },
]

const process = [
  {
    number: "01",
    title: "Listen",
    text: "We start with the room, the rhythm of your home, and how the piece needs to live.",
  },
  {
    number: "02",
    title: "Source",
    text: "Retired dhow timbers are documented, seasoned, and selected for the work they can become.",
  },
  {
    number: "03",
    title: "Shape",
    text: "Our makers use hand tools and quiet joinery to honour every irregularity in the wood.",
  },
  {
    number: "04",
    title: "Return",
    text: "Natural oils deepen the grain, and every piece leaves with a story worth keeping.",
  },
]

export default function AboutPage() {
  return (
    <PageShell>
      <div className="mb-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      </div>

      <section className="relative -mx-5 overflow-hidden bg-[#2a211b] text-[#f6f0e6] sm:-mx-8 lg:-mx-10">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[52%]">
          <Image
            src="/reference-site/craft-workshop.webp"
            alt="A Paje Dhow furniture maker working by hand in the workshop"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover opacity-65 lg:opacity-90"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#2a211b_0%,rgba(17,19,15,0.82)_40%,rgba(17,19,15,0.18)_100%)]" />
        </div>

        <div className="relative grid min-h-[380px] items-end px-5 py-12 sm:px-10 sm:py-16 lg:min-h-[440px] lg:grid-cols-[1fr_0.8fr] lg:px-10 lg:py-20">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d9b98a]">
              Our beginning · Nungwi, 2019
            </p>
            <h1 className="mt-6 max-w-[18ch] text-4xl sm:text-5xl font-medium leading-tight tracking-[-0.02em]">
              Old timber.
              <br />
              <span className="font-light italic text-[#d9b98a]">A new chapter.</span>
            </h1>
            <p className="mt-9 max-w-lg text-[15px] font-light leading-7 text-white/68 sm:text-base">
              Paje Dhow Furniture started in 2019 in Nungwi, Zanzibar, and is now located in
              Bwejuu, Zanzibar. From the beginning our purpose has been simple: useful, lasting
              furniture made with local skill.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-3 border-t border-white/15 lg:col-span-2">
            {[
              ["2019", "started in Nungwi"],
              ["Bwejuu", "our workshop today"],
              ["Zanzibar", "made on the island"],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/15 py-5 last:border-r-0">
                <strong className="block text-2xl font-medium tracking-[-0.05em] text-[#f6f0e6] sm:text-3xl">
                  {value}
                </strong>
                <span className="mt-2 block text-[9px] uppercase tracking-[0.16em] text-white/48">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-12 border-b border-black/12 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-32">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
            01 · Our story
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="max-w-[18ch] text-3xl sm:text-4xl font-medium leading-tight tracking-[-0.02em] text-[#2a211b]">
            Furniture rooted in place, purpose, and people.
          </h2>
          <div className="mt-10 grid gap-7 text-[15px] font-light leading-8 text-muted-foreground sm:grid-cols-2 sm:text-base">
            <p>
              What started in Nungwi in 2019 as a small workshop grew through customer trust and
              word of mouth. Today we work from Bwejuu, where our makers create tables, beds, cabinetry, seating, doors, and custom pieces for
              homes, villas, lodges, and restaurants across the island.
            </p>
            <p>
              Every project begins with the space and the people who will use it. Dimensions,
              proportion, finish, comfort, and delivery are considered before work begins, keeping
              the process personal from the first conversation to the finished piece.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="grid gap-3 bg-[#2a211b] px-0 py-3 text-[#f6f0e6] sm:grid-cols-[1.25fr_0.75fr] sm:py-4">
        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[540px]">
          <Image
            src="/reference-site/gallery.jpg"
            alt="Handcrafted furniture in a Zanzibar interior"
            fill
            sizes="(max-width: 640px) 100vw, 62vw"
            className="object-cover transition-transform duration-1000 hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/5" />
          <p className="absolute bottom-6 left-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 sm:bottom-8 sm:left-8">
            Made for a life around it
          </p>
        </div>
        <div className="flex min-h-[360px] flex-col justify-between bg-[#6b2b2b] p-7 sm:min-h-[540px] sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d9b98a]">
            A slower pace
          </p>
          <p className="max-w-sm text-[clamp(1.7rem,3vw,2.8rem)] font-light leading-[1.05] tracking-[-0.045em]">
            The best pieces take the time they need. We leave room for the wood to tell us what it
            wants to become.
          </p>
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/48">
            Workshop notes · Bwejuu
          </span>
        </div>
      </section>

      <section className="border-b border-black/12 py-20 lg:py-32">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
            02 · What guides us
          </p>
          <h2 className="mt-6 max-w-[18ch] text-3xl sm:text-4xl font-medium leading-tight tracking-[-0.02em] text-[#2a211b]">
            Local skill stays at the centre.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px bg-black/12 sm:grid-cols-3">
          {principles.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 80}>
              <article className="bg-white p-6 sm:min-h-64 sm:p-8">
                <span className="text-[10px] text-[#6b2b2b]">0{index + 1}</span>
                <h3 className="mt-10 text-lg font-medium tracking-[-0.035em] text-[#2a211b]">
                  {principle.title}
                </h3>
                <p className="mt-7 text-sm font-light leading-7 text-muted-foreground">
                  {principle.text}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-b border-black/12 py-20 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
              03 · How it takes shape
            </p>
          </Reveal>
          <div className="border-t border-black/12">
            {process.map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <article className="grid grid-cols-[38px_88px_1fr] gap-3 border-b border-black/12 py-6 sm:grid-cols-[48px_140px_1fr]">
                  <span className="text-[10px] text-[#6b2b2b]">{step.number}</span>
                  <h3 className="text-sm font-medium text-[#2a211b] sm:text-base">
                    {step.title}
                  </h3>
                  <p className="text-xs font-light leading-6 text-muted-foreground sm:text-sm">
                    {step.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-10 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b2b2b]">
            Workshop · Bwejuu
          </p>
          <h2 className="mt-6 max-w-[18ch] text-3xl sm:text-4xl font-medium leading-tight tracking-[-0.02em] text-[#2a211b]">
            Come and see how the work takes shape.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <Link
            href="/contact?request=I would like to discuss a furniture project."
            className="group inline-flex min-h-14 w-fit items-center gap-8 bg-[#6b2b2b] px-6 text-xs font-bold text-[#f6f0e6] transition duration-300 hover:-translate-y-1 hover:bg-[#2a211b]"
          >
            Plan your visit
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </PageShell>
  )
}
