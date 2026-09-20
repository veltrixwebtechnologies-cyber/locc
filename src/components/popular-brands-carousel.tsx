import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const EXTRA_BRANDS = [
  {
    id: "peter-england",
    name: "Peter England",
    logo: "PETER ENGLAND",
    logoSrc: "/assets/brand-peter-england.png",
    className: "text-[11px] font-extrabold tracking-tight",
  },
  {
    id: "raymond",
    name: "Raymond",
    logo: "raymond",
    logoSrc: "/assets/brand-raymond.png",
    className: "font-serif text-xl italic text-[#e21d2f]",
  },
  {
    id: "max",
    name: "max",
    logo: "max",
    logoSrc: "/assets/brand-max.png",
    className: "text-3xl font-black lowercase text-[#2452a4]",
  },
  {
    id: "trends",
    name: "TRENDS",
    logo: "TRENDS",
    logoSrc: "/assets/brand-trends.png",
    className: "text-lg font-semibold tracking-tight text-[#58616b]",
  },
  {
    id: "allen-solly",
    name: "Allen Solly",
    logo: "Allen Solly",
    logoSrc: "/assets/brand-allen-solly.png",
    className: "font-serif text-sm font-semibold text-[#18243a]",
  },
  {
    id: "louis-philippe",
    name: "LOUIS PHILIPPE",
    logo: "LOUIS PHILIPPE",
    logoSrc: "/assets/brand-louis-philippe.png",
    className: "text-[9px] font-black tracking-[0.08em] text-[#18243a]",
  },
  {
    id: "indian-terrain",
    name: "INDIAN TERRAIN",
    logo: "INDIAN\nTERRAIN",
    logoSrc: "/assets/brand-indian-terrain.png",
    className: "whitespace-pre-line text-xs font-serif font-bold leading-none text-[#3b465c]",
  },
  {
    id: "jockey",
    name: "JOCKEY",
    logo: "JOCKEY",
    logoSrc: "/assets/brand-jockey.png",
    className: "text-lg font-black tracking-tight text-[#172033]",
  },
  {
    id: "bata",
    name: "Bata",
    logo: "Bata",
    logoSrc: "/assets/brand-bata.png",
    className: "font-serif text-2xl italic text-[#df1d2d]",
  },
  {
    id: "woodland",
    name: "WOODLAND",
    logo: "WOODLAND",
    logoSrc: "/assets/brand-woodland.png",
    className: "text-xs font-black tracking-tight text-[#27804d]",
  },
  {
    id: "kalyan-jewellers",
    name: "KALYAN JEWELLERS",
    logo: "KALYAN\nJEWELLERS",
    logoSrc: "/assets/brand-kalyan.png",
    className: "whitespace-pre-line text-[10px] font-black leading-none text-[#d59b00]",
  },
  {
    id: "jos-alukkas",
    name: "JOS ALUKKAS",
    logo: "JOS ALUKKAS",
    logoSrc: "/assets/brand-jos-alukkas.png",
    className: "text-[10px] font-bold tracking-tight text-[#18243a]",
  },
  {
    id: "joyalukkas",
    name: "Joyalukkas",
    logo: "Joyalukkas",
    logoSrc: "/assets/brand-joyalukkas.png",
    className: "font-serif text-lg font-semibold text-[#d9252a]",
  },
];

const BRAND_ITEMS = EXTRA_BRANDS;

export function PopularBrandsCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const autoplayPausedRef = useRef(false);
  const [activePage, setActivePage] = useState(0);

  const updatePage = () => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>("a");
    if (rail && card)
      setActivePage(Math.min(4, Math.round(rail.scrollLeft / (card.offsetWidth + 12))));
  };

  useEffect(() => {
    const advance = () => {
      const rail = railRef.current;
      if (!rail || autoplayPausedRef.current) return;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (maxScroll <= 0) return;

      // Move the native overflow rail continuously. This keeps autoplay
      // reliable across desktop, touch devices, and resized viewports.
      const nextScroll = rail.scrollLeft + 0.8;
      rail.scrollLeft = nextScroll >= maxScroll ? 0 : nextScroll;
    };

    const timer = window.setInterval(advance, 24);
    return () => window.clearInterval(timer);
  }, []);

  const move = (distance: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const target = Math.min(maxScroll, Math.max(0, rail.scrollLeft + distance));
    rail.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <section className="mx-3 mt-6 overflow-hidden rounded-2xl bg-[#f0eaff] px-3 py-4 sm:mx-5 sm:px-6 sm:py-5 md:mx-8 md:px-8 lg:mt-8 lg:py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black text-[#211735] sm:text-2xl">
            Popular Brands
          </h2>
          <p className="text-[10px] text-[#453b67] sm:text-xs">Top Brands Now on LocalShore</p>
        </div>
        <Link
          to="/brands"
          className="shrink-0 text-[10px] font-bold text-[#211735] hover:text-[#981495] sm:text-xs"
        >
          View All →
        </Link>
      </div>

      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => move(-(railRef.current?.clientWidth ?? 420) * 0.82)}
          aria-label="Previous brands"
          className="absolute left-0 top-[38%] z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-[#211735] shadow-[0_3px_12px_rgba(33,23,53,0.16)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#981495]/30 sm:top-1/2 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <div
          ref={railRef}
          onScroll={updatePage}
          onMouseEnter={() => {
            autoplayPausedRef.current = true;
          }}
          onMouseLeave={() => {
            autoplayPausedRef.current = false;
          }}
          onTouchStart={() => {
            autoplayPausedRef.current = true;
          }}
          onTouchEnd={() => {
            window.setTimeout(() => {
              autoplayPausedRef.current = false;
            }, 1200);
          }}
          className="flex gap-2 overflow-x-auto px-9 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:px-14 lg:gap-4"
        >
          {BRAND_ITEMS.map((brand) => (
            <div
              key={brand.id}
              className="flex min-w-[calc((100vw-5.5rem)/3)] snap-start shrink-0 flex-col items-center gap-1 sm:min-w-[164px] lg:min-w-[180px]"
            >
              <Link
                to="/brands"
                className="flex h-[60px] w-full items-center justify-center rounded-lg border border-white/80 bg-white px-2 text-center shadow-[0_2px_8px_rgba(33,23,53,0.06)] transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#981495]/30 sm:h-[86px] sm:rounded-xl sm:px-4 lg:h-[96px]"
              >
                <img
                  src={brand.logoSrc}
                  alt={`${brand.name} logo`}
                  className="max-h-10 max-w-full object-contain sm:max-h-14"
                />
              </Link>
              <span className="truncate text-center text-[8px] font-semibold uppercase text-[#453b67] sm:hidden">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => move((railRef.current?.clientWidth ?? 420) * 0.82)}
          aria-label="Next brands"
          className="absolute right-0 top-[38%] z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-[#211735] shadow-[0_3px_12px_rgba(33,23,53,0.16)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#981495]/30 sm:top-1/2 sm:h-10 sm:w-10"
        >
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
      <div
        className="mt-2 flex justify-center gap-1.5 sm:hidden"
        aria-label="Brand carousel position"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${activePage === index ? "bg-[#981495]" : "bg-[#d8cde9]"}`}
          />
        ))}
      </div>
    </section>
  );
}
