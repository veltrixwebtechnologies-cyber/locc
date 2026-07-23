import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function QtyStepper({
  qty,
  onChange,
  onAdd,
}: {
  qty: number;
  onChange: (n: number) => void;
  onAdd: () => void;
}) {
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (qty > 0) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 280);
      return () => clearTimeout(t);
    }
  }, [qty]);

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg border border-primary/30 bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        Add
      </button>
    );
  }
  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg bg-primary text-primary-foreground ${pop ? "cart-pop" : ""}`}
    >
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(qty - 1)}
        className="grid h-7 w-7 place-items-center hover:bg-teal-deep"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center font-mono text-xs">{qty}</span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(qty + 1)}
        className="grid h-7 w-7 place-items-center hover:bg-teal-deep"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
