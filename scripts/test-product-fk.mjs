import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flbygucibbrfcwcgzyea.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYnlndWNpYmJyZmN3Y2d6eWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0NTg3MSwiZXhwIjoyMTAwMjIxODcxfQ.irQ1yW6Zaj1AjZd7XHhdB6A7kPze1J8GViv-4Airvy0";

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
