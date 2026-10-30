import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  BadgePercent,
  ChevronRight,
  Eye,
  Heart,
  Home,
  LayoutGrid,
  List,
  MapPin,
  Package,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { cartConflictManager } from "@/modules/shopper/services/cart-conflict";
import {
  getCleanShopId,
  isWishlistShop,
  resolveProductImageUrl,
  useToggleWishlist,
  useWishlist,
  useWishlistProducts,
  type MerchandisingProduct,
} from "@/lib/merchandising";
import { APPROVED_STORE, productsByStore, stores } from "@/lib/mock-data";
import { getFallbackShopImage, SafeProductImage } from "@/lib/image-utils";
import { WishlistButton } from "@/components/wishlist-button";
import { getImportedShopCoordinates } from "@/lib/imported-shops";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

type SortOption = "recent" | "price_low" | "price_high" | "name_asc" | "discount_high";
type ViewMode = "grid" | "list";
type ItemTypeFilter = "all" | "products" | "shops";

const SHOP_CATEGORY_LABELS: Record<string, string> = {
  fruits_veg: "Fresh Produce",
  meat_fish: "Meat & Fish",
  bakery: "Bakery & Sweets",
  grocery: "Kirana & Grocery",
  pharmacy: "Pharmacy & Care",
  fashion: "Fashion & Apparel",
  electronics: "Electronics & Appliances",
  home_kitchen: "Home & Kitchen",
  flowers: "Flower Shops & Florists",
  gifts: "Gift Shops & Novelties",
  furniture: "Furniture & Living",
};

function formatCategoryLabel(cat?: string | null): string {
  if (!cat) return "Local Store";
  const clean = cat.toLowerCase().replace(/_/g, " ").trim();
  return SHOP_CATEGORY_LABELS[clean] || SHOP_CATEGORY_LABELS[cat] || cat;
}

