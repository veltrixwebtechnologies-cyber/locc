import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Campaign = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  offer: string;
  category?: string;
  query?: string;
  imageUrl: string;
  background: string;
  accent: string;
  imagePosition?: string;
};

const campaigns: Campaign[] = [
  {
    id: "fresh-local",
    eyebrow: "Fresh from local stores",
    title: "Daily essentials, picked nearby",
    description: "Produce, staples and dairy from approved neighborhood sellers.",
    action: "Shop fresh",
    offer: "Fresh picks every day",
    category: "fresh",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=82",
    background: "#f1ecff",
    accent: "#6d28d9",
  },
  {
    id: "quick-kitchen",
    eyebrow: "Quick kitchen",
    title: "Snacks and meals without the wait",
    description: "Find instant food, beverages and ready-to-cook favorites.",
    action: "Explore quick picks",
    offer: "Quick bites in minutes",
    category: "ready",
    imageUrl:
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=1200&q=82",
    background: "#fff2cc",
    accent: "#9a6500",
  },
  {
    id: "home-care",
    eyebrow: "Home care week",
    title: "Restock your home in a few taps",
    description: "Cleaning, personal care and everyday household essentials.",
    action: "Shop home care",
    offer: "Everyday value",
    category: "home",
    imageUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=82",
    background: "#e5f6ee",
    accent: "#087a55",
  },
  {
    id: "personal-care",
    eyebrow: "Beauty and personal care",
    title: "Everyday care, all in one place",
    description: "Skincare, grooming and personal essentials from trusted local stores.",
    action: "Explore personal care",
    offer: "Care essentials",
    category: "personal",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=82",
    background: "#ffeaf1",
    accent: "#be185d",
  },
  {
    id: "smart-electronics",
    eyebrow: "Smart essentials",
    title: "Tech upgrades for everyday life",
    description: "Useful accessories and small electronics delivered from nearby sellers.",
    action: "Shop electronics",
    offer: "Popular tech picks",
    category: "electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=82",
    background: "#e8f2ff",
    accent: "#1d4ed8",
    imagePosition: "center",
  },
  {
    id: "fashion-edit",
    eyebrow: "The local fashion edit",
    title: "Fresh styles from stores near you",
    description: "Discover clothing, accessories and seasonal favorites in one place.",
    action: "Explore fashion",
    offer: "New season styles",
    category: "fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=82",
    background: "#fff0e5",
    accent: "#c2410c",
    imagePosition: "center",
  },
];

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

function resolveBannerImage(imageUrl: string) {
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) return imageUrl;
  return supabase.storage.from("banner-images").getPublicUrl(imageUrl).data.publicUrl;
}

const campaignPalette = [
  { background: "#f1ecff", accent: "#6d28d9" },
  { background: "#fff2cc", accent: "#9a6500" },
  { background: "#e5f6ee", accent: "#087a55" },
  { background: "#ffeaf1", accent: "#be185d" },
  { background: "#e8f2ff", accent: "#1d4ed8" },
  { background: "#fff0e5", accent: "#c2410c" },
];

function categoryFromLink(link: string | null) {
  if (!link) return undefined;
  try {
    const parsed = new URL(link, "https://localshore.example");
    const queryCategory = parsed.searchParams.get("category");
    if (queryCategory) return queryCategory;
    const categoryMatch = parsed.pathname.match(/^\/category\/([^/]+)$/);
    return categoryMatch?.[1];
  } catch {
    return undefined;
  }
}

