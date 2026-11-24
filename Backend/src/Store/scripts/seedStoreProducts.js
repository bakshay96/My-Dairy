require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const mongoose = require("mongoose");
const { AdminModel } = require("../../Admin/admin.model");
const { StoreProfileModel, StoreProductModel } = require("../models");

const SAMPLE_PRODUCTS = [
  // ─── 🥛 DAIRY PRODUCTS ────────────────────────────────────────────────────────
  {
    name: "Fresh Buffalo Milk (Full Cream 6.5% Fat)",
    category: "dairy",
    subCategory: "Fresh Milk",
    brand: "Milkify Pure",
    sku: "MK-DRY-MILK-BUF",
    barcode: "8901001001",
    unit: "liter",
    packageSize: "1 Liter Pouch",
    price: 68,
    mrp: 72,
    costPrice: 58,
    stockQuantity: 120,
    minStockAlert: 15,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 38,
    description: "Farm fresh raw & chilled buffalo milk collected directly from village farmers. Lab-tested with 6.5% Fat and 9.0% SNF. Rich, creamy, and 100% pure.",
    highlights: ["Tested 6.5% Fat & 9.0% SNF", "No water dilution or preservatives", "Chilled below 4°C within 1 hour"],
    images: [
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Pure Cow Milk (A2 Gir Cow 4.5% Fat)",
    category: "dairy",
    subCategory: "Fresh Milk",
    brand: "Milkify Farm Fresh",
    sku: "MK-DRY-MILK-COW",
    barcode: "8901001002",
    unit: "liter",
    packageSize: "1 Liter Pouch",
    price: 58,
    mrp: 62,
    costPrice: 48,
    stockQuantity: 85,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    ratingCount: 42,
    description: "Pure indigenous Gir cow milk rich in A2 beta-casein proteins. Wholesome, light on the stomach, and ideal for children and daily health.",
    highlights: ["100% Desi Cow A2 Milk", "Natural sweetness & golden hue", "Rich in natural vitamins & minerals"],
    images: [
      "https://images.unsplash.com/photo-1568651315053-156e544dc467?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Artisan Malai Paneer (Soft & Creamy)",
    category: "dairy",
    subCategory: "Paneer & Cheese",
    brand: "Milkify Gold",
    sku: "MK-DRY-PAN-500",
    barcode: "8901001003",
    unit: "kg",
    packageSize: "500 gm Pack",
    price: 190,
    mrp: 210,
    costPrice: 155,
    stockQuantity: 40,
    minStockAlert: 8,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 29,
    description: "Melt-in-mouth cottage cheese crafted from pure full-fat buffalo milk. Contains 18g protein per 100g with no artificial coagulants or starch fillers.",
    highlights: ["Super soft & spongy texture", "Zero starch or palm oil", "High biological value protein"],
    images: [
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Traditional Bilona Cow Desi Ghee (Danedar)",
    category: "dairy",
    subCategory: "Desi Ghee",
    brand: "Vedic Pure",
    sku: "MK-DRY-GHEE-1L",
    barcode: "8901001004",
    unit: "kg",
    packageSize: "1 Liter Jar",
    price: 650,
    mrp: 750,
    costPrice: 530,
    stockQuantity: 30,
    minStockAlert: 5,
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    ratingCount: 56,
    description: "Prepared using traditional slow-churned curd bilona method. Highly aromatic, granular (danedar) texture, golden hue, and packed with fat-soluble vitamins.",
    highlights: ["Slow-cooked wooden bilona process", "Aromatic Danedar granules", "Ayurvedic immunity enhancer"],
    images: [
      "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Farm Fresh Thick Curd (Dahi)",
    category: "dairy",
    subCategory: "Curd & Dahi",
    brand: "Milkify Fresh",
    sku: "MK-DRY-DAHI-500",
    barcode: "8901001005",
    unit: "kg",
    packageSize: "500 gm Tub",
    price: 45,
    mrp: 50,
    costPrice: 35,
    stockQuantity: 50,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: false,
    rating: 4.7,
    ratingCount: 22,
    description: "Natural probiotic rich curd set from pasteurized farm milk. Mildly sweet taste, smooth consistency, and zero sourness when consumed fresh.",
    highlights: ["Live probiotic active cultures", "No gelatin or chemical thickeners", "Supports healthy gut digestion"],
    images: [
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Pure Churned Butter (Peeli Makkhan)",
    category: "dairy",
    subCategory: "Butter",
    brand: "Milkify Gold",
    sku: "MK-DRY-BUT-200",
    barcode: "8901001006",
    unit: "packet",
    packageSize: "200 gm Pack",
    price: 110,
    mrp: 120,
    costPrice: 90,
    stockQuantity: 35,
    minStockAlert: 6,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 19,
    description: "Rich and wholesome table butter lightly salted. Perfect accompaniment for hot parathas, bajra roti, and everyday breakfast spread.",
    highlights: ["Fresh cream churned", "Creamy spreadability", "Zero synthetic preservatives"],
    images: [
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Spiced Masala Buttermilk (Chaas)",
    category: "dairy",
    subCategory: "Beverages",
    brand: "Milkify Refresh",
    sku: "MK-DRY-CHAAS-500",
    barcode: "8901001007",
    unit: "packet",
    packageSize: "500 ml Pouch",
    price: 18,
    mrp: 20,
    costPrice: 12,
    stockQuantity: 70,
    minStockAlert: 15,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 31,
    description: "Traditional refreshing chaas spiced with roasted cumin (jeera), black salt, fresh mint, and ginger. Beat the village summer heat naturally.",
    highlights: ["Authentic jeera & pudina tadka", "Zero fat natural electrolyte hydration", "Instant cooling effect"],
    images: [
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Fresh Pind Mawa / Khoya",
    category: "dairy",
    subCategory: "Sweets & Khoya",
    brand: "Milkify Sweets",
    sku: "MK-DRY-MAWA-1K",
    barcode: "8901001008",
    unit: "kg",
    packageSize: "1 kg Pack",
    price: 380,
    mrp: 420,
    costPrice: 310,
    stockQuantity: 18,
    minStockAlert: 5,
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    ratingCount: 16,
    description: "Slow-reduced whole buffalo milk khoya prepared under hygienic conditions. The authentic foundation for rich village pedas, gulab jamuns, and barfis.",
    highlights: ["100% Buffalo milk evaporation", "Zero potato or chemical adulteration", "Freshly prepared daily"],
    images: [
      "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80",
    ],
  },

  // ─── 🌾 CATTLE FEED & FARMING ────────────────────────────────────────────────
  {
    name: "Sudha 8000 Cattle Feed Pellets (High Protein 22%)",
    category: "farming",
    subCategory: "Cattle Feed",
    brand: "Sudha Feed",
    sku: "MK-CAT-SUDHA-50K",
    barcode: "8902001001",
    unit: "bag",
    packageSize: "50 kg Sack",
    price: 1350,
    mrp: 1450,
    costPrice: 1220,
    stockQuantity: 75,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 65,
    description: "Premium balanced pellet feed with 22% crude protein, 3.5% bypass fat, fortified with live yeast cultures and chelated minerals. Increases daily milk production by 1.5 - 2 Liters per cow.",
    highlights: ["22% Crude Protein & 3.5% Fat", "Boosts milk quantity & FAT % test", "Contains live yeast for rumen health"],
    images: [
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Amul Nutri-Feed Balanced Lactation Mash (Gold Sacks)",
    category: "farming",
    subCategory: "Cattle Feed",
    brand: "Amul Cattle Feed",
    sku: "MK-CAT-AMUL-50K",
    barcode: "8902001002",
    unit: "bag",
    packageSize: "50 kg Sack",
    price: 1420,
    mrp: 1550,
    costPrice: 1300,
    stockQuantity: 60,
    minStockAlert: 12,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 52,
    description: "Scientifically formulated cattle mash from India's trusted dairy cooperative. High bypass protein improves milk solids-not-fat (SNF) and prevents body weight loss during peak lactation.",
    highlights: ["Enriched with bypass methionine & lysine", "Maximizes peak lactation length", "Tested for zero aflatoxins"],
    images: [
      "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Kapila Super Cow Feed Pellets (High Milk Formula)",
    category: "farming",
    subCategory: "Cattle Feed",
    brand: "Kapila Agro",
    sku: "MK-CAT-KAPILA-50K",
    barcode: "8902001003",
    unit: "bag",
    packageSize: "50 kg Sack",
    price: 1280,
    mrp: 1380,
    costPrice: 1160,
    stockQuantity: 45,
    minStockAlert: 8,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 39,
    description: "Specially formulated for high yielding crossbred cows (HF & Jersey) and Murrah buffaloes. Palatable pellets with roasted grains to ensure complete consumption.",
    highlights: ["High energy density for crossbred cattle", "Easy digestion and minimal feed waste", "Improves cow immunity & coat sheen"],
    images: [
      "https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Pure Mustard Oil Cake (Sarson Ki Danedar Khal)",
    category: "farming",
    subCategory: "Oil Cakes",
    brand: "Kisan Shuddh",
    sku: "MK-CAT-KHAL-50K",
    barcode: "8902001004",
    unit: "bag",
    packageSize: "50 kg Sack",
    price: 1650,
    mrp: 1800,
    costPrice: 1500,
    stockQuantity: 30,
    minStockAlert: 6,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 44,
    description: "Cold-pressed natural mustard cake flakes rich in essential amino acids and residual vegetable fat (8%). Traditional feed essential for winter body heat and milk fat enhancement.",
    highlights: ["Pure cold-pressed mustard residue", "8% Natural residual oil content", "Proven to elevate milk fat test by 0.5%"],
    images: [
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Cotton Seed Cake (Binaula Khal - Premium)",
    category: "farming",
    subCategory: "Oil Cakes",
    brand: "Gujarat Cotton Kings",
    sku: "MK-CAT-BIN-50K",
    barcode: "8902001005",
    unit: "bag",
    packageSize: "50 kg Sack",
    price: 1750,
    mrp: 1900,
    costPrice: 1600,
    stockQuantity: 35,
    minStockAlert: 5,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 28,
    description: "Unadulterated decorticated cotton seed cake. Famous among dairy farmers for producing thick creamy milk with high butterfat percentage.",
    highlights: ["Clean decorticated cotton seeds", "Highest energy concentration", "Fast visible improvement in milk cream layer"],
    images: [
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Calci-Gold Liquid Calcium Supplement with Vitamin D3",
    category: "farming",
    subCategory: "Veterinary Supplements",
    brand: "VetPharma Care",
    sku: "MK-CAT-CALCI-5L",
    barcode: "8902001006",
    unit: "bottle",
    packageSize: "5 Liter Can",
    price: 580,
    mrp: 680,
    costPrice: 460,
    stockQuantity: 25,
    minStockAlert: 5,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 37,
    description: "High potency liquid calcium, phosphorus, and vitamin D3 supplement. Prevents milk fever post-calving and maintains skeletal strength during intense milk production.",
    highlights: ["Rapidly absorbable ionic calcium", "Added Vitamin A, D3, B12 & Biotin", "Prevents hypocalcemia & downer cow syndrome"],
    images: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Chelated Mineral Mixture (BioMin Forte)",
    category: "farming",
    subCategory: "Veterinary Supplements",
    brand: "BioMinerals",
    sku: "MK-CAT-MIN-5K",
    barcode: "8902001007",
    unit: "packet",
    packageSize: "5 kg Bucket",
    price: 450,
    mrp: 520,
    costPrice: 360,
    stockQuantity: 40,
    minStockAlert: 8,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 29,
    description: "Fortified with organic amino-acid chelated Zinc, Copper, Manganese, Cobalt, Iodine, and Chromium. Promotes timely heat cycles, regular conception, and udder health.",
    highlights: ["Overcomes repeat breeding problems", "Strengthens hooves & improves fertility", "Fortified with Chromium to relieve heat stress"],
    images: [
      "https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Heavy Duty Silage Storage Bags (1 Ton Capacity)",
    category: "farming",
    subCategory: "Farm Equipment",
    brand: "GreenFodder Agro",
    sku: "MK-CAT-SILO-5P",
    barcode: "8902001008",
    unit: "piece",
    packageSize: "Pack of 5 Bags",
    price: 850,
    mrp: 999,
    costPrice: 680,
    stockQuantity: 20,
    minStockAlert: 4,
    isAvailable: true,
    isFeatured: false,
    rating: 4.7,
    ratingCount: 14,
    description: "UV-treated 7-layer airtight polythene silage bags. Preserve green maize and sorghum fodder under anaerobic conditions with zero nutrient degradation.",
    highlights: ["7-layer puncture resistant virgin polymer", "Ensures high lactic acid fermentation", "Preserves sweet green fodder for round-the-year feeding"],
    images: [
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80",
    ],
  },

  // ─── 🛒 KIRANA & DAILY GROCERY ──────────────────────────────────────────────
  {
    name: "Sharbati Whole Wheat Atta (Stone Ground Chakki)",
    category: "kirana",
    subCategory: "Flours & Grains",
    brand: "Kisan Bhog",
    sku: "MK-KIR-ATTA-10K",
    barcode: "8903001001",
    unit: "bag",
    packageSize: "10 kg Bag",
    price: 420,
    mrp: 460,
    costPrice: 360,
    stockQuantity: 50,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 48,
    description: "100% MP Sharbati golden wheat milled slowly on traditional natural stone chakkis to retain dietary fiber, bran, and natural sweetness. Makes extra soft rotis.",
    highlights: ["100% MP Sharbati heavy grains", "Cold stone grinding preserves nutrients", "Rotis stay soft for over 12 hours"],
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Premium Kolam Rice (Aged 1 Year)",
    category: "kirana",
    subCategory: "Rice & Pulses",
    brand: "Swad Annapurna",
    sku: "MK-KIR-RICE-10K",
    barcode: "8903001002",
    unit: "bag",
    packageSize: "10 kg Bag",
    price: 550,
    mrp: 620,
    costPrice: 470,
    stockQuantity: 40,
    minStockAlert: 8,
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    ratingCount: 35,
    description: "Naturally matured Kolam rice grains. Cooks fluffy, separate, and non-sticky with an authentic everyday aroma. Ideal for dal-chawal and khichdi.",
    highlights: ["Naturally aged 12 months", "Non-sticky slender white grains", "Pesticide tested and laser sorted"],
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Unpolished Desi Toor Dal (Arhar Dal)",
    category: "kirana",
    subCategory: "Rice & Pulses",
    brand: "Desi Khet",
    sku: "MK-KIR-TOOR-1K",
    barcode: "8903001003",
    unit: "kg",
    packageSize: "1 kg Pack",
    price: 145,
    mrp: 165,
    costPrice: 125,
    stockQuantity: 60,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 29,
    description: "Direct-from-farm unpolished pigeon pea split dal. Zero synthetic oil or water polishing, ensuring rich natural proteins and hearty earthy aroma.",
    highlights: ["Zero chemical oil polish", "Rich in folate & plant protein", "Cooks quickly with deep yellow color"],
    images: [
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Refined Crystal Sugar (S-30 Grade)",
    category: "kirana",
    subCategory: "Staples",
    brand: "Madhur Crystals",
    sku: "MK-KIR-SUG-5K",
    barcode: "8903001004",
    unit: "kg",
    packageSize: "5 kg Bag",
    price: 210,
    mrp: 230,
    costPrice: 190,
    stockQuantity: 45,
    minStockAlert: 8,
    isAvailable: true,
    isFeatured: false,
    rating: 4.7,
    ratingCount: 21,
    description: "Untouched by hand, 100% sulphur-free sparkling white sugar crystals. Dissolves cleanly without residue in milk tea, sweets, and sherbets.",
    highlights: ["Sulphurless refining process", "Uniform sparkling crystals", "Zero chemical residue"],
    images: [
      "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Assam CTC Kadak Leaf Tea",
    category: "kirana",
    subCategory: "Beverages",
    brand: "Chai Baag",
    sku: "MK-KIR-TEA-500",
    barcode: "8903001005",
    unit: "packet",
    packageSize: "500 gm Pack",
    price: 180,
    mrp: 220,
    costPrice: 140,
    stockQuantity: 55,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    ratingCount: 41,
    description: "Bold Assam tea leaves with granular CTC grains. Yields a rich red-golden liquor, strong aroma, and unmatched flavor when brewed with fresh milk.",
    highlights: ["Direct upper Assam tea estate harvest", "Intense strong liquor for milk tea lovers", "Rich antioxidants and refreshing boost"],
    images: [
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Cold-Pressed Kachi Ghani Mustard Oil",
    category: "kirana",
    subCategory: "Edible Oils",
    brand: "Shuddh Dhara",
    sku: "MK-KIR-OIL-1L",
    barcode: "8903001006",
    unit: "bottle",
    packageSize: "1 Liter Bottle",
    price: 155,
    mrp: 175,
    costPrice: 135,
    stockQuantity: 40,
    minStockAlert: 8,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 33,
    description: "Authentic first-press virgin mustard oil expelled using traditional slow wooden kolhus. Pungent natural aroma, rich in Omega-3 and natural vitamin E.",
    highlights: ["First cold press virgin oil", "Natural pungent mustard sharpness", "Zero solvent extraction chemicals"],
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Tata Salt Vacuum Evaporated (Iodized)",
    category: "kirana",
    subCategory: "Staples",
    brand: "Tata Salt",
    sku: "MK-KIR-SALT-1K",
    barcode: "8903001007",
    unit: "packet",
    packageSize: "1 kg Pack",
    price: 26,
    mrp: 28,
    costPrice: 22,
    stockQuantity: 100,
    minStockAlert: 20,
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    ratingCount: 60,
    description: "India's trusted vacuum evaporated iodized salt. Free flowing, guaranteed iodine levels to safeguard cognitive health and mental development.",
    highlights: ["Vacuum evaporated purity", "Free-flowing crystal grains", "Optimal iodine fortification"],
    images: [
      "https://images.unsplash.com/photo-1518110903416-65314742a088?auto=format&fit=crop&w=600&q=80",
    ],
  },
  {
    name: "Desi Jaggery Cubes (Chemical-Free Gud Bheli)",
    category: "kirana",
    subCategory: "Staples",
    brand: "Gramin Gud",
    sku: "MK-KIR-GUD-1K",
    barcode: "8903001008",
    unit: "kg",
    packageSize: "1 kg Box",
    price: 75,
    mrp: 90,
    costPrice: 58,
    stockQuantity: 50,
    minStockAlert: 10,
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    ratingCount: 27,
    description: "Unbleached organic sugarcane jaggery prepared naturally using okra stem clarifying agents. Rich in bio-available iron and natural minerals.",
    highlights: ["Zero chemical hydros or soda bleaching", "Deep natural dark amber color", "Natural iron booster and respiratory soother"],
    images: [
      "https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=600&q=80",
    ],
  },
];

async function seedProducts() {
  try {
    const mongoUrl = process.env.mongo_url || process.env.MONGO_URL;
    if (!mongoUrl) {
      console.error("Missing MONGO_URL in environment.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl);
    console.log("✓ Connected to MongoDB.");

    const admins = await AdminModel.find({ Status: "Active" });
    if (!admins || admins.length === 0) {
      console.error("No active admin accounts found.");
      process.exit(1);
    }

    console.log(`Found ${admins.length} active admin(s). Seeding store catalogs...`);

    for (const admin of admins) {
      console.log(`\n======================================================`);
      console.log(`Processing Store for Admin: ${admin.name} (${admin.shopName})`);
      console.log(`Village: ${admin.village} | Mobile: ${admin.mobile}`);
      console.log(`======================================================`);

      const baseSlug = (admin.shopName || "dairy-outlet")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      const uniqueSlug = `${baseSlug}-${admin._id.toString().slice(-4)}`;

      // 1. Ensure StoreProfile exists with rich settings and multi-village geofence
      const profile = await StoreProfileModel.findOneAndUpdate(
        { adminId: admin._id },
        {
          $setOnInsert: {
            adminId: admin._id,
            storeName: admin.shopName || "Milkify Farm Fresh & Cattle Feed",
            slug: uniqueSlug,
            tagline: "Pure Farm Fresh Dairy, Cattle Feed & Daily Essentials",
            description: "Direct farm-to-table pure dairy products, scientifically formulated high-protein cattle feeds, and daily kitchen staples delivered to your village doorstep.",
            bannerImage: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80",
            logoImage: "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=200&q=80",
            phone: admin.mobile || "1234567890",
            email: admin.email || "store@milkify.app",
            isOpen: true,
            operatingHours: { openTime: "06:00 AM", closeTime: "09:00 PM" },
            isStoreEnabled: true,
          },
          $set: {
            village: admin.village || "Bhandari",
            serviceVillages: [
              admin.village || "Bhandari",
              "Shivnagar",
              "Rampur",
              "Khed",
              "Ambegaon",
              "Chakan",
              "Rajgurunagar",
            ],
            deliveryRadiusKm: 12,
            deliveryFee: 20,
            freeDeliveryThreshold: 499,
            allowSelfPickup: true,
          },
        },
        { new: true, upsert: true }
      );

      console.log(`✓ Store Profile ready: /store/${profile.slug}`);
      console.log(`  Serviced Villages: ${profile.serviceVillages.join(", ")} (Radius: ${profile.deliveryRadiusKm} km)`);

      // 2. Clear existing sample products for this admin to avoid duplicates, or upsert by SKU
      let createdCount = 0;
      let updatedCount = 0;

      for (const prodData of SAMPLE_PRODUCTS) {
        const productSlug = `${prodData.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")}-${admin._id.toString().slice(-4)}`;

        const filter = { adminId: admin._id, sku: prodData.sku };
        const update = {
          ...prodData,
          adminId: admin._id,
          slug: productSlug,
        };

        const existing = await StoreProductModel.findOne(filter);
        if (existing) {
          await StoreProductModel.updateOne(filter, { $set: update });
          updatedCount++;
        } else {
          await StoreProductModel.create(update);
          createdCount++;
        }
      }

      console.log(`✓ Inventory seeded: ${createdCount} created, ${updatedCount} updated.`);

      // Category breakdown count
      const [dairyC, farmC, kiranaC] = await Promise.all([
        StoreProductModel.countDocuments({ adminId: admin._id, category: "dairy" }),
        StoreProductModel.countDocuments({ adminId: admin._id, category: "farming" }),
        StoreProductModel.countDocuments({ adminId: admin._id, category: "kirana" }),
      ]);
      console.log(`  📊 Products Breakdown: Dairy: ${dairyC} | Cattle Feed: ${farmC} | Kirana: ${kiranaC}`);
    }

    console.log(`\n🎉 Store seeding completed successfully! All items ready for end-to-end testing.`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedProducts();
