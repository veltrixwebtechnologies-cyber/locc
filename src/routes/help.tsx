import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronLeft, ChevronDown, Mail, Phone } from "lucide-react";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Open Orders from the bottom nav and tap an active order to see the live map and courier status.",
  },
  {
    q: "Can I cancel an order?",
    a: "Orders can be cancelled before the shop marks them as 'Picking'. Contact the shop directly from the order screen.",
  },
  {
    q: "What are Verified Local Stores?",
    a: "Real neighbourhood shops we've physically verified — not dark stores or warehouses.",
  },
  {
    q: "How do delivery fees work?",
    a: "Fees are set per shop based on distance from your address. You'll see the exact fee at checkout.",
  },
];

const TOPIC_CONTENT: Record<string, { title: string; body: string }> = {
  about: { title: "About Local Shore", body: "Local Shore brings trusted neighborhood shops, everyday essentials, and dependable delivery together in one simple place." },
  neighborhoods: { title: "Our neighborhoods", body: "We work with nearby stores so your order supports local businesses and reaches you with a shorter, more thoughtful route." },
  community: { title: "Community notes", body: "Discover local favorites, seasonal picks, and practical updates from the neighborhoods we serve." },
  sell: { title: "Sell with us", body: "Have a local shop? Contact us to list your catalog, reach nearby customers, and grow without losing your neighborhood identity." },
  deliver: { title: "Deliver with us", body: "Delivery partners help local orders move safely and on time. Contact support to learn about eligibility and onboarding." },
  partner: { title: "Partner help", body: "Partners can contact support for account, delivery, payout, and document assistance." },
  merchant: { title: "Merchant resources", body: "Find guidance for catalog setup, inventory, order handoff, customer care, and store growth." },
  privacy: { title: "Privacy center", body: "We use your account, address, and order details to provide delivery, support, and safety features. Contact us for access or deletion requests." },
  terms: { title: "Terms of use", body: "Use Local Shore respectfully, provide accurate delivery details, and follow the policies shown during checkout and account setup." },
};

export const Route = createFileRoute("/help")({ component: HelpPage });

function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const topic = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("topic") : null;
  const topicContent = topic ? TOPIC_CONTENT[topic] : undefined;

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Profile
        </p>
        <h1 className="mt-1 font-display text-3xl">Help & support</h1>
        {topicContent && (
          <section className="mt-5 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
            <h2 className="font-semibold">{topicContent.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{topicContent.body}</p>
          </section>
        )}
      </div>

      <div className="mx-5 mt-6 grid grid-cols-2 gap-3">
        <a
          href="mailto:hello@localshore.app"
          className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-black/[0.04]"
        >
          <Mail className="h-4 w-4 text-primary" /> Email us
        </a>
        <a
          href="tel:+911800000000"
          className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-black/[0.04]"
        >
          <Phone className="h-4 w-4 text-primary" /> Call support
        </a>
      </div>

      <p className="mx-5 mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        FAQs
      </p>
      <ul className="mx-5 mt-2 overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.04]">
        {FAQS.map((f, i) => (
          <li key={i} className={`${i < FAQS.length - 1 ? "border-b hairline" : ""}`}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="flex-1 text-sm font-semibold">{f.q}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</p>}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
