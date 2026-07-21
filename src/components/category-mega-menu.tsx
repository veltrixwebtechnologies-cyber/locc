import { Link } from "@tanstack/react-router";
import { ChevronDown, PackageSearch } from "lucide-react";
import { deliveryCategories } from "@/lib/mock-data";

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
];

const imageFor = (categoryId: string) =>
  deliveryCategories.find((category) => category.id === categoryId)?.imageUrl ??
  deliveryCategories[0]?.imageUrl;

export function CategoryMegaMenu() {
  return (
    <div className="hidden border-b hairline bg-background/95 backdrop-blur md:block">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Browse</p>
            <h2 className="font-display text-xl leading-tight text-foreground">Categories</h2>
          </div>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            View all shops
          </Link>
        </div>
        <nav aria-label="Shop categories" className="grid grid-cols-6 items-stretch gap-3">
          {menuGroups.map((group) => (
            <div key={group.id} className="group relative">
              <Link
                to="/"
                search={{ category: group.categoryId, q: undefined }}
                className="flex min-h-[98px] flex-col items-center justify-center gap-2 rounded-lg border hairline bg-card px-3 py-3 text-center text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted hover:shadow-md"
              >
                <span className="relative h-12 w-12 overflow-hidden rounded-full border hairline bg-card ring-0 transition-all duration-200 group-hover:ring-2 group-hover:ring-primary/20">
                  {imageFor(group.categoryId) ? (
                    <img
                      src={imageFor(group.categoryId)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <PackageSearch className="m-3 h-5 w-5 text-primary" />
                  )}
                </span>
                <span className="flex items-center gap-1 leading-none">
                  {group.label}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:rotate-180" />
                </span>
              </Link>

              <div className="pointer-events-none absolute left-0 top-full z-50 w-[min(940px,calc(100vw-3rem))] translate-y-2 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                <div className="overflow-hidden rounded-xl border hairline bg-card shadow-2xl">
                  <div
                    className="awning h-2"
                    style={{ ["--awning-color" as string]: "var(--teal)" }}
                    aria-hidden
                  />
                  <div className="grid grid-cols-[180px_1fr]">
                    <div className="bg-primary p-5 text-primary-foreground">
                      <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                        Shop Local
                      </p>
                      <p className="mt-2 font-display text-2xl leading-tight">{group.label}</p>
                      <p className="mt-3 text-xs leading-5 opacity-85">
                        Delivered from real neighborhood stores near your shoreline.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-5 p-5">
                      {group.columns.map((column) => (
                        <div key={column.heading}>
                          <Link
                            to="/"
                            search={{ category: group.categoryId, q: undefined }}
                            className="text-sm font-bold text-primary underline-offset-4 hover:underline"
                          >
                            {column.heading}
                          </Link>
                          <ul className="mt-3 space-y-2">
                            {column.items.map((item) => (
                              <li key={item}>
                                <Link
                                  to="/"
                                  search={{ category: group.categoryId, q: item }}
                                  className="text-sm font-medium text-foreground/85 underline-offset-4 hover:text-primary hover:underline"
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
                </div>
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
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
  return (
    <div className="border-b hairline bg-background md:hidden">
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Browse</p>
            <h2 className="font-display text-lg leading-tight text-foreground">Categories</h2>
          </div>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="text-[11px] font-medium text-muted-foreground"
          >
            All
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menuGroups.map((group) => (
            <Link
              key={group.id}
              to="/"
              search={{ category: group.categoryId, q: undefined }}
              className="flex min-w-[86px] flex-col items-center gap-1 rounded-lg border hairline bg-card px-2 py-2 text-center text-[11px] font-semibold text-foreground shadow-sm transition-all active:scale-[0.98] hover:border-primary/40 hover:bg-muted"
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
