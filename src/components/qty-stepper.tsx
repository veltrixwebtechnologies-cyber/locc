import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";

export function QtyStepper({
  qty,
  onChange,
  onAdd,
  max,
  addClassName,
}: {
  qty: number;
  onChange: (n: number) => void;
  onAdd: () => void;
  max?: number;
  addClassName?: string;
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
      <m.button
        type="button"
        onClick={onAdd}
        className={addClassName ?? "rounded-lg border border-primary/30 bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground transition-colors"}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
      >
        Add
      </m.button>
    );
  }
  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg bg-[var(--orchid)] text-primary-foreground ${pop ? "cart-pop" : ""}`}
    >
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(qty - 1)}
        className="grid h-7 w-7 place-items-center hover:bg-[var(--orchid-deep)]"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="relative grid h-7 w-6 place-items-center overflow-hidden text-center font-mono text-xs">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={qty}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
          >
            {qty}
          </m.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label="Increase"
        disabled={max != null && qty >= max}
        onClick={() => onChange(qty + 1)}
        className="grid h-7 w-7 place-items-center hover:bg-[var(--orchid-deep)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
