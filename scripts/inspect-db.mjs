import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("Checking Supabase connection...");
  
  // 1. Check categories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .limit(30);
  console.log("Categories:", catErr ? catErr.message : categories?.map(c => ({ id: c.id, name: c.name, slug: c.slug })));

  // 2. Check sample products
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, seller_id, name, brand, category, selling_price, mrp, stock, image_url, attributes, status")
    .limit(5);
  console.log("Products count sample:", products?.length, prodErr ? prodErr.message : "");
  if (products && products.length > 0) {
    console.log("Sample product row:", JSON.stringify(products[0], null, 2));
  }

  // 3. Check clothing or fashion products in DB
  const { data: fashionProducts, error: fErr } = await supabase
    .from("products")
    .select("id, name, brand, category, selling_price, attributes, status")
    .or("category.ilike.%fashion%,category.ilike.%clothing%,category.ilike.%boutique%,name.ilike.%shirt%,name.ilike.%dress%")
    .limit(10);
  console.log("Fashion/Clothing products in DB:", fashionProducts?.length, fErr ? fErr.message : "");
  if (fashionProducts && fashionProducts.length > 0) {
    console.log("Sample fashion products:", JSON.stringify(fashionProducts.slice(0, 3), null, 2));
  }

  // 4. Test RPC functions
  const { data: rpcTest1, error: rpcErr1 } = await supabase.rpc("get_customer_visible_products", {
    p_lat: 11.0168,
    p_lng: 76.9558,
    p_limit: 3,
    p_offset: 0
  });
  console.log("RPC get_customer_visible_products:", rpcErr1 ? rpcErr1.message : `Found ${rpcTest1?.length} products`);

  const { data: rpcTest2, error: rpcErr2 } = await supabase.rpc("search_localshore_products", {
    p_search_query: "shirt",
    p_page: 1,
    p_page_size: 3
  });
  console.log("RPC search_localshore_products:", rpcErr2 ? rpcErr2.message : `Found ${rpcTest2?.products?.length} products`);

  const { data: rpcTest3, error: rpcErr3 } = await supabase.rpc("filter_marketplace_products", {
    p_category_slug: "fashion",
    p_limit: 3,
    p_offset: 0
  });
  console.log("RPC filter_marketplace_products:", rpcErr3 ? rpcErr3.message : `Result: ${JSON.stringify(rpcTest3).slice(0, 150)}`);

  const { data: rpcTest4, error: rpcErr4 } = await supabase.rpc("get_marketplace_facets", {
    p_category_slug: "fashion"
  });
  console.log("RPC get_marketplace_facets:", rpcErr4 ? rpcErr4.message : `Result: ${JSON.stringify(rpcTest4).slice(0, 150)}`);

  const { data: rpcTest5, error: rpcErr5 } = await supabase.rpc("get_applicable_filters", {
    p_category_slug: "fashion"
  });
  console.log("RPC get_applicable_filters:", rpcErr5 ? rpcErr5.message : `Result: ${JSON.stringify(rpcTest5).slice(0, 150)}`);
}

inspect().catch(console.error);
