import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Sparkles,
  Gift,
  ArrowRight,
  ChevronRight,
  Trophy,
  Star,
  Clock,
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  Tag,
  Copy,
  Check,
  Store,
  ShoppingBag,
  X,
  Info,
  Percent,
  ChevronDown,
  Calendar,
  Filter,
} from "lucide-react";
import { m } from "motion/react";
import {
  REWARD_TIERS,
  REWARD_ACTIONS,
  REDEEM_OPTIONS,
  REWARD_CATEGORIES,
  SAMPLE_REWARD_HISTORY,
  SAMPLE_REWARDS_SUMMARY,
  type RewardTransaction,
  type RedeemOption,
} from "@/lib/rewards-data";

export const Route = createFileRoute("/rewards")({ component: RewardsPage });

const tierIcon = (tier: string) => {
  if (tier === "platinum") return "💎";
  if (tier === "gold") return "🥇";
  if (tier === "silver") return "🥈";
  return "🥉";
};

const txColor = (type: RewardTransaction["type"]) => {
  if (type === "earned" || type === "bonus" || type === "referral") return "text-emerald-700";
  if (type === "redeemed") return "text-[#981495]";
  return "text-slate-500";
};

const txSign = (type: RewardTransaction["type"]) => {
  if (type === "earned" || type === "bonus" || type === "referral") return "+";
  return "";
};

