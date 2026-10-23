import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://flbygucibbrfcwcgzyea.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYnlndWNpYmJyZmN3Y2d6eWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0NTg3MSwiZXhwIjoyMTAwMjIxODcxfQ.irQ1yW6Zaj1AjZd7XHhdB6A7kPze1J8GViv-4Airvy0";

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
