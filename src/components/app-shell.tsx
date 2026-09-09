import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ClipboardList,
  User,
  ShoppingBag,
  LogIn,
  Heart,
  MapPin,
  Search,
  ArrowRight,
  Clock3,
  ShieldCheck,
  Headphones,
  Gift,
} from "lucide-react";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import {
  CategoryMegaMenu,
  HeaderCategoryMenu,
  MobileCategoryStrip,
} from "@/components/category-mega-menu";
import { Fragment, type ReactNode, useEffect, useState, useRef } from "react";
import { useWishlist, useWishlistProducts } from "@/lib/merchandising";
import { AnimatePresence, m } from "motion/react";
import { SwiggyInstantSearchDropdown } from "@/components/ui/swiggy-instant-search-dropdown";
import { useDeliveryLocation, initAutoGPSLocation, hasUserChosenLocation, useGPSStatus, detectCurrentGPSLocation } from "@/lib/location-store";
import { LocationModal } from "@/components/ui/location-modal";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cart = useCart();
  const auth = useAuth();
  const wishlist = useWishlist();
  const wishlistProducts = useWishlistProducts();
  const [deliveryLocation] = useDeliveryLocation();
  const gpsState = useGPSStatus();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { itemCount, subtotal } = cartTotals(cart.lines);
  const savedCount = wishlistProducts.data?.length ?? wishlist.data?.length ?? 0;
  const isSignedIn = Boolean(auth.id);
  const hasLocation = mounted && deliveryLocation !== null;

  useEffect(() => {
    setMounted(true);
    initAutoGPSLocation();
    // Auto-open location picker on first visit (no explicit location chosen yet)
    if (!hasUserChosenLocation()) {
      setIsLocationModalOpen(true);
    }
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 8;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const tabs: Array<{
    to: string;
    label: string;
    icon: typeof Home;
    match: (p: string) => boolean;
  }> = [
    { to: "/", label: "Shops", icon: Home, match: (p) => p === "/" },
    {
      to: "/explore",
      label: "Explore",
      icon: Search,
      match: (p) => p.startsWith("/explore"),
    },
    {
      to: "/cart",
      label: "Cart",
      icon: ShoppingBag,
      match: (p) => p.startsWith("/cart"),
    },
    {
      to: "/wishlist",
      label: "Saved",
      icon: Heart,
      match: (p) => p.startsWith("/wishlist"),
    },
    {
      to: "/orders",
      label: "Orders",
      icon: ClipboardList,
      match: (p) => p.startsWith("/orders") || p.startsWith("/order/"),
    },
    {
      to: "/rewards",
      label: "Rewards",
      icon: Gift,
      match: (p) => p.startsWith("/rewards"),
    },
    { to: "/profile", label: "Profile", icon: User, match: (p) => p.startsWith("/profile") },
  ];

  return (
    <div className="min-h-screen bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      {/* Mobile top nav header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b hairline bg-background/95 px-3.5 py-2.5 backdrop-blur md:hidden">
        <Link
          to="/"
          search={{ category: undefined, q: undefined }}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground font-display shadow-xs">
            LS
          </span>
          <span className="font-display text-base font-bold text-foreground tracking-tight">
            LocalShore
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer shrink-0 max-w-[140px] sm:max-w-[180px] ${
              gpsState.status === "detecting"
                ? "border-amber-300/60 bg-amber-50/80 text-amber-800"
                : gpsState.status === "denied" || gpsState.status === "unavailable"
                  ? "border-purple-200/60 bg-purple-50/80 text-purple-800 hover:bg-purple-100"
                  : "border-purple-200/60 bg-purple-50/80 text-purple-800 hover:bg-purple-100"
            }`}
          >
            {gpsState.status === "detecting" ? (
              <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-600 fill-purple-600/20" />
            )}
            <span className="truncate text-left">
              {gpsState.status === "detecting"
                ? "Detecting..."
                : hasLocation
                  ? (deliveryLocation!.area || deliveryLocation!.label.split(",")[0])
                  : "Select location"}
            </span>
          </button>

          <Link
            to="/search"
            search={{ q: "" }}
            className="grid h-8 w-8 place-items-center rounded-lg border hairline bg-muted/60 text-foreground hover:bg-muted"
            aria-label="Search products"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Link
            to="/wishlist"
            className="relative grid h-8 w-8 place-items-center rounded-lg border hairline bg-muted/60 text-foreground hover:bg-muted"
            aria-label="View Saved Items"
          >
            <Heart className="h-4 w-4" />
            {savedCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="View Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--marigold)] px-1 font-mono text-[9px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </Link>

          {isSignedIn ? (
            <Link
              to="/profile"
              className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs shrink-0"
            >
              {(auth.name?.[0] ?? "U").toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: pathname }}
              className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs shrink-0"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Desktop top nav */}
      <header
        className={`sticky top-0 z-50 hidden border-b hairline bg-background/95 backdrop-blur transition-shadow duration-300 md:block ${
          scrolled ? "shadow-[0_8px_28px_-22px_rgba(42,27,74,0.55)]" : "shadow-none"
        }`}
      >
        {/* Full-width container with edge-to-edge padding */}
        <div className="flex h-[72px] w-full items-center gap-4 lg:gap-6 px-4 md:px-6 lg:px-10 xl:px-12">
          {/* Logo (Far-left content boundary) */}
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="flex shrink-0 items-center gap-2.5"
          >
            <m.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-sm font-black shadow-xs"
            >
              LS
            </m.span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              LocalShore
            </span>
          </Link>

          {/* Vertical Divider (Equal top/bottom spacing) */}
          <div className="h-6 w-px bg-border/80 shrink-0 mx-1" />

          {/* Location Selector (Deliver to -> Location -> Chevron) */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex shrink-0 items-center gap-2 text-left cursor-pointer hover:opacity-85 transition group min-w-0"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50 text-primary">
              {gpsState.status === "detecting" ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <MapPin className="h-4 w-4 text-primary fill-primary/10" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">
                {gpsState.status === "detecting" ? "Detecting location..." : "Deliver to"}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-foreground leading-none truncate">
                {gpsState.status === "detecting"
                  ? "Please wait..."
                  : hasLocation
                    ? deliveryLocation!.area || deliveryLocation!.label.split(",")[0]
                    : "Select location"}
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
          </button>

          {/* Main Search Bar */}
          <m.form
            animate={{ scale: searchFocused ? 1.01 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative flex min-w-[200px] flex-1 items-center gap-2.5 rounded-full border hairline bg-slate-50/90 px-4 py-2.5 transition-colors focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/10 shadow-2xs"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchFocused(false);
              void navigate({
                to: "/search",
                search: {
                  q: headerQuery.trim(),
                },
              });
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 200)}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={headerQuery}
              onChange={(event) => setHeaderQuery(event.target.value)}
              placeholder="Search shops, products, brands..."
              aria-label="Search shops, products, brands"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <AnimatePresence>
              {searchFocused && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2">
                  <SwiggyInstantSearchDropdown
                    query={headerQuery}
                    onSelectResult={() => setSearchFocused(false)}
                    onClearQuery={() => setHeaderQuery("")}
                  />
                </div>
              )}
            </AnimatePresence>
          </m.form>

          {/* Navigation Links */}
          <nav className="flex shrink-0 items-center gap-1 lg:gap-1.5">
            {tabs.map((t) => {
              const active = t.match(pathname);
              const Icon = t.icon;
              const badgeCount =
                t.to === "/cart"
                  ? itemCount
                  : t.to === "/wishlist"
                    ? (wishlistProducts.data?.length ?? wishlist.data?.length ?? 0)
                    : 0;
              const showBadge = badgeCount > 0;
              return (
                <Fragment key={t.to}>
                  {t.to === "/cart" && <HeaderCategoryMenu />}
                  <Link
                    to={t.to}
                    data-cart-target={t.to === "/cart" ? "" : undefined}
                    className={`relative inline-flex items-center gap-1.5 lg:gap-2 rounded-lg px-2.5 lg:px-3 py-2 text-xs lg:text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <m.span
                      whileHover={{ y: -1 }}
                      animate={
                        t.to === "/cart" && itemCount > 0 ? { scale: [1, 1.18, 1] } : { scale: 1 }
                      }
                      transition={{ duration: 0.42 }}
                      className="relative z-10 inline-flex"
                    >
                      <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
                    </m.span>
                    {t.label}
                    <AnimatePresence mode="popLayout">
                      {showBadge && (
                        <m.span
                          key={badgeCount}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          className="ml-0.5 min-w-[18px] rounded-full bg-[var(--marigold)] px-1.5 text-center font-mono text-[10px] leading-[18px] text-ink font-bold"
                        >
                          {badgeCount}
                        </m.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </Fragment>
              );
            })}
            {isSignedIn ? (
              <Link
                to="/profile"
                className="ml-1 lg:ml-2 inline-flex items-center gap-2 rounded-lg border hairline bg-card px-2.5 lg:px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                aria-label="Profile"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {(auth.name?.[0] ?? "U").toUpperCase()}
                </span>
              </Link>
            ) : (
              <Link
                to="/auth"
                search={{ redirect: pathname }}
                className="ml-1 lg:ml-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs lg:text-sm font-bold text-primary-foreground hover:bg-[#700b6e] transition-colors"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      {/* Category Mega Menu */}
      <div className="relative z-40 hidden md:block overflow-visible">
        <CategoryMegaMenu />
      </div>

      <div className="md:hidden">
        <MobileCategoryStrip />
      </div>

      <main className="mx-auto w-full max-w-[1600px] xl:max-w-[1800px] px-3 sm:px-4 md:px-6 lg:px-10 xl:px-12">{children}</main>

      <ShopperFooter />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {[
            { to: "/", label: "Shops", icon: Home, match: (p: string) => p === "/" },
            {
              to: "/explore",
              label: "Explore",
              icon: Heart,
              match: (p: string) => p.startsWith("/explore"),
            },
            {
              to: "/cart",
              label: "Cart",
              icon: ShoppingBag,
              match: (p: string) => p.startsWith("/cart"),
            },
            {
              to: "/orders",
              label: "Orders",
              icon: ClipboardList,
              match: (p: string) => p.startsWith("/orders") || p.startsWith("/order/"),
            },
            {
              to: "/profile",
              label: "Profile",
              icon: User,
              match: (p: string) => p.startsWith("/profile"),
            },
          ].map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            const badgeCount = t.to === "/cart" ? itemCount : 0;
            const showBadge = badgeCount > 0;
            return (
              <Link
                key={t.to}
                to={t.to}
                data-cart-target={t.to === "/cart" ? "" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] sm:text-[11px] font-medium transition-colors ${
                  active ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <m.span animate={{ y: active ? -2 : 0 }} className="inline-flex">
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                  </m.span>
                  <AnimatePresence mode="popLayout">
                    {showBadge && (
                      <m.span
                        key={badgeCount}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-[var(--marigold)] px-1 text-center font-mono text-[9px] font-bold leading-4 text-ink"
                      >
                        {badgeCount}
                      </m.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="truncate max-w-[56px] text-center">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Floating Bottom Cart Bar (Optimized for Mobile & Desktop) */}
      <AnimatePresence>
        {itemCount > 0 &&
          !pathname.startsWith("/cart") &&
          !pathname.startsWith("/checkout") && (
            <m.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="hidden md:block fixed bottom-6 right-8 z-[95] w-88 pointer-events-auto"
            >
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#4c1074] via-[#6b1fa0] to-[#125c52] p-3 text-white shadow-[0_12px_36px_rgba(0,0,0,0.4)] ring-1 ring-white/20 backdrop-blur-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white shadow-inner">
                    <ShoppingBag className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--marigold)] px-1 font-mono text-[9px] font-extrabold text-ink shadow-xs">
                      {itemCount}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white leading-tight truncate">
                      {itemCount} {itemCount === 1 ? "item" : "items"}{" "}
                      {cart.storeName ? `· ${cart.storeName}` : ""}
                    </p>
                    <p className="font-mono text-sm font-extrabold text-[#ffe566] tracking-wide">
                      ₹{subtotal}
                    </p>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--marigold)] px-4 py-2.5 text-xs font-extrabold text-ink shadow-md hover:brightness-105 active:scale-95 transition-all"
                >
                  View Cart
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </m.div>
          )}
      </AnimatePresence>

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </div>
  );
}

const footerColumns = [
  {
    title: "Life at LocalShoree",
    links: [
      ["Explore With LocalShoree", "/explore"],
      ["LocalShoree News", "/news"],
      ["Neighborhood Stories", "/news"],
      ["Snackables & Quick Picks", "/best-shops"],
    ],
  },
  {
    title: "Partner With Us",
    links: [
      ["Sell on LocalShore", "/help?topic=sell"],
      ["Brand Marketplace", "/brands"],
      ["Best Shops & Sellers", "/best-shops"],
      ["Cities We Deliver", "/cities"],
    ],
  },
  {
    title: "Help & Support",
    links: [
      ["Customer Care Center", "/customer-care"],
      ["Rewards & Loyalty", "/rewards"],
      ["Gift Cards", "/gift-cards"],
      ["Privacy & Terms", "/help?topic=privacy"],
    ],
  },
];

const footerCategories = [
  ["Daily groceries", "Fresh produce", "Pantry staples", "Breakfast", "Beverages", "Snacks"],
  ["Personal care", "Home essentials", "Health & wellness", "Baby care", "Kitchen", "Stationery"],
  ["Local favorites", "Bakery", "Ready to cook", "Gifts", "Electronics", "Seasonal picks"],
];

function ShopperFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background px-5 pb-7 pt-9 md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1fr_2.2fr]">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-900 font-display font-black text-white text-xs shadow-xs">
                LS
              </span>
              <span className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                Local Shore
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-600 font-medium">
              Everyday essentials & specialty products from verified neighborhood local sellers.
            </p>
          </section>
          <section>
            <div className="grid grid-cols-1 gap-7 text-sm text-slate-600 sm:grid-cols-3">
              {footerColumns.map((col) => (
                <div key={col.title} className="space-y-2.5">
                  <h4 className="font-display text-sm font-extrabold text-slate-900 tracking-tight">
                    {col.title}
                  </h4>
                  <div className="space-y-1.5">
                    {col.links.map(([label, href]) => (
                      <Link
                        key={label}
                        to={href as any}
                        className="block text-xs font-semibold text-slate-600 transition-colors hover:text-purple-900"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Shop by need</span>
              <Link
                to="/"
                search={{ category: undefined, q: undefined }}
                className="text-xs text-primary hover:underline"
              >
                Browse all
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {footerCategories
                .flat()
                .slice(0, 8)
                .map((label) => (
                  <Link
                    key={label}
                    to="/"
                    search={{ category: undefined, q: label }}
                    className="hover:text-primary"
                  >
                    {label}
                  </Link>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© Local Shore, 2026 · Made for nearby living.</p>
          <p>Availability and delivery times vary by neighborhood.</p>
        </div>
      </div>
    </footer>
  );
}
