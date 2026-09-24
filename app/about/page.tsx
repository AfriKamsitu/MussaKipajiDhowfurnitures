import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Breadcrumb, PageShell } from "@/components/page-shell"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover the story, local craftsmanship, and community behind Paje Dhow Furniture in Zanzibar.",
}

export default function AboutPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <section className="grid gap-12 border-b border-black/12 pb-20 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20 lg:pb-32 lg:pt-20">
        <Reveal className="flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">Our beginning · Zanzibar</p>
            <h1 className="mt-7 max-w-[10ch] text-[clamp(3.7rem,7vw,6.5rem)] font-medium leading-[0.88] tracking-[-0.07em] text-[#11130f]">
              Old timber.<br />{" "}<span className="font-light italic text-accent">A new chapter.</span>
            </h1>
          </div>
          <p className="mt-12 max-w-lg text-[15px] font-light leading-8 text-muted-foreground sm:text-[17px]">
            Paje Dhow Furniture began with a simple purpose: to create useful, lasting furniture
            through local skill and the natural character of timber shaped by Zanzibar’s coast.
          </p>
        </Reveal>

        <Reveal className="relative min-h-[520px] overflow-hidden bg-secondary sm:min-h-[680px]" delay={120}>
          <Image
            src="/reference-site/craft-workshop.webp"
            alt="A Paje Dhow furniture maker working by hand in the workshop"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover transition-transform duration-[1400ms] hover:scale-[1.025]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-6 pb-6 pt-20 text-white sm:px-8 sm:pb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/72">Made slowly · Built honestly · Finished by hand</p>
          </div>
        </Reveal>
      </section>

      <section className="grid gap-12 border-b border-black/12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">01 · Our story</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="max-w-[12ch] text-[clamp(2.8rem,5vw,5rem)] font-medium leading-[0.94] tracking-[-0.06em] text-[#11130f]">
            Furniture rooted in place, purpose, and people.
          </h2>
          <div className="mt-10 grid gap-7 text-[15px] font-light leading-8 text-muted-foreground sm:grid-cols-2 sm:text-base">
            <p>
              What started as a small workshop grew through customer trust and word of mouth. Our
              makers now create tables, beds, cabinetry, seating, doors, and custom pieces for
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

      <section className="grid gap-12 border-b border-black/12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">02 · What guides us</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="max-w-[12ch] text-[clamp(2.8rem,5vw,5rem)] font-medium leading-[0.94] tracking-[-0.06em] text-[#11130f]">
            Local knowledge stays at the centre of every piece.
          </h2>
          <div className="mt-12 grid gap-px bg-black/12 sm:grid-cols-3">
            {[
              ["Material", "We work with the grain, markings, and natural variations already present in the wood."],
              ["Making", "Patient joinery and careful finishing give every piece strength without hiding its story."],
              ["Community", "Local production supports skilled work and keeps customers close to the people making for them."],
            ].map(([title, text]) => (
              <article key={title} className="bg-white p-6 sm:min-h-64 sm:p-8">
                <h3 className="text-lg font-medium tracking-[-0.035em] text-[#11130f]">{title}</h3>
                <p className="mt-8 text-sm font-light leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="flex flex-col gap-10 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">Workshop · Bwejuu</p>
          <h2 className="mt-6 max-w-[10ch] text-[clamp(3rem,5vw,5.2rem)] font-medium leading-[0.92] tracking-[-0.06em] text-[#11130f]">
            Come and see how the work takes shape.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <Link
            href="/contact"
            className="group inline-flex min-h-14 w-fit items-center gap-8 bg-[#263228] px-6 text-xs font-bold text-[#f1eee6] transition duration-300 hover:-translate-y-1 hover:bg-[#11130f]"
          >
            Plan your visit <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </PageShell>
  )
}