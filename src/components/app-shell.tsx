import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, User, ShoppingBag, LogIn, Heart, MapPin, Search } from "lucide-react";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import { HeaderCategoryMenu, MobileCategoryStrip } from "@/components/category-mega-menu";
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop top nav */}
      <header
        className={`sticky top-0 z-40 hidden border-b hairline bg-background/90 backdrop-blur transition-shadow duration-300 md:block ${
          scrolled ? "shadow-[0_8px_28px_-22px_rgba(42,27,74,0.55)]" : "shadow-none"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-6">
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
          <form
            className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border hairline bg-muted/70 px-3 py-2.5 transition-colors focus-within:border-primary/40 focus-within:bg-background"
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
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={headerQuery}
              onChange={(event) => setHeaderQuery(event.target.value)}
              placeholder="Search for products, brands and shops"
              aria-label="Search products, brands and shops"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>
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
                    <m.span whileHover={{ y: -1 }} className="relative z-10 inline-flex">
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

      <div className="sticky top-0 z-30 md:top-16">
        <MobileCategoryStrip />
      </div>

      <main className="mx-auto w-full max-w-7xl">{children}</main>

      <ShopperFooter />

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
  ["About Local Shore", "Our neighborhoods", "Community notes", "Careers"],
  ["Sell with us", "Deliver with us", "Partner help", "Merchant resources"],
  ["Help center", "Contact support", "Privacy center", "Terms of use"],
];

const footerCategories = [
  ["Daily groceries", "Fresh produce", "Pantry staples", "Breakfast", "Beverages", "Snacks"],
  ["Personal care", "Home essentials", "Health & wellness", "Baby care", "Kitchen", "Stationery"],
  ["Local favorites", "Bakery", "Ready to cook", "Gifts", "Electronics", "Seasonal picks"],
];

function ShopperFooter() {
  return (
    <footer className="mt-16 bg-primary px-5 pb-8 pt-12 text-primary-foreground md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <section>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-marigold font-display font-bold text-marigold-foreground">LS</span>
              <span className="font-display text-xl font-bold text-primary-foreground">Local Shore</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/75">Small shops, thoughtful sellers, and everyday essentials brought closer to home.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Fresh", "Nearby", "Trusted"].map((label) => <span key={label} className="rounded-full border border-primary-foreground/30 px-3 py-1 text-xs text-primary-foreground/85">{label}</span>)}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-marigold">Explore Local Shore</h2>
            <div className="mt-5 grid grid-cols-1 gap-8 text-sm text-primary-foreground/75 sm:grid-cols-3">
              {footerLinks.map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-3">
                  {column.map((label) => (
                    <a key={label} href="#" className="block transition-colors hover:text-primary-foreground">
                      {label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-primary-foreground/20 pt-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-marigold">Shop by need</h2>
                <Link to="/" search={{ category: undefined, q: undefined }} className="text-xs text-primary-foreground/75 hover:text-primary-foreground">Browse all</Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {footerCategories.flat().map((label) => <Link key={label} to="/" search={{ category: undefined, q: label }} className="rounded-lg bg-primary-foreground/10 px-3 py-2 text-xs text-primary-foreground/85 transition-colors hover:bg-primary-foreground/20">{label}</Link>)}
              </div>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-5">
              <p className="text-sm font-semibold text-primary-foreground">Keep Local Shore close</p>
              <p className="mt-1 text-sm text-primary-foreground/75">Get delivery updates and neighborhood picks.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="#" className="rounded-lg bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">iOS app</a>
                <a href="#" className="rounded-lg bg-marigold px-4 py-2 text-xs font-semibold text-marigold-foreground hover:brightness-105">Android app</a>
                {['Instagram', 'LinkedIn', 'X'].map((label) => <a key={label} href="#" className="rounded-lg border border-primary-foreground/35 px-3 py-2 text-xs text-primary-foreground/85 hover:border-primary-foreground hover:text-primary-foreground">{label}</a>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-primary-foreground/20 pt-5 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© Local Shore, 2026 · Made for nearby living.</p>
          <p>Availability and delivery times vary by neighborhood.</p>
        </div>
      </div>
    </footer>
  );
}
