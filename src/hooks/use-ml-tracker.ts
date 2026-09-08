import { useEffect } from 'react';
import { mlTracker, MLEventType } from '@/lib/ml-tracker';

export function useMLTracker() {
  const trackSearch = (query: string, lat?: number, lng?: number, resultCount?: number) => {
    if (!query || query.trim().length === 0) return;
    mlTracker.track({
      event_type: 'search',
      search_query: query.trim(),
      lat,
      lng,
      metadata: { result_count: resultCount },
    });
  };

  const trackShopView = (shopId: string, categoryName?: string, lat?: number, lng?: number) => {
    if (!shopId) return;
    mlTracker.track({
      event_type: 'shop_view',
      shop_id: shopId,
      category_name: categoryName,
      lat,
      lng,
    });
  };

  const trackProductView = (productId: string, shopId?: string, categoryName?: string) => {
    if (!productId) return;
    mlTracker.track({
      event_type: 'product_view',
      product_id: productId,
      shop_id: shopId,
      category_name: categoryName,
    });
  };

  const trackCartAdd = (productId: string, shopId?: string, price?: number) => {
    mlTracker.track({
      event_type: 'cart_add',
      product_id: productId,
      shop_id: shopId,
      metadata: { price },
    });
  };

  const trackCheckout = (shopId?: string, totalAmount?: number, itemCount?: number) => {
    mlTracker.track({
      event_type: 'checkout',
      shop_id: shopId,
      metadata: { total_amount: totalAmount, item_count: itemCount },
    });
  };

  const trackRecommendationClick = (shopId: string, source: string, query?: string) => {
    mlTracker.track({
      event_type: 'recommendation_click',
      shop_id: shopId,
      search_query: query,
      metadata: { source_component: source },
    });
  };

  return {
    trackSearch,
    trackShopView,
    trackProductView,
    trackCartAdd,
    trackCheckout,
    trackRecommendationClick,
  };
}
