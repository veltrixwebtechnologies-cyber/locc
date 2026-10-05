import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "supabase/migrations/20261004190000_fix_shop_status_overload_ambiguity.sql",
  "utf8",
);

test("shop status overload migration removes default-argument ambiguity", () => {
  assert.match(migration, /RENAME TO get_shop_status_impl/);
  assert.match(migration, /_seller_id uuid,\s*_at timestamptz,\s*_tz text\s*\)/);
  assert.match(migration, /get_shop_status\(\s*_seller_id uuid,\s*_at timestamptz\s*\)/);
  assert.match(migration, /get_shop_status\(_seller_id uuid\)/);
  assert.doesNotMatch(migration, /_at timestamptz DEFAULT|_tz text\s+DEFAULT/);
});
