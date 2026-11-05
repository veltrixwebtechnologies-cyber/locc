import type { DeliveryLocation } from "./location-store";
import { parseCoordinates } from "./coordinates";
import { supabase } from "@/integrations/supabase/client";

export async function saveDeliveryEntrance(location: DeliveryLocation) {
  const pin = parseCoordinates(location.entranceLatitude, location.entranceLongitude);
  if (!pin || !location.verifiedByCustomer) throw new Error("Confirm a valid delivery entrance first.");
  const { data, error: authError } = await supabase.auth.getUser();
  if (!data.user) {
    if (authError && authError.name !== "AuthSessionMissingError") throw authError;
    return "local" as const;
  }
  const { error } = await (supabase as any).from("customer_delivery_locations").upsert({
    user_id: data.user.id,
    entrance_latitude: pin.lat,
    entrance_longitude: pin.lng,
    details: { ...location, address: location.label },
    updated_at: location.updatedAt,
  }, { onConflict: "user_id" });
  if (error) throw error;
  return "synced" as const;
}
