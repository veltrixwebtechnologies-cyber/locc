import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Search, LocateFixed, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AwningCard } from "@/components/awning-card";
import { stores, deliveryCategories, APPROVED_STORE, type StoreCategory } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { reverseGeocode } from "@/lib/geocoding.functions";
import { MerchandisingSections } from "@/components/merchandising-sections";
import { PromoCarousel } from "@/components/promo-carousel";
import type { MerchandisingProduct } from "@/lib/merchandising";
import { m } from "motion/react";
import { Reveal } from "@/components/motion/presets";

const toStoreCategory = (value?: string | null): StoreCategory => {
  const category = (value ?? "").toLowerCase();
  if (category.includes("pharma") || category.includes("wellness")) return "pharmacy";
  if (category.includes("station") || category.includes("book")) return "stationery";
  if (category.includes("bake") || category.includes("food")) return "bakery";
  return "grocery";
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const reverseGeocodeFn = useServerFn(reverseGeocode);
  const [location, setLocation] = useState("Marine Drive, Kochi");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(location);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [locError, setLocError] = useState("");
  const [query, setQuery] = useState(search.q ?? "");
  const [cat, setCat] = useState<string>(search.category ?? "all");
  const approvedProducts = useQuery({
    queryKey: ["approved-product-catalog"],
    queryFn: async () => {
      let { data, error } = await (supabase as any)
        .from("approved_product_catalog")
        .select(
          "id,seller_id,name,category,selling_price,image_url,stock,shop_name,business_type,city,state,address_line1",
        )
        .order("created_at", { ascending: false });
      // Keep existing deployments working until the catalog view migration is applied.
      if (error) {
        const fallback = await (supabase as any)
          .from("products")
          .select("id,seller_id,name,category,selling_price,image_url,stock")
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      return data ?? [];
    },
  });
  const approvedVendors = useQuery({
    queryKey: ["approved-vendors"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("approved_vendor_catalog")
        .select("id,shop_name,business_type,city,state,address_line1,category,shop_logo_path,shop_banner_path");
      if (error) throw error;
      const rows = data ?? [];
      const paths = Array.from(new Set(
        rows.flatMap((vendor: any) => [vendor.shop_banner_path, vendor.shop_logo_path]).filter(Boolean),
      )) as string[];
      const signedByPath = new Map<string, string>();
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage
          .from("seller-docs")
          .createSignedUrls(paths, 60 * 60);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
        }
      }
      return rows.map((vendor: any) => ({
        ...vendor,
        storefront_image_url:
          signedByPath.get(vendor.shop_banner_path) ??
          signedByPath.get(vendor.shop_logo_path) ??
          null,
      }));
    },
  });

  useEffect(() => {
    setQuery(search.q ?? "");
    setCat(search.category ?? "all");
  }, [search.category, search.q]);

  const autoSetLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("Location is not supported by this browser.");
      return;
    }

    setLocStatus("loading");
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let label = `Current location · ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
        try {
          const result = await reverseGeocodeFn({ data: coords });
          label = result.address;
        } catch {
          setLocError("Location found, but the address name could not be loaded.");
        }
        setDraft(label);
        setLocation(label);
        setEditing(false);
        setLocStatus("ok");
      },
      (err) => {
        setLocStatus("error");
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Permission denied. Allow location access in your browser."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Location unavailable. Type your area manually."
              : err.code === err.TIMEOUT
                ? "Timed out getting your location. Try Auto again."
                : "Could not get your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const activeFilter: StoreCategory | undefined = useMemo(() => {
    if (cat === "all") return undefined;
    return deliveryCategories.find((c) => c.id === cat)?.filter;
  }, [cat]);

  const filtered = useMemo(() => {
    const liveProducts = approvedProducts.data ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    const liveSellerIds = new Set(liveProducts.map((product: any) => product.seller_id));
    const liveVendorStores = (approvedVendors.data ?? [])
      .filter((vendor: any) => liveSellerIds.has(vendor.id))
      .map((vendor: any, index: number) => ({
          ...APPROVED_STORE,
          id: vendor.id,
          name: vendor.shop_name || APPROVED_STORE.name,
          tagline: vendor.business_type || "Approved local vendor",
          category: toStoreCategory(vendor.category),
          address:
            [vendor.address_line1, vendor.city, vendor.state].filter(Boolean).join(", ") ||
            APPROVED_STORE.address,
          imageUrl: vendor.storefront_image_url || APPROVED_STORE.imageUrl,
          distanceKm: 2 + index * 0.2,
        }));
    const allStores = liveVendorStores.length > 0 ? [...liveVendorStores, ...stores] : stores;
    return allStores.filter((s) => {
      if (cat !== "all" && !activeFilter) return false;
      if (activeFilter && s.category !== activeFilter) return false;
      if (
        normalizedQuery &&
        !s.name.toLowerCase().includes(normalizedQuery) &&
        !s.tagline.toLowerCase().includes(normalizedQuery) &&
        !liveProducts.some(
          (product: any) =>
            product.seller_id === s.id &&
            (product.name?.toLowerCase().includes(normalizedQuery) ||
              product.category?.toLowerCase().includes(normalizedQuery)),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [cat, activeFilter, query, approvedProducts.data, approvedVendors.data]);

  const homepageProducts = useMemo<MerchandisingProduct[]>(
    () =>
      (approvedProducts.data ?? []).map((product: any) => ({
        id: product.id,
        seller_id: product.seller_id,
        name: product.name,
        brand: null,
        brand_id: null,
        brand_name: null,
        category: product.category ?? null,
        selling_price: Number(product.selling_price ?? 0),
        mrp: Number(product.selling_price ?? 0),
        discount_price: null,
        discount_starts_at: null,
        discount_ends_at: null,
        clearance: false,
        stock: Number(product.stock ?? 0),
        image_url: product.image_url ?? null,
        created_at: "",
        average_rating: 0,
        review_count: 0,
        shop_name: product.shop_name || "Approved local seller",
      })),
    [approvedProducts.data],
  );

  return (
    <AppShell>
      {/* Location bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur md:top-16">
        <div className="px-5 pt-4 pb-3 md:px-8 md:pt-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Good to see you
          </p>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setLocation(draft || location);
                setEditing(false);
              }}
              className="mt-1 flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full bg-transparent text-base font-medium outline-none"
                placeholder="Enter street, area or landmark"
              />
              <button
                type="button"
                onClick={autoSetLocation}
                disabled={locStatus === "loading"}
                className="inline-flex items-center gap-1 text-xs text-primary disabled:opacity-60"
              >
                <LocateFixed
                  className={`h-3.5 w-3.5 ${locStatus === "loading" ? "animate-spin" : ""}`}
                />
                {locStatus === "loading" ? "Finding" : "Auto"}
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
              >
                Set
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setDraft(location);
                setEditing(true);
              }}
              className="mt-1 flex items-center gap-2 text-left"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-base font-medium underline-offset-4 hover:underline">
                {location}
              </span>
            </button>
          )}
          {locStatus === "error" && <p className="mt-1 text-[11px] text-destructive">{locError}</p>}
          {locStatus === "ok" && !editing && (
            <p className="mt-1 text-[11px] text-primary">Delivery location updated.</p>
          )}
        </div>
      </div>

      <PromoCarousel />

      {/* Mobile search. Desktop search remains in the commerce header. */}
      <div className="px-5 pb-2 md:hidden">
        <label className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 ring-1 ring-black/[0.04] md:px-4 md:py-3.5">
          <Search className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories or shops"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground md:text-base"
          />
        </label>
      </div>

      <MerchandisingSections fallbackProducts={homepageProducts} />

      {/* Category tiles */}
      <div className="mt-3 md:mt-6">
        <div className="mb-2 flex items-center justify-between px-5 md:px-8">
          <h2 className="font-display text-base font-bold text-foreground md:text-lg">
            Shop by category
          </h2>
          {cat !== "all" && (
            <button
              onClick={() => setCat("all")}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <CategoryStrip cat={cat} setCat={setCat} />
      </div>

      {/* Store list */}
      <div className="mt-2 flex items-center justify-between px-5 pt-2 md:mt-6 md:px-8">
        <h2 className="font-display text-base font-bold text-foreground md:text-xl">
          Verified local shops near you
        </h2>
        <span className="font-mono text-[10px] uppercase text-muted-foreground md:text-xs">
          {filtered.length} shops
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 px-5 pb-8 md:mt-4 md:grid-cols-2 md:gap-5 md:px-8 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState />
          </div>
        ) : (
          filtered.map((s) => <AwningCard key={s.id} store={s} />)
        )}
      </div>

      <p className="px-5 pb-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        · Local Shore · Coastal India ·
      </p>

      {/* Auth CTA (mock) */}
      <div className="px-5 pb-4">
        <Link
          to="/auth"
          search={{ redirect: undefined }}
          className="block text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Sign in with phone number
        </Link>
        <a
          href={import.meta.env.VITE_SELLER_HUB_URL || "http://localhost:5174"}
          className="mt-2 block text-center text-xs text-primary underline-offset-4 hover:underline"
        >
          Become a seller
        </a>
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <Reveal className="rounded-xl border hairline bg-card p-6 text-center">
      <p className="font-display text-lg">No shops match that.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No stores near you yet — try expanding your search radius or clearing filters.
      </p>
    </Reveal>
  );
}

function CategoryStrip({ cat, setCat }: { cat: string; setCat: (v: string) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {/* Left arrow */}
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollBy(-1)}
        className={`absolute left-2 top-[38%] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.06] bg-background/95 p-2 shadow-md backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-primary hover:text-primary-foreground md:flex ${
          canLeft ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {/* Right arrow */}
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollBy(1)}
        className={`absolute right-2 top-[38%] z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.06] bg-background/95 p-2 shadow-md backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-primary hover:text-primary-foreground md:flex ${
          canRight ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Edge fades */}
      <div
        className={`pointer-events-none absolute left-0 top-0 z-[5] hidden h-full w-12 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 md:block ${
          canLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 z-[5] hidden h-full w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 md:block ${
          canRight ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth px-5 pb-3 md:gap-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {deliveryCategories.map((c, i) => {
          const active = c.id === cat;
          return (
            <m.button
              key={c.id}
              onClick={() => setCat(active ? "all" : c.id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="group/tile flex w-[88px] shrink-0 flex-col items-center gap-1.5 animate-fade-in md:w-[104px]"
              whileHover={{ scale: 1.035 }}
              whileTap={{ scale: 0.97 }}
            >
              <div
                className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--sand)] ring-1 transition-all duration-300 ease-out group-hover/tile:-translate-y-0.5 group-hover/tile:shadow-md ${
                  active
                    ? "ring-2 ring-primary scale-[1.03]"
                    : "ring-black/[0.05] group-hover/tile:ring-primary/40"
                }`}
              >
                <img
                  src={c.imageUrl}
                  alt={c.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/tile:scale-110"
                />
              </div>
              <span
                className={`text-center text-[11px] font-medium leading-tight transition-colors md:text-xs ${
                  active ? "text-primary" : "text-foreground"
                }`}
              >
                {c.label}
              </span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
