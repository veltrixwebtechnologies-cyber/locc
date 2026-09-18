import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  CalendarDays,
  Copy,
  MapPin,
  ShoppingBag,
  Sparkles,
  Utensils,
  Shirt,
} from "lucide-react";

const fallbackOffers = [
  {
    title: "Up to 40% Off\nat Local Shops",
    description: "Support local. Shop local. Save more.",
    validity: "Valid till 31 Dec",
    action: "Explore shops",
    category: "all-shops",
    icon: ShoppingBag,
    image: "/marketplace-ads/groceries-hero.png",
    accent: "#7c3aed",
    coupon: "LOCAL40",
  },
  {
    title: "Fresh Groceries\nat Best Prices",
    description: "Daily essentials, better value.",
    validity: "Fresh picks nearby",
    action: "Shop groceries",
    category: "grocery",
    icon: ShoppingBag,
    image: "/marketplace-ads/groceries-hero.png",
    accent: "#16a34a",
    coupon: "FRESH20",
  },
  {
    title: "Restaurant Offers\nYou’ll Love",
    description: "Great food. Great local vibes.",
    validity: "Valid till 31 Dec",
    action: "Order now",
    category: "restaurants",
    icon: Utensils,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=420&q=80",
    accent: "#8b5cf6",
    coupon: "DINE100",
  },
  {
    title: "Trendy Fashion\nUp to 50% Off",
    description: "Look good. Feel local.",
    validity: "Valid till 31 Dec",
    action: "Shop fashion",
    category: "fashion",
    icon: Shirt,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=420&q=80",
    accent: "#ec4899",
    coupon: "STYLE50",
  },
];

const iconByCategory = { restaurants: Utensils, fashion: Shirt } as const;

function resolveImage(imageUrl: string) {
  if (/^(https?:|data:|blob:)/i.test(imageUrl) || imageUrl.startsWith("/")) return imageUrl;
  return supabase.storage.from("banner-images").getPublicUrl(imageUrl).data.publicUrl;
}

export function LocalShoreOffers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const offersQuery = useQuery({
    queryKey: ["localshore-offer-cards", "shopper"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("localshore_offer_cards").select("*").order("sort_order").order("created_at");
      if (error) return fallbackOffers;
      return data.map((offer: any) => ({ ...offer, image: resolveImage(offer.image_url), icon: iconByCategory[offer.category as keyof typeof iconByCategory] || ShoppingBag }));
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });
  const offers = offersQuery.data ?? fallbackOffers;

  const copyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <section className="relative mx-3 mt-8 overflow-hidden rounded-[28px] bg-[#e9ddff] px-4 py-6 sm:mx-5 sm:px-8 md:mx-8 md:px-12 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[radial-gradient(circle_at_7px_0,#fff_7px,transparent_8px)] [background-size:14px_14px] opacity-90" />
      <div className="relative z-10 mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5421a7] sm:text-sm">
            <MapPin className="h-4 w-4 fill-[#5421a7]/10" /> LocalShore Specials
          </p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-[#202144] sm:text-3xl">
            Offers for You
          </h2>
          <p className="mt-1 text-xs font-medium text-[#5d567a] sm:text-sm">
            Discover local shops, great deals and more — all in one place.
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#7c3aed]">
            Coupon codes available
          </p>
        </div>
        <Sparkles className="hidden h-8 w-8 text-[#8b5cf6] sm:block" />
      </div>

      <div className="relative z-10 grid min-w-0 grid-cols-1 gap-3 pb-1 sm:grid-cols-2 2xl:grid-cols-4">
        {offers.map((offer) => {
          const Icon = offer.icon;
          return (
            <article
              key={offer.title}
              className="relative min-h-[240px] min-w-0 overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_10px_24px_rgba(75,42,145,0.08)] backdrop-blur-sm"
            >
              <div className="relative z-10 flex w-[72%] min-w-0 flex-col items-start [overflow-wrap:anywhere] sm:w-[68%]">
                <div
                  className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-[#f1e8ff]"
                  style={{ color: offer.accent }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="whitespace-pre-line font-display text-base font-extrabold leading-tight text-[#202144]">
                  {offer.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#70698b]">{offer.description}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#4b4568]">
                  <CalendarDays className="h-3 w-3 shrink-0" /> {offer.validity}
                </p>
                <button
                  type="button"
                  onClick={() => void copyCoupon(offer.coupon)}
                  className="mt-2 inline-flex min-h-11 max-w-full items-center gap-2 rounded-md border border-dashed border-[#9b7ad9] bg-[#f5efff] px-3 py-2 text-xs font-black tracking-wider text-[#5421a7] transition hover:bg-[#5421a7] hover:text-white"
                  aria-label={`Copy coupon code ${offer.coupon}`}
                >
                  <span>{copiedCode === offer.coupon ? "COPIED" : offer.coupon}</span>
                  <Copy className="h-3 w-3 shrink-0" />
                </button>
                <Link
                  to="/search"
                  search={{ category: offer.category, q: undefined }}
                  className="mt-3 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-[#5421a7] shadow-sm hover:bg-[#5421a7] hover:text-white"
                >
                  <span>{offer.action}</span> <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              </div>
              <img
                src={offer.image}
                alt=""
                loading="lazy"
                className="pointer-events-none absolute bottom-0 right-0 h-[78%] w-[42%] object-cover object-center [mask-image:linear-gradient(to_right,transparent,black_45%)]"
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
