export function ReferenceHomeHero() {
  return (
    <section
      aria-label="Shop everything local. From fashion to fresh produce. LocalShore it!"
      className="mx-auto mt-5 w-full max-w-[1710px] px-1 sm:mt-6 sm:px-2 md:mt-7"
    >
      <div className="aspect-[3.6/1] min-h-[96px] w-full overflow-hidden rounded-2xl sm:aspect-[4.35/1] sm:min-h-0">
        <img
          src="/assets/localshore-home-banner.png"
          alt="LocalShore: Shop everything local. From fashion to fresh produce. Local shops, fresh produce, real people, faster delivery. Small shops, big dreams."
          width={2048}
          height={726}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="block h-[104%] w-[104%] max-w-none -translate-x-[2%] -translate-y-[2%] object-cover object-center"
        />
      </div>
    </section>
  );
}
