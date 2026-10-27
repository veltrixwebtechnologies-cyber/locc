export function ReferenceHomeHero() {
  return (
    <section
      aria-label="Shop everything local. From fashion to fresh produce. LocalShore it!"
      className="mx-auto mt-2.5 w-full max-w-[1760px] px-3 sm:mt-5 sm:px-6 lg:px-8"
    >
      <div className="relative aspect-[2040/461] w-full overflow-hidden rounded-2xl bg-[#8f21b4] shadow-[0_4px_20px_rgba(143,33,180,0.12)] sm:rounded-[28px] sm:shadow-[0_18px_42px_rgba(91,31,126,0.18)]">
        <img
          src="/assets/localshore-home-banner.png"
          alt="LocalShore: Shop everything local. From fashion to fresh produce. Local shops, fresh produce, real people, faster delivery. Small shops, big dreams."
          width={2040}
          height={461}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="block h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.015]"
        />
      </div>
    </section>
  );
}
