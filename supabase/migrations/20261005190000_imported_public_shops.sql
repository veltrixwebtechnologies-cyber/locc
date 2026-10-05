-- Public discovery listings are intentionally separate from seller-owned
-- stores: imported records must never imply a seller account or a catalog.
BEGIN;
SET LOCAL search_path = public, extensions;
CREATE TABLE IF NOT EXISTS public.imported_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'imported' CHECK (source_type = 'imported'),
  source_place_key text NOT NULL UNIQUE,
  business_name text NOT NULL,
  category text NOT NULL,
  formatted_address text,
  city text,
  state text,
  postal_code text,
  country text,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  phone text,
  website text,
  google_maps_url text,
  rating numeric(2,1) CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),
  review_count integer CHECK (review_count IS NULL OR review_count >= 0),
  business_status text,
  opening_hours text,
  source text NOT NULL,
  cover_image_url text,
  image_source text CHECK (image_source IS NULL OR image_source IN ('unsplash', 'seller')),
  image_type text CHECK (image_type IS NULL OR image_type IN ('representative', 'seller')),
  image_attribution text,
  claim_status text NOT NULL DEFAULT 'unclaimed'
    CHECK (claim_status IN ('unclaimed', 'pending', 'claimed')),
  claimed_by_seller_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS imported_shops_geo_idx
  ON public.imported_shops USING gist (
    (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography)
  );
CREATE INDEX IF NOT EXISTS imported_shops_category_idx ON public.imported_shops (category);
CREATE INDEX IF NOT EXISTS imported_shops_name_search_idx
  ON public.imported_shops USING gin (to_tsvector('simple', business_name));

ALTER TABLE public.imported_shops ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.imported_shops FROM anon, authenticated;
GRANT ALL ON public.imported_shops TO service_role;

CREATE OR REPLACE FUNCTION public.get_nearby_imported_shops(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 7,
  p_category_slug text DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  business_name text,
  category text,
  formatted_address text,
  city text,
  state text,
  postal_code text,
  country text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  phone text,
  website text,
  google_maps_url text,
  rating numeric,
  review_count integer,
  cover_image_url text,
  image_source text,
  image_type text,
  image_attribution text,
  claim_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  WITH input AS (
    SELECT
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS origin,
      LEAST(GREATEST(COALESCE(p_radius_km, 7), 0.1), 50) * 1000 AS radius_m,
      NULLIF(lower(trim(p_category_slug)), '') AS category_key,
      NULLIF(trim(p_query), '') AS query_text
    WHERE p_lat BETWEEN -90 AND 90 AND p_lng BETWEEN -180 AND 180
  ), eligible AS (
    SELECT s.*, i.origin,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
        i.origin
      ) / 1000.0 AS measured_distance_km,
      CASE WHEN s.claimed_by_seller_id IS NULL THEN s.cover_image_url ELSE
        COALESCE(media.file_url, s.cover_image_url)
      END AS resolved_image_url
    FROM public.imported_shops s
    CROSS JOIN input i
    LEFT JOIN LATERAL (
      SELECT d.file_url
      FROM public.seller_documents d
      WHERE d.seller_id = s.claimed_by_seller_id
        AND d.doc_type IN ('shopBanner', 'shopLogo')
        AND NULLIF(d.file_url, '') IS NOT NULL
        -- Private storage paths are not browser URLs. Keep the representative
        -- cover until a claiming workflow publishes an approved image URL.
        AND d.file_url ~ '^https?://'
      ORDER BY CASE d.doc_type WHEN 'shopBanner' THEN 0 ELSE 1 END, d.created_at DESC
      LIMIT 1
    ) media ON true
    WHERE ST_DWithin(
      ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
      i.origin,
      i.radius_m
    )
      AND (
        i.category_key IS NULL
        OR CASE
          WHEN lower(s.category) LIKE '%fashion%' OR lower(s.category) LIKE '%apparel%' THEN 'fashion'
          WHEN lower(s.category) LIKE '%furniture%' THEN 'furniture'
          ELSE regexp_replace(lower(s.category), '[^a-z0-9]+', '_', 'g')
        END = regexp_replace(i.category_key, '[^a-z0-9]+', '_', 'g')
      )
      AND (
        i.query_text IS NULL
        OR s.business_name ILIKE '%' || i.query_text || '%'
        OR COALESCE(s.category, '') ILIKE '%' || i.query_text || '%'
        OR COALESCE(s.formatted_address, '') ILIKE '%' || i.query_text || '%'
        OR COALESCE(s.city, '') ILIKE '%' || i.query_text || '%'
      )
  )
  SELECT e.id, e.business_name, e.category, e.formatted_address, e.city,
    e.state, e.postal_code, e.country, e.latitude, e.longitude,
    e.measured_distance_km, e.phone, e.website, e.google_maps_url,
    e.rating, e.review_count, e.resolved_image_url,
    CASE WHEN e.claimed_by_seller_id IS NOT NULL AND e.resolved_image_url IS DISTINCT FROM e.cover_image_url
      THEN 'seller' ELSE e.image_source END,
    CASE WHEN e.claimed_by_seller_id IS NOT NULL AND e.resolved_image_url IS DISTINCT FROM e.cover_image_url
      THEN 'seller' ELSE e.image_type END,
    CASE WHEN e.claimed_by_seller_id IS NOT NULL AND e.resolved_image_url IS DISTINCT FROM e.cover_image_url
      THEN NULL ELSE e.image_attribution END,
    e.claim_status
  FROM eligible e
  ORDER BY e.measured_distance_km, e.business_name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
$function$;

REVOKE ALL ON FUNCTION public.get_nearby_imported_shops(double precision, double precision, double precision, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_nearby_imported_shops(double precision, double precision, double precision, text, text, integer) TO anon, authenticated;
COMMIT;
