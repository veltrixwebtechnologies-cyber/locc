export type NominatimReverseResult = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

export type ResolvedLocationAddress = {
  area: string;
  city: string;
  label: string;
  pincode?: string;
};

const firstValue = (...values: Array<string | undefined>) =>
  values.find((value) => Boolean(value?.trim()))?.trim() || "";

const uniqueParts = (parts: string[]) =>
  parts.filter((part, index) => part && parts.indexOf(part) === index);

/**
 * Nominatim's display_name commonly begins with a house number or administrative
 * ward. That is unsuitable as a delivery area, so use its structured address
 * fields and deliberately prefer customer-recognisable neighbourhood names.
 */
export function resolveNominatimAddress(result: NominatimReverseResult): ResolvedLocationAddress {
  const address = result.address || {};
  const area =
    firstValue(
      address.neighbourhood,
      address.quarter,
      address.suburb,
      address.residential,
      address.village,
      address.hamlet,
      address.locality,
      address.road,
    ) || "Live GPS Location";
  const locality = firstValue(
    address.city,
    address.town,
    address.municipality,
    address.county,
    address.state_district,
  );
  const state = firstValue(address.state);
  const city = uniqueParts([locality, state]).join(", ");
  const street = [address.house_number, address.road].filter(Boolean).join(" ");
  const labelParts = uniqueParts([street, area, locality, state, address.postcode || ""]);

  return {
    area,
    city,
    label: labelParts.join(", ") || result.display_name || "Live GPS Location",
    pincode: address.postcode,
  };
}
