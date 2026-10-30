import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectSellers() {
  const { data: sCols, error: cErr } = await supabase.from("sellers").select("*").limit(1);
  if (sCols && sCols[0]) {
    console.log("Sellers table columns:", Object.keys(sCols[0]));
    console.log("Sample seller:", sCols[0]);
  } else {
    console.log("Sellers error:", cErr?.message);
  }
}

inspectSellers().catch(console.error);
