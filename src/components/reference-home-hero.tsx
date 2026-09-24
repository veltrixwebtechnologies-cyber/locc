export function ReferenceHomeHero() {
  return (
    <section className="mx-auto mt-5 w-full max-w-[1710px] px-1 sm:mt-6 sm:px-2 md:mt-7">
      <div className="relative min-h-[248px] overflow-hidden rounded-[18px] bg-[#b42abd] px-4 py-5 text-white shadow-[0_18px_40px_rgba(91,14,112,0.2)] sm:min-h-[250px] sm:rounded-[22px] sm:px-10 sm:py-8 lg:min-h-[274px] lg:px-12">

        <div className="relative z-10 max-w-[63%] sm:max-w-[52%] lg:max-w-[55%]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-sm sm:text-xs">
              ✨ LocalShore Marketplace
            </span>
            <span className="rounded-full bg-[#f3d053] px-3 py-1 text-[10px] font-black text-slate-900 sm:text-[11px]">
              ⚡ 20–30 MIN DELIVERY
            </span>
          </div>

          <h1 className="mt-4 font-display text-[22px] font-black leading-[1.04] tracking-tight sm:mt-6 sm:text-4xl lg:text-[42px]">
            <span className="block">Shop everything local.</span>
            <span className="block">From fashion to fresh produce.</span>
            <span className="block text-[#ffe15b]">LocalShore it!</span>
          </h1>
          <p className="mt-3 text-[10px] font-medium leading-snug text-white/90 sm:mt-4 sm:text-sm">
            Support neighborhood vendors with instant fulfillment across Shoreline City.
          </p>
          <p className="mt-2 font-display text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#ffe15b] sm:text-sm sm:tracking-[0.24em]">
            Connect <span className="px-1 text-white/70">·</span> Shop{" "}
            <span className="px-1 text-white/70">·</span> Thrive
          </p>
        </div>

        <img
          src="/assets/shoreline-rider-cutout.webp"
          alt="LocalShore delivery rider"
          width={1475}
          height={1066}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute bottom-0 right-[-5%] z-10 h-[68%] w-[48%] object-contain object-center sm:right-[7%] sm:h-full sm:w-[46%] lg:right-[10%] lg:w-[42%]"
        />
        <p className="absolute right-5 top-1/2 z-10 hidden max-w-[150px] -translate-y-1/2 rotate-[-8deg] text-center font-display text-2xl font-black leading-[1.05] tracking-tight text-white/95 lg:block">
          Local shops.<br />
          Real people.<br />
          Better together.
        </p>
      </div>
    </section>
  );
}
