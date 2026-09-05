import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { addressesStore, useAddresses } from "@/lib/addresses-store";
import { ChevronLeft, MapPin, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/addresses")({ component: AddressesPage });

function AddressesPage() {
  const items = useAddresses();
  const [label, setLabel] = useState("");
  const [line, setLine] = useState("");

  const add = () => {
    if (!label.trim() || !line.trim()) return;
    addressesStore.add({ label: label.trim(), line: line.trim(), lat: null, lng: null });
    setLabel("");
    setLine("");
  };

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
        <h1 className="mt-1 font-display text-3xl">Saved addresses</h1>
      </div>

      <ul className="mx-5 mt-6 space-y-2">
        {items.length === 0 && (
          <li className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-black/[0.04]">
            No addresses saved yet.
          </li>
        )}
        {items.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]"
          >
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{a.label}</p>
              <p className="text-sm text-muted-foreground">{a.line}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {typeof a.lat === "number" && typeof a.lng === "number"
                  ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`
                  : "Coordinates unavailable"}
              </p>
            </div>
            <button
              onClick={() => addressesStore.remove(a.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mx-5 mt-6 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
        <p className="text-sm font-semibold">Add new address</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (Home, Office)"
          className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="Full address"
          rows={2}
          className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={add}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Save address
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tip: fine-tune the exact drop-off pin on the checkout map when placing an order.
        </p>
      </div>
    </AppShell>
  );
}
