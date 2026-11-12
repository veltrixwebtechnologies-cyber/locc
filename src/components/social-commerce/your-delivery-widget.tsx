import { Link } from "@tanstack/react-router";
import { Bike, ChevronRight } from "lucide-react";
import { useOrders, type Order } from "@/modules/shopper/services/orders-store";

const ACTIVE_STATUSES = new Set([
  "new",
  "accepted",
  "vendor_accepted",
  "preparing",
  "packed",
  "ready_for_pickup",
  "assigned",
  "delivery_partner_assigned",
  "going_to_vendor",
  "arrived_at_vendor",
  "picked_up",
  "going_to_customer",
  "out_for_delivery",
  "arrived_at_customer",
  "rider_assigned",
  "rider_accepted",
  "rider_at_shop",
]);

function getDeliveryStage(status: string) {
  switch (status) {
    case "new":
    case "accepted":
    case "vendor_accepted":
      return {
        step: 1,
        statusText: "Order Confirmed",
        etaText: "~35 min",
        progressPct: "10%",
      };
    case "preparing":
    case "packed":
    case "ready_for_pickup":
      return {
        step: 2,
        statusText: "Order Packed",
        etaText: "~25 min",
        progressPct: "40%",
      };
    case "assigned":
    case "delivery_partner_assigned":
    case "going_to_vendor":
    case "arrived_at_vendor":
    case "picked_up":
    case "going_to_customer":
    case "out_for_delivery":
    case "rider_assigned":
    case "rider_accepted":
    case "rider_at_shop":
      return {
        step: 3,
        statusText: "Out for Delivery",
        etaText: "~15 min",
        progressPct: "75%",
      };
    case "arrived_at_customer":
      return {
        step: 4,
        statusText: "Arriving Now",
        etaText: "~2 min",
        progressPct: "100%",
      };
    default:
      return {
        step: 1,
        statusText: "Order Confirmed",
        etaText: "~30 min",
        progressPct: "15%",
      };
  }
}

export function YourDeliveryWidget() {
  const orders = useOrders();
  const activeOrder: Order | undefined = orders.find((o) => ACTIVE_STATUSES.has(o.status));

  // Only render when the customer has an actual active order in progress
  if (!activeOrder) {
    return null;
  }

  const orderCode = activeOrder.code || (activeOrder.id ? activeOrder.id.slice(0, 8).toUpperCase() : "LIVE");
  const orderId = activeOrder.id || activeOrder.code;
  const stage = getDeliveryStage(activeOrder.status);

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Bike className="h-4 w-4 text-[#8B2FC9]" />
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Your Delivery</h3>
        </div>
        <Link
          to="/orders"
          className="group inline-flex items-center gap-0.5 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
        >
          Delivery Hub
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Live Order Tracking Card */}
      <Link
        to="/order/$orderId"
        params={{ orderId }}
        className="group block rounded-2xl bg-[#F8FAFC] p-3.5 border border-[#ECD9F9] transition hover:shadow-xs hover:border-[#8B2FC9]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Scooter Graphic */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-purple-100/70 flex items-center justify-center p-1.5">
              <span className="text-2xl">🛵</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#0F172A]">Order #{orderCode}</span>
              </div>
              <p className="text-xs font-semibold text-[#8B2FC9] mt-0.5">{stage.statusText}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-[#64748B] block">ETA</span>
            <span className="text-xs font-extrabold text-[#0F172A]">{stage.etaText}</span>
          </div>
        </div>

        {/* 4-Stage Stepper Tracker */}
        <div className="mt-4 pt-2 border-t border-purple-100/80">
          <div className="relative flex items-center justify-between px-1">
            {/* Connecting Track Line */}
            <div className="absolute left-3 right-3 top-1.5 h-0.5 bg-[#E2E8F0] -z-0">
              <div
                className="h-full bg-[#8B2FC9] rounded-full transition-all duration-500"
                style={{ width: stage.progressPct }}
              />
            </div>

            {/* Step 1: Confirmed */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                  stage.step >= 1 ? "bg-[#8B2FC9]" : "bg-[#E2E8F0]"
                } ${stage.step === 1 ? "animate-pulse" : ""}`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  stage.step >= 1 ? "font-bold text-[#0F172A]" : "font-semibold text-slate-400"
                }`}
              >
                Confirmed
              </span>
            </div>

            {/* Step 2: Packed */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                  stage.step >= 2 ? "bg-[#8B2FC9]" : "bg-[#E2E8F0]"
                } ${stage.step === 2 ? "animate-pulse" : ""}`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  stage.step >= 2 ? "font-bold text-[#0F172A]" : "font-semibold text-slate-400"
                }`}
              >
                Packed
              </span>
            </div>

            {/* Step 3: Out for Delivery */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                  stage.step >= 3 ? "bg-[#8B2FC9]" : "bg-[#E2E8F0]"
                } ${stage.step === 3 ? "animate-pulse" : ""}`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  stage.step === 3
                    ? "font-extrabold text-[#8B2FC9]"
                    : stage.step > 3
                    ? "font-bold text-[#0F172A]"
                    : "font-semibold text-slate-400"
                }`}
              >
                Out for Delivery
              </span>
            </div>

            {/* Step 4: Arriving */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                  stage.step >= 4 ? "bg-[#8B2FC9]" : "bg-[#E2E8F0]"
                } ${stage.step === 4 ? "animate-pulse" : ""}`}
              />
              <span
                className={`text-[10px] mt-1 ${
                  stage.step >= 4 ? "font-extrabold text-[#8B2FC9]" : "font-semibold text-slate-400"
                }`}
              >
                Arriving
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
