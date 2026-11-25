const { StoreProfileModel, StoreProductModel } = require("../models");

/**
 * Admin: Get all inventory items with filtering (category, search, stock level)
 */
exports.getAdminProducts = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { category, search, stockAlert, page = 1, limit = 50 } = req.query;

    const query = { adminId };

    if (category && ["dairy", "farming", "kirana"].includes(category)) {
      query.category = category;
    }

    if (stockAlert === "true") {
      query.$expr = { $lte: ["$stockQuantity", "$minStockAlert"] };
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { brand: { $regex: term, $options: "i" } },
        { sku: { $regex: term, $options: "i" } },
        { barcode: { $regex: term, $options: "i" } },
        { subCategory: { $regex: term, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      StoreProductModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
      StoreProductModel.countDocuments(query),
    ]);

    const [dairyCount, farmingCount, kiranaCount, lowStockCount] = await Promise.all([
      StoreProductModel.countDocuments({ adminId, category: "dairy" }),
      StoreProductModel.countDocuments({ adminId, category: "farming" }),
      StoreProductModel.countDocuments({ adminId, category: "kirana" }),
      StoreProductModel.countDocuments({ adminId, $expr: { $lte: ["$stockQuantity", "$minStockAlert"] } }),
    ]);

    res.status(200).json({
      success: true,
      products,
      total,
      stats: {
        totalProducts: dairyCount + farmingCount + kiranaCount,
        dairyCount,
        farmingCount,
        kiranaCount,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error("getAdminProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Create Product in Inventory
 */
exports.createAdminProduct = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const {
      name,
      category,
      subCategory,
      brand,
      sku,
      barcode,
      description,
      highlights,
      images,
      unit,
      packageSize,
      price,
      mrp,
      costPrice,
      stockQuantity,
      minStockAlert,
      isAvailable,
      isFeatured,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: "Product name, category, and price are required." });
    }

    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const product = await StoreProductModel.create({
      adminId,
      name: name.trim(),
      slug: uniqueSlug,
      category,
      subCategory: subCategory || "General",
      brand: brand || "",
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: barcode || "",
      description: description || "",
      highlights: Array.isArray(highlights) ? highlights : [],
      images: Array.isArray(images) ? images : [],
      unit: unit || "piece",
      packageSize: packageSize || "1 unit",
      price: Number(price),
      mrp: mrp ? Number(mrp) : Number(price),
      costPrice: costPrice ? Number(costPrice) : 0,
      stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
      minStockAlert: minStockAlert ? Number(minStockAlert) : 5,
      isAvailable: isAvailable !== false,
      isFeatured: Boolean(isFeatured),
    });

    // Emit live inventory update
    try {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ adminId });
      const { emitStoreInventoryUpdated } = require("../../services/socketService");
      emitStoreInventoryUpdated(adminId, profile?.slug, { action: "created", product });
    } catch (e) {}

    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error) {
    console.error("createAdminProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Update Product & Adjust Stock
 */
exports.updateAdminProduct = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { id } = req.params;

    const updateData = { ...req.body };
    delete updateData.adminId;

    const product = await StoreProductModel.findOneAndUpdate(
      { _id: id, adminId },
      { $set: updateData },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Emit live inventory update
    try {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ adminId });
      const { emitStoreInventoryUpdated } = require("../../services/socketService");
      emitStoreInventoryUpdated(adminId, profile?.slug, { action: "updated", product });
    } catch (e) {}

    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    console.error("updateAdminProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete Product
 */
exports.deleteAdminProduct = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const { id } = req.params;

    const product = await StoreProductModel.findOneAndDelete({ _id: id, adminId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Emit live inventory update
    try {
      const { StoreProfileModel } = require("../models");
      const profile = await StoreProfileModel.findOne({ adminId });
      const { emitStoreInventoryUpdated } = require("../../services/socketService");
      emitStoreInventoryUpdated(adminId, profile?.slug, { action: "deleted", productId: id });
    } catch (e) {}

    res.status(200).json({ success: true, message: "Product deleted from inventory" });
  } catch (error) {
    console.error("deleteAdminProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Browse Products for a specific Outlet by Category
 */
exports.getPublicProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const { category, search, sort = "featured" } = req.query;

    const profile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Store outlet not found" });
    }

    const query = {
      adminId: profile.adminId,
      isAvailable: true,
    };

    if (category && ["dairy", "farming", "kirana"].includes(category)) {
      query.category = category;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { brand: { $regex: term, $options: "i" } },
        { subCategory: { $regex: term, $options: "i" } },
      ];
    }

    let sortObj = { isFeatured: -1, createdAt: -1 };
    if (sort === "price_asc") sortObj = { price: 1 };
    if (sort === "price_desc") sortObj = { price: -1 };
    if (sort === "rating") sortObj = { rating: -1 };

    const products = await StoreProductModel.find(query).sort(sortObj);

    res.status(200).json({
      success: true,
      count: products.length,
      category: category || "all",
      products,
    });
  } catch (error) {
    console.error("getPublicProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
