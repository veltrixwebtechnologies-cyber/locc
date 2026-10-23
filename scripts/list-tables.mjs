import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flbygucibbrfcwcgzyea.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYnlndWNpYmJyZmN3Y2d6eWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0NTg3MSwiZXhwIjoyMTAwMjIxODcxfQ.irQ1yW6Zaj1AjZd7XHhdB6A7kPze1J8GViv-4Airvy0";

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
