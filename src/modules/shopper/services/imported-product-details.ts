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

  // Electronics
  "4k smart led tv 43 inch":
    "High-definition 4K smart television featuring vivid HDR display and built-in streaming apps. Check screen size, HDMI/USB ports, sound output, and manufacturer warranty with the showroom.",
  "surround soundbar 120w speaker":
    "Dynamic 120W surround soundbar with deep bass subwoofers and clear dialogue clarity. Verify Bluetooth connectivity, optical inputs, and TV compatibility with the shop.",
  "true wireless bluetooth earbuds":
    "Ergonomic wireless earbuds featuring fast auto-pairing, ENC noise reduction, and a compact pocket charging case. Confirm battery endurance and ear-tip fit.",
  "type-c 65w fast charger adapter":
    "High-efficiency 65W GaN fast charger suitable for rapid charging of phones, tablets, and lightweight laptops. Confirm pin style and cable compatibility.",
  "10000mah power bank fast charge":
    "Dual-port 10000mAh portable power bank with LED charge indicator and multi-device fast recharge. Confirm output wattage and flight safety compliance.",
  "smart fitness watch with spo2":
    "Feature-packed fitness tracker with real-time heart rate, SpO2 blood oxygen sensor, and daily step tracking. Confirm water resistance and mobile app connectivity.",
  "portable bluetooth speaker waterproof":
    "Rugged waterproof wireless speaker delivering punchy 360-degree audio outdoors and indoors. Check IPX rating, playtime hours, and aux input options.",
  "mixer grinder 750w 3 jars":
    "Heavy-duty 750W copper-motor mixer grinder with stainless steel jars for chutney, dry spices, and wet batter. Check blade sharpness and overload protection.",
  "electric steam iron 1200w":
    "Non-stick ceramic soleplate electric steam iron with continuous steam burst for wrinkle-free clothes. Check temperature settings and water tank capacity.",
  "induction cooktop 2000w":
    "Energy-saving electromagnetic induction cooktop with preset Indian cooking options and push-button controls. Verify pan compatibility and auto-shutoff features.",

  // Flowers
  "fresh jasmine garland (மல்லிப்பூ)":
    "Authentic fresh jasmine garland strung daily with fragrant buds for festive hair adornment, home pooja, and wedding celebrations. Retains morning freshness.",
  "red rose flower bouquet":
    "Handcrafted bouquet of fresh long-stem red roses wrapped in elegant tissue paper and satin ribbon. Ideal for anniversaries, birthdays, and special greetings.",
  "mixed floral bouquet (lilies & roses)":
    "Vibrant festive flower arrangement blending Asiatic lilies, fresh roses, and seasonal greenery. Perfect for congratulations and celebratory greetings.",
  "traditional pooja flower mix (உதிரிப்பூ)":
    "Assorted loose fresh flowers including marigold, jasmine, and rose petals for daily temple worship, Kolam decoration, and deity archana.",
  "marigold garland (சாமந்தி மாலை)":
    "Dense golden yellow and orange marigold garland for auspicious doorway toran, vehicle pooja, and festive home decoration.",
  "lotus flowers for pooja (pack of 2)":
    "Fresh natural sacred pink lotus blooms harvested early morning for Mahalakshmi pooja and special divine prayers.",
  "fragrant tube rose garland (சம்பங்கி)":
    "Sweet-scented tube rose (sampangi) floral garland woven tightly for reception stage decor, weddings, and garlanding deities.",
  "orchid table flower arrangement":
    "Long-lasting exotic purple dendrobium orchids arranged in a stylish presentation bowl for office tables, dining, and home aesthetics.",
  "bridal flower veni for hair":
    "Exquisite traditional South Indian bridal hair veni crafted with fresh jasmine, roses, and baby breath for weddings and Seemantham.",
  "carnation flower bunch (10 stems)":
    "Fresh colorful carnation flower bunch known for exceptional vase life and ruffled petals. A graceful gift for any celebration.",

  // Gifts
  "customized wooden photo frame":
    "Laser-engraved polished wooden photo frame personalized with your memorable photograph. Confirm picture resolution and printing finish with the shop.",
  "personalized magic ceramic mug":
    "Heat-reactive black ceramic mug that magically reveals your custom photo or message when hot liquid is poured. Microwave safe.",
  "handmade festive gift hamper":
    "Delightful celebration gift hamper curated with gourmet treats, dry fruits, greeting card, and keepsake festive novelties.",
  "scented soy wax candle set":
    "Aromatherapy natural soy wax candle set in decorative glass jars with soothing lavender and vanilla essential oils for serene ambience.",
  "crystal rotating led photo lamp":
    "3D optical crystal photo keepsake placed on a multi-color rotating LED light base. Creates an enchanting glowing display.",
  "teddy bear & chocolate gift combo":
    "Cuddly plush teddy bear paired with premium assorted chocolates. A sweet, heartwarming gift for birthdays and romantic occasions.",
  "laser engraved metal pen & keychain set":
    "Sleek metallic executive rollerball pen and matching keychain engraved with a name or initials, packaged in an elegant gift box.",
  "vintage musical box gift":
    "Classic hand-cranked wooden melody music box featuring ornate woodwork and a sweet acoustic chime when cranked.",
  "personalized name led night lamp":
    "Modern acrylic silhouette LED night lamp engraved with your custom name or couple initials. Emits a cozy warm ambient glow.",
  "celebration greeting card with envelope":
    "Artistic cardstock greeting card with gold foil embossing, thoughtful message inside, and matching luxury envelope.",
};

export function importedProductDetails(name: string, category: string) {
  const bakery = /bakery|baker/i.test(category);
  const furniture = /furniture/i.test(category);
  const electronics = /electro/i.test(category);
  const flowers = /flower|florist/i.test(category);
  const gifts = /gift/i.test(category);
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
        : electronics
          ? [
              "Brand warranty & service center support",
              "Specifications & power rating",
              "In-box cables & accessories",
              "Replacement & return policy",
            ]
          : flowers
            ? [
                "Freshness & morning delivery time",
                "Garland length & flower density",
                "Fragrance & petal condition",
                "Event timing & packaging",
              ]
            : gifts
              ? [
                  "Photo / text customization proof",
                  "Preparation & dispatch timeframe",
                  "Gift wrapping & card message",
                  "Safe protective packaging",
                ]
              : [
                  "Available sizes and colours",
                  "Fabric / material and fit",
                  "Care instructions",
                  "Exchange and return terms",
                ],
  };
}
