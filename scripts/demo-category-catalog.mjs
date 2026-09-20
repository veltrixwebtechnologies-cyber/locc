// Demo inventory only. Reuse the project's existing illustrative stock photos.
// Each product belongs to exactly one category; shops never receive other catalogs.
export const demoCategories = [
  { key: "fruits_veg", label: "Fresh Produce", photo: "1610832958506-aa56368176cf", products: [
    ["Tomato", 38, "1546094096-0df4bcaaa337"], ["Onion", 42, "1508747703725-719777637510"],
    ["Potato", 36, "1518977676601-b53f82aba655"], ["Carrot", 52, "1445282768818-728615cc910a"],
    ["Banana", 48, "1571771894821-ce9b6c11b08e"], ["Apple", 160, "1560806887-1e4cd0b6cbd6"],
    ["Orange", 90, "1547514701-42782101795e"], ["Mango", 120, "1553279768-865429fa0078"],
    ["Spinach", 28, "1576045057995-568f588f82fb"], ["Coconut", 55],
  ] },
  { key: "meat_fish", label: "Meat & Fish", photo: "1607623814075-e51df1bdc82f", products: [
    ["Chicken", 240, "1604503468506-a8da13d82791"], ["Mutton", 780],
    ["Fish", 280, "1510130387422-82bed34b37e9"], ["Prawns", 420, "1565680018434-b513d5e5fd47"],
    ["Eggs", 90, "1518569656558-1f25e69d93d7"], ["Chicken Breast", 300, "1604503468506-a8da13d82791"],
    ["Chicken Leg", 260, "1626082927389-6cd097cdc6ec"], ["Seer Fish", 850, "1510130387422-82bed34b37e9"],
    ["Rohu Fish", 240, "1510130387422-82bed34b37e9"], ["Crab", 360, "1559737558-2f5a35f4523b"],
  ] },
  { key: "bakery", label: "Bakery & Sweets", photo: "1509440159596-0249088772ff", products: [
    ["Birthday Cake", 650, "1578985545062-69928b1d9587"], ["Black Forest Cake", 720, "1578985545062-69928b1d9587"],
    ["Chocolate Cake", 680, "1578985545062-69928b1d9587"], ["Bread", 45], ["Bun", 12],
    ["Puffs", 25], ["Cookies", 80, "1499636136210-6f4ee915583e"],
    ["Samosa", 18, "1601050690597-df0568f70950"], ["Gulab Jamun", 140], ["Mysore Pak", 220],
  ] },
  { key: "grocery", label: "Kirana & Grocery", photo: "1542838132-92c53300491e", products: [
    ["Rice", 72, "1586201375761-83865001e31c"], ["Wheat Flour", 58, "1627485937980-221c88ac04f9"],
    ["Cooking Oil", 155, "1474979266404-7eaacbcd87c5"], ["Sugar", 48, "1581441363689-1f3c3c414635"],
    ["Salt", 22], ["Dal", 110], ["Atta", 62, "1627485937980-221c88ac04f9"],
    ["Spices", 95], ["Biscuits", 35, "1499636136210-6f4ee915583e"], ["Tea", 120],
  ] },
  { key: "pharmacy", label: "Pharmacy & Care", photo: "1587854692152-cbe660dbde88", products: [
    ["Paracetamol", 25], ["Vitamins", 220], ["Face Wash", 160], ["Shampoo", 180],
    ["Toothpaste", 85], ["Toothbrush", 40], ["Hand Sanitizer", 65],
    ["First Aid Kit", 350], ["Bandages", 45], ["Baby Care Products", 280],
  ] },
  { key: "restaurants", label: "Restaurants & Dining", photo: "1555396273-367ea4eb4db5", products: [
    ["Vegetable Biryani", 180], ["Chicken Biryani", 240], ["Masala Dosa", 90], ["Idli and Sambar", 60],
    ["Vegetarian Meals", 150], ["Paneer Butter Masala", 210], ["Butter Naan", 45],
    ["Vegetable Fried Rice", 160], ["Chicken Fried Rice", 190], ["Parotta and Kurma", 100],
  ] },
  { key: "cafes", label: "Cafés & Tea", photo: "1501339847302-ac426a4a7cbb", products: [
    ["Filter Coffee", 45], ["Masala Tea", 30], ["Cappuccino", 120], ["Espresso", 90],
    ["Cold Coffee", 140], ["Lemon Tea", 40], ["Hot Chocolate", 130],
    ["Vegetable Sandwich", 100], ["Chocolate Milkshake", 160], ["Iced Tea", 80],
  ] },
  { key: "fashion", label: "Fashion & Apparel", photo: "1445205170230-053b83016050", products: [
    ["T-Shirts", 399], ["Jeans", 999], ["Shirts", 699], ["Sarees", 1299], ["Kurtis", 599],
    ["Chudidars", 899], ["Leggings", 299], ["Dresses", 1199], ["Innerwear", 249], ["Kids Wear", 499],
  ] },
  { key: "boutiques", label: "Boutiques", photo: "1558769132-cb1aea458c5e", products: [
    ["Handloom Cotton Saree", 1899], ["Embroidered Kurti", 1199], ["Designer Blouse", 899],
    ["Silk Dupatta", 799], ["Anarkali Suit", 2499], ["Linen Co-ord Set", 1699],
    ["Block Print Dress", 1499], ["Festive Lehenga", 3999], ["Palazzo Pants", 699], ["Cotton Salwar Set", 1399],
  ] },
  { key: "footwear", label: "Footwear", photo: "1549298916-b41d501d3772", products: [
    ["Running Shoes", 1499], ["Casual Sneakers", 1199], ["Formal Shoes", 1799], ["Walking Shoes", 1299],
    ["Leather Sandals", 899], ["Flip Flops", 249], ["Ballet Flats", 699], ["Block Heels", 999],
    ["Kids School Shoes", 799], ["Sports Sandals", 649],
  ] },
  { key: "jewellery", label: "Jewellery & Gifts", photo: "1535632066927-ab7c9ab60908", products: [
    ["Gold-tone Necklace", 899], ["Silver-tone Earrings", 399], ["Pearl Bracelet", 499], ["Pendant Set", 699],
    ["Fashion Ring", 249], ["Bangle Set", 599], ["Jewellery Gift Box", 349], ["Charm Bracelet", 449],
    ["Stud Earrings", 299], ["Beaded Necklace", 549],
  ] },
  { key: "electronics", label: "Electronics", photo: "1498049794561-7780e7231661", products: [
    ["Smartphones", 12999, "1511707171634-5f897ff02aa9"], ["Earbuds", 1499], ["Bluetooth Speakers", 1999],
    ["Chargers", 599], ["Power Banks", 1299], ["USB Cables", 249], ["Smart Watches", 2499],
    ["Phone Cases", 299], ["Screen Protectors", 199], ["Headphones", 1799],
  ] },
  { key: "home_kitchen", label: "Home & Kitchen", photo: "1556911220-e15b29be8c8f", products: [
    ["Cookware Set", 1499], ["Pressure Cooker", 1899], ["Non-Stick Pan", 799], ["Dinner Set", 1299],
    ["Water Bottle", 299], ["Storage Containers", 499], ["Mixer Grinder", 2499],
    ["Kitchen Knives", 399], ["Bedsheets", 999], ["Cleaning Supplies", 249],
  ] },
];

export const shopsPerCategory = 5;
export const seedTag = "category-coverage-v1";
