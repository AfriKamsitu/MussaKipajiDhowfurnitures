import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { EditorialProductCollection } from "@/components/home/editorial-product-collection"
import { BrandFilm } from "@/components/home/brand-film"
import { HeroFilm } from "@/components/home/hero-film"

const process = [
  ["01", "Salvage", "Retired dhow timbers are sourced with care and documented by origin."],
  ["02", "Season", "Each plank rests until it is stable enough to begin its new life."],
  ["03", "Shape", "Our makers use hand tools and quiet joinery to honour every irregularity."],
  ["04", "Finish", "Natural oils deepen the grain without hiding the timber’s first story."],
]

const projects = [
  {
    name: "Nyali Residence",
    place: "Mombasa · 2026",
    image: "/reference-site/project.jpg",
    className: "lg:col-span-2",
  },
  {
    name: "Shela House",
    place: "Lamu · 2025",
    image: "/reference-site/gallery.jpg",
    className: "",
  },
  {
    name: "Tides Restaurant",
    place: "Zanzibar · 2025",
    image: "/reference-site/hero.jpg",
    className: "",
  },
]

export function EditorialHome() {
  return (
    <main id="main-content" className="editorial-home bg-[#11130f] text-[#f1eee6]">
      <section id="home" className="editorial-hero relative flex overflow-hidden">
        <HeroFilm />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,8,0.48)_0%,rgba(8,10,8,0.16)_60%,transparent_100%),linear-gradient(0deg,rgba(8,10,8,0.8)_0%,rgba(8,10,8,0.1)_70%)]" />
        <div className="relative mx-auto flex w-full max-w-[1440px] flex-col justify-end px-5 pb-7 pt-28 sm:px-10 sm:pb-10 lg:px-[60px] lg:pb-12">
          <div className="hero-copy-rise">
            <p className="text-[10px] font-bold uppercase tracking-[0.27em] text-white/72 sm:text-[11px]">
              Made on the Swahili coast · Built to endure
            </p>
            <h1 className="mt-5 max-w-none text-[clamp(3rem,7.2vw,6.5rem)] lg:max-w-[14ch] font-medium leading-[0.98] tracking-[-0.055em] text-[#f1eee6]">
              Furniture with<br />{" "}a seafaring soul.
            </h1>
          </div>
          <div className="mt-8 flex items-end justify-between gap-6 sm:mt-10">
            <p className="hero-detail-rise max-w-lg text-[13px] leading-6 text-white/72 sm:text-[15px] sm:leading-7">
              We transform reclaimed dhow timber into soulful, contemporary pieces—each carrying
              the marks of wind, salt, and skilled hands.
            </p>
            <Link
              href="/shop"
              aria-label="Explore our collections"
              className="group hidden size-[92px] shrink-0 place-items-center rounded-full border border-white/42 text-[11px] font-medium transition duration-500 hover:rotate-6 hover:border-white hover:bg-white hover:text-[#11130f] sm:grid"
            >
              <span className="flex items-center gap-1">Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </div>
          <Link href="#about" className="mt-8 flex min-h-11 w-fit items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:text-white">
            <ArrowDown className="size-3.5 animate-bounce" /> Scroll to discover
          </Link>
        </div>
      </section>

      <section id="about" className="min-h-[760px] bg-white px-5 py-24 text-[#11130f] sm:px-10 sm:py-32 lg:min-h-[889px] lg:px-[60px] lg:py-40">
        <div className="mx-auto grid max-w-[1320px] gap-16 lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-16">
          <Reveal className="flex gap-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#66675f] lg:block">
            <span className="text-[#9b5e3b]">01</span>
            <span className="lg:mt-2 lg:block">Our story</span>
          </Reveal>
          <div>
            <Reveal>
              <h2 className="max-w-[11ch] text-[clamp(3.7rem,7vw,6.3rem)] font-medium leading-[0.91] tracking-[-0.066em]">
                Old boats.<br />{" "}<span className="font-light italic text-[#9b5e3b]">New stories.</span>
              </h2>
            </Reveal>
            <Reveal className="ml-auto mt-16 max-w-[600px]" delay={120}>
              <p className="text-[clamp(1.05rem,1.65vw,1.5rem)] font-light leading-[1.55] tracking-[-0.02em] text-[#4c4d47]">
                Along the East African coast, dhows have connected people and places for centuries.
                When their sailing days end, we begin a new chapter—preserving their timber and
                history through furniture made slowly, honestly, and by hand.
              </p>
              <Link href="/about" className="group mt-9 inline-flex min-h-11 items-center gap-2 border-b border-[#11130f] text-[12px] font-bold">
                Meet the craft <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="collections" className="bg-white px-5 pb-28 text-[#11130f] sm:px-10 sm:pb-36 lg:px-[60px] lg:pb-44">
        <div className="mx-auto max-w-[1320px] border-t border-black/12 pt-12 lg:pt-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <Reveal>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b5e3b]">Selected pieces</p>
              <h2 className="mt-6 max-w-[10ch] text-[clamp(3.4rem,6vw,5.45rem)] font-medium leading-[0.91] tracking-[-0.06em]">
                Objects made<br />{" "}<span className="font-light italic text-[#9b5e3b]">to live with.</span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-base font-light leading-7 text-[#66675f]">
                Small-batch furniture shaped by the material at hand. No two pieces carry the same
                grain, patina, or story.
              </p>
              <Link href="/shop" className="group mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-bold">
                Shop every piece <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <EditorialProductCollection />

        </div>
      </section>

      <section id="craft" className="grid bg-[#11130f] text-[#f1eee6] lg:min-h-[1065px] lg:grid-cols-2">
        <Reveal className="min-w-0 overflow-hidden lg:min-h-full">
          <BrandFilm />
        </Reveal>
        <div className="flex flex-col justify-center px-5 py-20 sm:px-10 sm:py-24 lg:px-[8vw] lg:py-28">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">Craftsmanship</p>
            <h2 className="mt-6 max-w-[10ch] text-[clamp(3.25rem,5vw,4.5rem)] font-medium leading-[0.91] tracking-[-0.06em]">
              Patience is<br />{" "}<span className="font-light italic text-[#c5a274]">part of the process.</span>
            </h2>
            <p className="mt-8 max-w-xl text-[15px] font-light leading-7 text-white/60">
              Every curve, joint, and finish is guided by the timber. We preserve the scars that
              tell its first life while refining every surface for the next.
            </p>
          </Reveal>
          <div className="mt-12 border-t border-white/14">
            {process.map(([number, title, description], index) => (
              <Reveal key={title} delay={index * 70}>
                <article className="grid grid-cols-[36px_100px_1fr] gap-3 border-b border-white/14 py-5 sm:grid-cols-[42px_120px_1fr]">
                  <span className="text-[10px] text-[#c5a274]">{number}</span>
                  <h3 className="text-[15px] font-medium">{title}</h3>
                  <p className="text-xs font-light leading-5 text-white/48">{description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="bg-white px-5 py-24 text-[#11130f] sm:px-10 sm:py-32 lg:px-[60px] lg:py-40">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col gap-8 border-t border-black/12 pt-12 lg:flex-row lg:items-end lg:justify-between lg:pt-16">
            <Reveal>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b5e3b]">Selected projects</p>
              <h2 className="mt-6 max-w-[11ch] text-[clamp(3.35rem,6vw,5.4rem)] font-medium leading-[0.91] tracking-[-0.06em]">
                Spaces with<br />{" "}<span className="font-light italic text-[#9b5e3b]">a sense of place.</span>
              </h2>
            </Reveal>
            <Link href="/contact?request=I would like to discuss a furniture project." className="group inline-flex min-h-11 w-fit items-center gap-2 border-b border-black text-xs font-bold">
              Discuss a project <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-16 grid gap-x-6 gap-y-14 lg:mt-24 lg:grid-cols-2">
            {projects.map((project, index) => (
              <Reveal key={project.name} className={project.className} delay={index * 90}>
                <article className="group">
                  <div className={`relative overflow-hidden bg-[#e6e0d4] ${index === 0 ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
                    <Image
                      src={project.image}
                      alt={`${project.name} interior project`}
                      fill
                      sizes={index === 0 ? "100vw" : "(max-width: 1024px) 100vw, 50vw"}
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex items-end justify-between border-b border-black/15 py-4">
                    <h3 className="text-lg font-medium tracking-[-0.03em]">{project.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#66675f]">{project.place}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="sustainability" className="relative min-h-[820px] overflow-hidden bg-[#263228] px-5 py-24 sm:px-10 sm:py-32 lg:px-[60px] lg:py-40">
        <div className="sustainability-orbit pointer-events-none absolute -right-24 top-16 size-[440px] rounded-full border border-white/10 sm:right-12 sm:size-[620px]" />
        <div className="relative mx-auto max-w-[1320px]">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c5a274]">Made to last · Made to matter · A lighter footprint</p>
            <h2 className="mx-auto mt-12 max-w-[10ch] text-center text-[clamp(3.65rem,6.7vw,6rem)] font-medium leading-[0.91] tracking-[-0.065em]">
              Nothing new<br />{" "}<span className="font-light italic text-[#c5a274]">needs to be cut down.</span>
            </h2>
            <p className="mx-auto mt-10 max-w-2xl text-center text-[15px] font-light leading-7 text-white/58">
              Our primary material has already crossed oceans. By reclaiming dhow timber, using
              plant-based finishes, and making locally, we keep valuable wood in use for generations.
            </p>
          </Reveal>
          <div className="mt-20 grid border-y border-white/14 sm:grid-cols-3">
            {[
              ["100%", "reclaimed dhow timber"],
              ["Local", "coastal makers & suppliers"],
              ["Lifetime", "repair promise"],
            ].map(([value, label], index) => (
              <Reveal key={value} delay={index * 80}>
                <div className="border-b border-white/14 py-8 text-center sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <strong className="block text-3xl font-medium tracking-[-0.05em] text-[#f1eee6] sm:text-4xl">{value}</strong>
                  <span className="mt-2 block text-[10px] uppercase tracking-[0.17em] text-white/48">{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 text-[#11130f] sm:px-10 sm:py-32 lg:px-[60px] lg:py-40">
        <div className="mx-auto max-w-[1180px]">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b5e3b]">In their words</p>
            <blockquote className="mt-12 text-[clamp(2.2rem,4.7vw,4.7rem)] font-light leading-[1.02] tracking-[-0.055em]">
              “The table feels as though it has always belonged here. You can see its history, but
              the form is completely at home in our space.”
            </blockquote>
            <div className="mt-12 flex items-center gap-4 text-[10px] uppercase tracking-[0.17em] text-[#66675f]">
              <span className="h-px w-12 bg-[#9b5e3b]" />
              <span>Amira & Daniel · Private residence, Lamu</span>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  )
}
