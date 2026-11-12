import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Store, ArrowRight, Check, MapPin, Star } from "lucide-react";
import { useFollowedShopIds, followingStore } from "@/lib/following-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { isBengaluruLocation } from "@/lib/social-feed-data";
import type { ShopCardData } from "@/modules/shopper/components/shop-card";
import { toast } from "sonner";

export interface NearbyShopItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  distanceKm: number;
  address?: string;
  isOpen?: boolean;
}

// ── 12 Authentic Verified Nearby Shops for Coimbatore (Nearest First) ──
const CBE_NEARBY_SHOPS: NearbyShopItem[] = [
  {
    id: "s_kovilmedu_medicals",
    name: "Kovilmedu Care Medicals",
    category: "Pharmacy",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.2,
    address: "Junction Arch, Kovilmedu, Coimbatore",
  },
  {
    id: "s_paap1",
    name: "Sri Krishna Sweets & Bakery",
    category: "Bakery & Sweets",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.3,
    address: "Pappampatti Pirivu, Trichy Road",
  },
  {
    id: "s_kiran1",
    name: "Anand Kirana Provision Store",
    category: "Grocery & Provisions",
    imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    distanceKm: 0.4,
    address: "12, Trichy Road, Coimbatore",
  },
  {
    id: "s_roja_bakes",
    name: "Roja Bakes & Sweets",
    category: "Bakery",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.4,
    address: "Main Road, Pappampatti Pirivu",
  },
  {
    id: "s_roja_mart",
    name: "Roja Supermarket & Kirana",
    category: "Daily Groceries",
    imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.6,
    address: "Pappampatti Pirivu Bus Stop",
  },
  {
    id: "s_book_nook",
    name: "The Book Nook & Stationery",
    category: "Books & Stationery",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.7,
    address: "Diwan Bahadur Road, RS Puram",
  },
  {
    id: "s_pala1",
    name: "Kovai Pazhamudir Nilayam",
    category: "Fruits & Veggies",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.7,
    address: "88, Trichy Road, Coimbatore",
  },
  {
    id: "s_haribhavanam",
    name: "Haribhavanam",
    category: "South Indian & Meals",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.8,
    address: "Sungam Junction, Trichy Road",
  },
  {
    id: "s_paap_artisan",
    name: "Ravi's Artisan Bakery",
    category: "Bakery",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.9,
    address: "DB Road, RS Puram, Coimbatore",
  },
  {
    id: "s_cafebreez",
    name: "Cafe Breez",
    category: "Beverages & Cafe",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    distanceKm: 1.0,
    address: "Race Course Road, Coimbatore",
  },
  {
    id: "s_stylehub",
    name: "StyleHub Boutique",
    category: "Fashion & Apparel",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    rating: 4.6,
    distanceKm: 1.1,
    address: "Cross Cut Road, Coimbatore",
  },
  {
    id: "s_kovai_fresh",
    name: "Kovai Fresh Mart",
    category: "Organic Produce",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    distanceKm: 1.2,
    address: "NSR Road, Saibaba Colony",
  },
];

// ── 12 Authentic Verified Nearby Shops for Bengaluru / JP Nagar ──
const BLR_NEARBY_SHOPS: NearbyShopItem[] = [
  {
    id: "s_jp_bakery",
    name: "Ravi's Artisan Bakery (JP Nagar)",
    category: "Bakery & Sweets",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.3,
    address: "24th Main Road, JP Nagar 2nd Phase",
  },
  {
    id: "s_jp_produce",
    name: "Namma Fresh Produce (JP Nagar)",
    category: "Fruits & Veggies",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.4,
    address: "14th Cross, JP Nagar 2nd Phase",
  },
  {
    id: "s_jp_apparel",
    name: "JP Nagar Readymades & Menswear",
    category: "Individual Fashion",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.4,
    address: "15th Main Road, JP Nagar",
  },
  {
    id: "s_jp_groceries",
    name: "Kumar Groceries & Provisions",
    category: "Kirana & Grocery",
    imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    distanceKm: 0.5,
    address: "24th Main Road, JP Nagar",
  },
  {
    id: "s_jp_cafe",
    name: "Cafe Breez (JP Nagar)",
    category: "Beverages & Cafe",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
    rating: 4.7,
    distanceKm: 0.5,
    address: "9th Cross, JP Nagar 3rd Phase",
  },
  {
    id: "s_jp_pharmacy",
    name: "Apollo Pharmacy (JP Nagar)",
    category: "Pharmacy",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.6,
    address: "Ring Road, JP Nagar 2nd Phase",
  },
  {
    id: "s_jp_greenleaf",
    name: "GreenLeaf Organics",
    category: "Organic Foods",
    imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.7,
    address: "17th Cross, JP Nagar 4th Phase",
  },
  {
    id: "s_jp_haribhavanam",
    name: "Haribhavanam Meals & Biryani",
    category: "South Indian & Meals",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.8,
    address: "Outer Ring Road, JP Nagar",
  },
  {
    id: "s_jp_dairy",
    name: "Meena Dairy Farm",
    category: "Dairy & Milk",
    imageUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.9,
    address: "Arekere Mico Layout, Bannerghatta",
  },
  {
    id: "s_jp_pet",
    name: "PetPal Co. (JP Nagar)",
    category: "Pet Care",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 1.0,
    address: "6th Phase, JP Nagar",
  },
  {
    id: "s_jp_home",
    name: "HomeKart Essentials",
    category: "Home & Decor",
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80",
    rating: 4.6,
    distanceKm: 1.2,
    address: "Bannerghatta Main Road",
  },
  {
    id: "s_jp_spice",
    name: "Spice Route Bazaar",
    category: "Spices & Masala",
    imageUrl: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 1.4,
    address: "24th Main Road, JP Nagar",
  },
];