function WishlistPage() {
  const auth = useAuth();
  const wishlist = useWishlist();
  const products = useWishlistProducts();
  const toggle = useToggleWishlist();
  const signedIn = Boolean(auth.id);

  // Filter & Sort State
  const [itemTypeTab, setItemTypeTab] = useState<ItemTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Dialogs
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showMultiStoreDialog, setShowMultiStoreDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    item: MerchandisingProduct;
    kind: "product" | "shop";
  } | null>(null);

  const rawProducts = useMemo(() => products.data ?? [], [products.data]);

  // Separate real products from favorite shops
  const { savedProducts, savedShops } = useMemo(() => {
    const prods: MerchandisingProduct[] = [];
    const shps: MerchandisingProduct[] = [];
    for (const item of rawProducts) {
      if (isWishlistShop(item)) {
        shps.push(item);
      } else {
        prods.push(item);
      }
    }
    return { savedProducts: prods, savedShops: shps };
  }, [rawProducts]);

  // Categories extracted from all saved items
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of rawProducts) {
      const cat = p.category ? p.category.trim() : "Other";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [rawProducts]);

  // Stores extracted from products
  const storeList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const p of savedProducts) {
      const sId = p.seller_id || APPROVED_STORE.id;
      const sName = p.shop_name || APPROVED_STORE.name;
      const current = map.get(sId);
      if (current) {
        current.count += 1;
      } else {
        map.set(sId, { id: sId, name: sName, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [savedProducts]);

  // Filtered & Sorted items based on active tab, search, category, store and sort
  const filteredItems = useMemo(() => {
    let list: MerchandisingProduct[] = [];
    if (itemTypeTab === "products") {
      list = [...savedProducts];
    } else if (itemTypeTab === "shops") {
      list = [...savedShops];
    } else {
      list = [...rawProducts];
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shop_name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)),
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => (p.category ?? "Other").toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Store filter
    if (selectedStore !== "all") {
      list = list.filter(
        (p) =>
          (p.seller_id || APPROVED_STORE.id) === selectedStore ||
          getCleanShopId(p) === selectedStore,
      );
    }

    // Sorting
    list.sort((a, b) => {
      const isShopA = isWishlistShop(a);
      const isShopB = isWishlistShop(b);

      if (sortBy === "price_low" || sortBy === "price_high" || sortBy === "discount_high") {
        if (isShopA && !isShopB) return 1;
        if (!isShopA && isShopB) return -1;
      }

      const priceA = Number(a.discount_price ?? a.selling_price);
      const priceB = Number(b.discount_price ?? b.selling_price);
      const mrpA = Number(a.mrp || priceA);
      const mrpB = Number(b.mrp || priceB);
      const discA = mrpA > priceA ? ((mrpA - priceA) / mrpA) * 100 : 0;
      const discB = mrpB > priceB ? ((mrpB - priceB) / mrpB) * 100 : 0;

      switch (sortBy) {
        case "price_low":
          return priceA - priceB;
        case "price_high":
          return priceB - priceA;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "discount_high":
          return discB - discA;
        case "recent":
        default:
          return (b.created_at || "").localeCompare(a.created_at || "");
      }
    });

    return list;
  }, [
    rawProducts,
    savedProducts,
    savedShops,
    itemTypeTab,
    searchQuery,
    selectedCategory,
    selectedStore,
    sortBy,
  ]);

  // Overall financial statistics (only real products have prices)
  const stats = useMemo(() => {
    let totalSellingPrice = 0;
    let totalMrp = 0;
    for (const p of savedProducts) {
      const price = Number(p.discount_price ?? p.selling_price);
      const mrp = Number(p.mrp || price);
      totalSellingPrice += price;
      totalMrp += mrp > price ? mrp : price;
    }
    const totalSavings = Math.max(0, totalMrp - totalSellingPrice);
    return {
      totalCount: rawProducts.length,
      productCount: savedProducts.length,
      shopCount: savedShops.length,
      totalSellingPrice,
      totalSavings,
      uniqueStores: storeList.length,
    };
  }, [rawProducts, savedProducts, savedShops, storeList]);

  // Share Wishlist
  const handleShareWishlist = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My LocalShore Wishlist",
          text: `Take a look at my saved items and favorite shops on LocalShore!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Wishlist link copied to clipboard!");
    } else {
      toast.info("Link: " + url);
    }
  };

  // Clear all items
  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      for (const p of rawProducts) {
        await toggle.mutateAsync({ productId: p.id, active: true });
      }
      toast.success("Wishlist cleared");
      setShowClearDialog(false);
    } catch (error: any) {
      toast.error(error?.message ?? "Could not clear all items");
    } finally {
      setIsClearing(false);
    }
  };

  // Move single product to cart
  const handleMoveToCart = async (product: MerchandisingProduct) => {
    const price = Number(product.discount_price ?? product.selling_price);
    const added = cartConflictManager.addWithConflictCheck(
      product.seller_id || APPROVED_STORE.id,
      product.shop_name || APPROVED_STORE.name,
      {
        id: product.id,
        name: product.name,
        unit: product.category ?? "1 unit",
        price,
        stock: product.stock,
        imageUrl: product.image_url ?? undefined,
      },
    );
    if (!added) return;

    try {
      await toggle.mutateAsync({ productId: product.id, active: true });
      toast.success(`Moved "${product.name}" to cart`, {
        action: {
          label: "Undo",
          onClick: () => {
            void toggle.mutate({
              productId: product.id,
              active: false,
              item: {
                productId: product.id,
                name: product.name,
                shopName: product.shop_name,
                category: product.category ?? "Other",
                price,
                imageUrl: product.image_url ?? undefined,
                sellerId: product.seller_id,
                itemType: "product",
              },
            });
          },
        },
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Added to cart, but could not remove from wishlist");
    }
  };

  // Remove single product with Undo
  const handleRemove = async (product: MerchandisingProduct) => {
    setDeleteTarget({ item: product, kind: "product" });
  };

  const executeRemove = async (product: MerchandisingProduct) => {
    const price = Number(product.discount_price ?? product.selling_price);
    try {
      await toggle.mutateAsync({ productId: product.id, active: true });
      toast.success(`Removed "${product.name}"`, {
        action: {
          label: "Undo",
          onClick: () => {
            void toggle.mutate({
              productId: product.id,
              active: false,
              item: {
                productId: product.id,
                name: product.name,
                shopName: product.shop_name,
                category: product.category ?? "Other",
                price,
                imageUrl: product.image_url ?? undefined,
                sellerId: product.seller_id,
                itemType: "product",
              },
            });
          },
        },
      });
    } catch (error: any) {
      toast.error(error.message ?? "Could not remove item");
    }
  };

  // Remove single shop with Undo
  const handleRemoveShop = async (shop: MerchandisingProduct) => {
    setDeleteTarget({ item: shop, kind: "shop" });
  };

  const executeRemoveShop = async (shop: MerchandisingProduct) => {
    try {
      await toggle.mutateAsync({ productId: shop.id, active: true });
      toast.success(`Removed "${shop.name}" from favorite shops`, {
        action: {
          label: "Undo",
          onClick: () => {
            void toggle.mutate({
              productId: shop.id,
              active: false,
              item: {
                productId: shop.id,
                name: shop.name,
                shopName: shop.shop_name || shop.name,
                category: shop.category ?? "Other",
                price: 0,
                imageUrl: shop.image_url ?? undefined,
                sellerId: shop.seller_id,
                itemType: "shop",
              },
            });
          },
        },
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Could not remove shop");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    if (target.kind === "shop") await executeRemoveShop(target.item);
    else await executeRemove(target.item);
  };

  // Bulk add to cart handler (strictly for products, never shops!)
  const handleBulkAddToCart = () => {
    if (savedProducts.length === 0) return;
    const productStores = new Map<string, { id: string; name: string; count: number }>();
    for (const p of savedProducts) {
      const sId = p.seller_id || APPROVED_STORE.id;
      const sName = p.shop_name || APPROVED_STORE.name;
      const current = productStores.get(sId);
      if (current) current.count += 1;
      else productStores.set(sId, { id: sId, name: sName, count: 1 });
    }
    const pStoreList = Array.from(productStores.values());

    if (pStoreList.length === 1) {
      const store = pStoreList[0];
      let addedCount = 0;
      for (const p of savedProducts) {
        const price = Number(p.discount_price ?? p.selling_price);
        const ok = cartConflictManager.addWithConflictCheck(store.id, store.name, {
          id: p.id,
          name: p.name,
          unit: p.category ?? "1 unit",
          price,
          stock: p.stock,
          imageUrl: p.image_url ?? undefined,
        });
        if (ok) addedCount++;
      }
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} items from ${store.name} to your cart!`);
      }
    } else {
      setShowMultiStoreDialog(true);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50/60 pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-foreground">Wishlist</span>
          </nav>

          {/* Page Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50/80 px-3 py-0.5 text-xs font-semibold text-primary">
                <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>SAVED COLLECTION</span>
              </div>
              <h1 className="mt-1.5 font-display text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                My Wishlist & Saved Shops{" "}
                {stats.totalCount > 0 ? (
                  <span className="font-sans text-lg font-normal text-slate-500">
                    ({stats.totalCount} {stats.totalCount === 1 ? "item" : "items"})
                  </span>
                ) : null}
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Saved favorites and neighborhood shops with live local pricing, fast direct delivery, and verified stores.
              </p>
            </div>

            {/* Quick Actions */}
            {signedIn && stats.totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWishlist}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 active:scale-98"
                >
                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearDialog(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/60 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100/80 active:scale-98"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
                {stats.productCount > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkAddToCart}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-98"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Add {stats.productCount} {stats.productCount === 1 ? "Product" : "Products"} to Cart</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Conditional Content */}
          {!signedIn ? (
            <SignedOutState />
          ) : wishlist.isLoading || products.isLoading ? (
            <WishlistLoadingSkeleton />
          ) : wishlist.error || products.error ? (
            <WishlistErrorState
              onRetry={() => {
                void wishlist.refetch();
                void products.refetch();
              }}
            />
          ) : rawProducts.length === 0 ? (
            <WishlistEmptyState />
          ) : (
            <>
              {/* Type Switcher Tabs: All / Products / Shops */}
              <div className="mt-5 flex items-center gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setItemTypeTab("all")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    itemTypeTab === "all"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>All Saved</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
                    {stats.totalCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemTypeTab("products")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    itemTypeTab === "products"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 font-bold">
                    {stats.productCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemTypeTab("shops")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    itemTypeTab === "shops"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>Favorite Shops</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-bold">
                    {stats.shopCount}
                  </span>
                </button>
              </div>

              {/* Value & Hyperlocal Highlights Strip */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Saved Items</span>
                  </div>
                  <p className="mt-1.5 font-display text-xl font-bold text-slate-900">{stats.totalCount}</p>
                  <p className="text-[11px] text-slate-400">
                    {stats.productCount} {stats.productCount === 1 ? "product" : "products"}, {stats.shopCount}{" "}
                    {stats.shopCount === 1 ? "shop" : "shops"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold">Cart Products Value</span>
                  </div>
                  <p className="mt-1.5 font-display text-xl font-bold text-slate-900">
                    ₹{stats.totalSellingPrice.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {stats.totalSavings > 0 ? (
                      <span className="font-semibold text-emerald-600">Save ₹{stats.totalSavings.toLocaleString()}</span>
                    ) : stats.productCount > 0 ? (
                      "Best local prices"
                    ) : (
                      "Save products to order"
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Store className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold">Saved Shops</span>
                  </div>
                  <p className="mt-1.5 font-display text-xl font-bold text-slate-900">
                    {stats.shopCount} {stats.shopCount === 1 ? "Shop" : "Shops"}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {savedShops.map((s) => s.name).join(", ") || "Verified local merchants"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold">Fulfillment</span>
                  </div>
                  <p className="mt-1.5 font-display text-xl font-bold text-slate-900">Fast Local</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">⚡ Same-day direct delivery</p>
                </div>
              </div>

              {/* Multi-Store Note Banner */}
              {storeList.length > 1 && itemTypeTab !== "shops" && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                  <Store className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-bold">Hyperlocal Neighborhood Shopping:</span> Your saved products belong to{" "}
                    <span className="font-semibold">{storeList.length} different local shops</span>. Orders are delivered
                    directly by each individual merchant to ensure peak freshness and speed.
                  </div>
                </div>
              )}

              {/* Filter, Search & View Controls Bar */}
              <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Search Input & Category Pills */}
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search Input */}
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search saved items & shops..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          selectedCategory === "all"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        All ({rawProducts.length})
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedCategory(c.name)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                            selectedCategory.toLowerCase() === c.name.toLowerCase()
                              ? "bg-primary text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {formatCategoryLabel(c.name)} ({c.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Store filter, Sort & View Mode */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 lg:border-t-0 lg:pt-0">
                    {/* Store Filter dropdown */}
                    {storeList.length > 1 && itemTypeTab !== "shops" && (
                      <select
                        aria-label="Filter wishlist by store"
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none hover:bg-white focus:border-primary"
                      >
                        <option value="all">All Shops ({storeList.length})</option>
                        {storeList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.count})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      <select
                        aria-label="Sort wishlist items"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none hover:bg-white focus:border-primary"
                      >
                        <option value="recent">Recently Added</option>
                        <option value="name_asc">Name: A to Z</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="discount_high">Highest Discount</option>
                      </select>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                      <button
                        type="button"
                        title="Grid View"
                        aria-label="Grid view"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-lg p-1.5 transition-all ${
                          viewMode === "grid"
                            ? "bg-white text-primary shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="List View"
                        aria-label="List view"
                        onClick={() => setViewMode("list")}
                        className={`rounded-lg p-1.5 transition-all ${
                          viewMode === "list"
                            ? "bg-white text-primary shadow-xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Display: Grid or List */}
              {filteredItems.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 font-display text-base font-bold text-slate-800">
                    No saved items match your filter
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try adjusting your search terms or clearing the selected filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedStore("all");
                      setItemTypeTab("all");
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map((item) =>
                    isWishlistShop(item) ? (
                      <WishlistShopGridCard
                        key={item.id}
                        shop={item}
                        onRemove={handleRemoveShop}
                        isPending={toggle.isPending}
                      />
                    ) : (
                      <WishlistGridCard
                        key={item.id}
                        product={item}
                        onMoveToCart={handleMoveToCart}
                        onRemove={handleRemove}
                        isPending={toggle.isPending}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-3">
                  {filteredItems.map((item) =>
                    isWishlistShop(item) ? (
                      <WishlistShopListRow
                        key={item.id}
                        shop={item}
                        onRemove={handleRemoveShop}
                        isPending={toggle.isPending}
                      />
                    ) : (
                      <WishlistListRow
                        key={item.id}
                        product={item}
                        onMoveToCart={handleMoveToCart}
                        onRemove={handleRemove}
                        isPending={toggle.isPending}
                      />
                    ),
                  )}
                </div>
              )}
            </>
          )}

          {/* Curated Recommendations Section ("You Might Also Like") */}
          <WishlistRecommendations
            savedProductIds={new Set(savedProducts.map((p) => p.id))}
            savedCategories={new Set(rawProducts.map((p) => (p.category ?? "").toLowerCase()))}
          />

          {/* LocalShore Hyperlocal Assurance Strip */}
          <NeighborhoodAssurance />
        </div>
      </div>

      {/* Confirmation Dialog for Clearing Wishlist */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-slate-900">
              Remove {deleteTarget?.kind === "shop" ? "favorite shop" : "saved item"}?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-slate-500">
              Remove <span className="font-semibold text-slate-700">{deleteTarget?.item.name}</span> from your saved collection?
              You can add it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <button
              type="button"
              disabled={toggle.isPending}
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={toggle.isPending}
              onClick={() => void confirmDelete()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {toggle.isPending ? "Removing..." : "Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-slate-900">
              Clear your entire wishlist?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will remove all {rawProducts.length} saved items and shops from your list. You can always add them back as
              you browse local stores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <button
              type="button"
              disabled={isClearing}
              onClick={() => setShowClearDialog(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isClearing ? "Clearing..." : "Clear All Items"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Store Cart Helper Dialog */}
      <Dialog open={showMultiStoreDialog} onOpenChange={setShowMultiStoreDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
              <Store className="h-5 w-5 text-primary" />
              <span>Add Items by Store</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              LocalShore delivers directly from individual neighborhood stores to ensure 30-45 minute speed. Your
              saved products belong to {storeList.length} shops—select which shop you want to add to your basket:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex flex-col gap-3">
            {storeList.map((store) => {
              const storeProducts = savedProducts.filter(
                (p) => (p.seller_id || APPROVED_STORE.id) === store.id,
              );
              const storeTotal = storeProducts.reduce(
                (sum, p) => sum + Number(p.discount_price ?? p.selling_price),
                0,
              );

              return (
                <div
                  key={store.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-slate-500" />
                      {store.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {storeProducts.length} {storeProducts.length === 1 ? "item" : "items"} • Subtotal:{" "}
                      <span className="font-bold text-slate-800">₹{storeTotal.toLocaleString()}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      let count = 0;
                      for (const p of storeProducts) {
                        const price = Number(p.discount_price ?? p.selling_price);
                        const ok = cartConflictManager.addWithConflictCheck(store.id, store.name, {
                          id: p.id,
                          name: p.name,
                          unit: p.category ?? "1 unit",
                          price,
                          stock: p.stock,
                          imageUrl: p.image_url ?? undefined,
                        });
                        if (ok) count++;
                      }
                      setShowMultiStoreDialog(false);
                      if (count > 0) {
                        toast.success(`Added ${count} items from ${store.name} to cart!`);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Add {storeProducts.length} items to Cart</span>
                  </button>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setShowMultiStoreDialog(false)}
              className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto sm:px-4"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/**
 * Shop Grid Card: Displays a saved local store with store badge, category, rating, delivery promise, and "Visit Shop" button.
 */
function WishlistShopGridCard({
  shop,
  onRemove,
  isPending,
}: {
  shop: MerchandisingProduct;
  onRemove: (shop: MerchandisingProduct) => void;
  isPending: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(shop.image_url ?? "");
  const cleanShopId = getCleanShopId(shop);
  const shopCoordinates = getImportedShopCoordinates(cleanShopId);
  const shopSearch = shopCoordinates ? { shopLat: shopCoordinates.lat, shopLng: shopCoordinates.lng } : undefined;
  const matchedStore = stores.find((s) => s.id === cleanShopId);
  const categoryLabelStr = formatCategoryLabel(shop.category);

  useEffect(() => {
    let active = true;
    if (shop.image_url && !/^(https?:|data:)/i.test(shop.image_url)) {
      void resolveProductImageUrl(shop.image_url).then((url) => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [shop.image_url]);

  const displayImg = imageUrl || getFallbackShopImage(shop.category, cleanShopId);
  const ratingVal = shop.average_rating > 0 ? shop.average_rating : (matchedStore?.rating ?? 4.8);
  const etaMin = matchedStore?.etaMin ?? 30;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl">
      <div>
        {/* Top Image Banner */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <img
            src={displayImg}
            alt={shop.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {/* Top-Left Trust Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-slate-900 border border-slate-200/80 shadow-xs">
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Local Shop</span>
          </div>

          {/* Top-Right Remove Button */}
          <button
            type="button"
            title="Remove from saved shops"
            aria-label={`Remove ${shop.name} from saved shops`}
            disabled={isPending}
            onClick={() => onRemove(shop)}
            className="absolute top-2.5 right-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow-xs backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white hover:text-rose-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Bottom Banner Info: Delivery ETA & Rating */}
          <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-white text-xs font-bold">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[11px]">
              <Truck className="h-3 w-3 text-emerald-400" />
              <span>{etaMin}-{etaMin + 10}m delivery</span>
            </div>

            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[11px] text-amber-300">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{ratingVal.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-4 space-y-2">
          {/* Category Tag */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary truncate">
              {categoryLabelStr}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Partner</span>
            </span>
          </div>

          {/* Shop Title */}
          <Link
            to="/store/$storeId"
            params={{ storeId: cleanShopId }}
            search={shopSearch}
            className="block group/title"
          >
            <h3 className="line-clamp-1 text-base font-extrabold text-slate-900 transition-colors group-hover/title:text-primary">
              {shop.name}
            </h3>
          </Link>

          {/* Address / Subtitle */}
          <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed flex items-start gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{matchedStore?.address || "Neighborhood store • Live catalog and direct local delivery"}</span>
          </p>
        </div>
      </div>

      {/* Bottom CTA Action Button */}
      <div className="p-4 pt-0">
        <Link
          to="/store/$storeId"
          params={{ storeId: cleanShopId }}
          search={shopSearch}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-98 py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Store className="h-3.5 w-3.5" />
          <span>Visit Shop</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Shop List Row: Sleek horizontal row for saved shops.
 */
function WishlistShopListRow({
  shop,
  onRemove,
  isPending,
}: {
  shop: MerchandisingProduct;
  onRemove: (shop: MerchandisingProduct) => void;
  isPending: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(shop.image_url ?? "");
  const cleanShopId = getCleanShopId(shop);
  const shopCoordinates = getImportedShopCoordinates(cleanShopId);
  const shopSearch = shopCoordinates ? { shopLat: shopCoordinates.lat, shopLng: shopCoordinates.lng } : undefined;
  const matchedStore = stores.find((s) => s.id === cleanShopId);
  const categoryLabelStr = formatCategoryLabel(shop.category);

  useEffect(() => {
    let active = true;
    if (shop.image_url && !/^(https?:|data:)/i.test(shop.image_url)) {
      void resolveProductImageUrl(shop.image_url).then((url) => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [shop.image_url]);

  const displayImg = imageUrl || getFallbackShopImage(shop.category, cleanShopId);
  const ratingVal = shop.average_rating > 0 ? shop.average_rating : (matchedStore?.rating ?? 4.8);
  const etaMin = matchedStore?.etaMin ?? 30;

  return (
    <div className="group flex flex-col gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center">
      {/* Thumbnail */}
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <Link to="/store/$storeId" params={{ storeId: cleanShopId }} search={shopSearch} className="block h-full w-full">
          <img
            src={displayImg}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </Link>
        <span className="absolute top-1.5 left-1.5 rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-black text-slate-900 border border-slate-200/80">
          ★ {ratingVal.toFixed(1)}
        </span>
      </div>

      {/* Info Column */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <Store className="h-3.5 w-3.5" />
            <span>Local Store</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            {categoryLabelStr}
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
            <Truck className="h-3 w-3" />
            {etaMin}-{etaMin + 10}m delivery
          </span>
        </div>

        <Link
          to="/store/$storeId"
          params={{ storeId: cleanShopId }}
          search={shopSearch}
          className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-primary"
        >
          {shop.name}
        </Link>

        <p className="truncate text-xs text-slate-500 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{matchedStore?.address || "Verified neighborhood partner with live inventory"}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:ml-4">
        <Link
          to="/store/$storeId"
          params={{ storeId: cleanShopId }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          <Store className="h-3.5 w-3.5" />
          <span>Visit Shop</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          title="Remove from saved shops"
          aria-label={`Remove ${shop.name} from saved shops`}
          disabled={isPending}
          onClick={() => onRemove(shop)}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 p-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Grid View Card for Products: Modern e-commerce presentation with price, discounts, and "Move to Cart".
 */
function WishlistGridCard({
  product,
  onMoveToCart,
  onRemove,
  isPending,
}: {
  product: MerchandisingProduct;
  onMoveToCart: (product: MerchandisingProduct) => void;
  onRemove: (product: MerchandisingProduct) => void;
  isPending: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const shopCoordinates = getImportedShopCoordinates(product.seller_id);
  const shopSearch = shopCoordinates ? { shopLat: shopCoordinates.lat, shopLng: shopCoordinates.lng } : undefined;

  useEffect(() => {
    let active = true;
    if (product.image_url && !/^(https?:|data:)/i.test(product.image_url)) {
      void resolveProductImageUrl(product.image_url).then((url) => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [product.image_url]);

  const price = Number(product.discount_price ?? product.selling_price);
  const mrp = Number(product.mrp || price);
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const storeInfo = stores.find((s) => s.id === product.seller_id);
  const etaMin = storeInfo?.etaMin ?? 30;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md">
      <div>
        {/* Image Frame with badges */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
          {/* Top-Left: Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute left-2.5 top-2.5 z-10 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
              {discountPercent}% OFF
            </div>
          )}

          {/* Top-Right: Remove button */}
          <button
            type="button"
            title="Remove from wishlist"
            aria-label={`Remove ${product.name} from wishlist`}
            disabled={isPending}
            onClick={() => onRemove(product)}
            className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow-xs backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white hover:text-rose-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Bottom-Left: Delivery ETA Tag */}
          <div className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
            <Truck className="h-3 w-3 text-emerald-400" />
            <span>{etaMin}-{etaMin + 10}m delivery</span>
          </div>

          {/* Clickable Image */}
          <Link
            to="/product/$productId"
            params={{ productId: product.id }}
            search={shopSearch}
            className="flex h-full w-full items-center justify-center"
          >
            <SafeProductImage
              src={imageUrl}
              productName={product.name}
              category={product.category}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Product Details */}
        <div className="mt-3 space-y-1">
          {/* Store name and link */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <Link
              to="/store/$storeId"
              params={{ storeId: product.seller_id || APPROVED_STORE.id }}
              search={shopSearch}
              className="inline-flex items-center gap-1 truncate font-medium text-slate-600 hover:text-primary hover:underline"
            >
              <Store className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{product.shop_name || "Verified Local Store"}</span>
            </Link>
            {product.average_rating > 0 && (
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{product.average_rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            to="/product/$productId"
            params={{ productId: product.id }}
            search={shopSearch}
            className="block line-clamp-2 text-sm font-bold text-slate-900 transition-colors hover:text-primary"
          >
            {product.name}
          </Link>

          {/* Category Pill */}
          {product.category && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {formatCategoryLabel(product.category)}
            </p>
          )}

          {/* Price Block */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-lg font-black text-slate-900">₹{price}</span>
            {mrp > price && (
              <span className="text-xs font-semibold text-slate-400 line-through">₹{mrp}</span>
            )}
            {discountPercent > 0 && (
              <span className="text-[11px] font-bold text-emerald-600">
                Save ₹{mrp - price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onMoveToCart(product)}
          disabled={isPending}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-98 disabled:opacity-60"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Move to Cart</span>
        </button>
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          search={shopSearch}
          title="View product details"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <Eye className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * List View Row: Sleek horizontal row for compact product review.
 */
function WishlistListRow({
  product,
  onMoveToCart,
  onRemove,
  isPending,
}: {
  product: MerchandisingProduct;
  onMoveToCart: (product: MerchandisingProduct) => void;
  onRemove: (product: MerchandisingProduct) => void;
  isPending: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const shopCoordinates = getImportedShopCoordinates(product.seller_id);
  const shopSearch = shopCoordinates ? { shopLat: shopCoordinates.lat, shopLng: shopCoordinates.lng } : undefined;

  useEffect(() => {
    let active = true;
    if (product.image_url && !/^(https?:|data:)/i.test(product.image_url)) {
      void resolveProductImageUrl(product.image_url).then((url) => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [product.image_url]);

  const price = Number(product.discount_price ?? product.selling_price);
  const mrp = Number(product.mrp || price);
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const storeInfo = stores.find((s) => s.id === product.seller_id);
  const etaMin = storeInfo?.etaMin ?? 30;

  return (
    <div className="group flex flex-col gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-purple-200 hover:shadow-sm sm:flex-row sm:items-center">
      {/* Thumbnail */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          search={shopSearch}
          className="flex h-full w-full items-center justify-center p-1.5"
        >
          <SafeProductImage
            src={imageUrl}
            productName={product.name}
            category={product.category}
            alt={product.name}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
        </Link>
        {discountPercent > 0 && (
          <span className="absolute bottom-1 left-1 rounded bg-emerald-600 px-1 py-0.2 text-[9px] font-black text-white">
            {discountPercent}%
          </span>
        )}
      </div>

      {/* Info Column */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to="/store/$storeId"
            params={{ storeId: product.seller_id || APPROVED_STORE.id }}
            search={shopSearch}
            className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-primary hover:underline"
          >
            <Store className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{product.shop_name}</span>
          </Link>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
            <Truck className="h-3 w-3" />
            {etaMin}-{etaMin + 10}m delivery
          </span>
          {product.category && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400 font-medium">{formatCategoryLabel(product.category)}</span>
            </>
          )}
        </div>

        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          search={shopSearch}
          className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <p className="text-xs text-slate-500">
          In Stock • Verified local merchant • Hyperlocal fulfillment
        </p>
      </div>

      {/* Pricing & Actions Column */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-2.5 sm:flex-row sm:items-center">
        <div className="text-right sm:mr-3">
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="font-display text-base font-black text-slate-900">₹{price}</span>
            {mrp > price && (
              <span className="text-xs font-semibold text-slate-400 line-through">₹{mrp}</span>
            )}
          </div>
          {discountPercent > 0 && (
            <p className="text-[10px] font-bold text-emerald-600">Save ₹{mrp - price}</p>
          )}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => onMoveToCart(product)}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 disabled:opacity-60 sm:flex-none"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Move to Cart</span>
          </button>
          <button
            type="button"
            title="Remove from wishlist"
            aria-label={`Remove ${product.name} from wishlist`}
            disabled={isPending}
            onClick={() => onRemove(product)}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-2.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Recommendations Section: Suggests products from neighboring shops matching saved interests.
 */
function WishlistRecommendations({
  savedProductIds,
  savedCategories,
}: {
  savedProductIds: Set<string>;
  savedCategories: Set<string>;
}) {
  const recommendations = useMemo(() => {
    const all = Object.values(productsByStore).flat();
    const available = all.filter((p) => !savedProductIds.has(p.id));

    const matching = available.filter((p) =>
      savedCategories.has((p.category ?? "").toLowerCase()),
    );

    const other = available.filter(
      (p) => !savedCategories.has((p.category ?? "").toLowerCase()),
    );

    const pool = [...matching, ...other];
    return pool.slice(0, 4);
  }, [savedProductIds, savedCategories]);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-12 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Neighborhood Discoveries</span>
          </div>
          <h2 className="mt-0.5 font-display text-xl font-black text-slate-900">
            You Might Also Like
          </h2>
          <p className="text-xs text-slate-500">
            Popular neighborhood products trending in nearby stores right now.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          <span>Explore All Stores</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((prod) => {
          const store = stores.find((s) => s.id === prod.storeId);
          return (
            <div
              key={prod.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <div className="absolute right-2 top-2 z-10">
                    <WishlistButton
                      productId={prod.id}
                      productName={prod.name}
                      entityType="product"
                      item={{
                        productId: prod.id,
                        name: prod.name,
                        shopName: store?.name ?? "Local Shop",
                        category: prod.category,
                        price: prod.price,
                        imageUrl: prod.imageUrl,
                        sellerId: prod.storeId,
                        itemType: "product",
                      }}
                    />
                  </div>
                  <Link
                    to="/product/$productId"
                    params={{ productId: prod.id }}
                    className="flex h-full w-full items-center justify-center"
                  >
                    <SafeProductImage
                      src={prod.imageUrl}
                      productName={prod.name}
                      category={prod.category}
                      alt={prod.name}
                      className="h-full w-full object-contain transition-transform group-hover:scale-105"
                    />
                  </Link>
                </div>

                <div className="mt-2.5 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                    <Store className="h-3 w-3 text-slate-400" />
                    <span>{store?.name ?? "Local Shop"}</span>
                  </p>
                  <Link
                    to="/product/$productId"
                    params={{ productId: prod.id }}
                    className="block truncate text-xs font-bold text-slate-900 transition-colors hover:text-primary"
                  >
                    {prod.name}
                  </Link>
                  <p className="font-display text-sm font-black text-slate-900">₹{prod.price}</p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const added = cartConflictManager.addWithConflictCheck(
                      prod.storeId,
                      store?.name ?? "Local Shop",
                      {
                        id: prod.id,
                        name: prod.name,
                        unit: prod.unit,
                        price: prod.price,
                        stock: prod.stock,
                        imageUrl: prod.imageUrl,
                      },
                    );
                    if (added) {
                      toast.success(`Added ${prod.name} to cart`);
                    }
                  }}
                  className="w-full rounded-xl border border-primary/20 bg-primary/5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Neighborhood Assurance Strip: 4 pillar trust elements.
 */
function NeighborhoodAssurance() {
  return (
    <div className="mt-12 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-purple-50 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">Verified Local Stores</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
              Direct from your neighborhood artisans and shopkeepers you trust.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">⚡ Hyperlocal Speed</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
              Packed fresh and delivered directly in 30-45 minutes.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">100% Genuine Quality</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
              Authentic products covered by LocalShore neighborhood guarantee.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <BadgePercent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">True In-Store Prices</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
              Exact store catalog pricing with no hidden markups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty Wishlist State
 */
function WishlistEmptyState() {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-2xs">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-purple-50 text-primary">
        <Heart className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-slate-900">Your wishlist is empty</h2>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
        Save products and neighborhood shops to keep track of prices, discover local products, and order whenever you're ready.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          Explore Neighborhood Stores
        </Link>
        <Link
          to="/"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Browse All Categories
        </Link>
      </div>
    </div>
  );
}

/**
 * Signed-out state
 */
function SignedOutState() {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-2xs">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-purple-50 text-primary">
        <Heart className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-xl font-bold text-slate-900">Sign in to view your wishlist</h2>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
        Keep your favorite neighborhood items and shops synced across devices, and receive instant alerts when prices drop.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/auth"
          search={{ redirect: "/wishlist" }}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          Sign In / Create Account
        </Link>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function WishlistLoadingSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    </div>
  );
}

/**
 * Error State
 */
function WishlistErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-2xs">
      <Heart className="mx-auto h-10 w-10 text-rose-500" />
      <h2 className="mt-4 font-display text-lg font-bold text-slate-900">Wishlist could not be loaded</h2>
      <p className="mt-1 text-xs text-slate-500">
        There was an issue connecting to the store catalog. Please check your network and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  );
}
