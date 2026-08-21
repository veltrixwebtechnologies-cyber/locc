import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Menu, PackageSearch, X, Sparkles } from "lucide-react";
import { deliveryCategories } from "@/lib/mock-data";

type CategoryPromo = {
  headline: string;
  subtitle: string;
  ctaText: string;
  imageUrl: string;
  badge: string;
};

const categoryPromos: Record<string, CategoryPromo> = {
  fresh: {
    headline: "Daily essentials starting at ₹19",
    subtitle: "Get FREE 20-30 min delivery, fresh produce & daily dairy offers",
    ctaText: "Shop Fresh Produce Now",
    badge: "DAILY HARVEST",
    imageUrl: "/marketplace-ads/groceries-hero.png",
  },
  ready: {
    headline: "Quick meals & snacks starting at ₹29",
    subtitle: "Instant breakfast, tea snacks & beverages delivered fast",
    ctaText: "Explore Quick Kitchen",
    badge: "INSTANT PICKS",
    imageUrl:
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=600&q=80",
  },
  wellness: {
    headline: "Wellness & pharmacy at your doorstep",
    subtitle: "Cough care, first-aid, personal care & everyday pharmacy essentials",
    ctaText: "Shop Wellness Now",
    badge: "PHARMACY CARE",
    imageUrl: "/marketplace-ads/pharmacy.png",
  },
  home: {
    headline: "Home care & cleaning starting at ₹49",
    subtitle: "Detergents, dishwash, paper goods & household tools from local shops",
    ctaText: "Explore Home Care",
    badge: "HOME ESSENTIALS",
    imageUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80",
  },
  stationery: {
    headline: "School & office supplies starting at ₹15",
    subtitle: "Notebooks, pens, files & art supplies from neighborhood stores",
    ctaText: "Shop Stationery Now",
    badge: "OFFICE & SCHOOL",
    imageUrl:
      "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80",
  },
  bakery: {
    headline: "Freshly baked breads & cakes starting at ₹35",
    subtitle: "Artisanal breads, puffs, tea cakes & celebration cakes",
    ctaText: "Shop Fresh Bakes",
    badge: "LOCAL BAKERY",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
  electronics: {
    headline: "Tech accessories starting at ₹99",
    subtitle: "Chargers, cables, power banks & small home electronics",
    ctaText: "Explore Tech Deals",
    badge: "SMART TECH",
    imageUrl:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80",
  },
  fashion: {
    headline: "Local fashion edit starting at ₹199",
    subtitle: "Clothing, footwear & accessories from verified nearby shops",
    ctaText: "Explore Fashion",
    badge: "NEW STYLES",
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80",
  },
  beauty: {
    headline: "Beauty & personal care starting at ₹49",
    subtitle: "Skincare, hair care & body grooming essentials delivered nearby",
    ctaText: "Shop Beauty Now",
    badge: "PERSONAL CARE",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
  },
  "local-favorites": {
    headline: "Kerala & local specialties starting at ₹39",
    subtitle: "Banana chips, authentic spice mixes, pickles & local sweets",
    ctaText: "Shop Local Specials",
    badge: "LOCAL SHORE EXCLUSIVE",
    imageUrl: "/marketplace-ads/pet-care.png",
  },
};

const menuGroups = [
  {
    id: "fresh",
    label: "Fresh",
    categoryId: "fresh",
    columns: [
      {
        heading: "Daily Produce",
        items: ["Vegetables", "Fruits", "Leafy greens", "Coconut", "Farm eggs"],
      },
      {
        heading: "Staples",
        items: ["Rice & dals", "Flours", "Oils", "Spices", "Salt & sugar"],
      },
      {
        heading: "Dairy",
        items: ["Milk", "Curd", "Paneer", "Butter", "Cheese"],
      },
    ],
  },
  {
    id: "ready",
    label: "Quick Kitchen",
    categoryId: "ready",
    columns: [
      {
        heading: "Ready to Cook",
        items: ["Breakfast mixes", "Batter", "Noodles", "Frozen snacks", "Heat & eat"],
      },
      {
        heading: "Snacks",
        items: ["Chips", "Biscuits", "Namkeen", "Bakery bites", "Juices"],
      },
      {
        heading: "Beverages",
        items: ["Tea", "Coffee", "Soft drinks", "Energy drinks", "Water"],
      },
    ],
  },
  {
    id: "wellness",
    label: "Wellness",
    categoryId: "pharmacy",
    columns: [
      {
        heading: "Pharmacy",
        items: ["OTC medicines", "First aid", "Pain relief", "Cold & cough", "Digestive care"],
      },
      {
        heading: "Personal Care",
        items: ["Shampoo", "Soap", "Oral care", "Skin care", "Sanitary care"],
      },
      {
        heading: "Baby & Health",
        items: ["Baby care", "Supplements", "Masks", "Sanitizers", "Wellness devices"],
      },
    ],
  },
  {
    id: "home",
    label: "Home",
    categoryId: "home",
    columns: [
      {
        heading: "Cleaning",
        items: ["Floor cleaners", "Dishwash", "Detergents", "Disinfectants", "Garbage bags"],
      },
      {
        heading: "Kitchen",
        items: ["Foils & wraps", "Storage", "Utensils", "Paper goods", "Pooja needs"],
      },
      {
        heading: "Essentials",
        items: ["Batteries", "Bulbs", "Repairs", "Pet basics", "Monsoon needs"],
      },
    ],
  },
  {
    id: "stationery",
    label: "Stationery",
    categoryId: "stationery",
    columns: [
      {
        heading: "School",
        items: ["Notebooks", "Pens", "Geometry boxes", "Craft paper", "School lists"],
      },
      {
        heading: "Office",
        items: ["Files", "Markers", "Printer paper", "Sticky notes", "Desk supplies"],
      },
      {
        heading: "Art",
        items: ["Paints", "Brushes", "Canvas", "Sketch books", "Clay"],
      },
    ],
  },
  {
    id: "bakery",
    label: "Bakery",
    categoryId: "snacks",
    columns: [
      {
        heading: "Fresh Bakes",
        items: ["Bread", "Buns", "Puffs", "Cakes", "Cookies"],
      },
      {
        heading: "Local Specials",
        items: ["Banana chips", "Mixture", "Halwa", "Tea snacks", "Rusks"],
      },
      {
        heading: "Occasions",
        items: ["Birthday cakes", "Pastries", "Party packs", "Candles", "Gift boxes"],
      },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    categoryId: "electronics",
    columns: [
      {
        heading: "Mobile",
        items: ["Phone accessories", "Chargers", "Cables", "Power banks", "Screen guards"],
      },
      {
        heading: "Home Tech",
        items: ["LED bulbs", "Extension boards", "Batteries", "Adapters", "Smart devices"],
      },
      {
        heading: "Small Appliances",
        items: ["Fans", "Torches", "Speakers", "Clocks", "Kitchen gadgets"],
      },
    ],
  },
  {
    id: "fashion",
    label: "Fashion",
    categoryId: "fashion",
    columns: [
      {
        heading: "Clothing",
        items: ["Men's wear", "Women's wear", "Kids' wear", "Sleepwear", "Seasonal wear"],
      },
      {
        heading: "Accessories",
        items: ["Bags", "Wallets", "Belts", "Watches", "Sunglasses"],
      },
      {
        heading: "Footwear",
        items: ["Sandals", "Slippers", "Shoes", "Kids footwear", "Socks"],
      },
    ],
  },
  {
    id: "beauty",
    label: "Beauty & Care",
    categoryId: "personal",
    columns: [
      {
        heading: "Bath & Body",
        items: ["Soaps", "Body wash", "Deodorants", "Lotions", "Hand care"],
      },
      {
        heading: "Hair Care",
        items: ["Shampoo", "Conditioner", "Hair oil", "Combs", "Styling"],
      },
      {
        heading: "Oral & Skin",
        items: ["Toothpaste", "Toothbrushes", "Face care", "Sunscreen", "Makeup"],
      },
    ],
  },
  {
    id: "local-favorites",
    label: "Local Favorites",
    categoryId: "snacks",
    columns: [
      {
        heading: "Kerala Specials",
        items: ["Banana chips", "Spice mixes", "Pickles", "Halwa", "Coconut products"],
      },
      {
        heading: "Gifting",
        items: ["Gift boxes", "Festival packs", "Flowers", "Greeting cards", "Party supplies"],
      },
      {
        heading: "Everyday Picks",
        items: ["Best sellers", "New arrivals", "Under ₹99", "Family packs", "Combo offers"],
      },
    ],
  },
];

const imageFor = (categoryId: string) =>
  deliveryCategories.find((category) => category.id === categoryId)?.imageUrl ??
  deliveryCategories[0]?.imageUrl;

export function CategoryMegaMenu() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <>
      <div className="w-full border-b border-primary-foreground/10 bg-primary text-primary-foreground shadow-sm">
        <div className="flex h-11 w-full items-center gap-1 overflow-visible px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-colors hover:bg-primary-foreground/10"
          >
            <Menu className="h-4 w-4" />
            All categories
          </button>

          <nav
            aria-label="Shop categories"
            className="flex min-w-0 items-center gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {menuGroups.map((group) => {
              const promo = categoryPromos[group.id] ?? categoryPromos.fresh!;
              const isSelected = activeGroup === group.id;

              return (
                <div
                  key={group.id}
                  className="group relative shrink-0"
                  onMouseEnter={() => setActiveGroup(group.id)}
                  onMouseLeave={() => setActiveGroup(null)}
                >
                  <Link
                    to="/"
                    search={{ category: group.categoryId, q: undefined }}
                    onClick={() => setActiveGroup(isSelected ? null : group.id)}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors hover:bg-primary-foreground/10"
                  >
                    {group.label}
                    <ChevronDown className="h-3 w-3 opacity-70 transition-transform group-hover:rotate-180" />
                  </Link>

                  {/* Amazon Prime Style Popover Dropdown Card with Arrow Caret */}
                  <div className="pointer-events-none absolute left-0 top-full z-50 w-[min(780px,calc(100vw-2rem))] translate-y-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-1 group-hover:opacity-100">
                    <div className="relative">
                      {/* Caret Arrow pointing up to the category tab */}
                      <div className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-amber-50 z-20 shadow-sm" />

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]">
                        <div className="grid grid-cols-[1fr_1.25fr]">
                          {/* Amazon Prime-Style Feature Banner Card */}
                          <div className="flex flex-col justify-between bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/70 p-6 border-r border-slate-100">
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-900">
                                <Sparkles className="h-3 w-3 text-amber-700" />
                                {promo.badge}
                              </span>
                              <h3 className="mt-3 font-display text-xl font-extrabold leading-snug tracking-tight text-slate-900">
                                {promo.headline}
                              </h3>
                              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                                {promo.subtitle}
                              </p>
                            </div>

                            <div className="my-4 relative h-36 w-full overflow-hidden rounded-xl shadow-sm border border-black/5">
                              <img
                                src={promo.imageUrl}
                                alt={group.label}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            <div>
                              <Link
                                to="/"
                                search={{ category: group.categoryId, q: undefined }}
                                className="flex w-full items-center justify-center rounded-full bg-[#ffd814] hover:bg-[#f7ca00] px-5 py-2.5 text-center text-xs font-extrabold text-slate-900 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                              >
                                {promo.ctaText}
                              </Link>
                              <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-widest text-slate-400">
                                Local Shore Prime Offers
                              </p>
                            </div>
                          </div>

                          {/* Subcategory Links Column */}
                          <div className="p-6 bg-white flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                <h4 className="font-display text-sm font-bold text-slate-900">
                                  Top Categories in {group.label}
                                </h4>
                                <Link
                                  to="/"
                                  search={{ category: group.categoryId, q: undefined }}
                                  className="text-xs font-bold text-teal-700 hover:underline"
                                >
                                  View all &rarr;
                                </Link>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                {group.columns.map((column) => (
                                  <div key={column.heading}>
                                    <Link
                                      to="/"
                                      search={{ category: group.categoryId, q: undefined }}
                                      className="text-xs font-bold text-slate-900 hover:text-teal-700 hover:underline"
                                    >
                                      {column.heading}
                                    </Link>
                                    <ul className="mt-2 space-y-1.5">
                                      {column.items.map((item) => (
                                        <li key={item}>
                                          <Link
                                            to="/"
                                            search={{ category: group.categoryId, q: item }}
                                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 hover:underline"
                                          >
                                            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
                                            {item}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                              <span className="text-[10px] font-semibold text-slate-400">
                                Powered by Local Shore Verified Sellers
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close categories"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60"
          />
          <aside className="relative flex h-full w-[min(360px,88vw)] flex-col overflow-y-auto bg-background text-foreground shadow-2xl">
            <div className="flex items-center justify-between bg-primary px-5 py-5 text-primary-foreground">
              <Link
                to="/"
                search={{ category: undefined, q: undefined }}
                onClick={() => setDrawerOpen(false)}
                className="font-display text-lg font-bold"
              >
                Browse LocalShoree
              </Link>
              <button
                type="button"
                aria-label="Close categories"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 hover:bg-primary-foreground/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DrawerSection title="Trending">
              <DrawerLink label="Best sellers" onClick={() => setDrawerOpen(false)} />
              <DrawerLink label="New arrivals" onClick={() => setDrawerOpen(false)} />
              <DrawerLink label="Deals & discounts" onClick={() => setDrawerOpen(false)} />
            </DrawerSection>
            <DrawerSection title="Digital Content & Devices">
              <DrawerLink
                label="Mobile & small electronics"
                category="electronics"
                onClick={() => setDrawerOpen(false)}
              />
              <DrawerLink
                label="Chargers, cables & accessories"
                category="electronics"
                onClick={() => setDrawerOpen(false)}
              />
              <DrawerLink
                label="Batteries, bulbs & home tech"
                category="electronics"
                onClick={() => setDrawerOpen(false)}
              />
            </DrawerSection>
            <DrawerSection title="Shop by Category">
              {[
                ["Fresh & daily needs", "fresh"],
                ["Home & kitchen", "home"],
                ["Beauty & personal care", "personal"],
                ["Fashion & footwear", "fashion"],
                ["Stationery & office", "stationery"],
                ["Snacks & beverages", "snacks"],
              ].map(([label, category]) => (
                <DrawerLink
                  key={category}
                  label={label}
                  category={category}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </DrawerSection>
            <DrawerSection title="Programs & Features">
              <DrawerLink label="Sell with LocalShoree" onClick={() => setDrawerOpen(false)} />
              <DrawerLink label="Deliver with LocalShoree" onClick={() => setDrawerOpen(false)} />
              <DrawerLink label="Help & customer support" onClick={() => setDrawerOpen(false)} />
            </DrawerSection>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-5 py-5">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function DrawerLink({
  label,
  category,
  onClick,
}: {
  label: string;
  category?: string;
  onClick: () => void;
}) {
  return (
    <Link
      to="/"
      search={{ category, q: category ? undefined : label }}
      onClick={onClick}
      className="flex items-center justify-between rounded-md px-0 py-2 text-sm text-foreground/80 hover:text-primary"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export function HeaderCategoryMenu() {
  return (
    <div className="group relative">
      <Link
        to="/"
        search={{ category: undefined, q: undefined }}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Categories
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:rotate-180" />
      </Link>

      <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[min(940px,calc(100vw-3rem))] -translate-x-1/2 translate-y-3 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-1 group-hover:opacity-100">
        <div className="overflow-hidden rounded-xl border hairline bg-card shadow-2xl">
          <div
            className="awning h-2"
            style={{ ["--awning-color" as string]: "var(--teal)" }}
            aria-hidden
          />
          <div className="border-b hairline px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Browse</p>
            <h2 className="font-display text-xl leading-tight text-foreground">Categories</h2>
          </div>
          <div className="grid grid-cols-6 gap-3 p-5">
            {menuGroups.map((group) => (
              <Link
                key={group.id}
                to="/"
                search={{ category: group.categoryId, q: undefined }}
                className="flex min-h-[98px] flex-col items-center justify-center gap-2 rounded-lg border hairline bg-background px-3 py-3 text-center text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted hover:shadow-md"
              >
                <span className="relative h-12 w-12 overflow-hidden rounded-full border hairline bg-card ring-0 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/20">
                  {imageFor(group.categoryId) ? (
                    <img
                      src={imageFor(group.categoryId)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  ) : (
                    <PackageSearch className="m-3 h-5 w-5 text-primary" />
                  )}
                </span>
                <span className="leading-tight">{group.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileCategoryStrip() {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const selected = menuGroups.find((group) => group.id === openGroup);

  return (
    <div className="border-b hairline bg-background md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
            className="text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Browse</p>
            <h2 className="font-display text-lg leading-tight text-foreground">Categories</h2>
          </button>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            onClick={() => {
              setIsOpen(false);
              setOpenGroup(null);
            }}
            className="text-[11px] font-medium text-muted-foreground"
          >
            All
          </Link>
        </div>
        {isOpen && (
          <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menuGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-expanded={openGroup === group.id}
                onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                className={`flex min-w-[86px] flex-col items-center gap-1 rounded-lg border hairline bg-card px-2 py-2 text-center text-[11px] font-semibold text-foreground shadow-sm transition-all active:scale-[0.98] hover:border-primary/40 hover:bg-muted ${openGroup === group.id ? "border-primary/50 bg-muted ring-2 ring-primary/15" : ""}`}
              >
                <span className="h-11 w-11 overflow-hidden rounded-full border hairline bg-card">
                  {imageFor(group.categoryId) ? (
                    <img
                      src={imageFor(group.categoryId)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PackageSearch className="m-2.5 h-5 w-5 text-primary" />
                  )}
                </span>
                {group.label}
              </button>
            ))}
          </div>
        )}

        {isOpen && selected && (
          <div className="mt-3 overflow-hidden rounded-xl border hairline bg-card shadow-xl">
            <div
              className="awning h-1.5"
              style={{ ["--awning-color" as string]: "var(--teal)" }}
              aria-hidden
            />
            <div className="bg-primary px-4 py-3 text-primary-foreground">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                Shop Local
              </p>
              <p className="mt-1 font-display text-xl leading-tight">{selected.label}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4">
              {selected.columns.map((column) => (
                <div key={column.heading}>
                  <Link
                    to="/"
                    search={{ category: selected.categoryId, q: undefined }}
                    onClick={() => setOpenGroup(null)}
                    className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                  >
                    {column.heading}
                  </Link>
                  <ul className="mt-2 space-y-1.5">
                    {column.items.map((item) => (
                      <li key={item}>
                        <Link
                          to="/"
                          search={{ category: selected.categoryId, q: item }}
                          onClick={() => setOpenGroup(null)}
                          className="text-xs text-foreground/85 underline-offset-4 hover:text-primary hover:underline"
                        >
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
