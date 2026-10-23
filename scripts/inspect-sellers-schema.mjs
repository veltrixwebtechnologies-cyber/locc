import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flbygucibbrfcwcgzyea.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYnlndWNpYmJyZmN3Y2d6eWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0NTg3MSwiZXhwIjoyMTAwMjIxODcxfQ.irQ1yW6Zaj1AjZd7XHhdB6A7kPze1J8GViv-4Airvy0";

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
