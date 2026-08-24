import { Link } from "@tanstack/react-router";
import { Star, ChevronRight, CheckCircle2, Plus, ShoppingBag } from "lucide-react";
import { m } from "motion/react";
import type { MerchandisingProduct } from "@/lib/merchandising";
import { cartStore, useCart } from "@/lib/cart-store";
import { flyProductToCart } from "@/lib/fly-to-cart";
import { WishlistButton } from "@/components/wishlist-button";

/* ─── 1. Shoreline Category Deals Yellow Strip Carousel ──────────────────── */
export function SwiggyTopDealsStrip() {
  const deals = [
    {
      id: "deal-grocery",
      badge: "GET 30% OFF",
      title: "Daily Grocery",
      subtitle: "Fresh staples & local produce",
      category: "grocery",
      bgColor: "#ffc200",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "deal-pharmacy",
      badge: "FREE DELIVERY",
      title: "Pharmacy & Care",
      subtitle: "24x7 Chemist in 15 mins",
      category: "pharmacy",
      bgColor: "#ffc200",
      image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "deal-bakery",
      badge: "FLAT ₹100 OFF",
      title: "Fresh Bakery",
      subtitle: "Oven baked breads & cakes",
      category: "bakery",
      bgColor: "#ffc200",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "deal-stationery",
      badge: "UP TO 40% OFF",
      title: "Stationery & Tech",
      subtitle: "School, office & gadget needs",
      category: "stationery",
      bgColor: "#ffc200",
      image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=400&q=80",
    },
  ];

  return (
    <div className="w-full overflow-hidden py-3">
      <div className="flex gap-3 overflow-x-auto px-5 md:px-8 no-scrollbar scroll-smooth">
        {deals.map((deal) => (
          <Link
            key={deal.id}
            to="/"
            search={{ category: deal.category, q: undefined }}
            className="relative shrink-0 w-[240px] sm:w-[280px] h-[100px] sm:h-[110px] rounded-2xl overflow-hidden shadow-xs transition-transform duration-300 hover:scale-[1.02] cursor-pointer group"
            style={{ backgroundColor: deal.bgColor }}
          >
            {/* Left text area */}
            <div className="absolute inset-y-0 left-0 w-[60%] p-3.5 flex flex-col justify-between z-10">
              <div>
                <p className="text-[11px] font-black tracking-wider uppercase text-slate-900">
                  {deal.title}
                </p>
                <p className="text-xs text-slate-800 font-semibold mt-0.5 line-clamp-1">
                  {deal.subtitle}
                </p>
              </div>

              {/* Pill badge */}
              <div className="inline-flex items-center justify-center rounded-full bg-[#101c42] px-3 py-1 text-center shadow-xs">
                <span className="text-[11px] font-black tracking-tight text-white uppercase">
                  {deal.badge}
                </span>
              </div>
            </div>

            {/* Right category graphic preview */}
            <div className="absolute right-[-10px] top-[-10px] bottom-[-10px] w-[50%] overflow-hidden">
              <div className="relative h-full w-full">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="h-full w-full object-cover rounded-full border-4 border-white/30 shadow-md scale-110 group-hover:scale-115 transition-transform duration-500"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── 2. Shoreline Verified Local Merchant Banner (Mobile Peek Carousel) ──────── */
export function SwiggyFeaturedBanner() {
  const adBanners = [
    {
      id: "ad-1",
      merchant: "Anand Kirana Store",
      headline: "Get items at ₹39*",
      subtitle: "Exclusively on Local Shore!",
      category: "grocery",
      logoBg: "#981495",
      logoText: "AK",
      buttonBg: "#284a75", // Swiggy exact navy blue button color
      bgGradient: "from-[#ebf3fe] via-[#f4f8ff] to-white",
      borderColor: "border-[#d8e6fa]",
      image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "ad-2",
      merchant: "Sagar Medicals 24x7",
      headline: "Medicines at ₹20*",
      subtitle: "Express 15-min delivery!",
      category: "pharmacy",
      logoBg: "#0d9488",
      logoText: "SM",
      buttonBg: "#115e59",
      bgGradient: "from-[#eefcf6] via-[#f4fdf9] to-white",
      borderColor: "border-[#cceee0]",
      image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "ad-3",
      merchant: "Coastline Bakes",
      headline: "Fresh Breads at ₹49*",
      subtitle: "Wood-fired daily bakes!",
      category: "bakery",
      logoBg: "#d97706",
      logoText: "CB",
      buttonBg: "#92400e",
      bgGradient: "from-[#fff8ee] via-[#fffcf6] to-white",
      borderColor: "border-[#fde6c7]",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "ad-4",
      merchant: "Kavya Stationery",
      headline: "Pens & Notes at ₹29*",
      subtitle: "School & office supplies!",
      category: "stationery",
      logoBg: "#7c3aed",
      logoText: "KS",
      buttonBg: "#5b21b6",
      bgGradient: "from-[#faf5ff] via-[#fcf8ff] to-white",
      borderColor: "border-[#ebd9fc]",
      image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=500&q=80",
    },
  ];

  return (
    <div className="w-full overflow-hidden py-3">
      {/* Horizontal Carousel with Mobile Peek (84vw on mobile, 440px on desktop) */}
      <div className="flex gap-3.5 overflow-x-auto px-5 md:px-8 no-scrollbar scroll-smooth snap-x snap-mandatory">
        {adBanners.map((ad) => (
          <div
            key={ad.id}
            className={`shrink-0 w-[85vw] max-w-[390px] sm:w-[440px] snap-start rounded-[24px] border ${ad.borderColor} bg-gradient-to-r ${ad.bgGradient} p-4 sm:p-4.5 shadow-xs transition-all duration-300 hover:shadow-md relative overflow-hidden`}
          >
            <div className="flex items-center justify-between gap-2 h-full">
              {/* Left Column Text & Action */}
              <div className="flex-1 min-w-0 pr-2 space-y-1 sm:space-y-1.5 z-10">
                <p className="text-[13px] sm:text-[14px] font-extrabold text-slate-700 truncate">
                  {ad.merchant}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  {ad.headline}
                </h3>
                <p className="text-xs font-semibold text-slate-500 truncate">
                  {ad.subtitle}
                </p>

                <div className="pt-2">
                  <Link
                    to="/"
                    search={{ category: ad.category, q: undefined }}
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: ad.buttonBg }}
                  >
                    ORDER NOW
                  </Link>
                </div>

                <p className="text-[9px] text-slate-400 font-medium pt-0.5">
                  *T&amp;C apply
                </p>
              </div>

              {/* Right Image + Floating Merchant Logo Badge */}
              <div className="relative shrink-0 w-[130px] sm:w-[160px] h-[105px] sm:h-[120px] rounded-2xl overflow-hidden bg-slate-100 border border-white/80 shadow-xs">
                <img
                  src={ad.image}
                  alt={ad.merchant}
                  className="h-full w-full object-cover"
                />

                {/* Floating Rounded Merchant Logo Badge (Top Right) */}
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-xl bg-white/95 backdrop-blur-xs px-2 py-1 shadow-md border border-slate-100">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-black"
                    style={{ backgroundColor: ad.logoBg }}
                  >
                    {ad.logoText}
                  </div>
                  <span className="text-[10px] font-black text-slate-800 truncate max-w-[65px]">
                    {ad.merchant.split(" ")[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 3. Shoreline ₹99 Local Budget Store ────────────────────────────────────── */
export function Swiggy99StoreSection({
  products = [],
}: {
  products?: MerchandisingProduct[];
}) {
  const cart = useCart();

  // Curated Local Shore essentials under ₹99
  const localBudgetItems = [
    {
      id: "b1",
      seller_id: "s1",
      name: "Bananas (Nendran)",
      selling_price: 45,
      mrp: 60,
      category: "Grocery",
      image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
      shop_name: "Anand Kirana",
      average_rating: 4.7,
    },
    {
      id: "b2",
      seller_id: "s1",
      name: "Farm Fresh Eggs",
      selling_price: 72,
      mrp: 85,
      category: "Dairy & Eggs",
      image_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80",
      shop_name: "Anand Kirana",
      average_rating: 4.8,
    },
    {
      id: "b3",
      seller_id: "s1",
      name: "Fresh Red Tomatoes",
      selling_price: 40,
      mrp: 55,
      category: "Fresh",
      image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
      shop_name: "Nadar Provisions",
      average_rating: 4.6,
    },
    {
      id: "b4",
      seller_id: "s2",
      name: "Paracetamol 500mg",
      selling_price: 22,
      mrp: 30,
      category: "Pharmacy",
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
      shop_name: "Sagar Medicals",
      average_rating: 4.9,
    },
    {
      id: "b5",
      seller_id: "s3",
      name: "Fresh Butter Croissant",
      selling_price: 65,
      mrp: 80,
      category: "Bakery",
      image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
      shop_name: "Coastline Bakes",
      average_rating: 4.9,
    },
    {
      id: "b6",
      seller_id: "s4",
      name: "Blue Gel Pens (Pack of 5)",
      selling_price: 60,
      mrp: 75,
      category: "Stationery",
      image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc36b92?auto=format&fit=crop&w=400&q=80",
      shop_name: "Kavya Stationery",
      average_rating: 4.5,
    },
  ];

  return (
    <div className="mx-5 my-6 md:mx-8 md:my-8">
      {/* Light blue Tinted Container exact like Swiggy ₹99 Store */}
      <div className="rounded-[28px] border border-[#d2e7ff] bg-gradient-to-b from-[#eaf3ff] to-[#f4f8fe] p-4 sm:p-6 shadow-xs">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            {/* 99 Store Badge Icon */}
            <div className="flex items-center justify-center rounded-xl bg-slate-900 px-3 py-1 shadow-sm">
              <span className="text-lg font-black tracking-tight text-[#ffc200]">
                99 store
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900 sm:text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                <span>Local Essentials Under ₹99 · Fast 20-Min Delivery</span>
              </div>
            </div>
          </div>

          <Link
            to="/"
            search={{ category: "all", q: undefined }}
            className="flex items-center gap-0.5 text-xs font-extrabold text-[#981495] hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Horizontal Carousel of Products */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          {localBudgetItems.map((item: any) => {
            const sellingPrice = Number(item.selling_price);
            const mrp = Number(item.mrp);

            return (
              <div
                key={item.id}
                className="group relative shrink-0 w-[145px] sm:w-[160px] rounded-2xl bg-white p-2.5 shadow-xs border border-slate-100 transition-all duration-300 hover:shadow-md"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Category Pill Badge (Bottom Left) */}
                  <div className="absolute left-1.5 bottom-1.5 rounded-xs bg-black/70 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    {item.category}
                  </div>

                  {/* Floating Add '+' Button (Bottom Right) */}
                  <button
                    type="button"
                    onClick={() => {
                      flyProductToCart(item.id);
                      cartStore.add(item.seller_id, item.shop_name ?? "Local Store", {
                        id: item.id,
                        name: item.name,
                        unit: item.category ?? "Item",
                        price: sellingPrice,
                        stock: 20,
                      });
                    }}
                    className="absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-md text-[#981495] hover:bg-[#981495] hover:text-white transition-colors active:scale-95"
                    title="Add item"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>

                {/* Details */}
                <div className="mt-2 space-y-1">
                  <h4 className="line-clamp-1 text-xs font-bold text-slate-800 group-hover:text-[#981495] transition-colors">
                    {item.name}
                  </h4>

                  {/* Price row */}
                  <div className="flex items-center gap-1.5">
                    {mrp > sellingPrice && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{mrp}
                      </span>
                    )}
                    <span className="rounded-md bg-[#ffc200] px-1.5 py-0.5 text-[11px] font-black text-slate-900">
                      ₹{sellingPrice}
                    </span>
                  </div>

                  {/* Rating + Merchant line */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-xs">
                      <Star className="h-2.5 w-2.5 fill-emerald-700 text-emerald-700" />
                      {(item.average_rating ?? 4.7).toFixed(1)}
                    </span>
                    <span className="truncate max-w-[70px] text-[10px] text-slate-400">
                      {item.shop_name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
