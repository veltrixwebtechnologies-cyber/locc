export type LocalShoreMenuColumn = {
  heading: string;
  items: string[];
};

export type LocalShoreMenuGroup = {
  id: string;
  label: string;
  categoryId: string;
  columns: LocalShoreMenuColumn[];
  isFavorite?: boolean;
};

const column = (heading: string, items: string): LocalShoreMenuColumn => ({
  heading,
  items: items.split("|"),
});

const group = (
  id: string,
  label: string,
  categoryId: string,
  columns: LocalShoreMenuColumn[],
  isFavorite = false,
): LocalShoreMenuGroup => ({ id, label, categoryId, columns, isFavorite });

export const LOCALSHORE_MENU_GROUPS: LocalShoreMenuGroup[] = [
  group("fresh", "Fresh Produce", "fruits_veg", [
    column(
      "Fruits",
      "Fresh Fruits|Exotic Fruits|Seasonal Fruits|Cut Fruits|Fruit Baskets|Organic Fruits",
    ),
    column(
      "Vegetables",
      "Fresh Vegetables|Leafy Vegetables|Root Vegetables|Organic Vegetables|Cut Vegetables|Seasonal Vegetables",
    ),
    column(
      "Fresh & Natural",
      "Coconut & Tender Coconut|Fresh Herbs|Sprouts|Fresh Juices|Farm Fresh Products|Organic Stores",
    ),
    column(
      "Shops",
      "Fruit Shops|Vegetable Shops|Organic Stores|Farmers Markets|Fresh Produce Stores",
    ),
  ]),
  group("meat_fish", "Meat & Fish", "meat_fish", [
    column("Meat", "Chicken|Mutton|Beef|Pork|Country Chicken|Eggs"),
    column("Fish & Seafood", "Fresh Fish|Prawns|Crab|Seafood|Shellfish|Dried Fish"),
    column(
      "Specialty",
      "Meat Markets|Fish Markets|Organic Meat|Frozen Meat|Marinated Meat|Ready-to-Cook Meat",
    ),
    column("Shops", "Meat Shops|Fish Shops|Seafood Shops|Poultry Shops"),
  ]),
  group("bakery_sweets", "Bakery & Sweets", "bakery", [
    column("Bakery", "Cakes|Pastries|Bread|Buns & Rolls|Cookies|Donuts"),
    column(
      "Indian Sweets",
      "Traditional Sweets|Milk Sweets|Halwa|Laddus|Mysore Pak|Bengali Sweets",
    ),
    column("Savouries", "Mixtures|Murukku|Chips|Snacks|Namkeen"),
    column("Specialty", "Birthday Cakes|Custom Cakes|Wedding Cakes|Dessert Shops|Ice Cream Shops"),
  ]),
  group("grocery", "Kirana & Grocery", "grocery", [
    column("Staples", "Rice|Flour & Atta|Pulses|Dal|Grains|Millets"),
    column("Cooking Essentials", "Cooking Oil|Ghee|Spices|Masalas|Salt & Sugar|Dry Fruits"),
    column("Beverages", "Tea|Coffee|Juices|Soft Drinks|Health Drinks|Packaged Water"),
    column(
      "Household & Shops",
      "Cleaning Supplies|Laundry|Kitchen Supplies|Paper Products|Kirana Stores|Supermarkets|Mini Markets|Wholesale Stores",
    ),
  ]),
  group("pharmacy", "Pharmacy & Care", "pharmacy", [
    column(
      "Pharmacy",
      "Medicines|Prescription Medicines|OTC Medicines|First Aid|Vitamins & Supplements|Health Products",
    ),
    column("Personal Care", "Oral Care|Hair Care|Skin Care|Feminine Care|Men's Grooming|Baby Care"),
    column(
      "Medical",
      "Medical Equipment|Mobility Aids|Support Belts|Diagnostic Centers|Medical Stores",
    ),
    column("Shops", "Pharmacies|Medical Shops|Health Stores|Optical Stores|Diagnostic Centers"),
  ]),
  group("restaurants", "Restaurants & Dining", "restaurants", [
    column("Cuisine", "South Indian|North Indian|Chinese|Italian|Mexican|Continental"),
    column("Dining", "Family Restaurants|Fine Dining|Casual Dining|Fast Food|Buffets|Food Courts"),
    column("Food", "Biryani|Pizza|Burgers|Dosa|Parotta|Meals"),
    column("Specialty", "Vegetarian|Non-Vegetarian|Vegan|Jain Food|Seafood|Street Food"),
  ]),
  group("cafes", "Cafés & Tea", "cafes", [
    column("Cafés", "Coffee Shops|Tea Shops|Dessert Cafés|Bakery Cafés|Specialty Cafés|Juice Bars"),
    column("Drinks", "Coffee|Tea|Milkshakes|Smoothies|Fresh Juices|Bubble Tea"),
    column(
      "Experience",
      "Study Cafés|Work Cafés|Family Cafés|Rooftop Cafés|Late Night Cafés|Pet-Friendly Cafés",
    ),
  ]),
  group("fashion", "Fashion & Apparel", "fashion", [
    column("Men", "T-Shirts|Shirts|Jeans|Trousers|Ethnic Wear|Formal Wear"),
    column("Women", "Sarees|Kurtis|Dresses|Tops|Ethnic Wear|Western Wear"),
    column("Kids", "Boys Clothing|Girls Clothing|Baby Clothing|School Wear|Party Wear|Ethnic Wear"),
    column(
      "Specialty & Shops",
      "Innerwear|Nightwear|Sportswear|Winterwear|Maternity Wear|Plus Size|Clothing Stores|Department Stores|Local Fashion Stores",
    ),
  ]),
  group("boutiques", "Boutiques", "boutiques", [
    column("Women", "Saree Boutiques|Designer Wear|Bridal Wear|Custom Dresses|Ethnic Wear"),
    column("Men", "Designer Shirts|Custom Suits|Wedding Wear|Ethnic Wear"),
    column("Services", "Custom Stitching|Alterations|Embroidery|Blouse Stitching|Bridal Styling"),
    column(
      "Specialty",
      "Bridal Boutiques|Designer Boutiques|Handloom Stores|Traditional Wear Stores",
    ),
  ]),
  group("footwear", "Footwear", "footwear", [
    column("Men", "Formal Shoes|Casual Shoes|Sneakers|Sandals|Slippers"),
    column("Women", "Heels|Flats|Sandals|Sneakers|Slippers"),
    column("Kids", "School Shoes|Kids Sneakers|Sandals|Sports Shoes"),
    column(
      "Specialty & Shops",
      "Sports Footwear|Safety Shoes|Ethnic Footwear|Shoe Accessories|Custom Footwear|Footwear Stores|Shoe Shops",
    ),
  ]),
  group("jewellery", "Jewellery & Gifts", "jewellery", [
    column(
      "Jewellery",
      "Gold Jewellery|Silver Jewellery|Artificial Jewellery|Diamond Jewellery|Traditional Jewellery|Fashion Jewellery",
    ),
    column("Accessories", "Watches|Handbags|Wallets|Belts|Sunglasses"),
    column(
      "Gifts",
      "Personalized Gifts|Corporate Gifts|Couple Gifts|Wedding Gifts|Kids Gifts|Gift Hampers",
    ),
    column("Shops", "Jewellery Stores|Gold Shops|Silver Shops|Gift Stores|Watch Stores"),
  ]),
  group("electronics", "Electronics", "electronics", [
    column(
      "Home Electronics",
      "TVs|Refrigerators|Washing Machines|Air Conditioners|Fans|Microwaves",
    ),
    column("Computers", "Laptops|Desktops|Monitors|Printers|Computer Accessories|Networking"),
    column("Entertainment", "Speakers|Headphones|Gaming Consoles|Cameras|Smart TVs"),
    column("Shops", "Electronics Stores|Computer Shops|Appliance Stores|Camera Shops"),
  ]),
  group("mobile", "Mobile & Accessories", "mobile", [
    column("Mobile", "Smartphones|Feature Phones|Tablets|Smartwatches"),
    column("Accessories", "Chargers|Cables|Power Banks|Phone Cases|Screen Protectors|Earphones"),
    column(
      "Services",
      "Mobile Repair|Screen Replacement|Battery Replacement|Software Services|Data Recovery",
    ),
    column("Shops", "Mobile Stores|Authorized Dealers|Used Phone Shops|Mobile Repair Shops"),
  ]),
  group("beauty", "Beauty & Personal Care", "beauty", [
    column("Beauty", "Makeup|Skincare|Haircare|Fragrances|Cosmetics|Nail Care"),
    column("Salon", "Hair Salons|Beauty Parlours|Unisex Salons|Men's Salons|Women's Salons"),
    column("Wellness", "Spa|Massage|Skin Clinics|Hair Clinics|Bridal Makeup"),
    column("Specialty", "Bridal Beauty|Mehendi|Nail Studios|Makeup Artists|Beauty Stores"),
  ]),
  group("home_kitchen", "Home & Kitchen", "home_kitchen", [
    column("Kitchen", "Cookware|Kitchen Appliances|Storage|Dinnerware|Cutlery|Kitchen Tools"),
    column(
      "Home",
      "Home Essentials|Cleaning Products|Storage Solutions|Bathroom Essentials|Home Organization",
    ),
    column("Decor", "Wall Decor|Lamps & Lighting|Curtains|Rugs & Mats|Cushions|Artificial Plants"),
    column("Shops", "Kitchen Stores|Home Stores|Homeware Stores|Utensil Shops"),
  ]),
  group("furniture", "Furniture & Decor", "furniture", [
    column("Furniture", "Sofas|Beds|Dining Tables|Chairs|Wardrobes|Office Furniture"),
    column("Home Decor", "Wall Art|Mirrors|Clocks|Vases|Showpieces|Decorative Items"),
    column(
      "Specialty",
      "Custom Furniture|Wooden Furniture|Modular Furniture|Antique Furniture|Office Furniture",
    ),
    column("Shops", "Furniture Stores|Furniture Workshops|Home Decor Stores|Interior Stores"),
  ]),
  group("hardware", "Home & Hardware", "hardware", [
    column("Hardware", "Tools|Nuts & Bolts|Screws|Locks|Hinges|Electrical Hardware"),
    column("Plumbing", "Pipes|Taps|Bathroom Fittings|Plumbing Tools|Water Tanks"),
    column("Electrical", "Wires & Cables|Switches|Lights|Fans|Electrical Accessories"),
    column(
      "Building & Shops",
      "Paint|Cement|Tiles|Sanitaryware|Construction Materials|Hardware Stores|Electrical Shops|Plumbing Shops|Paint Stores",
    ),
  ]),
  group("books_stationery", "Books & Stationery", "books_stationery", [
    column(
      "Books",
      "School Books|College Books|Competitive Exam Books|Fiction|Non-Fiction|Children's Books",
    ),
    column(
      "Stationery",
      "Notebooks|Pens & Pencils|Art Supplies|Office Supplies|School Supplies|Craft Materials",
    ),
    column("Services", "Printing|Photocopy|Lamination|Binding|Scanning|Typing"),
    column("Shops", "Book Stores|Stationery Shops|Printing Shops|Book & Gift Stores"),
  ]),
  group("sports", "Sports & Fitness", "sports", [
    column("Sports", "Cricket|Football|Badminton|Tennis|Basketball|Volleyball"),
    column("Fitness", "Gym Equipment|Yoga|Fitness Accessories|Sportswear|Running Gear|Cycling"),
    column(
      "Activities & Shops",
      "Gyms|Fitness Studios|Yoga Centers|Sports Academies|Swimming Pools|Sports Stores|Bicycle Shops",
    ),
  ]),
  group("kids_sports", "Toys & Baby Care", "toys", [
    column(
      "Toys",
      "Educational Toys|Remote Control Toys|Board Games|Outdoor Toys|Soft Toys|Puzzles",
    ),
    column("Baby", "Baby Clothing|Diapers|Baby Food|Baby Care|Feeding Products|Baby Furniture"),
    column(
      "Kids & Shops",
      "School Essentials|Kids Accessories|Kids Books|Party Supplies|Kids Footwear|Toy Stores|Baby Stores|Kids Stores",
    ),
  ]),
  group("gifts", "Gift Shops", "gifts", [
    column(
      "Gifts",
      "Birthday Gifts|Anniversary Gifts|Wedding Gifts|Couple Gifts|Friendship Gifts|Corporate Gifts",
    ),
    column(
      "Personalized",
      "Photo Gifts|Custom Mugs|Custom Frames|Engraved Gifts|Personalized Accessories",
    ),
    column(
      "Hampers & Shops",
      "Chocolate Hampers|Flower Hampers|Beauty Hampers|Snack Hampers|Festival Hampers|Gift Stores|Party Stores",
    ),
  ]),
  group("flowers", "Flower Shops", "flowers", [
    column("Flowers", "Roses|Bouquets|Garlands|Loose Flowers|Exotic Flowers|Seasonal Flowers"),
    column(
      "Occasions",
      "Birthday Flowers|Wedding Flowers|Anniversary Flowers|Funeral Flowers|Festival Flowers",
    ),
    column(
      "Services & Shops",
      "Wedding Decoration|Event Decoration|Floral Decoration|Custom Bouquets|Same-Day Delivery|Flower Shops|Florists|Flower Markets",
    ),
  ]),
  group("pet_shops", "Pet Care & Shops", "pet_shops", [
    column("Pet Supplies", "Pet Food|Treats|Toys|Beds|Collars & Leashes|Grooming Products"),
    column("Pets", "Dogs|Cats|Birds|Fish|Small Pets"),
    column(
      "Services & Shops",
      "Pet Grooming|Veterinary Clinics|Pet Boarding|Pet Training|Pet Walking|Pet Sitting|Pet Stores|Aquarium Shops",
    ),
  ]),
  group("pooja", "Pooja & Divine", "pooja", [
    column("Pooja Essentials", "Pooja Items|Diyas|Incense Sticks|Camphor|Pooja Kits|Brass Items"),
    column("Religious", "Idols|Religious Books|Malas|Rudraksha|Spiritual Items"),
    column(
      "Flowers & Shops",
      "Pooja Flowers|Garlands|Temple Flowers|Coconut & Offerings|Temple Stores|Pooja Stores|Spiritual Stores",
    ),
  ]),
  group("auto", "Auto & Bike Spares", "auto", [
    column("Car", "Car Accessories|Car Spare Parts|Car Batteries|Car Lights|Car Care Products"),
    column("Bike", "Bike Spare Parts|Bike Accessories|Helmets|Bike Batteries|Bike Lights"),
    column(
      "Services & Shops",
      "Tyre Shops|Battery Shops|Car Wash|Bike Wash|Detailing|Auto Spare Shops|Bike Spare Shops|Tyre Dealers",
    ),
  ]),
  group("repair", "Repair Shops", "repair", [
    column(
      "Electronics",
      "Mobile Repair|Laptop Repair|TV Repair|Appliance Repair|Electronics Repair",
    ),
    column(
      "Home",
      "AC Repair|Refrigerator Repair|Washing Machine Repair|Plumbing|Electrical Repair",
    ),
    column("Vehicle", "Car Repair|Bike Repair|Scooter Repair|Tyre Repair|Battery Repair"),
    column("Other", "Watch Repair|Shoe Repair|Bag Repair|Key Duplication|Locksmith"),
  ]),
  group("local_services", "Local Services", "local_services", [
    column(
      "Home Services",
      "Plumbers|Electricians|Carpenters|Painters|Cleaning Services|Pest Control",
    ),
    column(
      "Personal Services",
      "Tailors|Laundry|Dry Cleaning|Beauty Services|Photographers|Makeup Artists",
    ),
    column("Professional", "Accountants|Lawyers|Consultants|Tutors|Designers|Computer Services"),
    column(
      "Events & Other",
      "Event Planners|Caterers|Decorators|DJs|Wedding Services|Packers & Movers|Printing Services|Travel Services",
    ),
  ]),
  group(
    "local_favorites",
    "Local Favorites",
    "favorites",
    [
      column(
        "Popular Near You",
        "Trending Shops|Most Visited|Highly Rated|Frequently Ordered|Popular This Week",
      ),
      column(
        "Local Gems",
        "Hidden Gems|Neighborhood Favorites|Family-Owned Shops|Local Brands|Traditional Shops|Unique Stores",
      ),
      column(
        "Favorites",
        "Popular Restaurants|Favorite Cafés|Street Food|Local Specialties|Famous Sweets|Popular Bakeries|Trending Fashion|Best Gift Shops|Local Deals|Recommended Shops",
      ),
    ],
    true,
  ),
];
