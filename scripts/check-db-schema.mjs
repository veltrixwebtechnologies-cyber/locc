import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flbygucibbrfcwcgzyea.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYnlndWNpYmJyZmN3Y2d6eWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0NTg3MSwiZXhwIjoyMTAwMjIxODcxfQ.irQ1yW6Zaj1AjZd7XHhdB6A7kPze1J8GViv-4Airvy0";

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  console.log("Checking database...");

  // 1. Check imported_shops
  const { data: shops, error: sErr } = await supabase
    .from("imported_shops")
    .select("id, business_name, category, city")
    .limit(10);
  console.log(`Imported shops count: ${shops?.length}`, sErr ? sErr.message : "");
  if (shops) {
    console.log("Sample shops:", shops.slice(0, 3));
  }

  // 2. Check products table
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("*")
    .limit(5);
  console.log(`Products table sample count: ${products?.length}`, pErr ? pErr.message : "");
  if (products && products.length > 0) {
    console.log("Product columns:", Object.keys(products[0]));
    console.log("Sample product:", products[0]);
  }

  // 3. Count total products in products table
  const { count, error: cErr } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  console.log(`Total products in DB: ${count}`, cErr ? cErr.message : "");

  // 4. Check sellers table
  const { data: sellers, error: selErr } = await supabase
    .from("sellers")
    .select("id, business_name, business_type")
    .limit(10);
  console.log(`Sellers count: ${sellers?.length}`, selErr ? selErr.message : "");
  if (sellers) {
    console.log("Sample sellers:", sellers.slice(0, 5));
  }
}

check().catch(console.error);
