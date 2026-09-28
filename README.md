# LocalShore Shopper

LocalShore Shopper is the customer-facing marketplace for discovering nearby local shops, browsing products, placing orders, and tracking deliveries.

The application is built with React, Vite, TanStack Router, TanStack Query, Supabase, PostGIS, Leaflet/OpenStreetMap, and Razorpay server functions.

## Features

- Location-aware shop discovery using the customer’s confirmed latitude and longitude.
- Category-aware shop and product filtering.
- Live shop and product search from the Supabase catalog.
- Nearby shop sorting by calculated distance.
- Configurable 5 km, 7 km, and 10 km discovery radius options.
- Existing-radius fallback when the newer zone-discovery RPC is not yet deployed.
- Product catalog, cart, wishlist, checkout, orders, addresses, rewards, and profile pages.
- Phone OTP, email OTP, and password authentication flows.
- Leaflet map selection and delivery-location confirmation.
- Razorpay payment-order creation and server-side payment verification.
- Responsive desktop and mobile layouts.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project with the LocalShore schema and migrations applied
- PostGIS enabled in Supabase for geographic queries

## Local setup

```bash
git clone <repository-url>
cd ShorelineShopper
npm install
cp .env.example .env
```

Edit `.env` with the Supabase project values. Never commit `.env`, service-role keys, Razorpay secrets, or Redis credentials.

Start the customer application:

```bash
npm run dev
```

The default local URL is:

```text
http://127.0.0.1:8080
```

To use another port:

```bash
npm run dev -- --host 127.0.0.1 --port 8080 --strictPort
```

## Running the LocalShore apps together

From `/home/sudhan/Downloads/LocalShoree`:

```bash
(cd "ShorelineShopper" && npm run dev -- --host 127.0.0.1 --port 8080 --strictPort)
(cd "SellerHub" && npm run dev -- --host 127.0.0.1 --port 8082 --strictPort)
(cd "Delivery Partner Hub" && npm run dev -- --host 127.0.0.1 --port 8081 --strictPort)
```

The companion applications use:

| Application | Local URL |
| --- | --- |
| ShorelineShopper | `http://127.0.0.1:8080` |
| Delivery Partner Hub | `http://127.0.0.1:8081` |
| SellerHub | `http://127.0.0.1:8082` |

## Environment variables

The full template is in `.env.example`.

### Browser-safe variables

These may use the `VITE_` prefix because they are exposed to the browser:

```text
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SELLER_HUB_URL
VITE_DELIVERY_HUB_URL
VITE_RAZORPAY_KEY_ID
```

### Server-only variables

Never expose these with a `VITE_` prefix:

```text
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
REDIS_URL
```

## Project structure

```text
src/
  components/       Reusable UI, cards, filters, maps, and navigation
  hooks/             TanStack Query and application hooks
  integrations/      Supabase and Firebase clients
  lib/               Location, discovery, cart, payments, search, and utilities
  routes/            TanStack Router pages and API/server-function routes
  routeTree.gen.ts   Generated TanStack Router route tree
public/              Static images, branding, favicon, and marketplace assets
supabase/             Database configuration, migrations, and seed data
tests/                Node-based regression and safety tests
```

## Location and shop discovery

The application only uses a location after it has been selected or explicitly confirmed by the customer. It does not silently use a hard-coded city coordinate.

The discovery flow is:

```text
Confirmed customer coordinates
        ↓
Selected category and search query
        ↓
Supabase/PostGIS shop discovery RPC
        ↓
Distance and availability filtering
        ↓
Nearest relevant shops
```

The client expects the discovery RPC to return valid shop coordinates and `distance_km`. Invalid or missing coordinates are discarded instead of being displayed with a fake distance.

The preferred RPC is:

```text
discover_nearby_shops
```

If that migration is not deployed, the client falls back only when Supabase reports that the function is missing:

```text
get_customer_visible_shops
```

The fallback preserves the existing catalog visibility rules. It does not replace unrelated categories with placeholder shops.

## Search behavior

Header search is live and location-aware:

1. The query is debounced and normalized.
2. Matching shops are loaded from the nearby discovery RPC.
3. Matching products are loaded from `get_customer_visible_products`.
4. Results are deduplicated by database identity.
5. Selecting a shop opens that shop’s catalog without leaking the search text into the shop’s product-category filter.
6. Entering a query or pressing the search icon opens `/search?q=...`.

## Supabase and migrations

Apply database migrations through the Supabase CLI or Supabase SQL Editor according to your deployment process. Migrations are stored in:

```text
supabase/migrations/
```

Important database capabilities include:

- Approved and active seller visibility
- Active, in-stock product visibility
- PostGIS distance calculation
- Category-aware shop discovery
- Product and shop search RPCs
- Operational zones and fallback discovery, when deployed

After deploying a new RPC, refresh the Supabase schema cache if your deployment process requires it, then verify the function from the app before enabling it in production.

## Development commands

```bash
# Start Vite development server
npm run dev

# Type-check the project
npx tsc --noEmit --pretty false

# Run regression and safety tests
npm run test:maps

# Run ESLint
npm run lint

# Build the production bundle
npm run build

# Preview the production build locally
npm run preview

# Format source files
npm run format
```

## Testing checklist

Before opening a pull request, verify:

- `npm run test:maps` passes.
- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.
- Location permission denial leads to manual location selection.
- Invalid or very inaccurate GPS coordinates are not treated as precise delivery locations.
- Search results contain only relevant nearby shops and products.
- Selecting a shop opens the correct shop and product catalog.
- Cart contents survive refresh for the same customer session.
- Checkout requires a confirmed delivery location.
- Payment verification uses the server-side order amount and payment status.
- Desktop and mobile layouts have no horizontal overflow.

## Security notes

- Keep Supabase service-role credentials server-side only.
- Do not trust prices, stock, seller IDs, coordinates, or payment status supplied by the browser.
- Keep payment creation and verification behind authenticated server functions.
- Enforce row-level security in Supabase for customer, seller, order, and payment data.
- Do not log OTPs, payment secrets, authorization headers, or personal location data unnecessarily.
- Apply the payment RPC permission migration before production use so payment functions are not executable by anonymous clients.

## Deployment

The project is configured for a Vite/TanStack Start build and Vercel-compatible Nitro output.

```bash
npm run build
```

Configure the production environment variables in the hosting provider, apply Supabase migrations, refresh the Supabase schema cache when needed, and confirm the deployed app can reach the required RPCs before accepting orders.

## Related applications

LocalShore is split into three applications:

- `ShorelineShopper`: customer marketplace
- `SellerHub`: seller and catalog management
- `Delivery Partner Hub`: delivery-partner workflows and tracking

All three applications should use the same Supabase project and compatible seller, product, order, location, and delivery schemas.
