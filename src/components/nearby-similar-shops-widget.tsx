import React from "react";
import { Link } from "@tanstack/react-router";
import { Store as StoreIcon, MapPin, Star, Sparkles, ArrowRight, Zap, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { getNearbyStoreRecommendations } from "@/lib/nearby-recommendation-engine";
import { useDeliveryLocation } from "@/lib/location-store";
import { cartStore } from "@/lib/cart-store";
import { flyProductToCart } from "@/lib/fly-to-cart";
import { toast } from "sonner";

interface NearbySimilarShopsWidgetProps {
  currentCategory?: string | null;
  currentProductId?: string;
  currentStoreId?: string;
  searchQuery?: string;
  title?: string;
  subtitle?: string;
}

export const NearbySimilarShopsWidget: React.FC<NearbySimilarShopsWidgetProps> = ({
  currentCategory = "",
  currentProductId = "",
  currentStoreId = "",
  searchQuery = "",
  title = "Stores & Products Near Your Home",
  subtitle = "Discover nearby local merchants selling matching items with instant delivery",
}) => {
  const [deliveryLocation] = useDeliveryLocation();

  const userLat = deliveryLocation?.lat ?? null;
  const userLng = deliveryLocation?.lng ?? null;
  const areaLabel = deliveryLocation?.area || deliveryLocation?.label.split(",")[0] || "Your Home";

  const recommendations = getNearbyStoreRecommendations({
    userLat,
    userLng,
    currentCategory,
    currentProductId,
    currentStoreId,
    searchQuery,
    limit: 3,
  });

  if (recommendations.length === 0) return null;

  return (
    <div className="my-8 rounded-3xl bg-gradient-to-br from-[#fcf7fe] via-[#f7eafd] to-[#f2dcfa] p-5 sm:p-7 border-2 border-purple-300/60 shadow-xl shadow-purple-950/5 relative overflow-hidden group">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#981495]/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#981495] text-white shadow-md shadow-purple-900/20 shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-purple-950/80 font-semibold mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Location badge pill */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-purple-300/80 px-3.5 py-1 text-xs font-bold text-[#981495] shadow-xs backdrop-blur-xs">
          <MapPin className="h-3.5 w-3.5 text-[#981495]" />
          <span>Near {areaLabel}</span>
        </span>
      </div>

      {/* Recommended Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {recommendations.map((shop, idx) => (
          <motion.div
            key={shop.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className="group/card rounded-2xl border-2 border-purple-200/80 bg-white p-4 shadow-sm hover:border-[#981495] hover:shadow-xl hover:shadow-purple-950/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Store Identity Row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#981495] to-[#670965] text-white shadow-xs">
                    <StoreIcon className="h-5 w-5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-extrabold text-sm text-slate-900 truncate leading-tight group-hover/card:text-[#981495] transition-colors">
                      {shop.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                      {shop.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 border border-amber-200/80 shadow-2xs shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-900">
                    {shop.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Distance & ETA Badge */}
              <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1.5 text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600/30" />
                  {shop.distanceKm} km away from you
                </span>
                <span className="text-emerald-700">~{shop.etaMin} mins</span>
              </div>

              {/* Matching Reason Pill */}
              <p className="text-[11px] font-semibold text-[#570954] bg-purple-50 border border-purple-200/80 p-2 rounded-xl mb-3">
                {shop.matchingReason}
              </p>

              {/* Products Available Here Preview */}
              {shop.matchingProducts.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Available Items Nearby:
                  </p>
                  <div className="space-y-2">
                    {shop.matchingProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50/60 border border-slate-200/60 transition-colors"
                      >
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {prod.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-purple-900">
                            ₹{prod.price}
                          </span>
                          <button
                            type="button"
                            data-product-id={prod.id}
                            onClick={() => {
                              flyProductToCart(prod.id);
                              cartStore.add(shop.id, shop.name, {
                                id: prod.id,
                                name: prod.name,
                                unit: prod.unit,
                                price: prod.price,
                              });
                              toast.success(`Added ${prod.name} to cart`);
                            }}
                            className="rounded-md bg-[#981495] hover:bg-purple-900 text-white px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visit Shop Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">
                Live Inventory Ready
              </span>
              <Link
                to="/store/$storeId"
                params={{ storeId: shop.id }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#981495] hover:bg-purple-900 text-white px-3.5 py-1.5 text-xs font-extrabold transition-all shadow-xs cursor-pointer"
              >
                <span>Visit Shop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
