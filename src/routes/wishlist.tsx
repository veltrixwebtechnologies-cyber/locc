import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Heart,
  Store,
  ShoppingBag,
  Trash2,
  Sparkles,
  ExternalLink,
  Plus,
  Star,
  MapPin,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { TrendingWidget } from "@/components/social-commerce/trending-widget";
import { YourDeliveryWidget } from "@/components/social-commerce/your-delivery-widget";
import { useWishlist, useWishlistProducts, useToggleWishlist } from "@/lib/merchandising";
import { cartStore, useCart } from "@/modules/shopper/services/cart-store";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

// Mockup showcase products matching Box 07
const SAMPLE_WISHLIST_PRODUCTS = [
  {
    id: "prod_wl_1",
    name: "Alphonso Mango (1 kg)",
    storeName: "Meena Fresh",
    price: 220,
    originalPrice: 280,
    discount: "21% Off",
    stockStatus: "in_stock" as const,
    stockLabel: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_wl_2",
    name: "T-Cotton T-Shirt (Unisex)",
    storeName: "StyleHub",
    price: 399,
    originalPrice: 499,
    discount: "20% Off",
    stockStatus: "in_stock" as const,
    stockLabel: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_wl_3",
    name: "Sourdough Loaf",
    storeName: "Ravi's Bakery",
    price: 180,
    originalPrice: 200,
    discount: "10% Off",
    stockStatus: "low_stock" as const,
    stockLabel: "Only 3 Left",
    imageUrl: "/assets/ravis-sourdough-hero.jpg",
  },
  {
    id: "prod_wl_4",
    name: "Organic Honey (500 g)",
    storeName: "Kumar Stores",
    price: 350,
    originalPrice: 390,
    discount: "10% Off",
    stockStatus: "in_stock" as const,
    stockLabel: "In Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=400&q=80",
  },
];

const SAMPLE_WISHLIST_SHOPS = [
  {
    id: "s_paap1",
    name: "Ravi's Artisan Bakery",
    category: "Bakery & Desserts",
    rating: 4.8,
    reviews: 194,
    distanceKm: 0.9,
    location: "RS Puram, Coimbatore",
    image: "/assets/ravis-sourdough-hero.jpg",
    openNow: true,
  },
  {
    id: "s_kiran1",
    name: "Meena Fresh Produce",
    category: "Fresh Fruits & Veggies",
    rating: 4.7,
    reviews: 320,
    distanceKm: 1.6,
    location: "Saibaba Colony",
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    openNow: true,
  },
  {
    id: "s_groc2",
    name: "Kumar Stores",
    category: "Kirana & Groceries",
    rating: 4.6,
    reviews: 215,
    distanceKm: 1.4,
    location: "Gandhipuram",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    openNow: true,
  },
  {
    id: "s_boutique1",
    name: "StyleHub Apparel",
    category: "Fashion & Clothing",
    rating: 4.5,
    reviews: 142,
    distanceKm: 2.1,
    location: "Cross Cut Road",
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
    openNow: true,
  },
];

