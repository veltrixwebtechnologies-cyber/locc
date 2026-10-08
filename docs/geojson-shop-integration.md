# GeoJSON shop integration report

Implemented locally in `ShorelineShopper-GMap`. No production deployment, Git push, live migration, or database import was performed.

## Architecture findings

The existing migration history (including the sibling SellerHub migrations) defines:

- `public.sellers`: registered seller/storefront identity, business information, coordinates, onboarding data.
- `public.stores`: store coordinates and information, with a mandatory seller owner. Store verification, orders, permissions, and catalog operations depend on that ownership.
- `public.seller_documents`: seller-uploaded banner/logo and onboarding media.
- Existing products/catalog tables and seller-only discovery RPCs (`discover_nearby_shops`, customer-visible shops/products). Seller discovery deliberately requires an approved seller and an available catalog.
- Existing PostGIS geographic functionality. No new geocoding provider or extension installation is introduced.

The existing Google Maps implementation is `LocalShoreMapExperience` → `GoogleMapsMapView`, using `MapMarkerItem`, `ShopCard`, and `ShopCardSheet`. Nearby discovery, homepage listings, and live search already use Supabase services. Existing seed scripts are demo/catalog oriented, not public-business importers.

Because public records have no seller owner or products, inserting them into `stores` would require fake accounts or weakening existing ownership constraints. The minimum safe addition is **one public discovery-record table**, `imported_shops`, integrated into the existing map/card/search services—not another seller/catalog system. No existing seller tables or records are modified.

This audit is based on local source and migration history. The deployed database schema and RPC execution were not verified remotely.

## Implemented behavior

- Reads every `.geojson` file from the existing sibling `../Shops` directory.
- Validates FeatureCollections and individual Points; bad records do not stop parsing/importing the others.
- Stores `coordinates[0]` as longitude and `coordinates[1]` as latitude.
- Cleans private-use icons, zero-width text, and JS scrape artifacts; rejects postal codes/UI labels as phone values.
- Uses explicit dataset categories: Fashion & Apparel and Furniture. Bengaluru is normalized without rewriting the original formatted address. Placeholder hours remain NULL.
- Uses Google place identity/URL where available, with normalized business name/address fallback. Coordinates never identify a business alone. URL query identity is preserved so distinct businesses are not merged.
- Checks existing seller-owned stores and legacy sellers before importing; refuses to proceed if that safety check fails.
- Upserts by a persisted unique source key. Existing imported name/address matches reuse their original key if a scraped URL changes.
- Preserves claim links and existing non-representative cover images on reruns. No accounts, products, opening hours, or phone numbers are invented.
- Uses a server-only service-role credential. Anonymous/authenticated clients have no direct table access; a bounded, read-only nearby RPC provides discovery fields.
- Uses indexed PostGIS radius queries, clamped to 50 km and 100 results maximum. Frontend queries use the user's relevant nearby area (the map's existing radius filter; homepage/search defaults to 7 km), rather than downloading the whole database. Map-pan viewport querying is not added.
- Converts stored database coordinates directly to Google map positions; no address geocoding calls.
- Displays public listings in existing map markers, map cards/detail sheet, nearby homepage cards, discovery results, and live search. Public listings are explicitly distinguished from verified seller shops and cannot enter the product/checkout flow.
- Missing imported-shop RPCs do not block existing seller discovery while the migration is pending.

## Images and future claiming

Category image pools reuse existing static Unsplash image references, assigned deterministically during import and persisted. No Unsplash API search is made per shop, page load, or render; no new image-provider credential is required. Images are labelled **representative**, never actual store photos. Covers load lazily with fallback behavior in cards.

Seller-supplied covers take priority over representative covers and are preserved by imports. A future approved claim can populate `claimed_by_seller_id` and `claim_status`. The RPC prioritizes linked seller banner/logo browser URLs. Private storage paths are deliberately not exposed as usable image URLs; a future claim/media workflow must publish or resolve an approved cover URL using the existing media system. No claim workflow is built in this change.

Unsplash references: [license](https://unsplash.com/license), [developer documentation](https://unsplash.com/documentation). API-specific attribution/hotlink/download requirements would need to be implemented if a future version introduces the API; this version does not use it.

## Verification results

Final dry run:

| Metric | Result |
| --- | ---: |
| Files processed | 3 |
| Records found | 150 |
| Usable prepared records | 145 |
| Duplicate records skipped within supplied files | 0 |
| Invalid coordinates | 0 |
| Invalid phone values removed | 141 |
| Invalid source records skipped | 5 |
| Live inserts/updates | 0 / 0 |

Furniture features 5, 22, 23, 29, and 30 have no usable business name after scrape-icon cleanup. They are skipped, not replaced with fake names.

Tests cover coordinate order, all three datasets, cleaning, postal-code rejection, same-building distinct shops, URL identity, repeated upserts, preservation of claimed seller images, stored-coordinate marker conversion, imported search results, and existing seller search when the migration is missing.

- `npm run test:maps`: 20 test files pass, including existing seller/discovery/checkout/map regression coverage.
- `npx tsc --noEmit --pretty false`: passes.
- `npm run build`: passes. Existing build warnings remain.
- Scoped ESLint with the formatting rule disabled: passes.
- Full `npm run lint`: fails on repository-wide Prettier formatting violations (2,557 reported in the checked working tree). Unrelated dirty files were not reformatted.

SQL execution, real Supabase writes, seller-account end-to-end browser behavior, and production performance remain unverified until the migration and import are run. Idempotency was verified using an in-memory Supabase-shaped client; this is not a substitute for a staging-database check.

## Required manual steps

1. In the **same Supabase project configured for this app**, review and execute `supabase/migrations/20261005190000_imported_public_shops.sql`. It requires the existing sellers, seller_documents, and PostGIS schema. Do not run it against an unrelated project.
2. Provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the server-side environment or existing local `.env`. Never prefix the service key with `VITE_`, commit it, or include it in frontend code. The importer also checks the existing `stores` table.
3. From this project directory, run:

```sh
npm run import:shops -- --dry-run
npm run import:shops
```

The first command only parses files. The second performs the paginated safety checks and upserts. Insert counts may be below 145 if matching registered sellers already exist. Run the second command again to confirm zero new inserts and stable record count.

4. Open the existing customer map near Bengaluru or Coimbatore and select the relevant category. Check markers against their supplied coordinates, representative-image labels, external website/Google links, and existing registered seller cards. Imported listings do not require fake products to appear.

## Files added

- `supabase/migrations/20261005190000_imported_public_shops.sql`
- `scripts/geojson-shop-normalizer.mjs`
- `scripts/import-geojson-shops.mjs`
- `src/lib/imported-shops.ts`
- `tests/geojson-shop-import.test.mjs`
- `docs/geojson-shop-integration.md`

## Files modified for this task

- `package.json`
- `src/lib/map-service/types.ts`
- `src/lib/localshore-shop-marker.ts`
- `src/hooks/use-shop-discovery.ts`
- `src/components/map/localshore-map-experience.tsx`
- `src/components/map/google-maps-map-view.tsx`
- `src/components/map/shop-card-sheet.tsx`
- `src/components/shop-card.tsx`
- `src/lib/live-search.ts`
- `src/components/ui/swiggy-instant-search-dropdown.tsx`
- `src/components/hero-section.tsx`
- `src/routes/index.tsx`
- `tests/live-search.test.mjs`

Several of these files already had user changes before this task. Those changes, other dirty files, and the original GeoJSON datasets were preserved.
