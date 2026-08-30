import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Sparkles, Gift, ArrowRight, ChevronRight, Trophy, Star, Clock,
  TrendingUp, ShieldCheck, Zap, Users, MessageSquare, UserCheck, Cake,
} from "lucide-react";
import { m } from "motion/react";
import {
  REWARD_TIERS, REWARD_ACTIONS, REDEEM_OPTIONS, SAMPLE_REWARD_HISTORY,
  SAMPLE_REWARDS_SUMMARY, type RewardTransaction,
} from "@/lib/rewards-data";

export const Route = createFileRoute("/rewards")({ component: RewardsPage });

const tierIcon = (tier: string) => {
  if (tier === "platinum") return "💎";
  if (tier === "gold") return "🥇";
  if (tier === "silver") return "🥈";
  return "🥉";
};

const txColor = (type: RewardTransaction["type"]) => {
  if (type === "earned" || type === "bonus" || type === "referral") return "text-emerald-600";
  if (type === "redeemed") return "text-purple-700";
  return "text-slate-400";
};

const txSign = (type: RewardTransaction["type"]) => {
  if (type === "earned" || type === "bonus" || type === "referral") return "+";
  return "";
};

function RewardsPage() {
  const s = SAMPLE_REWARDS_SUMMARY;
  const currentTier = REWARD_TIERS.find((t) => t.id === s.currentTier)!;
  const nextTier = REWARD_TIERS.find((t) => t.id === s.nextTier)!;
  const progress = ((s.currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
  const [historyFilter, setHistoryFilter] = useState<"all" | RewardTransaction["type"]>("all");
  const [showAllActions, setShowAllActions] = useState(false);

  const filteredHistory = historyFilter === "all"
    ? SAMPLE_REWARD_HISTORY
    : SAMPLE_REWARD_HISTORY.filter((t) => t.type === historyFilter);

  const visibleActions = showAllActions ? REWARD_ACTIONS : REWARD_ACTIONS.slice(0, 4);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">Rewards</span>
        </div>

        {/* ── Hero Points Card ──────────────────────────────────────────── */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-900 p-6 text-white shadow-xl sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-purple-200">LocalShore Rewards</span>
              </div>
              <p className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
                🪙 {s.currentPoints.toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-semibold text-purple-200">Shore Points</p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  {tierIcon(s.currentTier)} {currentTier.name} Member
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  +{s.earnedThisMonth} this month
                </span>
              </div>
            </div>

            <div className="min-w-[200px] rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:text-right">
              <p className="text-xs font-bold uppercase text-purple-200">Next: {nextTier.name}</p>
              <p className="mt-1 text-sm font-bold">{s.pointsToNextTier} points away</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-amber-400"
                />
              </div>
              {s.expiringPoints > 0 && (
                <p className="mt-2 text-[11px] text-amber-300">
                  ⏰ {s.expiringPoints} points expiring {s.expiringDate}
                </p>
              )}
            </div>
          </div>
        </m.div>

        {/* ── Stats Row ────────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Current Points", value: s.currentPoints.toLocaleString(), icon: Sparkles, color: "text-purple-700 bg-purple-50" },
            { label: "This Month", value: `+${s.earnedThisMonth}`, icon: TrendingUp, color: "text-emerald-700 bg-emerald-50" },
            { label: "Lifetime", value: s.lifetimePoints.toLocaleString(), icon: Trophy, color: "text-amber-700 bg-amber-50" },
            { label: "Expiring Soon", value: s.expiringPoints.toString(), icon: Clock, color: "text-rose-600 bg-rose-50" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="mt-2 font-display text-xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-[11px] font-semibold text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Reward Tiers ─────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-slate-900">Membership Tiers</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {REWARD_TIERS.map((tier) => {
              const isActive = tier.id === s.currentTier;
              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive ? "border-purple-300 bg-purple-50 ring-2 ring-purple-200" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tierIcon(tier.id)}</span>
                    <span className="text-sm font-bold text-slate-900">{tier.name}</span>
                    {isActive && <span className="rounded-full bg-purple-700 px-2 py-0.5 text-[9px] font-bold text-white">You</span>}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{tier.minPoints.toLocaleString()}+ points</p>
                  <ul className="mt-2 space-y-1">
                    {tier.benefits.slice(0, 2).map((b) => (
                      <li key={b} className="text-[11px] text-slate-600">• {b}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Earn Points ──────────────────────────────────────────── */}
          <section>
            <h2 className="font-display text-lg font-bold text-slate-900">Ways to Earn</h2>
            <p className="mt-0.5 text-xs text-slate-500">Complete actions to earn Shore Points</p>
            <div className="mt-3 space-y-2">
              {visibleActions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-purple-200 hover:shadow-xs">
                  <span className="text-xl">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{action.title}</p>
                    <p className="text-[11px] text-slate-500">{action.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    +{action.points} pts
                  </span>
                </div>
              ))}
              {!showAllActions && REWARD_ACTIONS.length > 4 && (
                <button onClick={() => setShowAllActions(true)} className="w-full rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition">
                  Show all {REWARD_ACTIONS.length} ways to earn →
                </button>
              )}
            </div>
          </section>

          {/* ── Redeem Points ────────────────────────────────────────── */}
          <section>
            <h2 className="font-display text-lg font-bold text-slate-900">Redeem Points</h2>
            <p className="mt-0.5 text-xs text-slate-500">Use your points for rewards</p>
            <div className="mt-3 space-y-2">
              {REDEEM_OPTIONS.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-purple-200 hover:shadow-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{opt.title}</p>
                    <p className="text-[11px] text-slate-500">{opt.description}</p>
                  </div>
                  <button
                    disabled={s.currentPoints < opt.pointsCost}
                    className="shrink-0 rounded-xl bg-purple-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {opt.pointsCost} pts
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Transaction History ───────────────────────────────────── */}
        <section className="mt-8 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Points History</h2>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {(["all", "earned", "redeemed", "bonus", "referral", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
                  historyFilter === f ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-purple-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-500">No transactions in this category</p>
              </div>
            ) : (
              filteredHistory.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {tx.orderId && <span className="font-mono">{tx.orderId} · </span>}
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`shrink-0 font-display text-base font-extrabold ${txColor(tx.type)}`}>
                    {txSign(tx.type)}{Math.abs(tx.points)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
