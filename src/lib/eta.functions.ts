/**
 * LocalShore Phase-Based Delivery ETA Engine — Backend Server Functions
 *
 * Secure endpoints executed via TanStack Start createServerFn:
 * 1. getCheckoutEtaQuoteFn: Generates quotes without mutating orders.
 * 2. getOrderLatestEtaFn: Retrieves real-time recalculation for active orders.
 * 3. recordOrderLifecycleEventFn: Ingests verified milestone events.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeDeliveryETA } from "./eta/calculator";
import type { ETAPrediction, ETARequestInput } from "./eta/types";
import { supabase } from "@/integrations/supabase/client";

const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const checkoutEtaInputSchema = z.object({
  storeCoordinates: geoPointSchema,
  customerCoordinates: geoPointSchema,
  category: z.string().nullable().optional(),
  itemCount: z.number().int().min(1).max(200).optional().default(1),
});

export const getCheckoutEtaQuoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => checkoutEtaInputSchema.parse(data))
  .handler(async ({ data }): Promise<ETAPrediction> => {
    const input: ETARequestInput = {
      storeCoordinates: data.storeCoordinates,
      customerCoordinates: data.customerCoordinates,
      category: data.category,
      itemCount: data.itemCount,
      currentStatus: "new",
    };

    return await computeDeliveryETA(input);
  });

const orderEtaInputSchema = z.object({
  orderId: z.string().min(1),
});

export const getOrderLatestEtaFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => orderEtaInputSchema.parse(data))
  .handler(async ({ data }): Promise<ETAPrediction | null> => {
    // 1. Fetch order and delivery assignment details
    const { data: order, error } = await (supabase as any)
      .from("orders")
      .select(
        `
        id,
        status,
        seller_id,
        customer_latitude,
        customer_longitude,
        created_at,
        seller:sellers(lat, lng),
        delivery_assignments(current_latitude, current_longitude, status)
      `,
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (error || !order) {
      return null;
    }

    const orderRow = order as any;
    const sellerLat = orderRow.seller?.lat;
    const sellerLng = orderRow.seller?.lng;
    const custLat = orderRow.customer_latitude;
    const custLng = orderRow.customer_longitude;

    if (!sellerLat || !sellerLng || !custLat || !custLng) {
      return null;
    }

    // Active delivery partner coordinates if available
    const activeAssignment = Array.isArray(orderRow.delivery_assignments)
      ? orderRow.delivery_assignments.find(
          (a: any) => !["expired", "rejected", "cancelled"].includes(a.status),
        )
      : null;

    const riderLat = activeAssignment?.current_latitude;
    const riderLng = activeAssignment?.current_longitude;

    const input: ETARequestInput = {
      storeCoordinates: { lat: Number(sellerLat), lng: Number(sellerLng) },
      customerCoordinates: { lat: Number(custLat), lng: Number(custLng) },
      riderCoordinates:
        riderLat && riderLng ? { lat: Number(riderLat), lng: Number(riderLng) } : null,
      currentStatus: orderRow.status,
      orderCreatedAtMs: orderRow.created_at ? new Date(orderRow.created_at).getTime() : undefined,
    };

    return await computeDeliveryETA(input);
  });

const lifecycleEventInputSchema = z.object({
  orderId: z.string().uuid(),
  eventType: z.enum([
    "accepted",
    "prepared",
    "rider_assigned",
    "rider_arrived_at_store",
    "picked_up",
    "out_for_delivery",
    "arrived_at_customer",
    "delivered",
  ]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const recordOrderLifecycleEventFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => lifecycleEventInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { error } = await (supabase as any).from("order_lifecycle_events").insert({
      order_id: data.orderId,
      event_type: data.eventType,
      metadata: data.metadata,
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to record lifecycle event: ${error.message}`);
    }

    return { success: true };
  });
