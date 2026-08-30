import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, Gift, CreditCard, Send, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import {
  GIFT_CARD_DESIGNS, GIFT_CARD_DENOMINATIONS, GIFT_CARD_TYPES,
  SAMPLE_GIFT_CARDS, type GiftCardDesign,
} from "@/lib/gift-cards-data";

export const Route = createFileRoute("/gift-cards")({ component: GiftCardsPage });

function GiftCardsPage() {
  const [tab, setTab] = useState<"buy" | "my_cards">("buy");
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<GiftCardDesign>(GIFT_CARD_DESIGNS[0]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [message, setMessage] = useState("");
  const [selectedType, setSelectedType] = useState("localshore");

  const amount = customAmount ? Number(customAmount) : selectedAmount;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">Gift Cards</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl sm:p-8"
        >
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">LocalShore Gift Cards</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Give someone a little local love</h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Send a LocalShore gift card to friends and family. They can shop from any local store on the platform.
          </p>
        </m.div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-slate-200 pb-1">
          {[
            { id: "buy" as const, label: "Buy Gift Card", icon: Gift },
            { id: "my_cards" as const, label: "My Gift Cards", icon: CreditCard },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t.id ? "bg-purple-700 text-white" : "text-slate-600 hover:bg-purple-50"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "buy" ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left: Configuration */}
            <div className="space-y-6 lg:col-span-3">
              {/* Gift Card Type */}
              <section>
                <h2 className="text-sm font-bold text-slate-900">Card Type</h2>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {GIFT_CARD_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`rounded-2xl border p-3.5 text-left transition ${
                        selectedType === type.id
                          ? "border-purple-300 bg-purple-50 ring-2 ring-purple-200"
                          : "border-slate-200 bg-white hover:border-purple-200"
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <p className="mt-1 text-xs font-bold text-slate-900">{type.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{type.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Amount */}
              <section>
                <h2 className="text-sm font-bold text-slate-900">Select Amount</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GIFT_CARD_DENOMINATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => { setSelectedAmount(d.value); setCustomAmount(""); }}
                      className={`relative rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                        selectedAmount === d.value && !customAmount
                          ? "bg-purple-700 text-white shadow-md"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                      }`}
                    >
                      {d.label}
                      {d.popular && (
                        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-black text-slate-900">
                          Popular
                        </span>
                      )}
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom ₹"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400"
                    min={100}
                    max={10000}
                  />
                </div>
              </section>

              {/* Design */}
              <section>
                <h2 className="text-sm font-bold text-slate-900">Choose Design</h2>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {GIFT_CARD_DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDesign(d)}
                      className={`aspect-[3/2] rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center text-2xl transition ring-offset-2 ${
                        selectedDesign.id === d.id ? "ring-2 ring-purple-500 scale-105" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {d.emoji}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{selectedDesign.name}</p>
              </section>

              {/* Recipient */}
              <section>
                <h2 className="text-sm font-bold text-slate-900">Recipient Details</h2>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Email or phone number"
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400"
                  />
                </div>
                <textarea
                  placeholder="Personal message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400"
                />
              </section>
            </div>

            {/* Right: Preview Card */}
            <div className="lg:col-span-2">
              <div className="sticky top-28">
                <h2 className="text-sm font-bold text-slate-900">Preview</h2>
                <m.div
                  layout
                  className={`mt-2 overflow-hidden rounded-3xl bg-gradient-to-br ${selectedDesign.gradient} p-6 text-white shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">LocalShore Gift Card</span>
                    <span className="text-3xl">{selectedDesign.emoji}</span>
                  </div>
                  <p className="mt-6 font-display text-4xl font-extrabold">₹{amount.toLocaleString()}</p>
                  {recipientName && <p className="mt-2 text-sm font-semibold">To: {recipientName}</p>}
                  {message && <p className="mt-1 text-xs text-white/70 italic">"{message}"</p>}
                  <div className="mt-6 flex items-center justify-between text-xs text-white/60">
                    <span>Valid for 12 months</span>
                    <span className="font-mono">••••  ••••  ••••</span>
                  </div>
                </m.div>

                <button className="mt-4 w-full rounded-2xl bg-purple-700 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-purple-800 active:scale-[0.98] flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Buy & Send Gift Card — ₹{amount.toLocaleString()}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  🔒 Secure payment · Instant delivery via email/SMS
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* My Cards Tab */
          <div className="mt-6 space-y-4 pb-8">
            {SAMPLE_GIFT_CARDS.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Gift className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-700">No gift cards yet</p>
                <p className="mt-1 text-xs text-slate-500">Give someone a little local love.</p>
                <button
                  onClick={() => setTab("buy")}
                  className="mt-4 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white"
                >
                  Buy a gift card
                </button>
              </div>
            ) : (
              SAMPLE_GIFT_CARDS.map((card) => {
                const design = GIFT_CARD_DESIGNS.find((d) => d.id === card.designId) ?? GIFT_CARD_DESIGNS[0];
                return (
                  <div key={card.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className={`bg-gradient-to-r ${design.gradient} p-4 text-white`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                          {card.type === "localshore" ? "LocalShore" : card.type} Gift Card
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          card.status === "active" ? "bg-white/20" : "bg-black/20"
                        }`}>
                          {card.status}
                        </span>
                      </div>
                      <p className="mt-2 font-display text-2xl font-extrabold">₹{card.balance.toLocaleString()}</p>
                      <p className="text-xs text-white/70">of ₹{card.originalAmount.toLocaleString()}</p>
                      <p className="mt-2 font-mono text-xs text-white/60">{card.code}</p>
                    </div>
                    <div className="p-4">
                      {card.senderName && (
                        <p className="text-xs text-slate-600">From: <strong>{card.senderName}</strong></p>
                      )}
                      {card.message && (
                        <p className="mt-1 text-xs text-slate-500 italic">"{card.message}"</p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Expires {card.expiresAt}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {card.transactions.length} transactions</span>
                      </div>
                      {/* Transaction list */}
                      <div className="mt-3 border-t border-slate-100 pt-3 space-y-1.5">
                        {card.transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{tx.description}</span>
                            <span className={`font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-slate-900"}`}>
                              {tx.type === "credit" ? "+" : ""}₹{Math.abs(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