function RewardsPage() {
  const [summary, setSummary] = useState(SAMPLE_REWARDS_SUMMARY);
  const [history, setHistory] = useState(SAMPLE_REWARD_HISTORY);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedReward, setSelectedReward] = useState<RedeemOption | null>(null);
  const [unlockedCoupon, setUnlockedCoupon] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | RewardTransaction["type"]>("all");
  const [redeemedRewardIds, setRedeemedRewardIds] = useState<string[]>([]);

  const currentTier = REWARD_TIERS.find((t) => t.id === summary.currentTier)!;
  const nextTier = REWARD_TIERS.find((t) => t.id === summary.nextTier)!;
  const progress =
    ((summary.currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) *
    100;

  // Filter rewards by category
  const filteredRewards = useMemo(() => {
    if (selectedCategory === "all") return REDEEM_OPTIONS;
    return REDEEM_OPTIONS.filter((r) => r.category === selectedCategory);
  }, [selectedCategory]);

  // Affordable rewards based on balance
  const affordableRewards = useMemo(() => {
    return REDEEM_OPTIONS.filter((r) => r.pointsCost <= summary.currentPoints);
  }, [summary.currentPoints]);

  // Local shop specific rewards
  const localShopRewards = useMemo(() => {
    return REDEEM_OPTIONS.filter((r) => r.category === "local_shops" || r.type === "shop_offer");
  }, []);

  const handleRedeemClick = (reward: RedeemOption) => {
    setSelectedReward(reward);
    setUnlockedCoupon(null);
    setCopiedCoupon(false);
  };

  const handleConfirmRedeem = () => {
    if (!selectedReward || summary.currentPoints < selectedReward.pointsCost) return;

    const couponCode = `LOCAL-${selectedReward.value.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    // Update state
    setSummary((prev) => ({
      ...prev,
      currentPoints: prev.currentPoints - selectedReward.pointsCost,
    }));

    setRedeemedRewardIds((prev) => [...prev, selectedReward.id]);

    const newTx: RewardTransaction = {
      id: `rt_${Date.now()}`,
      type: "redeemed",
      points: -selectedReward.pointsCost,
      description: `${selectedReward.title} (${couponCode})`,
      date: new Date().toISOString().split("T")[0],
    };

    setHistory((prev) => [newTx, ...prev]);
    setUnlockedCoupon(couponCode);
  };

  const handleCopyCoupon = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredHistory =
    historyFilter === "all"
      ? history
      : history.filter((t) => t.type === historyFilter);

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FAF8F5] pb-24 pt-4 sm:pt-6">
        {/* Responsive Content Container */}
        <div className="mx-auto max-w-[1240px] px-3 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500">
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="hover:text-[#981495] transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-900 font-extrabold">LocalShore Rewards Marketplace</span>
          </nav>

          {/* ── EXPIRING POINTS Contextual Alert Banner ── */}
          {summary.expiringPoints > 0 && (
            <div className="mb-5 rounded-2xl bg-amber-50 border-2 border-amber-300/80 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  ⏳
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    {summary.expiringPoints} SharePoints are expiring on {summary.expiringDate}
                  </p>
                  <p className="text-[11px] font-semibold text-amber-900/80 mt-0.5">
                    Redeem them now for local shop vouchers and discount passes before they reset.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("popular-rewards")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-amber-300 px-4 py-2 text-xs font-black transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <span>Use Points Now</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}

          {/* ── COMPACT PREMIUM HERO ── */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-8 shadow-xl border-2 border-amber-300/70 mb-6">
            {/* Background Accent Gradients */}
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#981495]/30 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Hero Title & Balance */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-amber-300 border border-amber-300/30">
                  <Sparkles className="h-4 w-4 fill-amber-300" />
                  <span>LOCALSHORE REWARDS MARKETPLACE</span>
                </div>

                <div>
                  <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                    Your points are worth more here.
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1 max-w-xl">
                    Redeem SharePoints for instant shop vouchers, free express deliveries, and exclusive neighborhood store discounts.
                  </p>
                </div>

                {/* Primary & Secondary Action CTAs */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToId("popular-rewards")}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3 text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer shadow-amber-400/20"
                  >
                    <Gift className="h-4 w-4" />
                    <span>Redeem Points</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToId("earn-points")}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 text-xs transition-all backdrop-blur-md border border-white/20 cursor-pointer"
                  >
                    <Zap className="h-4 w-4 text-amber-300" />
                    <span>Earn More</span>
                  </button>
                </div>
              </div>

              {/* Right Hero Balance Box & Milestone Progress */}
              <div className="w-full lg:w-[360px] rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 shadow-2xl flex flex-col justify-between shrink-0">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                      Available Balance
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-extrabold">
                      ₹{Math.floor(summary.currentPoints / 10)} Rewards Value
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl sm:text-5xl font-black text-amber-300 tracking-tight">
                      {summary.currentPoints.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-200">SharePoints</span>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="mt-5 pt-4 border-t border-white/15">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-white flex items-center gap-1">
                      <span>{tierIcon(summary.currentTier)}</span>
                      <span>{currentTier.name} Member</span>
                    </span>
                    <span className="text-amber-300 font-extrabold">
                      {summary.pointsToNextTier} pts to {nextTier.name}
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── QUICK SUMMARY HORIZONTAL BAR ── */}
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-[#981495] flex items-center justify-center font-bold text-lg shrink-0">
                🪙
              </div>
              <div>
                <p className="font-display text-lg font-black text-slate-900 leading-tight">
                  {summary.currentPoints.toLocaleString()}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Current Points</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                ₹
              </div>
              <div>
                <p className="font-display text-lg font-black text-emerald-700 leading-tight">
                  ₹{Math.floor(summary.currentPoints / 10)}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Rewards Value</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
                🎯
              </div>
              <div>
                <p className="font-display text-lg font-black text-slate-900 leading-tight">
                  {summary.pointsToNextTier}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Points to {nextTier.name}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg shrink-0">
                ⌛
              </div>
              <div>
                <p className="font-display text-lg font-black text-rose-600 leading-tight">
                  {summary.expiringPoints}
                </p>
                <p className="text-[11px] font-bold text-slate-500">Expiring Soon</p>
              </div>
            </div>
          </div>

          {/* ── REWARDS FOR YOU (Affordable Rewards Grid) ── */}
          <section className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-[#981495] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider mb-1">
                  <span>READY TO CLAIM</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Rewards For You
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Affordable with your current <strong className="text-slate-900">{summary.currentPoints.toLocaleString()} SharePoints</strong> balance — {affordableRewards.length} rewards ready!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {affordableRewards.slice(0, 4).map((reward) => {
                const isRedeemed = redeemedRewardIds.includes(reward.id);
                return (
                  <div
                    key={reward.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-[#981495]/50 hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      {/* Top Shop / Category Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 text-[#981495] px-2 py-1 text-[10px] font-black truncate max-w-[170px]">
                          <span>{reward.icon || "🎁"}</span>
                          <span className="truncate">{reward.shopName || reward.category}</span>
                        </span>
                        <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          {reward.pointsCost} pts
                        </span>
                      </div>

                      {/* Reward Value & Title */}
                      <h3 className="font-display text-base sm:text-lg font-black text-slate-900 leading-tight group-hover:text-[#981495] transition-colors">
                        {reward.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {reward.description}
                      </p>

                      {reward.minOrder !== undefined && reward.minOrder > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 mt-2">
                          Min. order ₹{reward.minOrder}
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      type="button"
                      disabled={isRedeemed}
                      onClick={() => handleRedeemClick(reward)}
                      className={`mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-black transition-all cursor-pointer shadow-xs ${
                        isRedeemed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-[#981495] hover:bg-purple-800 text-white active:scale-95 shadow-purple-900/10"
                      }`}
                    >
                      {isRedeemed ? "✓ Claimed" : "Redeem Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── REWARD CATEGORIES FILTER BAR ── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {REWARD_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer border ${
                      active
                        ? "bg-[#981495] text-white border-[#981495] shadow-xs"
                        : "bg-white text-slate-700 hover:bg-purple-50 border-slate-200/90 hover:border-purple-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── LOCALSHORE DIFFERENTIATOR: REWARDS FROM LOCAL SHOPS ── */}
          <section className="mb-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-900/5 to-slate-900/5 border-2 border-amber-300/80 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-slate-950 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider mb-1">
                  <Store className="h-3 w-3" />
                  <span>LOCALSHORE EXCLUSIVE</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Rewards from Local Shops
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-xl">
                  Exclusive discounts sponsored by verified neighborhood merchants in your delivery zone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory("local_shops")}
                className="text-xs font-bold text-[#981495] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all local shop rewards</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {localShopRewards.map((reward) => {
                const canAfford = summary.currentPoints >= reward.pointsCost;
                const isRedeemed = redeemedRewardIds.includes(reward.id);
                return (
                  <div
                    key={reward.id}
                    className="flex flex-col justify-between rounded-2xl bg-white border border-amber-300/70 p-4 shadow-xs hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-950 px-2 py-0.5 text-[10px] font-extrabold truncate">
                          🏪 {reward.shopName}
                        </span>
                        <span className="text-xs font-black text-[#981495]">
                          {reward.value}
                        </span>
                      </div>

                      <h3 className="font-display text-sm sm:text-base font-black text-slate-900 leading-tight">
                        {reward.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {reward.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">POINTS REQUIRED</p>
                        <p className="text-xs font-black text-slate-900">{reward.pointsCost} pts</p>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford || isRedeemed}
                        onClick={() => handleRedeemClick(reward)}
                        className={`rounded-xl px-3 py-2 text-xs font-black transition-all cursor-pointer ${
                          isRedeemed
                            ? "bg-emerald-100 text-emerald-800"
                            : canAfford
                              ? "bg-[#981495] hover:bg-purple-800 text-white shadow-xs"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isRedeemed ? "✓ Claimed" : canAfford ? "Redeem" : "Need Pts"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── POPULAR REWARDS MARKETPLACE GRID ── */}
          <section id="popular-rewards" className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Popular Rewards Catalog
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Browse {filteredRewards.length} available reward passes and discount vouchers
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500">
                Showing {filteredRewards.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredRewards.map((reward) => {
                const canAfford = summary.currentPoints >= reward.pointsCost;
                const isRedeemed = redeemedRewardIds.includes(reward.id);
                return (
                  <div
                    key={reward.id}
                    className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-[#981495]/40 hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <span>{reward.icon || "🏷️"}</span>
                          <span className="truncate">{reward.shopName || reward.category}</span>
                        </span>
                        {reward.popular && (
                          <span className="rounded-full bg-amber-100 text-amber-900 text-[9px] font-black px-2 py-0.5">
                            POPULAR
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-base font-black text-slate-900 leading-snug group-hover:text-[#981495] transition-colors">
                        {reward.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                        {reward.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs font-bold">
                        <span className="text-[#981495] font-black">{reward.value}</span>
                        {reward.minOrder !== undefined && (
                          <span className="text-[10px] text-slate-400">Min ₹{reward.minOrder}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-slate-900 font-black text-sm">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                        <span>{reward.pointsCost} pts</span>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford || isRedeemed}
                        onClick={() => handleRedeemClick(reward)}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                          isRedeemed
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : canAfford
                              ? "bg-[#981495] hover:bg-purple-800 text-white shadow-xs active:scale-95"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isRedeemed ? "✓ Claimed" : canAfford ? "Redeem" : "Insufficient Pts"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── TWO-COLUMN SECTION: EARN SHAREPOINTS + MEMBERSHIP STATUS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* ── EARN SHAREPOINTS (2 Cols) ── */}
            <section id="earn-points" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-black text-slate-900 tracking-tight">
                    Earn More SharePoints
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Complete quick actions to build your reward balance
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REWARD_ACTIONS.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200/90 p-4 hover:border-purple-200 hover:shadow-xs transition-all"
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{action.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {action.title}
                        </h4>
                        <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[10px] font-black">
                          +{action.points} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── MEMBERSHIP STATUS (1 Col - ONE Focused Card) ── */}
            <section>
              <h2 className="font-display text-xl font-black text-slate-900 tracking-tight mb-4">
                Membership Status
              </h2>

              <div className="rounded-2xl bg-white border-2 border-purple-200 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tierIcon(summary.currentTier)}</span>
                    <div>
                      <span className="rounded-full bg-[#981495] text-white px-2 py-0.5 text-[9px] font-black uppercase">
                        ACTIVE MEMBER
                      </span>
                      <h3 className="font-display text-lg font-black text-slate-900 leading-tight mt-0.5">
                        {currentTier.name} Member
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-medium">
                  {currentTier.benefits.map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Compact Tier Roadmap */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    TIER ROADMAP
                  </p>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-extrabold">
                    {REWARD_TIERS.map((t) => {
                      const active = t.id === summary.currentTier;
                      return (
                        <div
                          key={t.id}
                          className={`rounded-lg py-1.5 border ${
                            active
                              ? "bg-[#981495] text-white border-[#981495]"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          <div>{tierIcon(t.id)}</div>
                          <div className="truncate mt-0.5">{t.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── POINTS ACTIVITY SECTION ── */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-black text-slate-900 tracking-tight">
                  Recent Points Activity
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track your earned and redeemed SharePoints
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold text-[#981495] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View full history ({history.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {history.slice(0, 4).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200/80 p-3.5 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        tx.type === "earned" || tx.type === "bonus" || tx.type === "referral"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-purple-50 text-[#981495]"
                      }`}
                    >
                      {tx.type === "earned" ? "🛍️" : tx.type === "referral" ? "👥" : tx.type === "bonus" ? "🎁" : "🎟️"}
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {tx.orderId && <span className="font-mono font-bold text-slate-600">Order #{tx.orderId} · </span>}
                        {new Date(tx.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <span className={`font-display text-sm sm:text-base font-black ${txColor(tx.type)}`}>
                    {txSign(tx.type)}
                    {tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── REWARD REDEMPTION MODAL ── */}
        {selectedReward && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border-2 border-amber-300">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {!unlockedCoupon ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-purple-50 text-[#981495] flex items-center justify-center font-bold text-2xl shrink-0 border border-purple-200">
                      {selectedReward.icon || "🎁"}
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {selectedReward.shopName || selectedReward.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                        {selectedReward.title}
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 mb-5 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Reward Value</span>
                      <span className="text-[#981495] font-black">{selectedReward.value}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Points Required</span>
                      <span className="font-bold text-slate-900">{selectedReward.pointsCost} SharePoints</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Your Points Balance</span>
                      <span className="font-bold text-emerald-700">{summary.currentPoints.toLocaleString()} SharePoints</span>
                    </div>
                    {selectedReward.minOrder !== undefined && selectedReward.minOrder > 0 && (
                      <div className="flex justify-between font-medium text-slate-600 pt-1 border-t border-slate-200">
                        <span>Minimum Order</span>
                        <span className="font-bold text-slate-900">₹{selectedReward.minOrder}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmRedeem}
                    className="w-full rounded-2xl bg-[#981495] hover:bg-purple-800 text-white font-extrabold py-3.5 text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    Confirm & Redeem for {selectedReward.pointsCost} Points
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mb-3 border-2 border-emerald-300">
                    ✓
                  </div>

                  <h3 className="text-xl font-black text-slate-900">Reward Unlocked!</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Your <strong className="text-slate-900">{selectedReward.title}</strong> coupon code is ready to use at checkout.
                  </p>

                  <div className="mt-4 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-400 p-4 flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                      {unlockedCoupon}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(unlockedCoupon)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      {copiedCoupon ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCoupon ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReward(null)}
                    className="mt-6 w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Done, back to marketplace
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSACTION HISTORY MODAL ── */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border-2 border-amber-300">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-900">Points Activity History</h3>
                <p className="text-xs text-slate-500 font-medium">Complete record of SharePoints transactions</p>
              </div>

              {/* History Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                {(["all", "earned", "redeemed", "bonus", "referral"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setHistoryFilter(f)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition cursor-pointer ${
                      historyFilter === f
                        ? "bg-[#981495] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-purple-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {filteredHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/70"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {tx.orderId && <span className="font-mono font-bold text-slate-600">Order #{tx.orderId} · </span>}
                        {tx.date}
                      </p>
                    </div>
                    <span className={`font-display text-sm font-black ${txColor(tx.type)}`}>
                      {txSign(tx.type)}
                      {tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
