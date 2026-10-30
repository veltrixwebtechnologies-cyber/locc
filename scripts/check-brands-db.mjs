import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

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
