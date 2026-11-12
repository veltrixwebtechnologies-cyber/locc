import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Users, Store, Compass } from "lucide-react";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { SocialCommercePostCard } from "@/components/social-commerce/social-commerce-post-card";
import { getSocialPostsForLocation } from "@/lib/social-feed-data";
import { useDeliveryLocation } from "@/lib/location-store";
import { useFollowedShopIds } from "@/lib/following-store";

export const Route = createFileRoute("/following")({
  component: FollowingPage,
});

const FOLLOWING_FILTERS = [
  { id: "all", label: "All Updates" },
  { id: "new", label: "New Arrivals" },
  { id: "offers", label: "Offers" },
  { id: "restocks", label: "Restocks" },
];

function FollowingPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [deliveryLocation] = useDeliveryLocation();
  const followedShopIds = useFollowedShopIds();

  const allPosts = useMemo(
    () => getSocialPostsForLocation(deliveryLocation),
    [deliveryLocation],
  );

  const followedPosts = useMemo(() => {
    return allPosts.filter((p) => followedShopIds.includes(p.shopId));
  }, [allPosts, followedShopIds]);

  const filteredPosts = useMemo(() => {
    switch (activeFilter) {
      case "new":
        return followedPosts.filter(
          (p) =>
            p.badgeTag === "Freshly Baked" ||
            p.badgeTag === "New Arrival" ||
            p.hashtags.some((h) => h.toLowerCase().includes("new")),
        );
      case "offers":
        return followedPosts.filter(
          (p) =>
            p.category === "deals" ||
            p.taggedProducts.some((tp) => tp.discountPrice !== undefined),
        );
      case "restocks":
        return followedPosts.filter(
          (p) =>
            p.badgeTag === "Restocked" ||
            p.description.toLowerCase().includes("restock"),
        );
      default:
        return followedPosts;
    }
  }, [followedPosts, activeFilter]);

  return (
    <SocialCommerceShell>
      <div className="space-y-6">
        {/* ── Header: Following ── */}
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8B2FC9]/10 text-[#8B2FC9]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                  Following
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Latest updates, offers and new arrivals from {followedShopIds.length} shops you follow.
                </p>
              </div>
            </div>
            <Link
              to="/"
              className="text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] flex items-center gap-1 hidden sm:flex"
            >
              <span>Explore More</span>
              <Compass className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Filter Pills */}
          {followedPosts.length > 0 && (
            <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#F5EDFD]">
              {FOLLOWING_FILTERS.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id)}
                    className={`shrink-0 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#8B2FC9] text-white shadow-[0_4px_14px_rgba(168, 56, 189,0.35)]"
                        : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] border border-[#E2E8F0]"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Following Feed Posts ── */}
        <div className="space-y-5">
          {filteredPosts.map((post) => (
            <SocialCommercePostCard key={post.id} post={post} />
          ))}

          {followedPosts.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center border border-[#E2E8F0]">
              <Store className="mx-auto h-12 w-12 text-[#8B2FC9]/60 mb-3" />
              <h3 className="text-base font-bold text-[#0F172A]">You're not following any shops yet</h3>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-md mx-auto">
                Follow local bakeries, organic markets, and boutique clothing shops to receive their latest arrivals, special offers, and daily deals right here.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#8B2FC9] hover:bg-[#7812B8] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition active:scale-95"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Neighborhood Shops</span>
              </Link>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center border border-[#E2E8F0]">
              <Store className="mx-auto h-10 w-10 text-[#8B2FC9]/60 mb-2" />
              <h3 className="text-base font-bold text-[#0F172A]">No updates in this filter</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Check other filter options or browse all updates from your followed shops.
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="mt-4 rounded-full bg-[#8B2FC9] px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                View All Updates
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </SocialCommerceShell>
  );
}
