import { parseCoordinates, type Coordinates } from "./coordinates";

export function deliveryLocationSignature(address: string, pin: Coordinates): string {
  return address.trim() && parseCoordinates(pin.lat, pin.lng)
    ? JSON.stringify([address.trim(), pin.lat, pin.lng])
    : "";
}

export function isConfirmedDeliveryLocation(
  address: string,
  pin: Coordinates,
  acquired: boolean,
  confirmed: string,
): boolean {
  const signature = deliveryLocationSignature(address, pin);
  return acquired && signature !== "" && signature === confirmed;
}
