import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { dedupeKey, googlePlaceIdentity, normalizeFeature } from "./geojson-shop-normalizer.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const inputDir = path.resolve(scriptDir, "../../Shops");

export async function collectGeoJsonRows(directory = inputDir) {
  const summary = {
    filesProcessed: 0,
    recordsFound: 0,
    inserted: 0,
    updated: 0,
    duplicatesSkipped: 0,
    invalidCoordinates: 0,
    invalidPhoneValuesRemoved: 0,
    errors: 0,
  };
  const rows = [];
  const placeKeys = new Set();
  const nameAddressKeys = new Set();
  const files = (await fs.readdir(directory)).filter((file) => file.toLowerCase().endsWith(".geojson")).sort();

  for (const file of files) {
    try {
      const parsed = JSON.parse(await fs.readFile(path.join(directory, file), "utf8"));
      if (parsed?.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
        summary.errors += 1;
        console.error(`${file}: expected a GeoJSON FeatureCollection with features[]`);
        continue;
      }
      summary.filesProcessed += 1;
      summary.recordsFound += parsed.features.length;
      for (const [index, feature] of parsed.features.entries()) {
        try {
          const result = normalizeFeature(feature, file);
          if (result.invalidCoordinates) {
            summary.invalidCoordinates += 1;
            continue;
          }
          if (result.error) {
            summary.errors += 1;
            console.error(`${file} feature ${index + 1}: ${result.error}`);
            continue;
          }
          if (result.invalidPhone) summary.invalidPhoneValuesRemoved += 1;
          const row = result.record;
          const nameAddress = dedupeKey(row);
          if (placeKeys.has(row.source_place_key) || nameAddressKeys.has(nameAddress)) {
            summary.duplicatesSkipped += 1;
            continue;
          }
          placeKeys.add(row.source_place_key);
          nameAddressKeys.add(nameAddress);
          rows.push(row);
        } catch (error) {
          summary.errors += 1;
          console.error(`${file} feature ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      summary.errors += 1;
      console.error(`${file}: could not read/parse file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { rows, summary };
}

function normalizeBusinessName(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function normalizeAddress(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function isSameNamedAddress(shop, existing) {
  const name = normalizeBusinessName(shop.business_name);
  const existingName = normalizeBusinessName(existing.name);
  if (!name || name !== existingName) return false;
  const address = normalizeAddress(shop.formatted_address);
  const existingAddress = normalizeAddress([existing.address_line1, existing.city, existing.state].filter(Boolean).join(", "));
  return Boolean(address && existingAddress && Math.min(address.length, existingAddress.length) >= 8 && (address.includes(existingAddress) || existingAddress.includes(address)));
}

async function fetchAllRows(client, table, columns) {
  const all = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from(table).select(columns).order("id").range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Unable to verify existing ${table} before import: ${error.message}`);
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) return all;
  }
}

export async function importRows({ directory = inputDir, dryRun = process.argv.includes("--dry-run"), client = null } = {}) {
  const { rows, summary } = await collectGeoJsonRows(directory);
  if (dryRun) {
    console.log("Dry run: database was not modified.");
    printSummary(summary);
    return summary;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!client && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server-side environment before importing.");
  }
  const supabase = client ?? createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: async (input, init = {}) => {
        const timeoutSignal = AbortSignal.timeout(20_000);
        const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
        return fetch(input, { ...init, signal });
      },
    },
  });
  console.log(`Prepared ${rows.length} valid GeoJSON records; checking registered seller stores...`);
  const sellerStores = await fetchAllRows(supabase, "stores", "name,address_line1,city,state,google_place_id");
  console.log(`Checked ${sellerStores.length} seller stores; checking legacy seller profiles...`);
  const legacySellers = await fetchAllRows(supabase, "sellers", "business_name,address_line1,city,state,wizard_data");
  console.log(`Checked ${legacySellers.length} seller profiles; checking existing imported listings...`);
  const registeredBusinesses = [
    ...sellerStores,
    ...legacySellers.map((seller) => ({
      name: seller.business_name,
      address_line1: seller.address_line1,
      city: seller.city,
      state: seller.state,
      google_place_id: seller.wizard_data?.googlePlaceId ?? null,
    })),
  ];
  const importedRows = [];
  for (const row of rows) {
    const placeIdentity = googlePlaceIdentity(row.google_maps_url);
    const matchesSeller = registeredBusinesses.some((business) =>
      (placeIdentity && business.google_place_id === placeIdentity) || isSameNamedAddress(row, business),
    );
    if (matchesSeller) summary.duplicatesSkipped += 1;
    else importedRows.push(row);
  }

  const existingImports = await fetchAllRows(supabase, "imported_shops", "source_place_key,business_name,formatted_address,latitude,longitude,cover_image_url,image_source,image_type,image_attribution,claim_status,claimed_by_seller_id");
  console.log(`Checked ${existingImports.length} imported listings; preparing safe upserts...`);
  const knownRows = new Map(existingImports.map((row) => [row.source_place_key, row]));
  const knownNamesAndAddresses = new Map(existingImports.map((row) => [dedupeKey(row), row.source_place_key]));
  for (const row of importedRows) {
    // A scraped URL can change while the business identity remains the same.
    // Reuse its persisted key rather than creating a second discovery record.
    if (!knownRows.has(row.source_place_key)) {
      const previousKey = knownNamesAndAddresses.get(dedupeKey(row));
      if (previousKey) row.source_place_key = previousKey;
    }
  }

  // Upsert in small chunks. A failed chunk is retried row-by-row so one
  // malformed/constraint-breaking record cannot prevent the rest of the import.
  const toUpsert = (row) => {
    const existing = knownRows.get(row.source_place_key);
    if (!existing) return { ...row, claimed_by_seller_id: null, updated_at: new Date().toISOString() };
    const preserveSellerImage = Boolean(existing.cover_image_url && existing.image_type !== "representative");
    return {
      ...row,
      cover_image_url: preserveSellerImage ? existing.cover_image_url : row.cover_image_url,
      image_source: preserveSellerImage ? existing.image_source : row.image_source,
      image_type: preserveSellerImage ? existing.image_type : row.image_type,
      image_attribution: preserveSellerImage ? existing.image_attribution : row.image_attribution,
      claim_status: existing.claim_status,
      claimed_by_seller_id: existing.claimed_by_seller_id,
      updated_at: new Date().toISOString(),
    };
  };
  for (let offset = 0; offset < importedRows.length; offset += 25) {
    const batch = importedRows.slice(offset, offset + 25).map(toUpsert);
    let error;
    try {
      ({ error } = await supabase.from("imported_shops").upsert(batch, { onConflict: "source_place_key" }));
    } catch (batchError) {
      error = batchError;
    }
    if (!error) {
      for (const row of batch) {
        if (knownRows.has(row.source_place_key)) summary.updated += 1;
        else summary.inserted += 1;
      }
      console.log(`Imported batch ${Math.floor(offset / 25) + 1}: ${batch.length} records.`);
      continue;
    }
    for (const row of batch) {
      try {
        const { error: rowError } = await supabase.from("imported_shops").upsert(toUpsert(row), { onConflict: "source_place_key" });
        if (rowError) {
          summary.errors += 1;
          console.error(`${row.business_name}: ${rowError.message}`);
        } else if (knownRows.has(row.source_place_key)) summary.updated += 1;
        else summary.inserted += 1;
      } catch (rowError) {
        summary.errors += 1;
        console.error(`${row.business_name}: ${rowError instanceof Error ? rowError.message : String(rowError)}`);
      }
    }
  }
  console.log("Import finished.");
  printSummary(summary);
  return summary;
}

function printSummary(summary) {
  console.log(`Files processed: ${summary.filesProcessed}`);
  console.log(`Records found: ${summary.recordsFound}`);
  console.log(`Inserted: ${summary.inserted}`);
  console.log(`Updated: ${summary.updated}`);
  console.log(`Duplicates skipped: ${summary.duplicatesSkipped}`);
  console.log(`Invalid coordinates: ${summary.invalidCoordinates}`);
  console.log(`Invalid phone values removed: ${summary.invalidPhoneValuesRemoved}`);
  console.log(`Errors: ${summary.errors}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  importRows().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
