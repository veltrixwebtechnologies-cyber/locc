import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDeliveryLocation } from "@/lib/location-store";
import { POPULAR_BRANDS, getNearestStoreForBrand } from "@/lib/brand-stores-registry";

export function PopularBrandsCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const autoplayPausedRef = useRef(false);
  const [activePage, setActivePage] = useState(0);
  const [deliveryLoc] = useDeliveryLocation();

  const brandItemsWithNearest = useMemo(() => {
    return POPULAR_BRANDS.map((brand) => {
      const nearest = getNearestStoreForBrand(brand.id, deliveryLoc?.lat, deliveryLoc?.lng);
      return {
        ...brand,
        nearest,
      };
    });
  }, [deliveryLoc?.lat, deliveryLoc?.lng]);

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
          <p className="text-[10px] text-[#453b67] sm:text-xs">
            {deliveryLoc?.lat != null && deliveryLoc?.lng != null
              ? "Top Brands Now on LocalShore · Tap any brand to open nearest branch"
              : "Top Brands Now on LocalShore · Select location to see nearest branch distance"}
          </p>
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
          className="absolute left-0 top-[38%] z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-[#211735] shadow-[0_3px_12px_rgba(33,23,53,0.16)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#981495]/30 sm:top-1/2 sm:h-10 sm:w-10 cursor-pointer"
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
          className="flex gap-2.5 overflow-x-auto px-9 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:px-14 lg:gap-4"
        >
          {brandItemsWithNearest.map((brand) => {
            const nearestStore = brand.nearest.store;
            const hasDistance = brand.nearest.hasUserLocation && brand.nearest.distanceKm != null;
            const distanceDisplay = hasDistance
              ? brand.nearest.distanceKm! < 1
                ? `${Math.round(brand.nearest.distanceKm! * 1000)}m`
                : `${brand.nearest.distanceKm!.toFixed(1)} km`
              : null;
            const areaName = nearestStore.name.includes(" - ")
              ? nearestStore.name.split(" - ")[1].split(",")[0].trim()
              : nearestStore.city;

            return (
              <div
                key={brand.id}
                className="flex min-w-[calc((100vw-5.5rem)/3)] snap-start shrink-0 flex-col items-center gap-1.5 sm:min-w-[164px] lg:min-w-[180px]"
              >
                <Link
                  to={brand.nearest.href}
                  title={
                    hasDistance
                      ? `Open nearest ${brand.name}: ${nearestStore.name} (${distanceDisplay})`
                      : `Open ${brand.name}: ${nearestStore.name}`
                  }
                  className="group relative flex h-[60px] w-full flex-col items-center justify-center rounded-lg border border-white/80 bg-white px-2 text-center shadow-[0_2px_8px_rgba(33,23,53,0.06)] transition hover:-translate-y-0.5 hover:shadow-md hover:border-[#981495]/40 focus:outline-none focus:ring-2 focus:ring-[#981495]/30 sm:h-[86px] sm:rounded-xl sm:px-4 lg:h-[96px]"
                >
                  <img
                    src={brand.logoSrc}
                    alt={`${brand.name} logo`}
                    className="max-h-10 max-w-full object-contain transition-transform group-hover:scale-105 sm:max-h-14"
                  />
                </Link>
                <div className="flex w-full items-center justify-center gap-1 text-center">
                  <span className="truncate text-[9px] font-semibold text-[#3b2a59] sm:text-[11px] sm:font-bold">
                    {brand.name}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-[8px] font-medium text-[#7a649b] sm:text-[10px]">
                  <MapPin className="h-2.5 w-2.5 text-[#981495] shrink-0 sm:h-3 sm:w-3" />
                  <span className="truncate max-w-[120px] sm:max-w-[140px]">
                    {hasDistance ? `${areaName} · ${distanceDisplay}` : areaName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => move((railRef.current?.clientWidth ?? 420) * 0.82)}
          aria-label="Next brands"
          className="absolute right-0 top-[38%] z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-[#211735] shadow-[0_3px_12px_rgba(33,23,53,0.16)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#981495]/30 sm:top-1/2 sm:h-10 sm:w-10 cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
      <div
        className="mt-2.5 flex justify-center gap-1.5 sm:hidden"
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

