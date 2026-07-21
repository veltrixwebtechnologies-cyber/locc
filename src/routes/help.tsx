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

export const Route = createFileRoute("/help")({ component: HelpPage });

function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

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
