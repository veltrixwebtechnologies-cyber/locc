import { Link } from "@tanstack/react-router";
import { ChevronRight, ShoppingCart, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { isBengaluruLocation } from "@/lib/social-feed-data";
import { toast } from "sonner";

interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  unit?: string;
  imageUrl: string;
  storeId: string;
  storeName: string;
}

const CBE_TRENDING_PRODUCTS: TrendingProduct[] = [
  {
    id: "prod_mango_1",
    name: "Alphonso Mango",
    price: 220,
    unit: "kg",
    imageUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=300&q=80",
    storeId: "s_kiran1",
    storeName: "Meena Fresh Produce",
  },
  {
    id: "prod_tshirt_1",
    name: "T-Shirt (Cotton)",
    price: 399,
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80",
    storeId: "s_boutique1",
    storeName: "StyleHub Apparel",
  },
  {
    id: "prod_croissant_1",
    name: "Croissant",
    price: 70,
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80",
    storeId: "s_paap1",
    storeName: "Ravi's Artisan Bakery",
  },
  {
    id: "prod_greens_tr",
    name: "Fresh Greens",
    price: 35,
    unit: "bunch",
    imageUrl:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80",
    storeId: "s_kiran1",
    storeName: "Namma Fresh Produce",
  },
  {
    id: "prod_cocoil_tr",
    name: "Coconut Oil",
    price: 349,
    unit: "1L",
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
    storeId: "s_groc2",
    storeName: "Kumar Stores",
  },
];

const BLR_TRENDING_PRODUCTS: TrendingProduct[] = [
  {
    id: "prod_jp_mango_tr",
    name: "Alphonso Mango",
    price: 240,
    unit: "kg",
    imageUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=300&q=80",
    storeId: "s_jp_produce",
    storeName: "Namma Fresh Produce (JP Nagar)",
  },
  {
    id: "prod_jp_shirt_tr",
    name: "T-Shirt (Cotton)",
    price: 399,
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80",
    storeId: "s_jp_apparel",
    storeName: "JP Nagar Readymades & Menswear",
  },
  {
    id: "prod_jp_croissant_tr",
    name: "Croissant",
    price: 70,
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80",
    storeId: "s_jp_bakery",
    storeName: "Ravi's Artisan Bakery (JP Nagar)",
  },
];

export function TrendingWidget() {
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);
  const products = isBLR ? BLR_TRENDING_PRODUCTS : CBE_TRENDING_PRODUCTS;
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (item: TrendingProduct) => {
    cartStore.add(item.storeId, item.storeName, {
      id: item.id,
      name: item.name,
      price: item.price,
      stock: 20,
      imageUrl: item.imageUrl,
      unit: item.unit || "piece",
    });

    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    toast.success(`Added ${item.name} to cart! 🛍️`);

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🔥</span>
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Trending Near You</h3>
        </div>
        <Link
          to="/search"
          search={{ q: "trending", category: undefined }}
          className="group inline-flex items-center gap-0.5 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {products.map((item) => {
          const isAdded = addedIds[item.id];
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] p-2.5 border border-[#F0E6FA]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-2xs border border-[#E2E8F0]">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#0F172A] truncate">{item.name}</h4>
                  <p className="text-[10px] text-[#64748B] truncate">{item.storeName}</p>
                  <p className="text-xs font-extrabold text-[#581C87] mt-0.5">
                    ₹{item.price}
                    {item.unit && <span className="text-[10px] font-normal text-[#64748B]">/{item.unit}</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(item)}
                aria-label={`Add ${item.name} to cart`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition cursor-pointer shadow-xs ${
                  isAdded
                    ? "bg-emerald-500 text-white"
                    : "bg-[#8B2FC9] text-white hover:bg-[#7812B8] active:scale-95"
                }`}
              >
                {isAdded ? <Check className="h-4 w-4 stroke-[3]" /> : <ShoppingCart className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