function WishlistPage() {
  const wishlist = useWishlist();
  const realWishlistProducts = useWishlistProducts();
  const toggleWishlist = useToggleWishlist();
  const cart = useCart();
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<"products" | "shops">("products");
  const [sampleProducts, setSampleProducts] = useState(SAMPLE_WISHLIST_PRODUCTS);
  const [sampleShops, setSampleShops] = useState(SAMPLE_WISHLIST_SHOPS);

  // Combine real saved products with sample list if needed
  const realProductsList = realWishlistProducts.data || [];
  const displayProducts = useMemo(() => {
    if (realProductsList.length > 0) {
      return realProductsList.map((p) => ({
        id: p.id,
        name: p.name,
        storeName: p.shop_name || "Local Merchant",
        price: p.selling_price ?? p.mrp ?? 100,
        originalPrice: p.mrp,
        discount: p.mrp > p.selling_price ? `${Math.round(((p.mrp - p.selling_price) / p.mrp) * 100)}% Off` : undefined,
        stockStatus: (p.stock <= 0 ? "out_of_stock" : p.stock > 5 ? "in_stock" : "low_stock") as "in_stock" | "low_stock" | "out_of_stock",
        stockLabel: p.stock <= 0 ? "Out of Stock" : p.stock > 5 ? "In Stock" : `Only ${p.stock} Left`,
        imageUrl:
          p.image_url ||
          "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
      }));
    }
    return sampleProducts;
  }, [realProductsList, sampleProducts]);

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    storeName: string;
  }) => {
    cartStore.add("store_wishlist", product.storeName, {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: "item",
      stock: 15,
      imageUrl: product.imageUrl,
    });
    setRecentlyAddedIds((prev) => new Set(prev).add(product.id));
    toast.success(`Added ${product.name} to cart!`, {
      description: `₹${product.price} • ${product.storeName}`,
    });
  };

  const handleRemoveProduct = (productId: string) => {
    toggleWishlist.mutate({ productId, active: false });
    setSampleProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Removed from wishlist");
  };

  const handleRemoveShop = (shopId: string) => {
    setSampleShops((prev) => prev.filter((s) => s.id !== shopId));
    toast.success("Shop removed from saved list");
  };

  return (
    <SocialCommerceShell
      rightSidebar={
        <div className="space-y-4">
          <TrendingWidget />
          <YourDeliveryWidget />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent p-5 sm:p-6 rounded-3xl border border-purple-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            Saved Picks
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Wishlist
          </h1>
          <p className="text-sm text-[#746A85] mt-1">
            Your saved products and favorite neighborhood shops.
          </p>
        </div>

        {/* Tabs: Products (8) / Shops (4) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "products"
                ? "bg-[#8B2FC9] text-white shadow-sm shadow-purple-500/30"
                : "bg-white text-[#746A85] border border-purple-100 hover:border-purple-300"
            }`}
          >
            Products ({displayProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("shops")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "shops"
                ? "bg-[#8B2FC9] text-white shadow-sm shadow-purple-500/30"
                : "bg-white text-[#746A85] border border-purple-100 hover:border-purple-300"
            }`}
          >
            Shops ({sampleShops.length})
          </button>
        </div>

        {/* Tab 1: Products Rows (Matching Box 07) */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {displayProducts.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 text-center border border-purple-100 space-y-3">
                <Heart className="w-12 h-12 text-purple-200 mx-auto" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Your wishlist is empty
                </h3>
                <p className="text-xs text-[#746A85] max-w-sm mx-auto">
                  Tap the heart icon on any product across LocalShore to save it here for
                  easy purchasing.
                </p>
                <Link
                  to="/explore"
                  className="inline-block mt-2 px-5 py-2.5 rounded-2xl bg-[#8B2FC9] text-white text-xs font-bold shadow-md hover:bg-[#581C87] transition"
                >
                  Explore Products
                </Link>
              </div>
            ) : (
              displayProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group rounded-3xl bg-white p-4 sm:p-5 border border-purple-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Image & Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-purple-100 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-[#746A85] mt-0.5">
                        {prod.storeName}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-extrabold text-[#0F172A]">
                          ₹{prod.price}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{Math.round(prod.originalPrice)}
                          </span>
                        )}
                        {prod.discount && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {prod.discount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock Badge, Heart & Add to Cart */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-purple-50">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        prod.stockStatus === "in_stock"
                          ? "bg-emerald-100 text-emerald-700"
                          : prod.stockStatus === "out_of_stock"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {prod.stockLabel}
                    </span>

                    <button
                      onClick={() => handleRemoveProduct(prod.id)}
                      className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition active:scale-95"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>

                    {(() => {
                      const isInCart =
                        recentlyAddedIds.has(prod.id) ||
                        cart.lines.some((l) => l.productId === prod.id);
                      return (
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                            isInCart
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-600/20"
                              : "bg-gradient-to-r from-[#8B2FC9] to-[#581C87] hover:opacity-95 text-white shadow-purple-500/20"
                          }`}
                        >
                          {isInCart ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              Added to Cart
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Add to Cart
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Favorite Shops */}
        {activeTab === "shops" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sampleShops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-3xl bg-white p-5 border border-purple-100 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-purple-100"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">
                        {shop.name}
                      </h4>
                      <p className="text-xs text-[#746A85]">{shop.category}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {shop.rating}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#746A85] flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-purple-600" />
                          {shop.distanceKm} km
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveShop(shop.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-50">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ● Open Now
                  </span>
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: shop.id }}
                    className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-[#8B2FC9] text-[#8B2FC9] hover:text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    Visit Shop
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SocialCommerceShell>
  );
}