export function PromoCarousel() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const bannerQuery = useQuery({
    queryKey: ["homepage-banners"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("id,title,subtitle,image_url,link_url,sort_order,starts_at,ends_at")
        .eq("placement", "hero")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const now = Date.now();
      return ((data ?? []) as BannerRow[]).filter(
        (banner) =>
          (!banner.starts_at || new Date(banner.starts_at).getTime() <= now) &&
          (!banner.ends_at || new Date(banner.ends_at).getTime() > now),
      );
    },
    staleTime: 60_000,
  });
  const adminCampaigns: Campaign[] = (bannerQuery.data ?? []).map((banner, index) => {
    const palette = campaignPalette[index % campaignPalette.length];
    return {
      id: banner.id,
      eyebrow: "Featured on Local Shore",
      title: banner.title,
      description: banner.subtitle || "Discover this featured offer from Local Shore.",
      action: "Explore offer",
      offer: "Featured offer",
      category: categoryFromLink(banner.link_url),
      imageUrl: resolveBannerImage(banner.image_url),
      background: palette.background,
      accent: palette.accent,
    };
  });
  const visibleCampaigns = adminCampaigns.length ? adminCampaigns : campaigns;

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleCampaigns.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, visibleCampaigns.length]);

  useEffect(() => {
    if (activeIndex >= visibleCampaigns.length) setActiveIndex(0);
  }, [activeIndex, visibleCampaigns.length]);

  const show = (index: number) => {
    setActiveIndex((index + visibleCampaigns.length) % visibleCampaigns.length);
  };

  const campaign = visibleCampaigns[activeIndex] ?? visibleCampaigns[0];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="px-5 pb-3 md:px-8 md:pb-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") show(activeIndex - 1);
        if (event.key === "ArrowRight") show(activeIndex + 1);
      }}
    >
      <div className="group relative overflow-hidden rounded-xl bg-card shadow-md ring-1 ring-black/[0.06]">
        <AnimatePresence mode="wait" initial={false}>
          <m.article
            key={campaign.id}
            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -28 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="grid min-h-[208px] grid-cols-[1.08fr_0.92fr] md:min-h-[310px]"
            style={{ backgroundColor: campaign.background }}
          >
            <div className="relative z-[1] flex min-w-0 flex-col items-start justify-center px-5 py-8 md:px-12">
              <span
                className="mb-3 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold uppercase shadow-sm ring-1 ring-black/[0.04] md:text-[10px]"
                style={{ color: campaign.accent }}
              >
                {campaign.offer}
              </span>
              <p
                className="text-[10px] font-extrabold uppercase tracking-widest md:text-xs"
                style={{ color: campaign.accent }}
              >
                {campaign.eyebrow}
              </p>
              <h2 className="mt-2 max-w-xl font-display text-xl font-extrabold leading-tight text-foreground sm:text-2xl md:text-4xl">
                {campaign.title}
              </h2>
              <p className="mt-2 hidden max-w-lg text-sm leading-5 text-muted-foreground sm:block md:text-base">
                {campaign.description}
              </p>
              <Link
                to="/"
                search={{ category: campaign.category, q: campaign.query }}
                className="premium-button mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm md:px-5 md:py-2.5 md:text-sm"
                style={{ backgroundColor: campaign.accent }}
              >
                {campaign.action}
              </Link>
            </div>
            <div className="relative min-w-0 overflow-hidden">
              <m.img
                src={campaign.imageUrl}
                alt={campaign.title}
                initial={reduceMotion ? false : { scale: 1.04 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: campaign.imagePosition ?? "center" }}
                fetchPriority={activeIndex === 0 ? "high" : "auto"}
              />
              <div
                className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/10 to-transparent"
                aria-hidden
              />
              <div
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: campaign.accent }}
                aria-hidden
              />
            </div>
          </m.article>
        </AnimatePresence>

        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] text-white backdrop-blur-sm">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(visibleCampaigns.length).padStart(2, "0")}
        </span>

        <button
          type="button"
          aria-label="Previous promotion"
          onClick={() => show(activeIndex - 1)}
          className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground opacity-100 shadow-md transition-all hover:scale-105 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next promotion"
          onClick={() => show(activeIndex + 1)}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground opacity-100 shadow-md transition-all hover:scale-105 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
          {visibleCampaigns.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show promotion ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => show(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-foreground/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
