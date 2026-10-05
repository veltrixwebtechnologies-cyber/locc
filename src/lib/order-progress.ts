import type { OrderStatus } from "./orders-store";

/** Resolve persisted legacy/current order statuses to the customer timeline. */
export function getOrderProgressIndex(status: OrderStatus): number {
  switch (status) {
    case "new":
      return 0;
    case "accepted":
    case "vendor_accepted":
    case "preparing":
    case "packed":
      return 1;
    case "ready_for_pickup":
      return 2;
    case "assigned":
    case "delivery_partner_assigned":
    case "rider_assigned":
    case "rider_accepted":
    case "going_to_vendor":
      return 3;
    case "arrived_at_vendor":
    case "rider_at_shop":
      return 4;
    case "picked_up":
      return 5;
    case "going_to_customer":
    case "out_for_delivery":
      return 6;
    case "arrived_at_customer":
    case "at_customer":
    case "delivered":
      return 7;
    case "cancelled":
    case "cancelled_by_vendor":
    case "returned":
    case "assignment_failed":
    case "delivery_failed":
      return -1;
  }
}
