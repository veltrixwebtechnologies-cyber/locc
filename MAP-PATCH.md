# Delivery pin and tracking patch

Checkout requires a valid delivery pin and explicit confirmation that it matches the delivery address. Editing the address or moving the pin invalidates confirmation. Coarse GPS and missing coordinates no longer silently supply a destination. Order creation validates coordinates before writing.

Customer tracking uses road routes and cancels obsolete route requests. Routing failures display an error instead of a fabricated straight-line route. Missing destination pins are reported explicitly.

Validation: `npm run test:maps`, `npx tsc --noEmit`, and `npm run build`. Tests cover confirmation invalidation, route failure, and road-segment progress. Real authenticated checkout and delivery tracking still require Supabase configuration and test accounts.

Release with the matching DeliveryHub and VendorAdmin branches. Existing incorrect order pins are not automatically repaired. Verify saved-address checkout, manual pin changes, pickup-to-customer route changes, and customer updates during an authenticated phone delivery. Public OSRM car routes depend on network availability and map coverage and do not include live traffic or motorcycle-specific routing.
