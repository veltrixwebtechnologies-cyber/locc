import { ChevronRight, PackageSearch, Flame, TrendingUp, UsersRound, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { deliveryCategories } from "@/lib/mock-data";
import { resolveProductImageUrl, type MerchandisingProduct } from "@/lib/merchandising";
import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { SafeProductImage } from "@/lib/image-utils";

const browseGroups = [
  { label: "Fresh & Daily Needs", category: "fresh" },
  { label: "Home & Kitchen", category: "home" },
  { label: "Beauty & Personal Care", category: "personal" },
  { label: "Electronics & Accessories", category: "electronics" },
  { label: "Fashion & Footwear", category: "fashion" },
  { label: "Stationery & Office", category: "stationery" },
  { label: "Snacks & Beverages", category: "snacks" },
];

const frequentSearches = [
  { title: "Fresh groceries", category: "fresh" },
  { title: "Home essentials", category: "home" },
  { title: "Personal care", category: "personal" },
];

function categoryImage(category: string) {
  return deliveryCategories.find((item) => item.id === category)?.imageUrl;
}

export function MarketplaceDiscovery({ products }: { products: MerchandisingProduct[] }) {
  const featured = products.slice(0, 3);

  return (
    <section className="mt-6 px-5 md:px-8">
      <div className="overflow-hidden rounded-2xl border border-[#ead9a8] bg-card shadow-sm">
        <div className="grid lg:grid-cols-[1fr_250px]">
          <div className="p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Discover nearby
                </p>
                <h2 className="font-display text-lg font-bold text-foreground">
                  Frequently searched
                </h2>
              </div>
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {frequentSearches.map((item, index) => {
                const product = featured[index];
                const image = product?.image_url || categoryImage(item.category);
                return (
                  <DiscoveryProductCard
                    key={item.category}
                    item={item}
                    product={product}
                    image={image}
                    to={product ? "/product/$productId" : "/"}
                    {...(product
                      ? { params: { productId: product.id } }
                      : { search: { category: item.category, q: undefined } })}
                    className="group overflow-hidden rounded-xl border border-[#ead9a8] bg-background transition-all hover:-translate-y-0.5 hover:border-[#d9bd70] hover:shadow-md"
                  />
                );
              })}
            </div>
          </div>

          <Link
            to="/"
            search={{ category: "fresh", q: undefined }}
            className="m-4 flex min-h-44 flex-col justify-between rounded-xl bg-gradient-to-br from-[var(--orchid-deep)] via-[var(--orchid)] to-[var(--orchid-light)] p-5 text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            <div>
              <p className="text-xs font-medium text-primary-foreground/80">
                Trusted sellers near you
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold leading-tight">
                Discover local picks
              </h3>
              <p className="mt-2 text-xs leading-5 text-primary-foreground/80">
                Fresh products, quick delivery, and neighborhood stores you can trust.
              </p>
            </div>
            <span className="mt-5 inline-flex w-fit rounded-full bg-background px-4 py-2 text-xs font-bold text-foreground">
              View products
            </span>
          </Link>
        </div>
      </div>
      <SocialShoppingStrip />
    </section>
  );
}

function SocialShoppingStrip() {
  const reduceMotion = useReducedMotion();
  const signals = [
    { icon: TrendingUp, label: "Trending now", detail: "Fresh picks shoppers are exploring" },
    { icon: UsersRound, label: "Popular near you", detail: "Loved by local customers" },
    { icon: Zap, label: "Just added", detail: "New products from nearby sellers" },
  ];

  return (
    <m.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Social shopping highlights"
    >
      {signals.map(({ icon: Icon, label, detail }) => (
        <div
          key={label}
          className="flex min-w-[220px] items-center gap-2.5 rounded-full border border-[#ead9a8] bg-card px-3 py-2"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-foreground">{label}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{detail}</span>
          </span>
          <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
        </div>
      ))}
    </m.div>
  );
}

function DiscoveryProductCard({
  item,
  product,
  image,
  ...linkProps
}: {
  item: { title: string };
  product?: MerchandisingProduct;
  image?: string | null;
  to: "/product/$productId" | "/";
  params?: { productId: string };
  search?: { category: string; q?: undefined };
  className?: string;
}) {
  const [imageUrl, setImageUrl] = useState(image ?? "");

  useEffect(() => {
    let mounted = true;
    if (product?.image_url && !/^(https?:|data:)/i.test(product.image_url)) {
      void resolveProductImageUrl(product.image_url).then((url) => {
        if (mounted && url) setImageUrl(url);
      });
    }
    return () => {
      mounted = false;
    };
  }, [product?.image_url]);

  const sellingPrice = product
    ? Number(product.discount_price ?? product.selling_price ?? 0)
    : null;

  return (
    <Link
      {...linkProps}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#ead9a8] bg-white p-3.5 shadow-xs transition duration-300 hover:border-[#d9bd70] hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 p-2 flex items-center justify-center border border-[#ead9a8]/40">
        <SafeProductImage
          src={imageUrl}
          productName={product?.name ?? item.title}
          category={product?.category}
          alt={product?.name ?? item.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 flex flex-col justify-between flex-1">
        <h3 className="line-clamp-1 text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
          {product?.name ?? item.title}
        </h3>
        {sellingPrice !== null && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-black text-slate-900">₹{sellingPrice}</span>
          </div>
        )}
        <p className="mt-0.5 text-xs font-black text-purple-700">Best Pick</p>
      </div>
    </Link>
  );
}
