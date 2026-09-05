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
import { useDeliveryLocation } from "@/lib/location-store";
import { LocationModal } from "@/components/ui/location-modal";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cart = useCart();
  const auth = useAuth();
  const wishlist = useWishlist();
  const wishlistProducts = useWishlistProducts();
  const [deliveryLocation] = useDeliveryLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { itemCount } = cartTotals(cart.lines);
  const isSignedIn = Boolean(auth.id);

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
      icon: Heart,
      match: (p) => p.startsWith("/explore"),
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
      icon: ShoppingBag,
      match: (p) => p.startsWith("/rewards"),
    },
    { to: "/profile", label: "Profile", icon: User, match: (p) => p.startsWith("/profile") },
  ];

  return (
    <div className="min-h-screen bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 overflow-x-hidden">
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
          <span className="font-display text-base font-bold text-foreground tracking-tight">LocalShore</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 rounded-full border border-purple-200/60 bg-purple-50/80 px-2 py-1 text-[10px] font-bold text-purple-800 hover:bg-purple-100 transition cursor-pointer"
          >
            <MapPin className="h-3 w-3 text-purple-600 shrink-0" />
            <span className="truncate max-w-[70px] sm:max-w-[100px]">{deliveryLocation.area}</span>
          </button>

          <Link
            to="/"
            search={{ category: undefined, q: "" }}
            className="grid h-8 w-8 place-items-center rounded-lg border hairline bg-muted/60 text-foreground hover:bg-muted"
            aria-label="Search products"
          >
            <Search className="h-4 w-4" />
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
        className={`sticky top-0 z-50 hidden border-b hairline bg-background/90 backdrop-blur transition-shadow duration-300 md:block ${
          scrolled ? "shadow-[0_8px_28px_-22px_rgba(42,27,74,0.55)]" : "shadow-none"
        }`}
      >
        <div className="flex h-[72px] w-full items-center gap-4 lg:gap-5 px-4 md:px-6 lg:px-8">
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="flex shrink-0 items-center gap-2"
          >
            <m.span
              whileHover={{ scale: 1.07, rotate: -2 }}
              whileTap={{ scale: 0.96 }}
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold"
            >
              LS
            </m.span>
            <span className="font-display text-lg font-bold text-foreground">LocalShore</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden min-w-0 shrink-0 items-center gap-2 border-l hairline pl-4 text-left xl:flex cursor-pointer hover:opacity-80 transition"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-[10px] font-medium text-muted-foreground">Deliver to</span>
              <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                {deliveryLocation.area}
                <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </span>
          </button>
          <m.form
            animate={{ scale: searchFocused ? 1.015 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border hairline bg-muted/70 px-3 py-2.5 transition-colors focus-within:border-primary/40 focus-within:bg-background"
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
              placeholder="Search for restaurants, shops, dishes or products"
              aria-label="Search restaurants, shops, dishes or products"
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
          <nav className="flex shrink-0 items-center gap-1">
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
                        ? "bg-primary text-primary-foreground"
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
                          className="ml-0.5 min-w-[18px] rounded-full bg-[var(--marigold)] px-1.5 text-center font-mono text-[10px] leading-[18px] text-ink"
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
                className="ml-1 lg:ml-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs lg:text-sm font-semibold text-primary-foreground hover:bg-[#700b6e]"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="relative z-40 hidden md:block overflow-visible">
        <CategoryMegaMenu />
      </div>

      <div className="hidden border-b border-purple-200/70 bg-purple-50/50 md:block">
        <div className="flex h-9 w-full items-center justify-between gap-6 px-4 md:px-6 text-[11px] text-foreground/75 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-primary transition cursor-pointer text-left"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>
                Delivering to{" "}
                <strong className="font-semibold text-foreground underline decoration-dotted">
                  {deliveryLocation.area}, {deliveryLocation.city}
                </strong>
                <span className="ml-1.5 text-[10px] text-purple-600 font-bold">(Change Location)</span>
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4 lg:gap-5">
            <Link to="/best-shops" className="inline-flex items-center gap-1.5 hover:text-primary font-semibold text-amber-800">
              🏆 Best Shops
            </Link>
            <Link to="/brands" className="inline-flex items-center gap-1.5 hover:text-primary font-semibold text-purple-800">
              🛍️ Brands
            </Link>
            <Link to="/explore" className="inline-flex items-center gap-1.5 hover:text-primary font-semibold text-teal-800">
              ✈️ Explore
            </Link>
            <Link to="/customer-care" className="inline-flex items-center gap-1.5 hover:text-primary">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              Customer Care
            </Link>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 md:top-16">
        <MobileCategoryStrip />
      </div>

      <main className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">{children}</main>

      <ShopperFooter />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {[
            { to: "/", label: "Shops", icon: Home, match: (p: string) => p === "/" },
            { to: "/explore", label: "Explore", icon: Heart, match: (p: string) => p.startsWith("/explore") },
            { to: "/cart", label: "Cart", icon: ShoppingBag, match: (p: string) => p.startsWith("/cart") },
            { to: "/orders", label: "Orders", icon: ClipboardList, match: (p: string) => p.startsWith("/orders") || p.startsWith("/order/") },
            { to: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") },
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
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </div>
  );
}

const footerLinks = [
  [
    ["Rewards & Loyalty", "/rewards"],
    ["Gift Cards", "/gift-cards"],
    ["LocalShore News", "/news"],
    ["Cities We Deliver", "/cities"],
  ],
  [
    ["Brand Marketplace", "/brands"],
    ["Best Shops & Sellers", "/best-shops"],
    ["International Travel", "/explore"],
    ["Sell on LocalShore", "/help?topic=sell"],
  ],
  [
    ["Customer Care Center", "/customer-care"],
    ["Help Center", "/help"],
    ["Privacy Policy", "/help?topic=privacy"],
    ["Terms of Service", "/help?topic=terms"],
  ],
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
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <section>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-marigold font-display font-bold text-marigold-foreground">
                LS
              </span>
              <span className="font-display text-xl font-bold text-foreground">Local Shore</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Everyday essentials from trusted neighborhood sellers.
            </p>
          </section>
          <section>
            <div className="grid grid-cols-1 gap-7 text-sm text-muted-foreground sm:grid-cols-3">
              {footerLinks.map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-3">
                  {column.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="block transition-colors hover:text-primary"
                    >
                      {label}
                    </a>
                  ))}
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
