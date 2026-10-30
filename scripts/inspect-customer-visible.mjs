import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCustomerVisible() {
  const { data, error } = await supabase.rpc("get_customer_visible_products", {
    p_lat: 11.0168,
    p_lng: 76.9558,
    p_limit: 20,
    p_offset: 0
  });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Retrieved ${data.length} products`);
  if (data.length > 0) {
    console.log("Product keys:", Object.keys(data[0]));
    console.log("First 3 products:", JSON.stringify(data.slice(0, 3), null, 2));
    
    // Check if any product has attributes or what attributes look like
    const withAttrs = data.filter(p => p.attributes && Object.keys(p.attributes).length > 0);
    console.log(`Products with non-empty attributes: ${withAttrs.length}`);
    if (withAttrs.length > 0) {
      console.log("Sample attributes:", withAttrs.slice(0, 3).map(p => ({ name: p.name, category: p.category, attributes: p.attributes })));
    }
    
    // Check categories present in data
    const categories = [...new Set(data.map(p => p.category))];
    console.log("Categories in visible products:", categories);
  }
}

inspectCustomerVisible().catch(console.error);
