import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

const supabase = createClient(supabaseUrl, serviceKey);

async function checkFks() {
  // Test inserting a test product into products table to see if seller_id must exist in sellers
  const testId = "00000000-0000-0000-0000-000000000099";
  const { error: insErr } = await supabase.from("products").insert({
    id: testId,
    seller_id: "a1000001-0001-4000-8000-000000000001", // Peter England imported_shop id
    user_id: "0c992219-e93c-40a3-a0cc-169e936ba878",
    name: "Test Check FK",
    selling_price: 999,
    category: "Fashion & Apparel",
    status: "active"
  });
  console.log("Insert test into products table with imported_shop id:", insErr ? insErr.message : "Success!");
  
  if (!insErr) {
    await supabase.from("products").delete().eq("id", testId);
    console.log("Cleaned up test product.");
  }
}

checkFks().catch(console.error);
