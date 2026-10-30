import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

const supabase = createClient(supabaseUrl, serviceKey);

async function listTables() {
  const { data, error } = await supabase.rpc("get_schema_tables", {});
  if (error) {
    // Try querying postgres tables directly or common names
    const tables = [
      "imported_shops", "imported_products", "shop_products", "inventory", 
      "brand_products", "brands", "categories", "sellers", "products"
    ];
    for (const t of tables) {
      const { count, error: tErr } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (!tErr) {
        console.log(`Table '${t}' exists with ${count} rows`);
      } else {
        console.log(`Table '${t}' does not exist or error:`, tErr.message);
      }
    }
  } else {
    console.log("Tables:", data);
  }
}

listTables().catch(console.error);
