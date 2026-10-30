import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectColumns() {
  for (const t of ["imported_products", "brand_products", "shop_products", "inventory"]) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(`Table ${t} columns:`, data && data[0] ? Object.keys(data[0]) : "No rows, let's insert empty or check");
    }
  }
}

inspectColumns().catch(console.error);
