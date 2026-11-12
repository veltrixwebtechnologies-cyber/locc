import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { useDeliveryLocation } from "@/lib/location-store";
import { isBengaluruLocation } from "@/lib/social-feed-data";

export function CityHeroBanner() {
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);

  const cityName = isBLR
    ? "Bengaluru"
    : deliveryLocation?.city?.split(",")[0] || "Coimbatore";
  const areaName = deliveryLocation?.area || deliveryLocation?.label?.split(",")[0] || cityName;

  const marketPill = isBLR
    ? "Bengaluru Local Market"
    : `${cityName} Local Market`;

  const bannerImage = isBLR
    ? "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80"
    : "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 shadow-xs select-none bg-gradient-to-r from-purple-50/70 via-slate-50/90 to-amber-50/50">
      {/* ── Refined Human-Crafted Hero Banner ── */}
      <div className="relative w-full overflow-hidden min-h-[160px] sm:min-h-[185px] md:min-h-[200px] p-4 sm:p-6 md:p-8 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Content */}
        <div className="relative z-10 max-w-[65%] sm:max-w-sm md:max-w-md space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-xs px-2.5 py-1 border border-purple-200/60 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700">Hyperlocal & Fast</span>
          </div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-[1.2] tracking-tight">
            Order fresh from <br className="hidden sm:inline" />
            local shops in <span className="text-[#8B2FC9]">{areaName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">
            Authentic neighborhood bakeries, daily groceries, and fresh produce delivered right to your doorstep.
          </p>

          <div className="pt-1 flex items-center gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition active:scale-98 cursor-pointer"
            >
              <span>Explore Shops</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>

        {/* Right City Landscape / Illustration */}
        <div className="relative shrink-0 w-32 sm:w-56 md:w-80 h-28 sm:h-36 md:h-44 overflow-hidden rounded-2xl shadow-inner border border-slate-200/60">
          <img
            src={bannerImage}
            alt={marketPill}
            className="h-full w-full object-cover rounded-2xl transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent rounded-2xl" />

          {/* Pill: Local Market */}
          <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/95 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-xs">
            <MapPin className="h-3 w-3 text-[#8B2FC9]" />
            <span className="truncate max-w-[120px] sm:max-w-none">{marketPill}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
