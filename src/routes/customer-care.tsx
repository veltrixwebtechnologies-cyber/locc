import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  ChevronRight, Search, MessageSquare, HelpCircle, Package,
  ChevronDown, Send, Paperclip, Clock, LifeBuoy,
} from "lucide-react";
import { m } from "motion/react";
import { SUPPORT_CATEGORIES, SUPPORT_FAQS, type SupportCategory } from "@/lib/platform-data";

export const Route = createFileRoute("/customer-care")({ component: CustomerCarePage });

function CustomerCarePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);

  const filteredFaqs = searchQuery.trim()
    ? SUPPORT_FAQS.filter((f) =>
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SUPPORT_FAQS;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">Customer Care</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl bg-gradient-to-br from-purple-800 to-indigo-900 p-6 text-white shadow-xl sm:p-8"
        >
          <LifeBuoy className="h-8 w-8 text-purple-300" />
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">How can we help you?</h1>
          <p className="mt-2 max-w-lg text-sm text-purple-200">
            Search for answers, browse categories, or raise a support ticket.
          </p>

          {/* Search */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Search className="h-4 w-4 text-purple-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-purple-300"
            />
          </div>
        </m.div>

        {/* Support Categories Grid */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-slate-900">What do you need help with?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {SUPPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setShowTicketForm(true); }}
                className={`rounded-2xl border p-3.5 text-left transition hover:border-purple-300 hover:shadow-xs ${
                  selectedCategory?.id === cat.id
                    ? "border-purple-300 bg-purple-50 ring-1 ring-purple-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <p className="mt-1.5 text-xs font-bold text-slate-900">{cat.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{cat.description}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* FAQs */}
          <section className="lg:col-span-3">
            <h2 className="text-sm font-bold text-slate-900">Frequently Asked Questions</h2>
            <div className="mt-3 space-y-2">
              {filteredFaqs.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <HelpCircle className="h-4 w-4 shrink-0 text-purple-600" />
                    <span className="flex-1 text-sm font-semibold text-slate-900">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                  </button>
                  {faqOpen === i && (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-2">
                      <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-sm text-slate-500">No results found for "{searchQuery}"</p>
                  <button
                    onClick={() => { setShowTicketForm(true); setSearchQuery(""); }}
                    className="mt-2 text-xs font-bold text-purple-700 underline"
                  >
                    Raise a support ticket instead
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Ticket Form / Contact */}
          <section className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">
              {showTicketForm ? (
                <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-700" />
                    <h3 className="text-sm font-bold text-slate-900">Raise a Ticket</h3>
                  </div>
                  {selectedCategory && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Category: <strong>{selectedCategory.label}</strong>
                    </p>
                  )}
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Subject"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400"
                    />
                    <textarea
                      placeholder="Describe your issue in detail..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        <Paperclip className="h-3.5 w-3.5" /> Attach image
                      </button>
                    </div>
                    <button className="w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white shadow-md transition hover:bg-purple-800 flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" /> Submit Ticket
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>Estimated response: within 2 hours</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-center">
                  <LifeBuoy className="mx-auto h-8 w-8 text-purple-600" />
                  <p className="mt-3 text-sm font-bold text-slate-900">Need more help?</p>
                  <p className="mt-1 text-xs text-slate-500">Select a category or raise a ticket.</p>
                  <button
                    onClick={() => setShowTicketForm(true)}
                    className="mt-4 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white"
                  >
                    Contact Support
                  </button>
                </div>
              )}

              <Link
                to="/support"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-purple-300"
              >
                <Package className="h-5 w-5 text-purple-700" />
                <div>
                  <p className="text-xs font-bold text-slate-900">View Support Tickets</p>
                  <p className="text-[11px] text-slate-500">Track your open requests</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
