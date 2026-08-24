import { useState, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Star,
  Clock,
  Compass,
  Search,
  SlidersHorizontal,
  Navigation,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Store as StoreIcon,
  ShoppingBag,
  Sparkles,
  Flame,
  Utensils,
  Scissors,
  Tv,
  Shirt,
  Sparkle,
  BookOpen,
  Home as HomeIcon,
  ChefHat,
  Gem,
} from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import {
  categoryLabel,
  categoryColor,
  type Store,
  type StoreCategory,
} from "@/lib/mock-data";

interface AirbnbMapViewProps {
  stores: Store[];
  activeCategory?: StoreCategory;
  onSelectCategory?: (category: StoreCategory | "all") => void;
}

const CATEGORY_EMOJIS: Record<StoreCategory, string> = {
  flour_mill: "🌾",
  palamuthir: "🍎",
  meat_fish: "🍗",
  fashion_accessories: "💎",
  boutiques: "👗",
  showrooms: "📺",
  fast_fashion: "🛍️",
  individual_fashion: "👔",
  kitchen_appliances: "🍳",
  home_decor: "🏺",
  pharmacy: "💊",
  stationery: "📚",
  bakery: "🥐",
  grocery: "🛒",
};

export function AirbnbMapView({ stores, activeCategory, onSelectCategory }: AirbnbMapViewProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(stores[0] ?? null);
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>(activeCategory ?? "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Filter stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (filterCat !== "all" && s.category !== filterCat) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          categoryLabel[s.category].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [stores, filterCat, searchQuery]);

  // Center coordinate calculation for map bounds (normalized scale for canvas plot)
  const mapBounds = useMemo(() => {
    if (!stores.length) return { minLat: 9.95, maxLat: 9.99, minLng: 76.23, maxLng: 76.27 };
    const lats = stores.map((s) => s.lat);
    const lngs = stores.map((s) => s.lng);
    return {
      minLat: Math.min(...lats) - 0.005,
      maxLat: Math.max(...lats) + 0.005,
      minLng: Math.min(...lngs) - 0.005,
      maxLng: Math.max(...lngs) + 0.005,
    };
  }, [stores]);

  const getCanvasCoords = (lat: number, lng: number) => {
    const latSpan = mapBounds.maxLat - mapBounds.minLat || 0.04;
    const lngSpan = mapBounds.maxLng - mapBounds.minLng || 0.04;

    // Convert lat/lng to percentage X (10% to 90%) and Y (15% to 85%)
    const xPct = 12 + ((lng - mapBounds.minLng) / lngSpan) * 76;
    // Lat increases going North, so Y is inverted for screen coordinates
    const yPct = 85 - ((lat - mapBounds.minLat) / latSpan) * 70;

    return { x: Math.max(8, Math.min(92, xPct)), y: Math.max(12, Math.min(88, yPct)) };
  };

  const handleCategoryClick = (cat: string) => {
    setFilterCat(cat);
    if (onSelectCategory) {
      onSelectCategory(cat as StoreCategory | "all");
    }
  };

  const activeStore = selectedStore ?? filteredStores[0];

  return (
    <div
      className={`relative overflow-hidden bg-slate-900 transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen p-0"
          : "my-6 rounded-3xl border border-slate-800 shadow-2xl mx-5 md:mx-8"
      }`}
    >
      {/* ── Top Airbnb Search & Filter Bar ── */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3.5 backdrop-blur-md md:px-6">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white md:text-lg">
                Explore Local Neighborhood Shops
              </h2>
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-400 border border-purple-500/20">
                Airbnb Map View
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Showing {filteredStores.length} authentic shops near Beach Road & Bazaar
            </p>
          </div>
        </div>

        {/* Right Search Input & Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Map Search input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shops (Flour Mill, Boutique...)"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-4 text-xs font-semibold text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Map / List view */}
          <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "map"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "grid"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <StoreIcon className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Category Pill Bar (Airbnb Style) ── */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto border-b border-slate-800/80 bg-slate-950/60 px-4 py-2.5 no-scrollbar">
        <button
          onClick={() => handleCategoryClick("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
            filterCat === "all"
              ? "bg-white text-slate-950 shadow-md"
              : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          ✨ All Shops ({stores.length})
        </button>
        {Object.entries(categoryLabel).map(([catKey, label]) => {
          const count = stores.filter((s) => s.category === catKey).length;
          if (count === 0) return null;
          const emoji = CATEGORY_EMOJIS[catKey as StoreCategory] || "🛍️";
          const isActive = filterCat === catKey;

          return (
            <button
              key={catKey}
              onClick={() => handleCategoryClick(catKey)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isActive
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              <span className="ml-0.5 text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Split View Container ── */}
      <div className="relative flex flex-col md:flex-row h-[550px] md:h-[620px] w-full">
        {/* Left Side: Shop Directory Cards */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-slate-800 bg-slate-950 overflow-y-auto p-4 space-y-3 ${
            viewMode === "map" ? "hidden md:block" : "block"
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {filteredStores.length} Verified Stores
            </span>
            <span className="text-[11px] font-semibold text-purple-400">
              Instant 20-30 min delivery
            </span>
          </div>

          {filteredStores.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <StoreIcon className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="text-sm font-semibold">No stores found</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing search or category filter.</p>
            </div>
          ) : (
            filteredStores.map((store) => {
              const isSelected = selectedStore?.id === store.id;
              const isHovered = hoveredStoreId === store.id;
              const emoji = CATEGORY_EMOJIS[store.category] || "🛍️";

              return (
                <m.div
                  key={store.id}
                  whileHover={{ x: 4 }}
                  onMouseEnter={() => setHoveredStoreId(store.id)}
                  onMouseLeave={() => setHoveredStoreId(null)}
                  onClick={() => setSelectedStore(store)}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-3.5 transition-all duration-200 ${
                    isSelected
                      ? "border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500"
                      : isHovered
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-850 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Store Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800 shadow-inner">
                      <img
                        src={store.imageUrl}
                        alt={store.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="absolute left-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-black text-white backdrop-blur-xs">
                        {emoji}
                      </span>
                    </div>

                    {/* Store Info */}
                    <div className="flex flex-1 flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="truncate text-sm font-black text-white group-hover:text-purple-300">
                            {store.name}
                          </h3>
                          <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-black text-emerald-400 border border-emerald-500/20">
                            <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                            {store.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                          {categoryLabel[store.category]} · {store.tagline}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-purple-400" />
                          <span>{store.distanceKm.toFixed(1)} km away</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>{store.etaMin} mins</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct link button */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                    <span className="truncate text-slate-400 font-medium">{store.address}</span>
                    <Link
                      to="/store/$storeId"
                      params={{ storeId: store.id }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 group-hover:translate-x-0.5 transition"
                    >
                      <span>Visit</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </m.div>
              );
            })
          )}
        </div>

        {/* Right Side: Interactive Airbnb Map Canvas */}
        <div
          className={`relative flex-1 bg-[#0b0f19] overflow-hidden ${
            viewMode === "grid" ? "hidden md:block" : "block"
          }`}
        >
          {/* Canvas SVG Map Graphic */}
          <div className="absolute inset-0 z-0 opacity-90">
            <svg className="h-full w-full" preserveAspectRatio="none">
              <defs>
                {/* Coastal Sea Water Gradient */}
                <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0c192c" />
                  <stop offset="100%" stopColor="#08111e" />
                </linearGradient>
                {/* Road Line Pattern */}
                <pattern id="roadGrid" width="120" height="120" patternUnits="userSpaceOnUse">
                  <path
                    d="M 120 0 L 0 0 0 120"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </pattern>
              </defs>

              {/* Background Base */}
              <rect width="100%" height="100%" fill="url(#seaGrad)" />
              <rect width="100%" height="100%" fill="url(#roadGrid)" opacity="0.4" />

              {/* Coastal Line Curve */}
              <path
                d="M 0 450 Q 200 300 400 350 T 800 200 T 1200 250 L 1200 620 L 0 620 Z"
                fill="#0f172a"
                opacity="0.8"
              />

              {/* Main Arterial Roads */}
              <path
                d="M 50 100 L 950 550"
                stroke="#334155"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 200 550 C 350 200, 650 400, 850 100"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeOpacity="0.3"
                fill="none"
              />
              <path
                d="M 100 320 L 1000 320"
                stroke="#334155"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
              <path
                d="M 450 50 L 450 580"
                stroke="#334155"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Local Landmarks */}
              <g opacity="0.25">
                <text x="70" y="80" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  🏖️ BEACH ROAD COASTLINE
                </text>
                <text x="480" y="120" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  🏛️ BAZAAR SQUARE
                </text>
                <text x="220" y="480" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  🌿 TEMPLE CAR STREET
                </text>
                <text x="720" y="380" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  🏬 COMMERCIAL HAVEN
                </text>
              </g>
            </svg>
          </div>

          {/* Map Controls Floating Overlay */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setZoomLevel(Math.min(zoomLevel + 0.2, 1.6))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/90 text-white shadow-lg border border-slate-800 hover:bg-slate-800 text-sm font-black"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(Math.max(zoomLevel - 0.2, 0.8))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/90 text-white shadow-lg border border-slate-800 hover:bg-slate-800 text-sm font-black"
            >
              −
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/90 text-purple-400 shadow-lg border border-slate-800 hover:bg-slate-800 text-xs font-bold"
              title="Reset View"
            >
              🎯
            </button>
          </div>

          {/* ── Interactive Airbnb Map Pins Container ── */}
          <div
            className="absolute inset-0 z-10 transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
          >
            {filteredStores.map((store) => {
              const { x, y } = getCanvasCoords(store.lat, store.lng);
              const isSelected = selectedStore?.id === store.id;
              const isHovered = hoveredStoreId === store.id;
              const emoji = CATEGORY_EMOJIS[store.category] || "🛍️";

              return (
                <div
                  key={store.id}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <m.button
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredStoreId(store.id)}
                    onMouseLeave={() => setHoveredStoreId(null)}
                    onClick={() => setSelectedStore(store)}
                    className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-xl transition-all duration-200 ${
                      isSelected
                        ? "z-30 bg-purple-600 text-white ring-4 ring-purple-500/40 shadow-purple-500/50 scale-110"
                        : isHovered
                        ? "z-20 bg-slate-800 text-white ring-2 ring-purple-400 shadow-slate-900"
                        : "z-10 bg-slate-900/95 text-slate-200 border border-slate-700/80 hover:bg-slate-800"
                    }`}
                  >
                    {/* Pin emoji & category */}
                    <span className="text-xs">{emoji}</span>

                    {/* Airbnb Badge Price/Rating Text */}
                    <span className="text-[11px] font-black tracking-tight whitespace-nowrap">
                      {store.name.split(" ")[0]} · ⭐{store.rating.toFixed(1)}
                    </span>

                    {/* Floating Pin Pointer Arrow */}
                    <div
                      className={`absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-xs ${
                        isSelected ? "bg-purple-600" : isHovered ? "bg-slate-800" : "bg-slate-900"
                      }`}
                    />
                  </m.button>
                </div>
              );
            })}
          </div>

          {/* ── Active Store Floating Airbnb Card Overlay ── */}
          <AnimatePresence>
            {activeStore && (
              <m.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute bottom-4 left-4 right-4 z-30 mx-auto max-w-lg rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl md:bottom-6"
              >
                <div className="flex gap-4">
                  {/* Store Thumbnail */}
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800 shadow-md">
                    <img
                      src={activeStore.imageUrl}
                      alt={activeStore.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-purple-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                      {CATEGORY_EMOJIS[activeStore.category] || "🛍️"}
                    </span>
                  </div>

                  {/* Store Card Info */}
                  <div className="flex flex-1 flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-base font-black text-white">
                          {activeStore.name}
                        </h3>
                        <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/30">
                          <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                          {activeStore.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-semibold text-purple-300">
                        {categoryLabel[activeStore.category]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-300">
                        {activeStore.tagline}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-purple-400" />
                        {activeStore.address} ({activeStore.distanceKm.toFixed(1)} km)
                      </span>
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                        {activeStore.etaMin} min delivery
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card CTA Actions */}
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Open Now for Delivery</span>
                  </div>
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: activeStore.id }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 active:scale-95"
                  >
                    <span>Explore Products</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
