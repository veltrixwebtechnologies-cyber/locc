import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Zap,
  Tag,
  ShieldCheck,
  Truck,
  Sparkles,
  Store as StoreIcon,
  ChevronLeft,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { WishlistButton } from "@/components/wishlist-button";
import { CompareButton } from "@/components/compare-button";
import { supabase } from "@/integrations/supabase/client";
import {
  recordProductEvent,
  recordRecentProductView,
  type MerchandisingProduct,
} from "@/lib/merchandising";
import { useAuth } from "@/lib/auth-store";
import { cartStore, useCart } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { flyProductToCart } from "@/lib/fly-to-cart";
import { toast } from "sonner";
import { m } from "motion/react";
import { SkeletonCard } from "@/components/motion/presets";
import { productsByStore, stores, Store } from "@/lib/mock-data";
import { ProductThumb } from "@/components/product-thumb";

export const Route = createFileRoute("/product/$productId")({ component: ProductPage });

function ProductPage() {
  const { productId } = Route.useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const cart = useCart();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [showDetails, setShowDetails] = useState(true);

  // Fetch current product
  const product = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("public_merchandising_products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) {
        const localProduct = Object.values(productsByStore)
          .flat()
          .find((candidate) => candidate.id === productId);
        if (!localProduct) throw error;
        const localStore = stores.find((store) => store.id === localProduct.storeId);
        const fallback: MerchandisingProduct = {
          id: localProduct.id,
          seller_id: localProduct.storeId,
          name: localProduct.name,
          brand: null,
          brand_id: null,
          brand_name: null,
          category: localProduct.category,
          selling_price: localProduct.price,
          mrp: Math.round(localProduct.price * 1.1),
          discount_price: localProduct.price,
          discount_starts_at: null,
          discount_ends_at: null,
          clearance: false,
          stock: localProduct.stock ?? 20,
          image_url: localProduct.imageUrl ?? null,
          created_at: new Date().toISOString(),
          average_rating: localStore?.rating ?? 4.7,
          review_count: 34,
          shop_name: localStore?.name ?? "Anand Kirana Store",
        };
        void recordProductEvent(productId, "view");
        return fallback;
      }
      void recordProductEvent(productId, "view");
      void recordRecentProductView(productId);
      return data as MerchandisingProduct;
    },
  });

  // Fetch reviews
  const reviews = useQuery({
    queryKey: ["product-reviews", productId],
    enabled: Boolean(product.data),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("id,rating,title,body,created_at,user_id")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Delivered product check for reviews
  const deliveredProductOrder = useQuery({
    queryKey: ["delivered-product-order", auth.id, productId],
    enabled: Boolean(auth.id && product.data),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("id,status,order_items(product_id)")
        .eq("user_id", auth.id)
        .eq("status", "delivered");
      if (error) throw error;
      return (
        (data ?? []).find((order: any) =>
          (order.order_items ?? []).some((line: any) => line.product_id === productId),
        ) ?? null
      );
    },
  });

  const existingReview = useQuery({
    queryKey: ["my-product-review", auth.id, productId],
    enabled: Boolean(auth.id && product.data),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", auth.id)
        .limit(1);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Similar Products (same category / related)
  const similarProducts = useQuery({
    queryKey: ["similar-products", productId, product.data?.category],
    enabled: Boolean(product.data),
    queryFn: async () => {
      const current = product.data as MerchandisingProduct;
      const { data, error } = await (supabase as any)
        .from("public_merchandising_products")
        .select("*")
        .neq("id", productId)
        .eq("category", current.category)
        .gt("stock", 0)
        .limit(12);

      if (!error && data && data.length >= 3) {
        return data as MerchandisingProduct[];
      }

      // Local fallback with varied names for demonstration
      const localProducts = Object.values(productsByStore)
        .flat()
        .filter((candidate) => candidate.id !== productId)
        .slice(0, 10);

      return localProducts.map((candidate, idx) => {
        const store = stores.find((entry) => entry.id === candidate.storeId);
        const mrp = Math.round(candidate.price * 1.1);
        return {
          id: candidate.id,
          seller_id: candidate.storeId,
          name: candidate.name,
          brand: candidate.category,
          brand_id: null,
          brand_name: "LocalShore",
          category: candidate.category || current.category || "Grocery",
          selling_price: candidate.price,
          mrp: mrp,
          discount_price: candidate.price,
          discount_starts_at: null,
          discount_ends_at: null,
          clearance: false,
          stock: candidate.stock ?? 25,
          image_url: candidate.imageUrl ?? null,
          created_at: new Date().toISOString(),
          average_rating: store?.rating ?? 4.6,
          review_count: 12 + idx * 5,
          shop_name: store?.name ?? "Anand Kirana Store",
        } satisfies MerchandisingProduct;
      });
    },
  });

  // Top Category Products
  const topCategoryProducts = useQuery({
    queryKey: ["top-category-products", product.data?.category],
    enabled: Boolean(product.data),
    queryFn: async () => {
      const current = product.data as MerchandisingProduct;
      const { data, error } = await (supabase as any)
        .from("public_merchandising_products")
        .select("*")
        .gt("stock", 0)
        .limit(10);

      if (!error && data && data.length > 0) {
        return data as MerchandisingProduct[];
      }

      const allLocal = Object.values(productsByStore).flat();
      return allLocal.slice(0, 10).map((candidate, idx) => {
        const store = stores.find((entry) => entry.id === candidate.storeId);
        return {
          id: candidate.id,
          seller_id: candidate.storeId,
          name: candidate.name,
          brand: null,
          brand_id: null,
          brand_name: null,
          category: candidate.category,
          selling_price: candidate.price,
          mrp: Math.round(candidate.price * 1.15),
          discount_price: candidate.price,
          discount_starts_at: null,
          discount_ends_at: null,
          clearance: false,
          stock: candidate.stock ?? 20,
          image_url: candidate.imageUrl ?? null,
          created_at: new Date().toISOString(),
          average_rating: store?.rating ?? 4.8,
          review_count: 28 + idx * 4,
          shop_name: store?.name ?? "Local Seller",
        } satisfies MerchandisingProduct;
      });
    },
  });

  const canReview = Boolean(
    auth.id && deliveredProductOrder.data && !existingReview.data?.length,
  );

  const submitReview = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("Sign in to review this product.");
      if (!deliveredProductOrder.data)
        throw new Error("You can review this product after it has been delivered.");
      if (existingReview.data?.length)
        throw new Error("You have already reviewed this product.");
      if (!body.trim()) throw new Error("Write a short review first.");
      const { error } = await (supabase as any).from("reviews").insert({
        product_id: productId,
        user_id: session.session.user.id,
        rating,
        body: body.trim(),
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      toast.success("Review submitted for approval");
      void queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      void queryClient.invalidateQueries({ queryKey: ["my-product-review", auth.id, productId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (product.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <SkeletonCard className="h-[420px] rounded-2xl" />
            <div className="space-y-4">
              <div className="premium-skeleton h-4 w-1/3 rounded" />
              <div className="premium-skeleton h-10 w-4/5 rounded-lg" />
              <div className="premium-skeleton h-6 w-1/4 rounded" />
              <div className="premium-skeleton h-12 w-2/5 rounded-xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (product.error || !product.data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Product unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested item is temporarily out of stock or unavailable.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm"
            to="/"
            search={{ category: undefined, q: undefined }}
          >
            <ArrowLeft className="h-4 w-4" /> Return to Marketplace
          </Link>
        </div>
      </AppShell>
    );
  }

  const item = product.data;
  const currentPrice = Number(item.discount_price ?? item.selling_price);
  const originalMrp = Number(item.mrp || currentPrice * 1.1);
  const discountPercent =
    originalMrp > currentPrice
      ? Math.round(((originalMrp - currentPrice) / originalMrp) * 100)
      : 0;

  const itemQtyInCart = cart.lines.find((line) => line.productId === item.id)?.qty ?? 0;

  return (
    <AppShell>
      <div className="bg-background min-h-screen pb-16">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="border-b border-border/60 bg-muted/30">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-muted-foreground md:px-8">
            <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <Link
              to="/"
              search={{ category: item.category ?? undefined, q: undefined }}
              className="hover:text-primary capitalize transition-colors"
            >
              {item.category || "Soft Drinks"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="truncate font-medium text-foreground">{item.name}</span>
          </div>
        </nav>

        {/* Main Product Hero Grid */}
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            {/* Left Column: Gallery & Product Details Accordion */}
            <div className="space-y-8">
              <ProductGallery item={item} discountPercent={discountPercent} />

              {/* Product Details Section (Blinkit style accordion) */}
              <div className="rounded-2xl border border-[#ead9a8] bg-card p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h2 className="font-display text-lg font-bold text-foreground">
                    Product Details
                  </h2>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                      showDetails ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDetails && (
                  <div className="mt-4 space-y-4 text-xs text-foreground/90 border-t border-border/60 pt-4">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Beverage / Item Type
                        </span>
                        <span className="font-medium text-sm text-foreground">
                          {item.category || "Soft Drink"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Net Quantity
                        </span>
                        <span className="font-medium text-sm text-foreground">750 ml</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Brand
                        </span>
                        <span className="font-medium text-sm text-foreground">
                          {item.brand_name || item.shop_name || "LocalShore Partner"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          FSSAI Lic. No.
                        </span>
                        <span className="font-medium text-sm font-mono text-foreground">
                          10012022000251
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Key Features & Storage
                      </span>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Keep chilled for maximum crisp refreshment. Store in a cool, dry place away from direct sunlight. Serve cold.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toast.info("Full manufacturer specifications available on packaging.")}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        View more details <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Title, Price, Add to Cart & Why Shop from Us */}
            <div className="space-y-6">
              {/* Product Info & Pricing */}
              <div className="rounded-2xl border border-[#ead9a8] bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      ⚡ 10-15 MINS DELIVERY
                    </span>
                    <h1 className="mt-3 font-display text-2xl md:text-3xl font-bold leading-tight text-foreground">
                      {item.name}
                    </h1>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Sold by <strong className="text-foreground font-semibold">{item.shop_name}</strong>
                    </p>
                  </div>
                  <WishlistButton
                    productId={item.id}
                    productName={item.name}
                    item={{
                      productId: item.id,
                      name: item.name,
                      shopName: item.shop_name,
                      category: item.category ?? "Other",
                      price: currentPrice,
                      imageUrl: item.image_url ?? undefined,
                      sellerId: item.seller_id,
                    }}
                  />
                </div>

                {/* Pack Size Pill */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-lg border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    750 ml
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({item.stock > 0 ? `In Stock (${item.stock} left)` : "Out of stock"})
                  </span>
                </div>

                {/* Price Block */}
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-bold text-foreground">
                    ₹{currentPrice}
                  </span>
                  {originalMrp > currentPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      MRP ₹{originalMrp}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  (Inclusive of all taxes)
                </p>

                {/* Primary Add to Cart Button */}
                <div className="mt-6">
                  {itemQtyInCart === 0 ? (
                    <button
                      type="button"
                      data-product-id={item.id}
                      onClick={() => {
                        void recordProductEvent(item.id, "add_to_cart");
                        flyProductToCart(item.id);
                        cartStore.add(item.seller_id, item.shop_name, {
                          id: item.id,
                          name: item.name,
                          unit: item.category ?? "750 ml",
                          price: currentPrice,
                          stock: item.stock,
                        });
                        toast.success(`Added ${item.name} to cart`);
                      }}
                      className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] py-3.5 text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      Add to cart
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground">Quantity in cart:</span>
                      <QtyStepper
                        qty={itemQtyInCart}
                        max={item.stock}
                        onAdd={() => {
                          flyProductToCart(item.id);
                          cartStore.add(item.seller_id, item.shop_name, {
                            id: item.id,
                            name: item.name,
                            unit: item.category ?? "750 ml",
                            price: currentPrice,
                            stock: item.stock,
                          });
                        }}
                        onChange={(nextQuantity) => cartStore.setQty(item.id, nextQuantity)}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <strong className="font-semibold text-foreground">{Number(item.average_rating || 4.7).toFixed(1)}</strong> ({item.review_count || 34} reviews)
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/store/$storeId"
                      params={{ storeId: item.seller_id }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <StoreIcon className="h-3.5 w-3.5" /> Visit store
                    </Link>
                    <CompareButton productId={item.id} />
                  </div>
                </div>
              </div>

              {/* "Why shop from LocalShore?" Feature Box */}
              <div className="rounded-2xl border border-[#ead9a8] bg-card p-5 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-foreground">
                  Why shop from LocalShore?
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Round The Clock Delivery</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Get items delivered to your doorstep from local dark stores near you, whenever you need them.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Best Prices & Offers</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Best price destination with offers directly from local merchants & manufacturers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Wide Assortment</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Choose from 30,000+ verified products across food, personal care, household & more.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Similar Products Horizontal Carousel Strip */}
          <section className="mt-12">
            <HorizontalProductStrip
              title="Similar products"
              products={similarProducts.data ?? []}
              loading={similarProducts.isLoading}
            />
          </section>

          {/* Section 2: Top Products in Category Horizontal Carousel Strip */}
          <section className="mt-10">
            <HorizontalProductStrip
              title={`Top products in ${item.category || "this category"}`}
              products={topCategoryProducts.data ?? []}
              loading={topCategoryProducts.isLoading}
            />
          </section>

          {/* Section 3: Suggested Shops Horizontal Strip */}
          <section className="mt-10">
            <SuggestedShopsStrip category={item.category} />
          </section>

          {/* Customer Reviews Section */}
          <section className="mt-12 rounded-2xl border border-[#ead9a8] bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-foreground">Customer Reviews</h2>
            {!auth.id ? (
              <p className="mt-2 text-xs text-muted-foreground">Sign in to write a review for this product.</p>
            ) : deliveredProductOrder.isLoading || existingReview.isLoading ? (
              <p className="mt-2 text-xs text-muted-foreground">Checking your order status…</p>
            ) : existingReview.data?.length ? (
              <p className="mt-2 text-xs text-muted-foreground">You have already submitted a review for this product.</p>
            ) : !canReview ? (
              <p className="mt-2 text-xs text-muted-foreground">Purchase and receive this product to write a review.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:max-w-xl">
                <label className="text-xs font-medium text-foreground">
                  Your rating:
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="ml-2 rounded-md border bg-background px-2.5 py-1 text-xs font-semibold"
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} Stars
                      </option>
                    ))}
                  </select>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe your experience with this item..."
                  className="min-h-24 rounded-xl border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  disabled={submitReview.isPending}
                  onClick={() => submitReview.mutate()}
                  className="w-fit rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submitReview.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}

            <div className="mt-6 space-y-3.5 border-t border-border/60 pt-4">
              {reviews.data?.map((review: any) => (
                <article key={review.id} className="border-b border-border/40 pb-3 last:border-0">
                  <div className="flex items-center gap-1 text-amber-400">
                    {"★".repeat(review.rating)}
                    <span className="text-xs font-bold text-foreground ml-2">{review.title || `${review.rating}.0`}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/90 leading-relaxed">{review.body}</p>
                </article>
              ))}
              {!reviews.data?.length && (
                <p className="text-xs text-muted-foreground">No approved customer reviews yet. Be the first to review!</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Gallery Component with Thumbnails                                          */
/* -------------------------------------------------------------------------- */
function ProductGallery({
  item,
  discountPercent,
}: {
  item: MerchandisingProduct;
  discountPercent: number;
}) {
  const mainImage = item.image_url || "";
  
  // Generate 4 representative product perspective thumbnails
  const thumbnails = [
    { label: "Front View", url: mainImage },
    {
      label: "Packaging",
      url: mainImage ? `${mainImage}&sat=-20` : "",
    },
    {
      label: "Nutrition Info",
      badge: "NUTRITION",
      url: mainImage,
    },
    {
      label: "FSSAI License",
      badge: "FSSAI 100120",
      url: mainImage,
    },
  ];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeImage = thumbnails[selectedIdx]?.url || mainImage;

  return (
    <div className="grid gap-4 sm:grid-cols-[90px_minmax(0,1fr)] sm:items-start">
      {/* Thumbnail Selector Column */}
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col [scrollbar-width:none]">
        {thumbnails.map((thumb, index) => (
          <button
            key={`${thumb.label}-${index}`}
            type="button"
            onClick={() => setSelectedIdx(index)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white p-2 transition-all ${
              selectedIdx === index
                ? "border-emerald-600 ring-2 ring-emerald-600/30 shadow-md"
                : "border-border/70 hover:border-emerald-500/60"
            }`}
          >
            <ProductThumb
              src={thumb.url || undefined}
              alt={`${item.name} ${thumb.label}`}
              category="grocery"
              fit="contain"
            />
            {thumb.badge && (
              <span className="absolute bottom-1 left-1 right-1 rounded bg-black/75 text-[8px] font-bold text-white truncate text-center py-0.5">
                {thumb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Big Main Image Container */}
      <m.div
        layoutId={`product-image-${item.id}`}
        className="relative order-1 flex min-h-[380px] md:min-h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-[#ead9a8] bg-white p-8 shadow-sm sm:order-2"
      >
        {discountPercent > 0 && (
          <span className="absolute left-4 top-4 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            {discountPercent}% OFF
          </span>
        )}
        
        <ProductThumb
          src={activeImage}
          alt={item.name}
          category="grocery"
          size="lg"
          fit="contain"
        />

        <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-3.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-xs backdrop-blur">
          {thumbnails[selectedIdx]?.label || "Product image"}
        </span>
      </m.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Horizontal Product Strip Component (Blinkit Card Design)                   */
/* -------------------------------------------------------------------------- */
function HorizontalProductStrip({
  title,
  products,
  loading = false,
}: {
  title: string;
  products: MerchandisingProduct[];
  loading?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const amount = direction === "left" ? -320 : 320;
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-64 w-48 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-card text-foreground hover:bg-muted transition-colors shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-card text-foreground hover:bg-muted transition-colors shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {products.map((product) => (
          <BlinkitProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Blinkit Style Compact Product Card                                         */
/* -------------------------------------------------------------------------- */
function BlinkitProductCard({ product }: { product: MerchandisingProduct }) {
  const cart = useCart();
  const quantity = cart.lines.find((line) => line.productId === product.id)?.qty ?? 0;
  const currentPrice = Number(product.discount_price ?? product.selling_price);
  const mrp = Number(product.mrp || currentPrice * 1.1);
  const discount = mrp > currentPrice ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;

  return (
    <div
      data-product-id={product.id}
      className="group relative flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ead9a8] bg-card p-3 shadow-xs transition-all hover:border-emerald-500/60 hover:shadow-md"
    >
      {/* Product Image Frame */}
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        onClick={() => {
          void recordProductEvent(product.id, "view");
          void recordRecentProductView(product.id);
        }}
        className="relative block aspect-square w-full overflow-hidden rounded-xl bg-[#f8f8f8] p-2"
      >
        {/* Delivery Time Badge */}
        <span className="absolute left-2 top-2 z-10 rounded bg-background/95 px-1.5 py-0.5 text-[9px] font-bold text-foreground shadow-xs">
          ⚡ 8 MINS
        </span>

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute right-2 top-2 z-10 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
            {discount}% OFF
          </span>
        )}

        <ProductThumb
          src={product.image_url || undefined}
          alt={product.name}
          category="grocery"
          fit="contain"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="mt-2.5 flex flex-1 flex-col justify-between">
        <div>
          <Link
            to="/product/$productId"
            params={{ productId: product.id }}
            className="line-clamp-2 text-xs font-semibold text-foreground leading-tight group-hover:text-emerald-700 transition-colors"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-[10px] text-muted-foreground">750 ml</p>
        </div>

        {/* Price & Add Button */}
        <div className="mt-3 flex items-center justify-between gap-1">
          <div>
            <span className="font-mono text-sm font-bold text-foreground">₹{currentPrice}</span>
            {mrp > currentPrice && (
              <span className="block text-[10px] text-muted-foreground line-through">₹{mrp}</span>
            )}
          </div>

          <QtyStepper
            qty={quantity}
            max={product.stock ?? 20}
            onAdd={() => {
              void recordProductEvent(product.id, "add_to_cart");
              flyProductToCart(product.id);
              cartStore.add(product.seller_id, product.shop_name, {
                id: product.id,
                name: product.name,
                unit: product.category ?? "750 ml",
                price: currentPrice,
                stock: product.stock ?? 20,
              });
            }}
            onChange={(nextQty) => cartStore.setQty(product.id, nextQty)}
            addClassName="rounded-lg border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-700 hover:text-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Suggested Shops Horizontal Strip Component                                 */
/* -------------------------------------------------------------------------- */
function SuggestedShopsStrip({ category }: { category?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const amount = direction === "left" ? -320 : 320;
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Suggested shops near you
          </h2>
          <p className="text-xs text-muted-foreground">
            Top local stores selling {category || "grocery & daily essentials"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-card text-foreground hover:bg-muted transition-colors shadow-xs"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-card text-foreground hover:bg-muted transition-colors shadow-xs"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {stores.map((store) => (
          <ShopCardItem key={store.id} store={store} />
        ))}
      </div>
    </div>
  );
}

function ShopCardItem({ store }: { store: Store }) {
  return (
    <div className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ead9a8] bg-card p-3.5 shadow-xs transition-all hover:border-emerald-500/60 hover:shadow-md">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
        <img
          src={store.imageUrl}
          alt={store.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-xs backdrop-blur">
          Verified Local
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-between space-y-2">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {store.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{store.tagline}</p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {store.rating.toFixed(1)}
          </span>
          <span>{store.distanceKm.toFixed(1)} km</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">⚡ {store.etaMin} mins</span>
        </div>

        <Link
          to="/store/$storeId"
          params={{ storeId: store.id }}
          className="mt-2 w-full rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary hover:text-primary-foreground py-2 text-center text-xs font-bold text-primary transition-all block"
        >
          Visit shop
        </Link>
      </div>
    </div>
  );
}

