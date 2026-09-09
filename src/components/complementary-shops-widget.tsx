import React from 'react';
import { Link } from '@tanstack/react-router';
import { Store, MapPin, Star, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateDistanceKm } from '@/lib/geo';

export interface ComplementaryShop {
  id: string;
  business_name: string;
  business_type?: string;
  city?: string;
  rating?: number;
  lat?: number | null;
  lng?: number | null;
  image_url?: string;
  matching_reason?: string;
}

interface ComplementaryShopsWidgetProps {
  currentCategory?: string;
  userLat?: number | null;
  userLng?: number | null;
  shops: ComplementaryShop[];
}

export const ComplementaryShopsWidget: React.FC<ComplementaryShopsWidgetProps> = ({
  currentCategory,
  userLat,
  userLng,
  shops,
}) => {
  if (!shops || shops.length === 0) return null;

  return (
    <div className="my-8 rounded-3xl bg-gradient-to-br from-[#fcf7fe] via-[#f7eafd] to-[#f2dcfa] p-5 sm:p-7 border-2 border-purple-300/60 shadow-xl shadow-purple-950/5 relative overflow-hidden group">
      {/* Decorative Subtle Orchid Watermark Pattern */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#981495]/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#981495] text-white shadow-md shadow-purple-900/20 shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-2">
              Complementary Nearby Shops
            </h3>
            <p className="text-xs text-purple-900/80 font-semibold mt-0.5">
              {currentCategory
                ? `Shoppers interested in ${currentCategory} also visited these local stores`
                : 'Smart contextual local recommendations'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-purple-300/80 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#981495] shadow-xs backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-[#981495] animate-ping" />
          AI Smart Match
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
        {shops.slice(0, 3).map((shop, idx) => {
          const dist =
            userLat && userLng && shop.lat && shop.lng
              ? calculateDistanceKm(userLat, userLng, shop.lat, shop.lng)
              : null;

          return (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className="group/card rounded-2xl border-2 border-purple-200/70 bg-white p-4 shadow-sm hover:border-[#981495] hover:shadow-xl hover:shadow-purple-950/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#981495] to-[#670965] text-white shadow-xs">
                      <Store className="h-4.5 w-4.5 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-extrabold text-sm text-slate-900 truncate leading-tight group-hover/card:text-[#981495] transition-colors">
                        {shop.business_name}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                        {shop.business_type || 'Verified Local Partner'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 border border-amber-200/80 shadow-2xs shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-900">
                      {(shop.rating || 4.5).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* AI Matching Reason Pill (Vibrant Orchid Theme) */}
                {shop.matching_reason && (
                  <div className="mt-3 rounded-xl bg-purple-50/90 border border-purple-200/80 p-2.5 text-xs text-purple-950 flex items-start gap-2 shadow-2xs">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 fill-amber-400/20" />
                    <p className="font-semibold text-[11px] leading-snug text-[#570954]">
                      {shop.matching_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {dist !== null ? (
                  <span className="text-xs font-bold text-slate-500 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-[#981495]" />
                    {dist.toFixed(1)} km away
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-[#981495]" />
                    Nearby shop
                  </span>
                )}

                <Link
                  to="/store/$storeId"
                  params={{ storeId: shop.id }}
                  className="inline-flex items-center gap-1 rounded-xl bg-purple-50 hover:bg-[#981495] text-[#981495] hover:text-white border border-purple-200/80 px-3 py-1.5 text-xs font-extrabold transition-all duration-200 shadow-2xs cursor-pointer"
                >
                  <span>Visit Shop</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
