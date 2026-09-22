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
  X,
  ChevronDown,
} from "lucide-react";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import { CategoryMegaMenu, MobileCategoryStrip } from "@/components/category-mega-menu";
import { AnimatedSearchPlaceholder } from "@/components/ui/animated-search-placeholder";
import { Fragment, type ReactNode, useEffect, useState, useRef } from "react";
import { useWishlist, useWishlistProducts } from "@/lib/merchandising";
import { AnimatePresence, m } from "motion/react";
import { SwiggyInstantSearchDropdown } from "@/components/ui/swiggy-instant-search-dropdown";
import { hasUserChosenLocation, useDeliveryLocation, useGPSStatus } from "@/lib/location-store";
import { LocationModal } from "@/components/ui/location-modal";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HEADER_SEARCH_PLACEHOLDERS = [
  "Search for shops, products and more",
  "Search for fresh vegetables",
  "Search for nearby bakeries",
  "Search for fashion stores",
  "Search for electronics shops",
  "Search for pharmacies",
  "Search for local favorites",
];

const OPEN_LOCATION_MODAL_EVENT = "localshore_open_location_modal";

function requestLocationModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_LOCATION_MODAL_EVENT));
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cart = useCart();
  const auth = useAuth();
  const wishlist = useWishlist();
  const wishlistProducts = useWishlistProducts();
  const [deliveryLocation] = useDeliveryLocation();
  const gpsState = useGPSStatus();
  const [isCartBarMinimized, setIsCartBarMinimized] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { itemCount, subtotal } = cartTotals(cart.lines);
  const savedCount = wishlistProducts.data?.length ?? wishlist.data?.length ?? 0;
  const isSignedIn = Boolean(auth.id);
  const hasLocation = mounted && deliveryLocation !== null;

  const showFloatingCart =
    itemCount > 0 && !pathname.startsWith("/cart") && !pathname.startsWith("/checkout");

  useEffect(() => {
    setMounted(true);

    // Keep location optional: let customers browse first, then offer a
    // dismissible location prompt if they continue browsing without choosing.
    const promptTimer = window.setTimeout(() => {
      if (deliveryLocation || hasUserChosenLocation()) return;
      requestLocationModal();
    }, 8000);

    return () => {
      window.clearTimeout(promptTimer);
    };
  }, []);

  // Supabase may send recovery links to the configured site root rather than
  // /auth. Catch the recovery event at the app shell so the token session is
  // established before navigating to the password form.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && pathname !== "/auth") {
        void navigate({ to: "/auth", search: { flow: "password-recovery" } });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, pathname]);

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
  ];

  return (
    <div
      // Reserve a stable mobile footer/cart-bar gutter from the first render.
      // Cart state is hydrated from localStorage after SSR; changing page
      // padding when that state arrives causes a large layout shift.
      className={`min-h-screen bg-background pb-[calc(11rem+env(safe-area-inset-bottom,0px))] md:pb-8 ${
        pathname.startsWith("/cart") || pathname.startsWith("/checkout")
          ? "!pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:!pb-0"
          : ""
      }`}
    >
      {/* Mobile top nav header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b hairline bg-background/95 px-3.5 py-2.5 backdrop-blur md:hidden">
        <Link
          to="/"
          search={{ category: undefined, q: undefined }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src="/assets/localshore-logo.jpeg"
            alt="LocalShore"
            width={132}
            height={48}
            className="h-9 w-[132px] object-cover object-center mix-blend-multiply"
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={requestLocationModal}
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer shrink-0 max-w-[140px] sm:flex sm:max-w-[180px] ${
              gpsState.status === "detecting"
                ? "border-amber-300/60 bg-amber-50/80 text-amber-800"
                : gpsState.status === "denied" || gpsState.status === "unavailable"
                  ? "border-[#f0abfc]/60 bg-[var(--sand)]/80 text-[#981495] hover:bg-[var(--sand)]"
                  : "border-[#f0abfc]/60 bg-[var(--sand)]/80 text-[#981495] hover:bg-[var(--sand)]"
            }`}
          >
            {gpsState.status === "detecting" ? (
              <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#c026d3] fill-[#c026d3]/20" />
            )}
            <span className="truncate text-left">
              {gpsState.status === "detecting"
                ? "Detecting..."
                : hasLocation
                  ? deliveryLocation!.area || deliveryLocation!.label.split(",")[0]
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
            to="/customer-care"
            className="grid h-8 w-8 place-items-center rounded-lg border hairline bg-muted/60 text-foreground hover:bg-muted"
            aria-label="Customer Care"
            title="Customer Care"
          >
            <Headphones className="h-4 w-4" />
          </Link>

          <Link
            to="/wishlist"
            className="relative hidden h-8 w-8 place-items-center rounded-lg border hairline bg-muted/60 text-foreground hover:bg-muted sm:grid"
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

      {/* Delivery location is shown on the customer home page only. */}
      {pathname === "/" && (
        <div className="sticky top-[57px] z-40 border-b hairline bg-background px-3 py-1.5 shadow-2xs sm:hidden md:hidden">
          <button
            type="button"
            onClick={requestLocationModal}
            className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-muted/70 active:bg-muted"
            aria-label={
              hasLocation
                ? `Change delivery location, currently ${deliveryLocation!.area || deliveryLocation!.label}`
                : "Select delivery location"
            }
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              {gpsState.status === "detecting" ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {gpsState.status === "detecting" ? "Finding your location" : "Deliver to"}
              </span>
              <span className="block truncate text-xs font-bold text-foreground">
                {gpsState.status === "detecting"
                  ? "Please wait…"
                  : hasLocation
                    ? deliveryLocation!.area || deliveryLocation!.label
                    : "Select your location"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      )}

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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex shrink-0 items-center gap-2.5"
          >
            <m.img
              src="/assets/localshore-logo.jpeg"
              alt="LocalShore"
              width={176}
              height={54}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="h-12 w-[190px] object-cover object-center mix-blend-multiply"
            />
          </Link>

          {pathname === "/" && (
            <>
              {/* Vertical Divider (Equal top/bottom spacing) */}
              <div className="h-6 w-px bg-border/80 shrink-0 mx-1" />

              {/* Location Selector (Deliver to -> Location -> Chevron) */}
              <button
                type="button"
                onClick={requestLocationModal}
                className="flex shrink-0 items-center gap-2 text-left cursor-pointer hover:opacity-85 transition group min-w-0"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sand)] text-primary">
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
            </>
          )}

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
            <div className="relative min-w-0 flex-1">
              <AnimatedSearchPlaceholder
                phrases={HEADER_SEARCH_PLACEHOLDERS}
                active={!searchFocused && !headerQuery}
                className="right-0 text-sm text-muted-foreground"
              />
              <input
                value={headerQuery}
                onChange={(event) => setHeaderQuery(event.target.value)}
                placeholder=""
                aria-label="Search shops, products, brands"
                className="relative z-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
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
            <Link
              to="/customer-care"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted lg:px-3 lg:text-sm"
              aria-label="Customer Care"
            >
              <Headphones className="h-4 w-4 text-primary" />
              <span>Customer Care</span>
            </Link>
            <a
              href={import.meta.env.VITE_SELLER_HUB_URL || "/seller"}
              className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10 lg:text-sm"
            >
              Become a Seller
            </a>
            <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`ml-1 inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors lg:ml-2 ${
                    profileMenuOpen || pathname.startsWith("/profile")
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "hairline bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {isSignedIn ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {(auth.name?.[0] ?? "U").toUpperCase()}
                    </span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span>Profile</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="z-[70] w-52 rounded-2xl border border-[#eadff0] bg-white p-1.5 text-slate-800 shadow-[0_18px_45px_rgba(30,10,50,0.18)]"
              >
                {isSignedIn && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      className="mb-1 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-bold text-primary"
                    >
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    to="/orders"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  >
                    <ClipboardList className="h-4 w-4 text-primary" /> Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/rewards"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Gift className="h-4 w-4 text-primary" /> Rewards
                  </Link>
                </DropdownMenuItem>
                {!isSignedIn && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/auth"
                      search={{ redirect: pathname }}
                      className="mt-1 flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-[#700b6e]"
                    >
                      <LogIn className="h-4 w-4" /> Sign in
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      {/* Category navigation is part of the customer home page only. */}
      {pathname === "/" && (
        <>
          <CategoryMegaMenu />
          <MobileCategoryStrip sticky />
        </>
      )}

      <main className="mx-auto w-full max-w-[1600px] xl:max-w-[1800px] px-3 sm:px-4 md:px-6 lg:px-10 xl:px-12">
        {children}
      </main>

      <ShopperFooter />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {[
            { to: "/", label: "Shops", icon: Home, match: (p: string) => p === "/" },
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
        {showFloatingCart && !isCartBarMinimized && (
          <m.div
            key="expanded-cart-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="fixed bottom-[calc(4.4rem+env(safe-area-inset-bottom,0px))] inset-x-3 z-[45] pointer-events-auto md:bottom-6 md:right-8 md:inset-x-auto md:w-96"
          >
            <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-[#981495] p-3 text-white shadow-[0_12px_36px_rgba(112,11,110,0.28)] ring-1 ring-[#f3d053]/40 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white shadow-inner">
                  <ShoppingBag className="h-5 w-5 text-amber-300" />
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--marigold)] px-1 font-mono text-[9px] font-extrabold text-ink shadow-xs">
                    {itemCount}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white leading-tight truncate">
                    {itemCount} {itemCount === 1 ? "item" : "items"}{" "}
                    {cart.storeName ? `· ${cart.storeName}` : ""}
                  </p>
                  <p className="font-mono text-sm font-extrabold text-[#ffe566] tracking-wide">
                    ₹{subtotal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {pathname === "/" && (
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("localshore_open_nearby_map"))
                    }
                    aria-label="Open nearby shops map"
                    className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-white/15 px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-white/25 active:scale-95"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Show map</span>
                    <span className="sm:hidden">Map</span>
                  </button>
                )}
                <Link
                  to="/cart"
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--marigold)] px-3 py-2 text-xs font-extrabold text-ink shadow-md transition-all hover:brightness-105 active:scale-95 sm:px-3.5"
                >
                  <span className="hidden sm:inline">View Cart</span>
                  <span className="sm:hidden">Cart</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsCartBarMinimized(true)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Minimize cart bar"
                  aria-label="Minimize cart summary bar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <LocationModalHost />
    </div>
  );
}

function LocationModalHost() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_LOCATION_MODAL_EVENT, open);
    return () => window.removeEventListener(OPEN_LOCATION_MODAL_EVENT, open);
  }, []);

  return <LocationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
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
    <footer className="mt-16 border-t border-[#e2dff0] bg-[#f2f2f7] px-5 pb-8 pt-12 text-slate-600 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-10 md:grid-cols-[1.25fr_1fr_1fr_1fr] lg:gap-16">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                search={{ category: undefined, q: undefined }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="LocalShore home"
              >
                <img
                  src="/assets/localshore-logo.jpeg"
                  alt="LocalShore"
                  width={200}
                  height={68}
                  className="h-16 w-[220px] object-cover object-center mix-blend-multiply"
                />
              </Link>
            </div>
            <p className="max-w-xs text-sm font-medium leading-relaxed">
              Everyday essentials and specialty products from verified neighborhood local sellers.
            </p>
            <p className="text-xs font-semibold text-slate-500">
              © LocalShore, 2026 · Made for nearby living.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Company
            </h4>
            <div className="space-y-2">
              {footerColumns[0].links.slice(0, 4).map(([label, href]) => (
                <Link
                  key={label}
                  to={href as any}
                  className="block text-sm font-medium transition-colors hover:text-[#981495]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Contact & Legal
            </h4>
            <div className="space-y-2">
              {footerColumns[2].links.map(([label, href]) => (
                <Link
                  key={label}
                  to={href as any}
                  className="block text-sm font-medium transition-colors hover:text-[#981495]"
                >
                  {label}
                </Link>
              ))}
            </div>
            <h4 className="pt-3 font-display text-base font-extrabold tracking-tight text-slate-900">
              Partner With Us
            </h4>
            <Link to="/help?topic=sell" className="block text-sm font-medium hover:text-[#981495]">
              Sell on LocalShore
            </Link>
          </section>

          <section className="space-y-3">
            <h4 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Available in
            </h4>
            <div className="space-y-2 text-sm font-medium">
              <p>Coimbatore</p>
              <p>Chennai</p>
              <p>Bengaluru</p>
              <p>Hyderabad</p>
              <p>More cities coming soon</p>
            </div>
            <h4 className="pt-3 font-display text-base font-extrabold tracking-tight text-slate-900">
              Social Links
            </h4>
            <div className="flex gap-2 text-xs font-bold text-slate-700" aria-label="Social links">
              {["in", "◎", "f", "p", "𝕏"].map((icon) => (
                <span
                  key={icon}
                  className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white"
                >
                  {icon}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-7 border-t border-slate-400/70 pt-7 md:flex-row md:gap-5">
          <div className="flex max-w-[340px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs md:max-w-none md:justify-start">
            <span className="w-full text-center font-bold text-slate-800 md:w-auto">Shop by need</span>
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="font-semibold text-[#981495] hover:underline"
            >
              Browse all
            </Link>
            {footerCategories
              .flat()
              .slice(0, 7)
              .map((label) => (
                <Link
                  key={label}
                  to="/"
                  search={{ category: undefined, q: label }}
                  className="hover:text-[#981495]"
                >
                  {label}
                </Link>
              ))}
          </div>
          <div className="flex w-full max-w-[340px] flex-col items-center gap-3 md:w-auto md:max-w-none md:flex-row md:gap-3">
            <span className="w-full text-center font-display text-xs font-bold leading-tight text-slate-800 sm:text-sm md:w-auto md:text-left">
              Shop better with the LocalShore app
            </span>
            <div className="flex items-center gap-2">
            <span className="flex h-11 w-[112px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-black px-2 text-white shadow-sm">
              <span className="text-lg">●</span>
              <span className="whitespace-nowrap text-[8px] leading-tight">
                DOWNLOAD ON THE
                <br />
                <strong className="text-xs">App Store</strong>
              </span>
            </span>
            <span className="flex h-11 w-[112px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-black px-2 text-white shadow-sm">
              <span className="text-lg text-[#3ddc84]">▶</span>
              <span className="whitespace-nowrap text-[8px] leading-tight">
                GET IT ON
                <br />
                <strong className="text-xs">Google Play</strong>
              </span>
            </span>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Availability and delivery times vary by neighborhood.
        </p>
      </div>
    </footer>
  );
}
