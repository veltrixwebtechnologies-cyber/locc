export function parseImportedProductId(id: string) {
  const match =
    /^sample:(imported:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([a-z0-9-]+)$/i.exec(
      id,
    );
  return match ? { shopId: match[1], slug: match[2] } : null;
}

const descriptions: Record<string, string> = {
  "birthday cake":
    "A celebration cake category for birthdays and special occasions. Choose a flavour, size and design with the bakery before placing a real order.",
  "chocolate cake":
    "A chocolate cake category for celebrations or sharing. Ask the bakery about available recipes, portion sizes and decoration options.",
  "black forest cake":
    "A Black Forest-style cake category. The bakery needs to confirm the actual recipe, toppings, size and availability.",
  "bread loaf":
    "A bread loaf category for sandwiches, toast and everyday meals. Ask the bakery about the bread variety, loaf weight and preparation date.",
  bun: "A bakery bun category for snacks and meals. Sweet, savoury and filled varieties may differ; confirm the available variety with the shop.",
  puffs:
    "A savoury pastry category. Confirm the filling, portion size, ingredients and preparation time with the bakery.",
  cookies:
    "A cookie category for snacking or gifting. Ask the bakery about available flavours, pack sizes and ingredients.",
  samosa:
    "A savoury filled snack category. Confirm the filling, serving size, ingredients and preparation time with the shop.",
  "gulab jamun":
    "An Indian sweet category often served for celebrations or as a dessert. Confirm the recipe, pack size and storage instructions with the shop.",
  "mysore pak":
    "An Indian sweet category for desserts and gifting. Confirm the recipe, pack weight and shelf life with the shop.",
  sofas:
    "A seating category for living rooms and shared spaces. Compare the seating capacity, upholstery, frame and dimensions before choosing a sofa.",
  "coffee table":
    "A living-room table category for placing everyday items near your seating area. Confirm its dimensions, materials and finish with the shop.",
  "dining table":
    "A dining table category for meals and gatherings. Compare seating capacity, dimensions, materials and finish to suit your room.",
  "dining chairs":
    "A dining chair category to complement your table. Confirm seat height, dimensions, materials and whether the price is per chair or per set.",
  beds: "A bed-frame category for bedrooms. Confirm the frame size, compatible mattress dimensions, materials and assembly requirements.",
  wardrobes:
    "A clothing-storage category for bedrooms. Compare dimensions, hanging space, shelves, materials and installation requirements.",
  bookshelves:
    "A shelving category for books and display items. Confirm dimensions, shelf capacity, materials and any wall-fixing requirements.",
  "office chairs":
    "A chair category for desks and workspaces. Compare height adjustment, back support, dimensions and materials with the shop.",
  "side tables":
    "A compact table category for use beside beds or seating. Confirm dimensions, materials and finish before choosing a model.",
  "home decor":
    "A decorative accessory category for personalising your living space. Confirm the exact item, size, materials and finish with the shop.",
};

export function importedProductDetails(name: string, category: string) {
  const bakery = /bakery|baker/i.test(category);
  const furniture = /furniture/i.test(category);
  return {
    description:
      descriptions[name.toLowerCase()] ??
      `${name} is a representative ${category.replace(/_/g, " ")} catalog item. Ask the shop about the available variants and the exact product specifications.`,
    checks: bakery
      ? [
          "Weight / serving size",
          "Ingredients and allergens",
          "Egg / eggless options where applicable",
          "Preparation date, shelf life and storage",
        ]
      : furniture
        ? [
            "Dimensions and available sizes",
            "Materials, finish and colour",
            "Assembly and delivery requirements",
            "Warranty and return terms",
          ]
        : [
            "Available sizes and colours",
            "Fabric / material and fit",
            "Care instructions",
            "Exchange and return terms",
          ],
  };
}
