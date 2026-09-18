import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  ChevronRight,
  X,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  REWARD_TIERS,
  REWARD_ACTIONS,
  REDEEM_OPTIONS,
  SAMPLE_REWARD_HISTORY,
  SAMPLE_REWARDS_SUMMARY,
  type RewardTransaction,
  type RedeemOption,
} from "@/lib/rewards-data";

export const Route = createFileRoute("/rewards")({ component: RewardsPage });

export function RewardsPage() {
  const [summary, setSummary] = useState(SAMPLE_REWARDS_SUMMARY);
  const [history, setHistory] = useState(SAMPLE_REWARD_HISTORY);
  const [selectedReward, setSelectedReward] = useState<RedeemOption | null>(null);
  const [unlockedCoupon, setUnlockedCoupon] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [showAllRewardsModal, setShowAllRewardsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [redeemedRewardIds, setRedeemedRewardIds] = useState<string[]>([]);

  const currentTier = REWARD_TIERS.find((t) => t.id === summary.currentTier)!;
  const nextTier = REWARD_TIERS.find((t) => t.id === summary.nextTier)!;

  const handleRedeemClick = (reward: RedeemOption) => {
    setSelectedReward(reward);
    setUnlockedCoupon(null);
    setCopiedCoupon(false);
  };

  const handleConfirmRedeem = () => {
    if (!selectedReward || summary.currentPoints < selectedReward.pointsCost) return;

    const couponCode = `LOCAL-${selectedReward.value.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

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

  const scrollToRedeem = () => {
    const el = document.getElementById("redeem-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FAF9F7] py-6 sm:py-8">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 space-y-8">
          
          {/* 1. HEADER */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-[#981495] transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-900 font-bold">Rewards</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Rewards
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-0.5">
              Earn points. Save more when you shop local.
            </p>
          </div>

          {/* 2. ELEGANT POINTS BALANCE CARD */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#981495] uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>SharePoints Balance</span>
                </div>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {summary.currentPoints.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    ≈ ₹{Math.floor(summary.currentPoints / 10)} in rewards
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-2">
                  <span className="font-bold text-slate-900">{currentTier.name} Member</span>
                  <span className="text-slate-300">•</span>
                  <span>{summary.pointsToNextTier} points to {nextTier.name}</span>
                  <button
                    type="button"
                    onClick={() => setShowBenefitsModal(true)}
                    className="ml-1 text-[#981495] hover:underline font-bold cursor-pointer"
                  >
                    [ View benefits ]
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToRedeem}
                  className="rounded-xl bg-[#981495] hover:bg-purple-800 text-white font-bold px-6 py-3 text-xs uppercase tracking-wider shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Redeem Points
                </button>
              </div>
            </div>
          </div>

          {/* 3. REDEEM REWARDS */}
          <div id="redeem-section" className="space-y-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                  Use your points
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Simple rewards you can redeem now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllRewardsModal(true)}
                className="text-xs font-bold text-[#981495] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all rewards</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 3 to 4 clean reward cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REDEEM_OPTIONS.slice(0, 4).map((reward) => {
                const canAfford = summary.currentPoints >= reward.pointsCost;
                const isRedeemed = redeemedRewardIds.includes(reward.id);
                return (
                  <div
                    key={reward.id}
                    className="flex flex-col justify-between rounded-xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-[#981495]/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>{reward.shopName || reward.category}</span>
                        <span className="text-[#981495] font-black">{reward.pointsCost} pts</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                        {reward.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {reward.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || isRedeemed}
                      onClick={() => handleRedeemClick(reward)}
                      className={`mt-4 w-full rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                        isRedeemed
                          ? "bg-emerald-100 text-emerald-800"
                          : canAfford
                            ? "bg-[#981495] hover:bg-purple-800 text-white shadow-xs active:scale-95"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isRedeemed ? "✓ Redeemed" : canAfford ? "Redeem" : "Need Points"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 4. LOCAL SHOP CONNECTION (Contextual Small Bar) */}
            <div className="rounded-xl bg-white border border-amber-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏪</span>
                <div>
                  <p className="font-bold text-slate-900">Shop local and earn more</p>
                  <p className="text-slate-500 font-medium">Earn bonus SharePoints at participating nearby shops.</p>
                </div>
              </div>
              <Link
                to="/"
                search={{ category: "all-shops", q: undefined }}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 text-xs transition-colors shrink-0"
              >
                Explore local shops
              </Link>
            </div>
          </div>

          {/* 5. EARN POINTS & RECENT ACTIVITY (Clean Two-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* EARN POINTS LIST */}
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                Earn SharePoints
              </h2>

              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
                {REWARD_ACTIONS.slice(0, 5).map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 text-xs hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{action.icon}</span>
                      <div>
                        <p className="font-bold text-slate-900">{action.title}</p>
                        <p className="text-slate-500 font-medium text-[11px]">{action.description}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 shrink-0">
                      +{action.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
                  Recent activity
                </h2>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="text-xs font-bold text-[#981495] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
                {history.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 text-xs hover:bg-slate-50/80 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{tx.date}</p>
                    </div>
                    <span className={`font-extrabold text-sm ${tx.type === "redeemed" ? "text-[#981495]" : "text-emerald-700"}`}>
                      {tx.type === "redeemed" ? "" : "+"}{tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* MODALS */}
        {/* Redeem Confirmation Modal */}
        {selectedReward && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {!unlockedCoupon ? (
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedReward.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedReward.description}</p>

                  <div className="my-4 rounded-xl bg-slate-50 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Points Cost</span>
                      <span className="font-bold text-slate-900">{selectedReward.pointsCost} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Your Balance</span>
                      <span className="font-bold text-emerald-700">{summary.currentPoints} points</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmRedeem}
                    className="w-full rounded-xl bg-[#981495] hover:bg-purple-800 text-white font-bold py-3 text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Confirm & Redeem
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-3">
                    ✓
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Reward Unlocked!</h3>
                  <p className="text-xs text-slate-500 mt-1">Coupon code for {selectedReward.title}:</p>

                  <div className="my-4 rounded-xl bg-amber-50 border border-dashed border-amber-300 p-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-900">{unlockedCoupon}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(unlockedCoupon)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-2.5 py-1 text-xs font-bold cursor-pointer"
                    >
                      {copiedCoupon ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCoupon ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReward(null)}
                    className="w-full rounded-xl bg-slate-900 text-white font-bold py-2.5 text-xs transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View All Rewards Modal */}
        {showAllRewardsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setShowAllRewardsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">All Available Rewards</h3>
              <p className="text-xs text-slate-500 mb-4">Choose any reward to redeem with your SharePoints balance</p>

              <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 flex-1">
                {REDEEM_OPTIONS.map((reward) => {
                  const canAfford = summary.currentPoints >= reward.pointsCost;
                  const isRedeemed = redeemedRewardIds.includes(reward.id);
                  return (
                    <div key={reward.id} className="flex flex-col justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                          <span>{reward.shopName || reward.category}</span>
                          <span className="text-[#981495] font-black">{reward.pointsCost} pts</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{reward.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{reward.description}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford || isRedeemed}
                        onClick={() => {
                          setShowAllRewardsModal(false);
                          handleRedeemClick(reward);
                        }}
                        className={`mt-3 w-full rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                          isRedeemed
                            ? "bg-emerald-100 text-emerald-800"
                            : canAfford
                              ? "bg-[#981495] text-white hover:bg-purple-800"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isRedeemed ? "✓ Redeemed" : canAfford ? "Redeem" : "Need Points"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Benefits Modal */}
        {showBenefitsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setShowBenefitsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{currentTier.name} Membership Benefits</h3>
              <p className="text-xs text-slate-500 mb-4">Your current tier perks & roadmap</p>

              <div className="space-y-2 text-xs">
                {currentTier.benefits.map((b) => (
                  <div key={b} className="flex items-center gap-2 font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowBenefitsModal(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 text-white font-bold py-2.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">Full Activity History</h3>
              <p className="text-xs text-slate-500 mb-3">Complete log of points earned and spent</p>

              <div className="overflow-y-auto divide-y divide-slate-100 space-y-1 flex-1 pr-1">
                {history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{tx.date}</p>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === "redeemed" ? "text-[#981495]" : "text-emerald-700"}`}>
                      {tx.type === "redeemed" ? "" : "+"}{tx.points} pts
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
