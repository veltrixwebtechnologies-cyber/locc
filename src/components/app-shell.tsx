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
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { useWishlist } from "@/lib/merchandising";
import { AnimatePresence, m } from "motion/react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cart = useCart();
  const auth = useAuth();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { itemCount } = cartTotals(cart.lines);
  const isSignedIn = Boolean(auth.id);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
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
      to: "/cart",
      label: "Cart",
      icon: ShoppingBag,
      match: (p) => p.startsWith("/cart") || p.startsWith("/checkout"),
    },
    {
      to: "/wishlist",
      label: "Wishlist",
      icon: Heart,
      match: (p) => p.startsWith("/wishlist"),
    },
    {
      to: "/orders",
      label: "Orders",
      icon: ClipboardList,
      match: (p) => p.startsWith("/orders") || p.startsWith("/order/"),
    },
    { to: "/profile", label: "Profile", icon: User, match: (p) => p.startsWith("/profile") },
  ];

  return (
    <div
      className={`min-h-screen bg-background pb-20 md:pb-0 ${itemCount > 0 && !pathname.startsWith("/cart") && !pathname.startsWith("/checkout") ? "pb-24 md:pb-24" : ""}`}
    >
      {/* Desktop top nav */}
      <header
        className={`sticky top-0 z-50 hidden border-b hairline bg-background/90 backdrop-blur transition-shadow duration-300 md:block ${
          scrolled ? "shadow-[0_8px_28px_-22px_rgba(42,27,74,0.55)]" : "shadow-none"
        }`}
      >
        <div className="flex h-[72px] w-full items-center gap-5 px-6 lg:px-8">
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
            <span className="font-display text-lg font-bold text-foreground">Local Shore</span>
          </Link>
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/",
                search: { category: undefined, q: undefined },
              })
            }
            className="hidden min-w-0 shrink-0 items-center gap-2 border-l hairline pl-4 text-left 2xl:flex"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-xs font-bold text-foreground">Delivery in 20-40 min</span>
              <span className="block max-w-36 truncate text-[11px] text-muted-foreground">
                Select delivery location
              </span>
            </span>
          </button>
          <m.form
            animate={{ scale: searchFocused ? 1.015 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="relative flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border hairline bg-muted/70 px-3 py-2.5 transition-colors focus-within:border-primary/40 focus-within:bg-background"
            onSubmit={(event) => {
              event.preventDefault();
              void navigate({
                to: "/",
                search: {
                  category: undefined,
                  q: headerQuery.trim() || undefined,
                },
              });
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={headerQuery}
              onChange={(event) => setHeaderQuery(event.target.value)}
              placeholder="Search for products, brands and shops"
              aria-label="Search products, brands and shops"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <AnimatePresence>
              {searchFocused && headerQuery.length === 0 && (
                <m.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border hairline bg-background p-2 shadow-xl"
                >
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Try searching
                  </p>
                  {["Fresh groceries", "Milk and breakfast", "Local bakery"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={() => setHeaderQuery(suggestion)}
                      className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      {suggestion}
                    </button>
                  ))}
                </m.div>
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
                    ? (wishlist.data?.length ?? 0)
                    : 0;
              const showBadge = badgeCount > 0;
              return (
                <Fragment key={t.to}>
                  {t.to === "/cart" && <HeaderCategoryMenu />}
                  <Link
                    to={t.to}
                    data-cart-target={t.to === "/cart" ? "" : undefined}
                    className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
                className="ml-2 inline-flex items-center gap-2 rounded-lg border hairline bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
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
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-teal-deep"
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

      <div className="hidden border-b border-[#ead9a8]/70 bg-[#fffaf0] md:block">
        <div className="flex h-9 w-full items-center justify-between gap-6 px-6 text-[11px] text-foreground/75 lg:px-8">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>
              Delivering to{" "}
              <strong className="font-semibold text-foreground">Marine Drive, Kochi</strong>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              20-40 min delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Trusted local sellers
            </span>
            <Link to="/help" className="inline-flex items-center gap-1.5 hover:text-primary">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              Need help?
            </Link>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 md:top-16">
        <MobileCategoryStrip />
      </div>

      <main className="mx-auto w-full max-w-7xl">{children}</main>

      <ShopperFooter />

      <AnimatePresence>
        {itemCount > 0 && !pathname.startsWith("/cart") && !pathname.startsWith("/checkout") ? (
          <m.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="fixed inset-x-0 bottom-[66px] z-50 px-4 md:bottom-5"
          >
            <div className="mx-auto flex max-w-xl items-center justify-between gap-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-[0_14px_38px_-12px_rgba(42,27,74,0.6)] ring-1 ring-white/20 md:max-w-lg md:px-5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary-foreground/75">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                </p>
                <p className="truncate font-display text-base font-bold">
                  ₹{cartTotals(cart.lines).subtotal}
                </p>
              </div>
              <Link
                to="/cart"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
                Review cart
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            const badgeCount =
              t.to === "/cart"
                ? itemCount
                : t.to === "/wishlist"
                  ? (wishlist.data?.length ?? 0)
                  : 0;
            const showBadge = badgeCount > 0;
            return (
              <Link
                key={t.to}
                to={t.to}
                data-cart-target={t.to === "/cart" ? "" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
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
                        className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-[var(--marigold)] px-1 text-center font-mono text-[9px] leading-4 text-ink"
                      >
                        {badgeCount}
                      </m.span>
                    )}
                  </AnimatePresence>
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const footerLinks = [
  [
    ["About Local Shore", "/help?topic=about"],
    ["Our neighborhoods", "/help?topic=neighborhoods"],
    ["Community notes", "/help?topic=community"],
    ["Careers", "mailto:careers@localshore.in"],
  ],
  [
    ["Sell with us", "/help?topic=sell"],
    ["Deliver with us", "/help?topic=deliver"],
    ["Partner help", "/help?topic=partner"],
    ["Merchant resources", "/help?topic=merchant"],
  ],
  [
    ["Help center", "/help"],
    ["Contact support", "/support"],
    ["Privacy center", "/help?topic=privacy"],
    ["Terms of use", "/help?topic=terms"],
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
