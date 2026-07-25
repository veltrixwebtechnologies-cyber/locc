import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, User, ShoppingBag, LogIn, Heart } from "lucide-react";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import { HeaderCategoryMenu, MobileCategoryStrip } from "@/components/category-mega-menu";
import { Fragment, type ReactNode } from "react";
import { useWishlist } from "@/lib/merchandising";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cart = useCart();
  const auth = useAuth();
  const wishlist = useWishlist();
  const { itemCount } = cartTotals(cart.lines);
  const isSignedIn = !!(auth.phone || auth.email);

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
      <header className="sticky top-0 z-40 hidden border-b hairline bg-background/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="flex items-center gap-2"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold">
              LS
            </span>
            <span className="font-display text-lg font-bold text-foreground">Local Shore</span>
          </Link>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => {
              const active = t.match(pathname);
              const Icon = t.icon;
              const badgeCount = t.to === "/cart" ? itemCount : t.to === "/wishlist" ? (wishlist.data?.length ?? 0) : 0;
              const showBadge = badgeCount > 0;
              return (
                <Fragment key={t.to}>
                  {t.to === "/cart" && <HeaderCategoryMenu />}
                  <Link
                    to={t.to}
                    className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
                    {t.label}
                    {showBadge && (
                      <span className="ml-0.5 min-w-[18px] rounded-full bg-[var(--marigold)] px-1.5 text-center font-mono text-[10px] leading-[18px] text-ink">
                        {badgeCount}
                      </span>
                    )}
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

      <main className="mx-auto w-full max-w-6xl">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            const badgeCount = t.to === "/cart" ? itemCount : t.to === "/wishlist" ? (wishlist.data?.length ?? 0) : 0;
            const showBadge = badgeCount > 0;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-[var(--marigold)] px-1 text-center font-mono text-[9px] leading-4 text-ink">
                      {badgeCount}
                    </span>
                  )}
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
