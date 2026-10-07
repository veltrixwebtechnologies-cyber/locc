import { createHash } from "node:crypto";
import path from "node:path";

const PRIVATE_USE = /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu;
const SCRAPE_ARTIFACT = /\b\d(?:\.\d+)?\s*JS\s*:\s*\d\b/giu;
const CATEGORY_IMAGES = {
  "Fashion & Apparel": [
    "photo-1445205170230-053b83016050",
    "photo-1558769132-cb1aea458c5e",
    "photo-1490481651871-ab68de25d43d",
    "photo-1489987707025-afc232f7ea0f",
    "photo-1541099649105-f69ad21f3246",
  ],
  Furniture: [
    "photo-1555041469-a586c61ea9bc",
    "photo-1556911220-e15b29be8c8f",
    "photo-1513519245088-0e12902e5a38",
    "photo-1584100936595-c0654b55a2e2",
  ],
  Bakery: [
    "photo-1509440159596-0249088772ff",
    "photo-1578985545062-69928b1d9587",
    "photo-1608198093002-ad4e005484df",
    "photo-1555507036-ab1f4038808a",
  ],
};

export function cleanText(value) {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(PRIVATE_USE, " ")
    .replace(SCRAPE_ARTIFACT, " ")
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/^[\s,·|]+|[\s,·|]+$/gu, "");
  return cleaned || null;
}

export function normalizePhone(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  if (!/^[+()\d\s.-]+$/u.test(cleaned)) return null;
  let digits = cleaned.replace(/\D/gu, "");
  if (digits.startsWith("0091") && digits.length === 14) digits = digits.slice(4);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^[1-9]\d{9}$/u.test(digits) && !/^(\d)\1{9}$/u.test(digits) ? `+91${digits}` : null;
}

export function normalizeUrl(value) {
  const text = cleanText(value);
  if (!text || /^(add website|website|none|na|n\/a)$/iu.test(text)) return null;
  try {
    const url = new URL(text);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function googlePlaceIdentity(value) {
  const urlValue = normalizeUrl(value);
  if (!urlValue) return null;
  const url = new URL(urlValue);
  const placeId = url.searchParams.get("query_place_id") ?? url.searchParams.get("place_id") ?? url.searchParams.get("cid") ?? urlValue.match(/!19s([^!/?#]+)/u)?.[1] ?? urlValue.match(/!1s([^!/?#]+)/u)?.[1];
  if (!placeId) return null;
  try { return decodeURIComponent(placeId); }
  catch { return placeId; }
}

export function normalizeOpeningHours(value) {
  const text = cleanText(value);
  if (!text || /^(hours|opening hours|add hours|closed|unknown|n\/a)$/iu.test(text)) return null;
  return text;
}

export function stablePlaceKey(googleMapsUrl, businessName, formattedAddress, latitude, longitude) {
  let identity = "";
  const mapsUrl = normalizeUrl(googleMapsUrl);
  if (mapsUrl) {
    const placeId = googlePlaceIdentity(mapsUrl);
    if (placeId) {
      identity = `google-place:${placeId}`;
    } else {
      const url = new URL(mapsUrl);
      for (const parameter of [...url.searchParams.keys()]) {
        if (/^(utm_|hl$|authuser$)/u.test(parameter)) url.searchParams.delete(parameter);
      }
      url.searchParams.sort();
      identity = `google-url:${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/u, "")}${url.search}`;
    }
  }
  const normalizedName = cleanText(businessName)?.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim() ?? "";
  const normalizedAddress = cleanText(formattedAddress)?.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim() ?? "";
  // Name + address provides a branch-safe fallback; when the address is absent
  // coordinates supplement the name, never identify a business on their own.
  if (!identity) {
    identity = normalizedName || normalizedAddress
      ? `name-address:${normalizedName}|${normalizedAddress || `${latitude},${longitude}`}`
      : `unidentified:${latitude},${longitude}`;
  }
  return createHash("sha256").update(identity).digest("hex");
}

export function representativeImage(category, stableKey) {
  const candidates = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.Furniture;
  const digest = createHash("sha256").update(stableKey).digest();
  const index = digest.readUInt32BE(0) % candidates.length;
  return {
    url: `https://images.unsplash.com/${candidates[index]}?auto=format&fit=crop&w=900&q=80`,
    source: "unsplash",
    type: "representative",
    attribution: "Unsplash — representative category image; not a photograph of this business",
  };
}

function parseRating(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
  if (typeof value !== "string" || !/^\s*[0-5](?:\.\d+)?\s*$/u.test(value)) return null;
  const rating = Number(value);
  return Number.isFinite(rating) && rating <= 5 ? rating : null;
}

function parseCount(value) {
  if (value == null || value === "") return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function normalizeFeature(feature, fileName) {
  if (feature?.type !== "Feature" || feature?.geometry?.type !== "Point") {
    return { error: "feature must be a GeoJSON Point" };
  }
  const coordinates = feature.geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return { error: "coordinates must contain longitude and latitude" };
  if (typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") return { invalidCoordinates: true };
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { invalidCoordinates: true };
  }
  const properties = feature.properties && typeof feature.properties === "object" ? feature.properties : {};
  const dataset = path.basename(fileName);
  const category = /furniture/iu.test(dataset)
    ? "Furniture"
    : /Dress_Shops_and_Apparels/iu.test(dataset)
      ? "Fashion & Apparel"
      : /Bakeries/iu.test(dataset)
        ? "Bakery"
        : null;
  if (!category) return { error: "Unknown dataset category; add an explicit filename mapping before importing" };
  const businessName = cleanText(properties.business_name);
  if (!businessName) return { error: "business_name is missing" };

  const address = cleanText(properties.formatted_address);
  const postalCode = address?.match(/\b\d{6}\b/u)?.[0] ?? null;
  const fileImpliesBengaluru = /banglore|bangalore|bengaluru/iu.test(fileName);
  const city = fileImpliesBengaluru ? "Bengaluru" : "Coimbatore";
  const state = fileImpliesBengaluru ? "Karnataka" : "Tamil Nadu";
  const sourcePlaceKey = stablePlaceKey(properties.google_maps_url, businessName, address, latitude, longitude);
  const image = representativeImage(category, sourcePlaceKey);
  const rawPhone = cleanText(properties.primary_phone);
  const phone = normalizePhone(rawPhone);
  const rawRating = properties.rating;
  const record = {
    source_type: "imported",
    source_place_key: sourcePlaceKey,
    business_name: businessName,
    category,
    formatted_address: address,
    city,
    state,
    postal_code: postalCode,
    country: "India",
    latitude,
    longitude,
    phone,
    website: category === "Bakery" ? null : normalizeUrl(properties.website),
    google_maps_url: normalizeUrl(properties.google_maps_url),
    rating: parseRating(rawRating),
    review_count: parseCount(properties.review_count),
    business_status: cleanText(properties.business_status),
    opening_hours: normalizeOpeningHours(properties.opening_hours),
    source: cleanText(properties.source) ?? "Google Maps",
    cover_image_url: image.url,
    image_source: image.source,
    image_type: image.type,
    image_attribution: image.attribution,
    claim_status: "unclaimed",
  };
  return {
    record,
    invalidPhone: properties.primary_phone != null && String(properties.primary_phone).trim().length > 0 && !phone,
    invalidRating: rawRating != null && parseRating(rawRating) == null,
    coordinateOrder: { latitude: coordinates[1], longitude: coordinates[0] },
  };
}

export function dedupeKey(record) {
  const name = record.business_name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const address = (record.formatted_address ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return `${name}|${address || `${record.latitude},${record.longitude}`}`;
}
