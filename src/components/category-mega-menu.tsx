import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Menu, PackageSearch, X, Tag, Headphones } from "lucide-react";
import { deliveryCategories } from "@/lib/mock-data";
import { scrollToShops } from "@/lib/scroll-utils";

type CategoryPromo = {
  headline: string;
  subtitle: string;
  ctaText: string;
  imageUrl: string;
  badge: string;
};

const categoryPromos: Record<string, CategoryPromo> = {
  fresh: {
    headline: "Daily Fresh Farm Produce & Fruits",
    subtitle: "Farm-fresh vegetables, organic fruits & fresh greens delivered in 20-30 mins",
    ctaText: "Shop Fresh Produce Now",
    badge: "FARM HARVEST",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
  },
  meat_fish: {
    headline: "Fresh Meat, Sea Fish & Country Poultry",
    subtitle: "Tender mutton, country chicken (nattu kozhi), Vanjaram fish & farm eggs",
    ctaText: "Explore Butchery & Seafood",
    badge: "FRESH CATCH",
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80",
  },
  bakery_sweets: {
    headline: "Fresh Bakes & Authentic Sweets",
    subtitle: "Hot puffs, birthday cakes, melt-in-mouth Mysurpa & traditional savories",
    ctaText: "Shop Bakes & Sweets",
    badge: "LOCAL BAKERY & MITHAI",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  },
  fashion: {
    headline: "Trending Local Fashion & Ethnic Wear",
    subtitle: "Readymade shirts, cotton dhotis, designer silk sarees & quality footwear",
    ctaText: "Explore Fashion & Boutiques",
    badge: "NEW STYLES",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80",
  },
  beauty: {
    headline: "Beauty & Personal Grooming Care",
    subtitle: "Skincare, cosmetics, herbal hair oils, perfumes & daily grooming items",
    ctaText: "Shop Beauty Care",
    badge: "PERSONAL CARE",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
  },
  electronics: {
    headline: "Smart Electronics & Mobile Accessories",
    subtitle: "Smartphones, chargers, bluetooth earphones, TVs & home appliances",
    ctaText: "Explore Tech & Gadgets",
    badge: "SMART TECH",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80",
  },
  home_kitchen: {
    headline: "Home Decor, Kitchen & Hardware Essentials",
    subtitle: "Stainless steel utensils, pressure cookers, brass lamps & hardware tools",
    ctaText: "Shop Home & Kitchen",
    badge: "HOME ESSENTIALS",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
  },
  pharmacy: {
    headline: "24/7 Pharmacy & Wellness Care",
    subtitle: "Prescription medicines, OTC care, first aid, supplements & medical devices",
    ctaText: "Shop Medical & Wellness",
    badge: "PHARMACY CARE",
    imageUrl: "/marketplace-ads/pharmacy.png",
  },
  kids_sports: {
    headline: "Toys, Baby Care & Sports Gear",
    subtitle: "Educational toys, baby diapers, cricket bats, badminton rackets & gym wear",
    ctaText: "Shop Kids & Sports",
    badge: "KIDS & FITNESS",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80",
  },
  local_favorites: {
    headline: "Top-Rated Community Favorites",
    subtitle: "Curated local shops with highest customer ratings, repeat buyers & community trust",
    ctaText: "Explore Local Favorites",
    badge: "COMMUNITY CHOICE",
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
  },
};

