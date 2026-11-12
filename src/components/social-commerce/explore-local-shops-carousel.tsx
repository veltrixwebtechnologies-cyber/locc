import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MapPin, Store, Check, ArrowRight } from "lucide-react";
import { useFollowedShopIds, followingStore } from "@/lib/following-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { isBengaluruLocation } from "@/lib/social-feed-data";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { toast } from "sonner";

export interface CarouselShopItem {
  id: string;
  name: string;
  badge: {
    label: string;
    variant: "live" | "open" | "new" | "restocked" | "trending";
  };
  verified: boolean;
  location: string;
  distanceKm: number;
  categories: string[];
  followersCount: string;
  coverImage: string;
  products: {
    id: string;
    name: string;
    price: number;
    unit?: string;
    imageUrl: string;
  }[];
}

// 10 Authentic local shops (2 pages of 5 shops each, matching master design)
export const ALL_CAROUSEL_SHOPS: CarouselShopItem[] = [
  // ── Page 1 (The 5 Core Master Mockup Shops) ──
  {
    id: "s_kiran1",
    name: "Namma Fresh Produce & Organics",
    badge: { label: "• Live", variant: "live" },
    verified: true,
    location: "R.S. Puram",
    distanceKm: 3.0,
    categories: ["Fruits & Veg", "Organic"],
    followersCount: "1.2k",
    coverImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_alphonso",
        name: "Mango",
        price: 240,
        imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_greens",
        name: "Greens",
        price: 35,
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_tomato",
        name: "Tomato",
        price: 30,
        imageUrl: "https://images.unsplash.com/photo-1546470427-f5b9c4e9c7d4?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_paap1",
    name: "Ravi's Artisan Bakery",
    badge: { label: "Open Now", variant: "open" },
    verified: true,
    location: "RS Puram",
    distanceKm: 2.1,
    categories: ["Bakery", "Fresh Bakes"],
    followersCount: "856",
    coverImage: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_croissant",
        name: "Croissant",
        price: 70,
        imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_sourdough",
        name: "Sourdough",
        price: 180,
        imageUrl: "/assets/ravis-sourdough-hero.jpg",
      },
      {
        id: "p_brownie",
        name: "Brownie",
        price: 120,
        imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_boutique1",
    name: "StyleHub Apparel",
    badge: { label: "• New Collection", variant: "new" },
    verified: true,
    location: "Avinashi Road",
    distanceKm: 4.8,
    categories: ["Fashion", "Trendy"],
    followersCount: "602",
    coverImage: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_tshirt",
        name: "T-Shirt",
        price: 399,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_polo",
        name: "Polo Tee",
        price: 599,
        imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_cap",
        name: "Cap",
        price: 299,
        imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_groc2",
    name: "Kumar Stores Groceries",
    badge: { label: "Restocked", variant: "restocked" },
    verified: true,
    location: "Gandhipuram",
    distanceKm: 1.4,
    categories: ["Groceries", "Essentials"],
    followersCount: "1.8k",
    coverImage: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_cocoil",
        name: "Coconut",
        price: 349,
        unit: "1L",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_sesame",
        name: "Sesame",
        price: 299,
        unit: "1L",
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_ghee",
        name: "Cow Ghee",
        price: 549,
        unit: "500g",
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_kovilmedu_medicals",
    name: "HealthPlus Pharmacy",
    badge: { label: "Trending", variant: "trending" },
    verified: true,
    location: "Race Course",
    distanceKm: 3.6,
    categories: ["Wellness", "Personal Care"],
    followersCount: "1.5k",
    coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_vitamins",
        name: "Vitamins",
        price: 499,
        imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_facewash",
        name: "Face Wash",
        price: 249,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_shampoo",
        name: "Shampoo",
        price: 199,
        imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },

  // ── Page 2 (Additional Local Shops) ──
  {
    id: "s_dairy1",
    name: "Meena Dairy & Farm Fresh",
    badge: { label: "• Live", variant: "live" },
    verified: true,
    location: "Saibaba Colony",
    distanceKm: 2.4,
    categories: ["Dairy & Milk", "Farm Direct"],
    followersCount: "940",
    coverImage: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_cowmilk",
        name: "Cow Milk",
        price: 48,
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_paneer",
        name: "Paneer",
        price: 110,
        imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_butter",
        name: "Butter",
        price: 160,
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_spiceroute",
    name: "Spice Route Masalas",
    badge: { label: "Open Now", variant: "open" },
    verified: true,
    location: "R.S. Puram",
    distanceKm: 1.8,
    categories: ["Spices", "Home Blend"],
    followersCount: "1.1k",
    coverImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_sambarmasala",
        name: "Sambar",
        price: 85,
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_cardamom",
        name: "Cardamom",
        price: 190,
        imageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_turmeric",
        name: "Turmeric",
        price: 65,
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_greenleaf",
    name: "GreenLeaf Organics",
    badge: { label: "• New Collection", variant: "new" },
    verified: true,
    location: "Peelamedu",
    distanceKm: 3.2,
    categories: ["Organics", "Fresh"],
    followersCount: "730",
    coverImage: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_spinach",
        name: "Spinach",
        price: 45,
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_avocado",
        name: "Avocado",
        price: 130,
        imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_berries",
        name: "Berries",
        price: 150,
        imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_electroworld",
    name: "ElectroWorld Gadgets",
    badge: { label: "Restocked", variant: "restocked" },
    verified: true,
    location: "Gandhipuram",
    distanceKm: 1.6,
    categories: ["Electronics", "Gadgets"],
    followersCount: "2.3k",
    coverImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_earbuds",
        name: "Buds",
        price: 1299,
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_cable",
        name: "Cable",
        price: 199,
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_powerbank",
        name: "PowerBank",
        price: 899,
        imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
  {
    id: "s_petpal",
    name: "PetPal Co. Pet Care",
    badge: { label: "Trending", variant: "trending" },
    verified: true,
    location: "Race Course",
    distanceKm: 2.8,
    categories: ["Pet Care", "Nutrition"],
    followersCount: "820",
    coverImage: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80",
    products: [
      {
        id: "p_dogfood",
        name: "Dog Food",
        price: 499,
        imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_catbiscuits",
        name: "Cat Food",
        price: 180,
        imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "p_petleash",
        name: "Leash",
        price: 299,
        imageUrl: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=200&q=80",
      },
    ],
  },
];

function getBadgeStyle(variant: CarouselShopItem["badge"]["variant"]) {
  switch (variant) {
    case "live":
      return "bg-rose-500 text-white font-extrabold animate-pulse";
    case "open":
      return "bg-emerald-600 text-white font-bold";
    case "new":
      return "bg-[#FEF08A] text-[#854D0E] font-bold";
    case "restocked":
      return "bg-amber-500 text-white font-bold";
    case "trending":
      return "bg-[#9333EA] text-white font-bold";
    default:
      return "bg-purple-600 text-white font-bold";
  }
}

export function ExploreLocalShopsCarousel() {
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);
  const followedIds = useFollowedShopIds();
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const PAGE_SIZE = 5;

  const shopsList = useMemo(() => {
    return ALL_CAROUSEL_SHOPS.map((shop) => {
      if (isBLR) {
        if (shop.id === "s_kiran1") return { ...shop, location: "JP Nagar 2nd Phase", distanceKm: 0.4 };
        if (shop.id === "s_paap1") return { ...shop, location: "JP Nagar 2nd Phase", distanceKm: 0.3 };
        if (shop.id === "s_boutique1") return { ...shop, name: "JP Nagar Readymades", location: "15th Main Road", distanceKm: 0.4 };
        if (shop.id === "s_groc2") return { ...shop, location: "14th Cross Rd", distanceKm: 0.5 };
        if (shop.id === "s_kovilmedu_medicals") return { ...shop, name: "Apollo Pharmacy", location: "15th Main Road", distanceKm: 0.2 };
        if (shop.id === "s_dairy1") return { ...shop, location: "9th Cross, JP Nagar", distanceKm: 0.6 };
        if (shop.id === "s_spiceroute") return { ...shop, location: "24th Main Road", distanceKm: 0.5 };
        if (shop.id === "s_greenleaf") return { ...shop, location: "Ring Road, JP Nagar", distanceKm: 0.7 };
        if (shop.id === "s_electroworld") return { ...shop, location: "15th Main Road", distanceKm: 0.4 };
        if (shop.id === "s_petpal") return { ...shop, location: "14th Cross Rd", distanceKm: 0.6 };
      }
      return shop;
    });
  }, [isBLR]);

  const totalPages = Math.ceil(shopsList.length / PAGE_SIZE);

  const visibleShops = shopsList.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const handleToggleFollow = (shopId: string, shopName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isNowFollowing = followingStore.toggle(shopId);
    if (isNowFollowing) {
      toast.success(`Following ${shopName}! 🎉`);
    } else {
      toast.info(`Unfollowed ${shopName}`);
    }
  };

  const handleAddToCart = (
    shop: CarouselShopItem,
    prod: CarouselShopItem["products"][0],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    cartStore.add(shop.id, shop.name, {
      id: prod.id,
      name: prod.name,
      price: prod.price,
      unit: prod.unit || "piece",
      stock: 20,
      imageUrl: prod.imageUrl,
    });
    setAddedProductIds((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAddedProductIds((prev) => ({ ...prev, [prod.id]: false }));
    }, 1500);
    toast.success(`Added ${prod.name} to cart!`);
  };

  return (
    <div className="relative rounded-3xl bg-white p-3.5 sm:p-5 border border-[#E2E8F0] shadow-xs">
      {/* ── Header Matching Reference ── */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF3FF] text-[#8B2FC9]">
            <Store className="h-4 w-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Explore Local Shops</h3>
        </div>
        <Link
          to="/explore"
          className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] transition"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Carousel Controls (Floating Left and Right Arrows on container edges) ── */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous shops"
        className="absolute -left-3 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-md border border-purple-100 hover:bg-[#F8FAFC] hover:scale-105 transition cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next shops"
        className="absolute -right-3 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-md border border-purple-100 hover:bg-[#F8FAFC] hover:scale-105 transition cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* ── 5 Cards Grid Row: Guaranteed All 5 Fit on Desktop Side-by-Side Without Overflow ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {visibleShops.map((shop) => {
          const isFollowing = followedIds.includes(shop.id);

          return (
            <Link
              key={shop.id}
              to="/store/$storeId"
              params={{ storeId: shop.id }}
              className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-2 sm:p-2.5 hover:border-[#8B2FC9]/50 hover:shadow-md transition-all min-w-0"
            >
              <div>
                {/* 1. Cover Photo with High-Contrast Badge */}
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
                  <img
                    src={shop.coverImage}
                    alt={shop.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Badge in top-right */}
                  <div
                    className={`absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] shadow-xs ${getBadgeStyle(
                      shop.badge.variant
                    )}`}
                  >
                    {shop.badge.label}
                  </div>
                </div>

                {/* 2. Shop Name + Verified Badge */}
                <div className="mt-2 flex items-center justify-between gap-1 min-w-0">
                  <h4
                    title={shop.name}
                    className="text-[11px] sm:text-xs font-bold text-[#0F172A] truncate group-hover:text-[#8B2FC9] transition"
                  >
                    {shop.name}
                  </h4>
                  {shop.verified && (
                    <span
                      title="Verified Shop"
                      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#0284C7] text-[8px] text-white font-bold"
                    >
                      ✓
                    </span>
                  )}
                </div>

                {/* 3. Location & Distance */}
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#64748B] mt-0.5 min-w-0">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#8B2FC9] shrink-0" />
                  <span className="truncate">
                    {shop.location} • {shop.distanceKm} km
                  </span>
                </div>

                {/* 4. Category Chips */}
                <div className="flex items-center gap-1 mt-1 overflow-hidden h-[18px]">
                  {shop.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[8px] font-semibold text-[#581C87] border border-purple-100/80 truncate shrink-0 max-w-[82px]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* 5. Followers Row with Solid Purple Pill Follow Button */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F8FAFC] gap-1 min-w-0 h-[28px]">
                  <span className="text-[10px] font-bold text-[#64748B] shrink-0">
                    {shop.followersCount}
                    <span className="hidden xl:inline text-[9px] text-[#8E82A3] ml-0.5">followers</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleFollow(shop.id, shop.name, e)}
                    className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition shadow-2xs active:scale-95 cursor-pointer shrink-0 ${
                      isFollowing
                        ? "bg-[#F8FAFC] border border-[#8B2FC9] text-[#581C87] flex items-center gap-0.5"
                        : "bg-[#8B2FC9] text-white hover:bg-[#7812B8]"
                    }`}
                  >
                    {isFollowing ? "Following ✓" : "Follow"}
                  </button>
                </div>
              </div>

              {/* 6. Tagged Products Row (3 items side-by-side without truncation) */}
              <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-[#F8FAFC]">
                {shop.products.slice(0, 3).map((prod) => {
                  const isAdded = addedProductIds[prod.id];
                  return (
                    <div
                      key={prod.id}
                      onClick={(e) => handleAddToCart(shop, prod, e)}
                      title={`Add ${prod.name} (₹${prod.price}) to cart`}
                      className="group/prod flex flex-col items-center rounded-lg p-0.5 hover:bg-[#F8FAFC] transition cursor-pointer min-w-0"
                    >
                      <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white shrink-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="h-full w-full object-cover transition group-hover/prod:scale-105"
                          loading="lazy"
                        />
                        {isAdded && (
                          <div className="absolute inset-0 bg-emerald-600/90 flex items-center justify-center text-white">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-medium text-[#0F172A] truncate w-full text-center mt-1 leading-tight">
                        {prod.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-[#0F172A] text-center leading-tight">
                        ₹{prod.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Bottom Slider Dots Matching Screen Reference ── */}
      <div className="flex items-center justify-center gap-1.5 pt-3">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentPage(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              idx === currentPage ? "w-4 bg-[#8B2FC9]" : "w-1.5 bg-[#E2E8F0] hover:bg-[#D5B8E6]"
            }`}
            aria-label={`Go to page ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
