export function BrandFilm() {
  return (
    <figure
      id="brand-film"
      aria-labelledby="brand-film-title"
      className="flex h-full scroll-mt-28 flex-col justify-center bg-[#1b2019] px-5 py-12 sm:px-10 sm:py-16 lg:px-12"
    >
      <div className="mb-6 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5a274]">
        <span>A new chapter in timber</span>
        <span className="shrink-0 text-white/60">Film preview · 00:13</span>
      </div>

      <video
        controls
        playsInline
        preload="none"
        poster="/videos/paje-dhow-preview-poster.jpg"
        width={832}
        height={468}
        aria-label="Paje Dhow Furniture brand film preview"
        aria-describedby="brand-film-description"
        className="aspect-video w-full bg-black object-contain shadow-[0_24px_70px_-24px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c5a274]"
      >
        <source src="/videos/paje-dhow-preview.mp4" type="video/mp4" />
        <track
          kind="captions"
          src="/videos/paje-dhow-preview.vtt"
          srcLang="en"
          label="Scene descriptions (English)"
        />
        Your browser does not support this video. Download the film using the link below.
      </video>

      <figcaption className="mt-7">
        <h3 id="brand-film-title" className="text-2xl font-medium leading-tight tracking-[-0.035em] text-[#f1eee6] sm:text-3xl">
          From the dhow to the home.
        </h3>
        <p id="brand-film-description" className="mt-4 max-w-lg text-sm font-light leading-6 text-white/65">
          A dhow on the Zanzibar coast, reclaimed timber at the workbench, and hands shaping
          its next chapter. A quiet look at the workshop, presented without sound.
        </p>
        <a
          href="/videos/paje-dhow-preview.mp4"
          download="paje-dhow-furniture-preview.mp4"
          className="mt-5 inline-flex min-h-11 items-center border-b border-white/35 text-xs font-medium text-[#f1eee6] transition-colors hover:border-[#c5a274] hover:text-[#c5a274] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c5a274]"
        >
          Download the film preview
        </a>
      </figcaption>
    </figure>
  )
}