const menuGroups = [
  {
    id: "fresh",
    label: "Fresh",
    categoryId: "fruits_veg",
    columns: [
      {
        heading: "Produce",
        items: ["Fresh Vegetables", "Seasonal Fruits", "Leafy Greens", "Tender Coconut"],
      },
      {
        heading: "Organic & Farm",
        items: ["Farm Produce", "Organic Vegetables", "Cut Produce", "Fresh Herbs"],
      },
    ],
  },
  {
    id: "meat_fish",
    label: "Meat & Fish",
    categoryId: "meat_fish",
    columns: [
      {
        heading: "Meat & Poultry",
        items: ["Country Chicken (Nattu Kozhi)", "Tender Mutton", "Chicken Curry Cut", "Farm Eggs"],
      },
      {
        heading: "Fish & Seafood",
        items: ["Fresh Sea Fish", "Vanjaram Fillet", "Prawns", "Crab", "Seafood Mix"],
      },
    ],
  },
  {
    id: "bakery_sweets",
    label: "Bakery & Sweets",
    categoryId: "bakery",
    columns: [
      {
        heading: "Fresh Bakes",
        items: ["Bread & Buns", "Hot Chicken/Veg Puffs", "Birthday Cakes", "Pastries", "Butter Biscuits"],
      },
      {
        heading: "Traditional Sweets",
        items: ["Ghee Mysurpa", "Halwa", "Ladoo", "Gulab Jamun", "Kaju Sweets"],
      },
      {
        heading: "Savories",
        items: ["Mixtures", "Karasev", "Murukku", "Snacks"],
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
        items: ["Men's Shirts", "Cotton Dhotis", "Pants & Jeans", "Kurtas & Ethnic", "Women Wear"],
      },
      {
        heading: "Boutiques & Shoes",
        items: ["Kanchipuram Silk Sarees", "Custom Stitching", "Leather Shoes", "Sandals", "Ethnic Footwear"],
      },
    ],
  },
  {
    id: "beauty",
    label: "Beauty & Care",
    categoryId: "beauty",
    columns: [
      {
        heading: "Skincare & Makeup",
        items: ["Skincare Creams", "Cosmetics", "Face Care", "Sunscreen", "Lip Care"],
      },
      {
        heading: "Hair & Body Care",
        items: ["Herbal Hair Oils", "Shampoos", "Soaps & Body Wash", "Grooming", "Perfumes"],
      },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    categoryId: "electronics",
    columns: [
      {
        heading: "Tech & Gadgets",
        items: ["Smartphones", "Chargers & Cables", "Earphones", "Back Covers", "Mobile Repair"],
      },
      {
        heading: "Home Electronics",
        items: ["Smart TVs", "Soundbars", "Refrigerators", "Washing Machines", "Home Tech"],
      },
    ],
  },
  {
    id: "home_kitchen",
    label: "Home & Kitchen",
    categoryId: "home_kitchen",
    columns: [
      {
        heading: "Kitchenware",
        items: ["Stainless Steel Utensils", "Mixer Grinders", "Pressure Cookers", "Gas Stoves"],
      },
      {
        heading: "Decor & Hardware",
        items: ["Brass Agal Lamps", "Designer Curtains", "Furniture", "Electrical Fittings", "Hardware Tools"],
      },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    categoryId: "pharmacy",
    columns: [
      {
        heading: "Medicines",
        items: ["Prescription Meds", "OTC Care", "First Aid", "Pain Relief", "Cold & Cough"],
      },
      {
        heading: "Wellness & Devices",
        items: ["Vitamins & Supplements", "Medical Devices", "Masks & Sanitizers", "Health Equipment"],
      },
    ],
  },
  {
    id: "kids_sports",
    label: "Kids & Sports",
    categoryId: "toys",
    columns: [
      {
        heading: "Toys & Baby Care",
        items: ["Educational Toys", "Baby Essentials", "Diapers", "Board Games", "Action Figures"],
      },
      {
        heading: "Sports & Fitness",
        items: ["Cricket Bats", "Badminton Rackets", "Fitness Gear", "Gym Wear", "Sports Balls"],
      },
    ],
  },
  {
    id: "local_favorites",
    label: "Local Favorites",
    categoryId: "favorites",
    isFavorite: true,
    columns: [
      {
        heading: "Community Trust",
        items: ["Highly Rated 4.7★+", "Most Ordered", "Fastest Delivery", "Verified Local Sellers"],
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

  const handleCategoryClick = () => {
    setActiveGroup(null);
    scrollToShops();
  };

  return (
    <>
      <div
        className="relative z-40 w-full border-b border-purple-100/90 bg-white/95 text-slate-800 shadow-2xs backdrop-blur-md"
        onMouseLeave={() => setActiveGroup(null)}
      >
        <div className="flex h-11 w-full items-center gap-1.5 px-4 md:px-6 lg:px-10 xl:px-12">
          {/* 1. ALL CATEGORIES BUTTON */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-900 text-white hover:bg-purple-950 border border-purple-900 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Menu className="h-4 w-4 text-[#F3D053]" />
            <span>All Categories</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />

          {/* 2nd - 11th EXACT SECONDARY CATEGORY ITEMS */}
          <nav
            aria-label="Shop categories"
            className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {menuGroups.map((group) => {
              const isOpen = activeGroup === group.id;

              return (
                <div
                  key={group.id}
                  className="shrink-0"
                  onMouseEnter={() => setActiveGroup(group.id)}
                >
                  <Link
                    to="/search"
                    search={{ category: group.categoryId }}
                    onClick={() => {
                      setActiveGroup(null);
                    }}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      isOpen
                        ? "bg-purple-50 text-purple-900 font-bold"
                        : "text-slate-700 hover:bg-purple-50/70 hover:text-purple-900"
                    }`}
                  >
                    {group.isFavorite && <span className="text-amber-500 mr-0.5">⭐</span>}
                    <span>{group.label}</span>
                    <ChevronDown
                      className={`h-3 w-3 opacity-60 transition-transform duration-200 ${
                        isOpen ? "rotate-180 opacity-100 text-purple-700" : ""
                      }`}
                    />
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Right-aligned marketplace links */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600 shrink-0 ml-2">
            <div className="h-4 w-px bg-slate-200 shrink-0" />
            <Link
              to="/best-shops"
              className="inline-flex items-center gap-1.5 hover:text-purple-900 font-semibold text-slate-700 transition"
            >
              <span>🏆</span> Best Shops
            </Link>
            <Link
              to="/brands"
              className="inline-flex items-center gap-1.5 hover:text-purple-900 font-semibold text-slate-700 transition"
            >
              <span>🛍️</span> Brands
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 hover:text-purple-900 font-semibold text-slate-700 transition"
            >
              <span>✈️</span> Explore
            </Link>
            <Link
              to="/customer-care"
              className="inline-flex items-center gap-1.5 hover:text-purple-900 font-medium transition"
            >
              <Headphones className="h-3.5 w-3.5 text-purple-700" />
              Customer Care
            </Link>
          </div>
        </div>

        {/* Mega Menu Popover Dropdown Overlay */}
        {activeGroup && (() => {
          const groupIndex = menuGroups.findIndex((g) => g.id === activeGroup);
          const group = menuGroups[groupIndex] ?? menuGroups[0];
          const promo = categoryPromos[group.id] ?? categoryPromos.fresh!;
          const isRightSide = groupIndex >= 5;

          return (
            <div
              className={`absolute top-full z-50 pt-2 transition-all duration-200 ${
                isRightSide ? "right-4 md:right-12 lg:right-24" : "left-4 md:left-12 lg:left-24"
              }`}
              onMouseEnter={() => setActiveGroup(group.id)}
              onMouseLeave={() => setActiveGroup(null)}
            >
              <div className="relative w-[min(760px,calc(100vw-2rem))]">
                <div
                  className={`absolute -top-1.5 h-3.5 w-3.5 rotate-45 border-l border-t border-slate-200 bg-amber-50 z-20 shadow-xs ${
                    isRightSide ? "right-12" : "left-12"
                  }`}
                />

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)]">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr]">
                    <div className="flex flex-col justify-between bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/60 p-5 border-r border-slate-100">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-900">
                          <Tag className="h-3 w-3 text-amber-700" />
                          {promo.badge}
                        </span>
                        <h3 className="mt-2.5 font-display text-lg font-extrabold leading-snug tracking-tight text-slate-900">
                          {promo.headline}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                          {promo.subtitle}
                        </p>
                      </div>

                      <div className="my-3 relative h-32 w-full overflow-hidden rounded-xl shadow-xs border border-black/5">
                        <img
                          src={promo.imageUrl}
                          alt={group.label}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>

                      <div>
                        <Link
                          to="/search"
                          search={{ category: group.categoryId }}
                          onClick={() => setActiveGroup(null)}
                          className="flex w-full items-center justify-center rounded-full bg-[#ffd814] hover:bg-[#f7ca00] px-4 py-2 text-center text-xs font-extrabold text-slate-900 shadow-xs transition-all hover:shadow active:scale-[0.99]"
                        >
                          {promo.ctaText}
                        </Link>
                        <p className="mt-1.5 text-center font-mono text-[9px] uppercase tracking-widest text-slate-400">
                          Local Shore Offers
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                          <h4 className="font-display text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Top Categories in {group.label}
                          </h4>
                          <Link
                            to="/search"
                            search={{ category: group.categoryId }}
                            onClick={() => setActiveGroup(null)}
                            className="text-xs font-bold text-purple-700 hover:underline"
                          >
                            View all &rarr;
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          {group.columns.map((column) => (
                            <div key={column.heading}>
                              <Link
                                to="/search"
                                search={{ category: group.categoryId, q: column.heading }}
                                onClick={() => setActiveGroup(null)}
                                className="text-xs font-bold text-slate-900 hover:text-purple-700 hover:underline"
                              >
                                {column.heading}
                              </Link>
                              <ul className="mt-1.5 space-y-1">
                                {column.items.map((item) => (
                                  <li key={item}>
                                    <Link
                                      to="/search"
                                      search={{ category: group.categoryId, q: item }}
                                      onClick={() => setActiveGroup(null)}
                                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-purple-700 hover:underline"
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

                      <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                        <span className="text-[10px] font-semibold text-slate-400">
                          Verified Neighborhood Shops
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Complete 31-Category All Categories Drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close categories"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-xs"
          />
          <aside className="relative flex h-full w-[min(420px,90vw)] flex-col overflow-y-auto bg-background text-foreground shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 px-5 py-5 text-white">
              <div className="flex items-center gap-2.5">
                <Menu className="h-5 w-5 text-[#F3D053]" />
                <div>
                  <h3 className="font-display text-lg font-bold text-white">All 31 Shop Categories</h3>
                  <p className="text-[11px] text-purple-200">Complete neighborhood marketplace directory</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close categories"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 hover:bg-white/15 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 divide-y divide-border overflow-y-auto">
              <DrawerSection title="🛒 Essentials & Daily Provisions">
                <DrawerLink label="Kirana & Grocery" category="kirana-grocery" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Supermarkets" category="supermarkets" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Pharmacies & Medicals" category="pharmacies" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Fruits & Vegetables" category="fruits-vegetables" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Meat & Fish" category="meat-fish" onClick={() => setDrawerOpen(false)} />
              </DrawerSection>

              <DrawerSection title="🍽️ Food, Dining & Sweets">
                <DrawerLink label="Bakeries" category="bakeries" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Sweet Shops" category="sweet-shops" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Restaurants" category="restaurants" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Cafés & Tea Shops" category="cafes-tea-shops" onClick={() => setDrawerOpen(false)} />
              </DrawerSection>

              <DrawerSection title="👗 Fashion, Beauty & Accessories">
                <DrawerLink label="Fashion & Clothing" category="fashion-clothing" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Boutiques" category="boutiques" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Footwear" category="footwear" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Jewellery & Watches" category="jewellery-watches" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Beauty & Care" category="beauty-care" onClick={() => setDrawerOpen(false)} />
              </DrawerSection>

              <DrawerSection title="📱 Electronics & Devices">
                <DrawerLink label="Electronics" category="electronics" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Mobile & Accessories" category="mobile-accessories" onClick={() => setDrawerOpen(false)} />
              </DrawerSection>

              <DrawerSection title="🏠 Home, Living & Hardware">
                <DrawerLink label="Home & Kitchen" category="home-kitchen" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Furniture & Home Decor" category="furniture-home-decor" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Home & Hardware" category="hardware-electrical" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Pooja Stores" category="pooja-stores" onClick={() => setDrawerOpen(false)} />
              </DrawerSection>

              <DrawerSection title="⚽ Lifestyle, Kids & Services">
                <DrawerLink label="Books & Stationery" category="books-stationery" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Sports & Fitness" category="sports-fitness" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Toys & Baby" category="toys-baby" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Gift Shops" category="gift-shops" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Flower Shops" category="flower-shops" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Pet Shops" category="pet-shops" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Auto & Bike" category="auto-bike" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Repair Shops" category="repair-shops" onClick={() => setDrawerOpen(false)} />
                <DrawerLink label="Local Services" category="local-services" onClick={() => setDrawerOpen(false)} />
              </DrawerSection>
            </div>
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
      to="/search"
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
        to="/search"
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
                to="/search"
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
            to="/search"
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
                    to="/search"
                    search={{ category: selected.categoryId, q: column.heading }}
                    onClick={() => setOpenGroup(null)}
                    className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                  >
                    {column.heading}
                  </Link>
                  <ul className="mt-2 space-y-1.5">
                    {column.items.map((item) => (
                      <li key={item}>
                        <Link
                          to="/search"
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
