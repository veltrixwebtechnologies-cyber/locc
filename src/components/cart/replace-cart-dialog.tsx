import { useEffect, useCallback } from "react";
import { AlertCircle, ShoppingBag } from "lucide-react";
import {
  cartConflictManager,
  useCartConflict,
} from "@/modules/shopper/services/cart-conflict";
import { toast } from "sonner";

export function ReplaceCartDialog() {
  const conflict = useCartConflict();

  const handleCancel = useCallback(() => {
    cartConflictManager.cancelReplace();
  }, []);

  const handleConfirm = useCallback(() => {
    if (!conflict) return;
    const { newStoreName, newProduct } = conflict;
    const replaced = cartConflictManager.confirmReplace();
    if (replaced) {
      toast.success(`${newProduct.name} added to cart from ${newStoreName}`);
    }
  }, [conflict]);

  useEffect(() => {
    if (!conflict) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [conflict, handleCancel]);

  if (!conflict) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-cart-title"
      aria-describedby="replace-cart-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={handleCancel}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
      />

      {/* Dialog Surface */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#f0abfc]/70 bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200 z-10">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="h-6 w-6 stroke-[2.5]" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="replace-cart-title" className="text-lg font-black text-slate-900 leading-snug">
              Replace cart items?
            </h2>

            <p id="replace-cart-desc" className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your cart already contains items from{" "}
              <strong className="text-slate-900 font-bold">{conflict.currentStoreName}</strong>.
              Do you want to discard them and add this item from{" "}
              <strong className="text-[#981495] font-bold">{conflict.newStoreName}</strong>?
            </p>

            {/* Pending Item Preview */}
            <div className="mt-3.5 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-[#981495]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {conflict.newProduct.name}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700">
                  ₹{conflict.newProduct.price.toLocaleString("en-IN")}
                  {conflict.newProduct.unit && (
                    <span className="text-slate-400 font-normal"> · {conflict.newProduct.unit}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer shadow-xs text-center"
              >
                Keep Current Cart
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="w-full rounded-2xl bg-[#981495] hover:bg-[#700b6e] py-3 px-3 text-xs font-bold text-white active:scale-98 transition-all cursor-pointer shadow-md text-center"
              >
                Replace Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