interface ExploreNearbyShopsProps {
  shops?: ShopCardData[];
  className?: string;
  isMobileCompact?: boolean;
}

export function Explore12LocalShops({
  shops,
  className = "",
  isMobileCompact = false,
}: ExploreNearbyShopsProps) {
  const navigate = useNavigate();
  const followedShopIds = useFollowedShopIds();
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);

  const activeAreaLabel = deliveryLocation
    ? `${deliveryLocation.area || deliveryLocation.label?.split(",")[0] || ""}, ${deliveryLocation.city || ""}`.trim().replace(/^,\s*/, "")
    : "Coimbatore, TN";

  const [isExpanded, setIsExpanded] = useState(false);

  // Compute final nearby shops (sorted by closest distance first)
  const displayShops = useMemo<NearbyShopItem[]>(() => {
    if (shops && shops.length >= 6) {
      const mapped = shops.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || "Local Store",
        imageUrl:
          s.imageUrl && !s.imageUrl.includes("photo-1542838132-92c53300491e")
            ? s.imageUrl
            : "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
        rating: s.rating ?? 4.8,
        distanceKm: s.distanceKm ?? 0.8,
        address: s.address,
        isOpen: s.isOpen ?? true,
      }));
      // Sort by closest distance
      mapped.sort((a, b) => a.distanceKm - b.distanceKm);
      return mapped.slice(0, 12);
    }

    return isBLR ? BLR_NEARBY_SHOPS : CBE_NEARBY_SHOPS;
  }, [shops, isBLR]);

  // Show 9 shops in an authentic 3x3 grid by default, or all 12 when expanded
  const visibleShops = isExpanded ? displayShops : displayShops.slice(0, 9);

  const isShopFollowed = (id: string) => followedShopIds.includes(id);

  const handleToggleFollow = (shop: NearbyShopItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isNowFollowing = followingStore.toggle(shop.id);
    if (isNowFollowing) {
      toast.success(`Following ${shop.name}! 🎉`);
    } else {
      toast.info(`Unfollowed ${shop.name}`);
    }
  };

  return (
    <div
      className={`rounded-3xl bg-white border border-[#E2E8F0] p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md ${className}`}
    >
      {/* ── Section Header: Nearby Shops ── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#F8FAFC]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#8B2FC9] border border-[#E2E8F0] shrink-0">
            <Store className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-[#0F172A] leading-tight">
              Nearby Shops
            </h2>
            <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3 text-[#8B2FC9] shrink-0" />
              <span>Near {activeAreaLabel}</span>
            </p>
          </div>
        </div>
        <Link
          to="/near-me"
          className="flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] transition cursor-pointer shrink-0 ml-2"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── 3x3 Grid Alignment ── */}
      <div className="pt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {visibleShops.map((shop) => {
          const followed = isShopFollowed(shop.id);

          return (
            <div
              key={shop.id}
              onClick={() => void navigate({ to: "/store/$storeId", params: { storeId: shop.id } })}
              className="flex flex-col items-center justify-between rounded-2xl border border-[#F0E6F7] bg-white p-2.5 sm:p-3 text-center shadow-2xs hover:shadow-md hover:border-[#8B2FC9]/40 transition group cursor-pointer"
            >
              {/* Local Shop Storefront Image */}
              <div className="relative mb-2 h-18 w-18 sm:h-20 sm:w-20 xl:h-22 xl:w-22 overflow-hidden rounded-2xl bg-[#F8FAFC] ring-1 ring-purple-100/80 group-hover:scale-105 transition-transform shadow-2xs">
                <img
                  src={shop.imageUrl}
                  alt={shop.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Distance Badge on image */}
                <div className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-extrabold text-white backdrop-blur-xs">
                  {shop.distanceKm} km
                </div>
              </div>

              {/* Shop Name & Category */}
              <div className="w-full min-w-0 mb-2">
                <h3
                  title={shop.name}
                  className="text-xs sm:text-[13px] font-bold text-[#0F172A] line-clamp-1 group-hover:text-[#8B2FC9] transition"
                >
                  {shop.name}
                </h3>
                <p className="text-[10px] text-[#746A85] truncate mt-0.5">
                  {shop.category}
                </p>
              </div>

              {/* Follow / Following Button */}
              <button
                type="button"
                onClick={(e) => handleToggleFollow(shop, e)}
                className={`w-full py-1.5 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  followed
                    ? "bg-[#F8FAFC] border border-[#D5B8E6] text-[#581C87] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                    : "bg-[#8B2FC9] hover:bg-[#8e2aa3] text-white shadow-xs active:scale-95"
                }`}
              >
                {followed ? (
                  <>
                    <span>Following</span>
                    <Check className="h-3 w-3 stroke-[2.5]" />
                  </>
                ) : (
                  <span>Follow</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Show more toggle if more shops exist */}
      {displayShops.length > 9 && (
        <div className="mt-3 pt-2 text-center border-t border-[#F8FAFC]">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] transition cursor-pointer"
          >
            {isExpanded ? "Show 3x3 Grid" : `Show More (${displayShops.length - 9} more)`}
          </button>
        </div>
      )}
    </div>
  );
}
