export function ReferenceHomeHero() {
  return (
    <section
      aria-label="Shop everything local. From fashion to fresh produce. LocalShore it!"
      className="mx-auto mt-6 w-full max-w-[1760px] px-3 sm:mt-8 sm:px-5 lg:px-8"
    >
      <div className="aspect-[3.6/1] min-h-[116px] w-full overflow-hidden rounded-[24px] bg-[#8f21b4] shadow-[0_18px_42px_rgba(91,31,126,0.18)] ring-1 ring-white/60 sm:aspect-[4.35/1] sm:min-h-0 lg:rounded-[28px]">
        <img
          src="/assets/localshore-home-banner.png"
          alt="LocalShore: Shop everything local. From fashion to fresh produce. Local shops, fresh produce, real people, faster delivery. Small shops, big dreams."
          width={2048}
          height={726}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="block h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.015]"
        />
      </div>
    </section>
  );
}
