import assert from "node:assert";
import {
  filterProductByState,
  calculateContextAwareFacets,
  filterStoreByState,
  type ActiveFilterState,
} from "../src/lib/dynamic-filter-engine.ts";
import type { DynamicAttributeFilter } from "../src/lib/category-taxonomy.ts";

function runTests() {
  console.log("🧪 Running LocalShore Dynamic Filter & Facet Engine Unit Tests...\n");

  const mockProducts = [
    {
      id: "p1",
      name: "Classic Cotton T-Shirt",
      brand: "Puma",
      price: 800,
      category: "Fashion & Clothing",
      attributes: { size: ["M", "L"], color: ["Black"], fabric: ["Cotton"] },
    },
    {
      id: "p2",
      name: "Slim Fit Linen Shirt",
      brand: "Raymond",
      price: 1500,
      category: "Fashion & Clothing",
      attributes: { size: ["S", "M"], color: ["White"], fabric: ["Linen"] },
    },
    {
      id: "p3",
      name: "Oversized Printed Hoodie",
      brand: "Puma",
      price: 2500,
      category: "Fashion & Clothing",
      attributes: { size: ["XL"], color: ["Black"], fabric: ["Cotton"] },
    },
    {
      id: "p4",
      name: "Silk Saree Festival Edition",
      brand: "Craftly",
      price: 4500,
      category: "Boutiques",
      attributes: { color: ["Red"], fabric: ["Silk"] },
    },
  ];

  // Test 1: OR within same attribute key
  {
    const state: ActiveFilterState = {
      selectedAttributes: {
        size: ["M", "L"],
      },
    };
    const matches = mockProducts.filter((p) => filterProductByState(p as any, state));
    assert.deepStrictEqual(
      matches.map((p) => p.id),
      ["p1", "p2"],
      "Test 1 Failed: OR logic within attribute key"
    );
    console.log("✅ Test 1 Passed: OR evaluation within attribute key (Size = M OR L)");
  }

  // Test 2: AND across distinct attribute keys
  {
    const state: ActiveFilterState = {
      selectedAttributes: {
        size: ["M"],
        color: ["Black"],
      },
    };
    const matches = mockProducts.filter((p) => filterProductByState(p as any, state));
    assert.deepStrictEqual(
      matches.map((p) => p.id),
      ["p1"],
      "Test 2 Failed: AND logic across attribute keys"
    );
    console.log("✅ Test 2 Passed: AND evaluation across distinct attribute keys (Size = M AND Color = Black)");
  }

  // Test 3: Price range filtering
  {
    const state: ActiveFilterState = {
      priceRange: [1000, 3000],
      selectedAttributes: {},
    };
    const matches = mockProducts.filter((p) => filterProductByState(p as any, state));
    assert.deepStrictEqual(
      matches.map((p) => p.id),
      ["p2", "p3"],
      "Test 3 Failed: Price range filtering"
    );
    console.log("✅ Test 3 Passed: Price range filtering (1000 to 3000)");
  }

  // Test 4: Brand filtering
  {
    const state: ActiveFilterState = {
      selectedBrands: ["Puma"],
      selectedAttributes: {},
    };
    const matches = mockProducts.filter((p) => filterProductByState(p as any, state));
    assert.deepStrictEqual(
      matches.map((p) => p.id),
      ["p1", "p3"],
      "Test 4 Failed: Brand filtering"
    );
    console.log("✅ Test 4 Passed: Brand filtering (Brand = Puma)");
  }

  // Test 5: Context-aware facet count calculation
  {
    const sizeFilterDef: DynamicAttributeFilter = {
      id: "size",
      name: "Size",
      type: "multi_select",
      options: [
        { label: "S", value: "S" },
        { label: "M", value: "M" },
        { label: "L", value: "L" },
        { label: "XL", value: "XL" },
      ],
    };

    const activeState: ActiveFilterState = {
      selectedBrands: ["Puma"],
      selectedAttributes: {
        size: ["M"],
      },
    };

    const facetResults = calculateContextAwareFacets(mockProducts as any, sizeFilterDef, activeState);
    const counts = Object.fromEntries(facetResults.options.map((o) => [o.value, o.count]));

    assert.strictEqual(counts["M"], 1, "Facet M count mismatch");
    assert.strictEqual(counts["L"], 1, "Facet L count mismatch");
    assert.strictEqual(counts["XL"], 1, "Facet XL count mismatch");
    assert.strictEqual(counts["S"], 0, "Facet S count mismatch");
    console.log("✅ Test 5 Passed: Context-aware facet calculation (Active key excluded during facet count)");
  }

  // Test 6: Store filtering
  {
    const store = {
      id: "s1",
      name: "Rao Supermarket",
      category: "Kirana & Grocery",
      rating: 4.6,
      distanceKm: 2.1,
      isOpen: true,
      etaMin: 25,
    };

    assert.strictEqual(
      filterStoreByState(store as any, { maxDistanceKm: 3, minRating: 4.0, openNowOnly: true }),
      true,
      "Store matching failed"
    );
    assert.strictEqual(
      filterStoreByState(store as any, { maxDistanceKm: 1.5 }),
      false,
      "Store distance filter failed"
    );
    assert.strictEqual(
      filterStoreByState(store as any, { minRating: 4.8 }),
      false,
      "Store rating filter failed"
    );
    console.log("✅ Test 6 Passed: Store filtering by distance, rating, and open status");
  }

  console.log("\n🎉 All 6 Dynamic Filter Engine tests PASSED successfully!");
}

runTests();
