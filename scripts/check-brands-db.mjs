import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flbygucibbrfcwcgzyea.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYnlndWNpYmJyZmN3Y2d6eWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0NTg3MSwiZXhwIjoyMTAwMjIxODcxfQ.irQ1yW6Zaj1AjZd7XHhdB6A7kPze1J8GViv-4Airvy0";

const supabase = createClient(supabaseUrl, serviceKey);

async function checkBrandsInSellers() {
  const brands = [
    "Peter England", "Raymond", "Max Fashion", "Trends", "Allen Solly", 
    "Louis Philippe", "Indian Terrain", "Jockey", "Bata", "Woodland", 
    "Kalyan", "Jos Alukkas", "Joyalukkas"
  ];
  for (const b of brands) {
    const { data: sData } = await supabase.from("sellers").select("id, business_name, city").ilike("business_name", `%${b}%`);
    const { data: pData } = await supabase.from("products").select("id, name, seller_id").ilike("brand", `%${b}%`).limit(3);
    const { data: pData2 } = await supabase.from("products").select("id, name, seller_id").ilike("name", `%${b}%`).limit(3);
    console.log(`Brand ${b}: in sellers: ${sData?.length || 0}, in products by brand: ${pData?.length || 0}, in products by name: ${pData2?.length || 0}`);
  }
}

checkBrandsInSellers().catch(console.error);
