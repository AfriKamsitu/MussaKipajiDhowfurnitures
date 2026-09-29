import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { EditorialProductCollection } from "@/components/home/editorial-product-collection"
import { HeroFilm } from "@/components/home/hero-film"
import { HeroCopyReveal } from "@/components/home/hero-copy-reveal"
import { Reveal } from "@/components/reveal"

const projects = [
  {
    name: "Nyali Residence",
    place: "Mombasa · 2026",
    image: "/reference-site/project.jpg",
    index: "01",
    layout: "lg:col-span-2",
  },
  {
    name: "Shela House",
    place: "Lamu · 2025",
    image: "/reference-site/gallery.jpg",
    index: "02",
    layout: "",
  },
  {
    name: "Tides Restaurant",
    place: "Zanzibar · 2025",
    image: "/reference-site/hero.jpg",
    index: "03",
    layout: "",
  },
]

const sustainabilityStats = [
  { value: "100%", label: "reclaimed dhow timber" },
  { value: "Local", label: "coastal makers & suppliers" },
  { value: "Lifetime", label: "repair promise" },
]

const ribbonItems = [
  "Reclaimed dhow timber",
  "Made slowly in Zanzibar",
  "Furniture to live with",
]

export function EditorialHome() {
  return (
    <main
      id="main-content"
      className="editorial-home cinematic-home bg-[#11130f] text-[#f1eee6]"
    >
      <section id="home" className="editorial-hero relative flex overflow-hidden">
        <HeroFilm />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,8,0.62)_0%,rgba(8,10,8,0.2)_65%,rgba(8,10,8,0.05)_100%),linear-gradient(0deg,rgba(8,10,8,0.86)_0%,rgba(8,10,8,0.08)_76%)]" />

        <div
          className="hero-wordstream pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 overflow-hidden whitespace-nowrap text-[clamp(2.6rem,9vw,8rem)] font-light uppercase leading-none tracking-[0.08em] text-white/12"
          aria-hidden="true"
        >
          PAJE DHOW · HANDCRAFTED ON THE SWAHILI COAST · PAJE DHOW · HANDCRAFTED ON THE SWAHILI COAST ·
        </div>

        <HeroCopyReveal className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col justify-end px-5 pb-8 pt-28 sm:px-10 sm:pb-12 lg:px-[60px] lg:pb-16">
          <div className="hero-copy-rise">
            <p className="text-[10px] font-bold uppercase tracking-[0.27em] text-white/75 sm:text-[11px]">
              Zanzibar, Tanzania
              <span className="mx-2 text-[#c5a274]">/</span>
              Made to endure
            </p>

            <h1 className="mt-5 max-w-[12ch] text-[clamp(3.25rem,8vw,7.5rem)] font-medium leading-[0.9] tracking-[-0.065em] text-[#f1eee6]">
              Furniture with
              <br />
              a <span className="font-light italic text-[#c5a274]">seafaring soul.</span>
            </h1>
          </div>

          <div className="mt-8 flex items-end justify-between gap-8 sm:mt-10">
            <p className="hero-detail-rise max-w-lg text-[13px] leading-6 text-white/75 sm:text-[15px] sm:leading-7">
              We turn reclaimed dhow timber into contemporary pieces, keeping the marks of wind,
              salt, and skilled hands in every finish.
            </p>

            <span className="hidden shrink-0 pb-1 text-[9px] uppercase tracking-[0.2em] text-white/55 sm:block">
              Scroll to explore <span className="ml-2 text-[#c5a274]">↓</span>
            </span>
          </div>
        </HeroCopyReveal>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-px bg-white/20" />
      </section>

      <div
        className="cinema-ribbon relative overflow-hidden border-y border-white/10 bg-[#11130f] py-4 sm:py-5"
        aria-label="Handcrafted in Zanzibar"
      >
        <div className="cinema-ribbon-track flex w-max items-center gap-5 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.24em] text-white/58 sm:gap-8 sm:text-[10px]">
          {Array.from({ length: 4 }, (_, copyIndex) => (
            <span key={copyIndex} className="flex items-center gap-5 sm:gap-8">
              {ribbonItems.map((item, itemIndex) => (
                <span key={item} className="flex items-center gap-5 sm:gap-8">
                  {item}
                  {itemIndex < ribbonItems.length - 1 && (
                    <i className="size-1 rounded-full bg-[#c5a274]" />
                  )}
                </span>
              ))}
              <i className="size-1 rounded-full bg-[#c5a274]" />
            </span>
          ))}
        </div>
      </div>

      <section
        id="collections"
        className="cinema-collection relative overflow-hidden bg-[#f1eee6] px-5 pb-24 pt-16 text-[#11130f] sm:px-10 sm:pb-32 sm:pt-20 lg:px-[60px] lg:pb-40 lg:pt-28"
      >
        <div className="cinema-light-leak pointer-events-none absolute -right-40 top-[-15rem] size-[42rem] rounded-full" />

        <div className="relative mx-auto max-w-[1320px]">
          <div className="mb-12 flex items-center justify-between border-t border-black/15 pt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-[#756d61] sm:mb-16">
            <span>
              Chapter 01 <span className="mx-2 text-[#9b5e3b]">/</span> The collection
            </span>
            <span className="hidden sm:block">Small batch · One of a kind</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <Reveal>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b5e3b]">
                Selected pieces
              </p>
              <h2 className="mt-5 max-w-[10ch] text-[clamp(3.3rem,6.4vw,6rem)] font-medium leading-[0.88] tracking-[-0.07em]">
                Objects made
                <br />
                <span className="font-light italic text-[#9b5e3b]">to live with.</span>
              </h2>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-sm font-light leading-7 text-[#625e56] sm:text-base">
                We make a limited number of pieces at a time, letting the grain, patina, and
                history of each board set the pace.
              </p>
              <Link
                href="/shop"
                className="group mt-5 inline-flex min-h-11 items-center gap-3 border-b border-[#11130f]/30 pb-2 text-[10px] font-bold uppercase tracking-[0.17em]"
              >
                Shop every piece
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <div className="cinema-product-stage mt-12 sm:mt-16 lg:mt-20">
            <EditorialProductCollection />
          </div>
        </div>
      </section>

      <section
        id="projects"
        className="cinema-projects relative overflow-hidden bg-[#11130f] px-5 py-20 text-[#f1eee6] sm:px-10 sm:py-28 lg:px-[60px] lg:py-36"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex items-center justify-between border-t border-white/15 pt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 sm:mb-14">
            <span>
              Chapter 02 <span className="mx-2 text-[#c5a274]">/</span> Places we have made
            </span>
            <span className="hidden sm:block">Coastal homes · Island hospitality</span>
          </div>

          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
                Selected projects
              </p>
              <h2 className="mt-5 max-w-[10ch] text-[clamp(3.25rem,6vw,5.9rem)] font-medium leading-[0.88] tracking-[-0.065em]">
                Spaces with
                <br />
                <span className="font-light italic text-[#c5a274]">a sense of place.</span>
              </h2>
            </Reveal>

            <Link
              href="/contact?request=I would like to discuss a furniture project."
              className="group inline-flex min-h-11 w-fit items-center gap-3 border-b border-white/35 pb-2 text-[10px] font-bold uppercase tracking-[0.17em] text-white/85 transition hover:border-[#c5a274] hover:text-[#c5a274]"
            >
              Discuss a project
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-12 grid gap-x-6 gap-y-10 sm:mt-16 lg:mt-20 lg:grid-cols-2 lg:gap-y-16">
            {projects.map((project, index) => (
              <Reveal key={project.name} className={project.layout} delay={index * 90}>
                <article className="cinema-project-card group">
                  <div
                    className={"cinema-project-image relative overflow-hidden bg-[#272820] " +
                      (index === 0 ? "aspect-[16/8]" : "aspect-[4/3]")}
                  >
                    <Image
                      src={project.image}
                      alt={project.name + " interior project"}
                      fill
                      sizes={index === 0 ? "100vw" : "(max-width: 1024px) 100vw, 50vw"}
                      className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-black/10 opacity-80 transition-opacity duration-700 group-hover:opacity-60" />
                    <span className="absolute left-4 top-4 text-[9px] uppercase tracking-[0.2em] text-white/70 sm:left-6 sm:top-6">
                      {project.index} <span className="text-[#c5a274]">/</span> Commission
                    </span>
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6">
                      <h3 className="text-xl font-medium tracking-[-0.04em] text-white sm:text-2xl">
                        {project.name}
                      </h3>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/70">
                        {project.place}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="sustainability"
        className="cinema-sustainability relative isolate overflow-hidden bg-[#263228] px-5 py-20 text-[#f1eee6] sm:px-10 sm:py-28 lg:px-[60px] lg:py-36"
      >
        <Image
          src="/reference-site/table.jpg"
          alt=""
          fill
          sizes="100vw"
          className="cinema-sustainability-image -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(17,19,15,0.92),rgba(17,19,15,0.73)_55%,rgba(17,19,15,0.45)),linear-gradient(0deg,rgba(17,19,15,0.7),transparent)]" />
        <div className="sustainability-orbit pointer-events-none absolute -right-24 top-16 size-[340px] rounded-full border border-white/10 sm:right-12 sm:size-[620px]" />

        <div className="relative mx-auto max-w-[1320px]">
          <div className="mb-12 flex items-center justify-between border-t border-white/20 pt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
            <span>
              Chapter 03 <span className="mx-2 text-[#c5a274]">/</span> How we use old wood
            </span>
            <span className="hidden sm:block">Material with a first life</span>
          </div>

          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
              Made to last · Made to matter
            </p>
            <h2 className="mt-8 max-w-[10ch] text-[clamp(3.35rem,6.7vw,6.4rem)] font-medium leading-[0.88] tracking-[-0.07em]">
              Nothing new
              <br />
              <span className="font-light italic text-[#c5a274]">needs to be cut down.</span>
            </h2>
            <p className="mt-8 max-w-xl text-[14px] font-light leading-7 text-white/68 sm:text-base">
              Our main material has already crossed oceans. Reclaiming dhow timber, finishing it
              with plant-based oils, and making locally keeps good wood in use for generations.
            </p>
          </Reveal>

          <div className="mt-14 grid border-y border-white/20 sm:mt-20 sm:grid-cols-3">
            {sustainabilityStats.map((stat, index) => (
              <Reveal key={stat.value} delay={index * 80}>
                <div className="border-b border-white/15 py-6 sm:border-b-0 sm:border-r sm:py-8 sm:last:border-r-0">
                  <strong className="block text-3xl font-medium tracking-[-0.05em] text-[#f1eee6] sm:text-4xl">
                    {stat.value}
                  </strong>
                  <span className="mt-2 block text-[9px] uppercase tracking-[0.17em] text-white/58">
                    {stat.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cinema-testimonial relative isolate flex min-h-[620px] items-center overflow-hidden px-5 py-24 text-[#f1eee6] sm:px-10 sm:py-32 lg:min-h-[780px] lg:px-[60px]">
        <Image
          src="/reference-site/sofa.jpg"
          alt=""
          fill
          sizes="100vw"
          className="cinema-testimonial-image -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,15,12,0.88),rgba(12,15,12,0.54)_58%,rgba(12,15,12,0.25)),linear-gradient(0deg,rgba(12,15,12,0.62),transparent)]" />

        <div className="relative mx-auto w-full max-w-[1180px]">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">
              A piece becomes part of a place
            </p>
            <blockquote className="mt-10 max-w-[16ch] text-[clamp(2.3rem,5vw,5.3rem)] font-light leading-[0.98] tracking-[-0.06em]">
              “The table feels as though it has always belonged here. You can see its history,
              but the form is completely at home in our space.”
            </blockquote>
            <div className="mt-10 flex items-center gap-4 text-[9px] uppercase tracking-[0.18em] text-white/70 sm:mt-14">
              <span className="h-px w-12 bg-[#c5a274]" />
              <span>
                Amira &amp; Daniel <span className="mx-2 text-white/40">·</span> Private residence,
                Lamu
              </span>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  )
}
