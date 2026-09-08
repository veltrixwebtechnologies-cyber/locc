import React from 'react';
import { Link } from '@tanstack/react-router';
import { Store, MapPin, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="my-8 rounded-xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 p-6 border border-indigo-500/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              Complementary Nearby Shops
            </h3>
            <p className="text-xs text-muted-foreground">
              {currentCategory 
                ? `Shoppers interested in ${currentCategory} also visited these local stores`
                : 'Smart contextual local recommendations'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
          AI Suggested
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {shops.slice(0, 3).map((shop) => {
          const dist = userLat && userLng && shop.lat && shop.lng
            ? calculateDistanceKm(userLat, userLng, shop.lat, shop.lng)
            : null;

          return (
            <Card key={shop.id} className="hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg bg-card/60">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-foreground line-clamp-1 flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-indigo-400 shrink-0" />
                      {shop.business_name}
                    </h4>
                    <span className="text-xs font-semibold text-amber-400 flex items-center shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 mr-0.5" />
                      {shop.rating || 4.5}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {shop.business_type || 'Local Partner Store'}
                  </p>

                  {shop.matching_reason && (
                    <p className="text-[11px] text-indigo-300/80 mt-2 bg-indigo-950/40 p-1.5 rounded border border-indigo-800/30">
                      💡 {shop.matching_reason}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  {dist !== null ? (
                    <span className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-emerald-400" />
                      {dist.toFixed(1)} km away
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nearby shop</span>
                  )}

                  <Link
                    to="/store/$storeId"
                    params={{ storeId: shop.id }}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center"
                  >
                    Visit Shop
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
