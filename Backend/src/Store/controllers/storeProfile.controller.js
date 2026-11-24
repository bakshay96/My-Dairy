const { StoreProfileModel, StoreProductModel } = require("../models");
const { AdminModel } = require("../../Admin/admin.model");
const { calculateHaversineDistanceKm } = require("../services/geofence.service");

/**
 * Get or create the Store Profile for the logged-in Dairy Admin
 */
exports.getMyStoreProfile = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    let profile = await StoreProfileModel.findOne({ adminId });

    if (!profile) {
      const admin = await AdminModel.findById(adminId);
      const baseSlug = (admin?.shopName || "dairy-outlet")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      const uniqueSlug = `${baseSlug}-${adminId.toString().slice(-4)}`;

      profile = await StoreProfileModel.create({
        adminId,
        storeName: admin?.shopName || "Farm Fresh Dairy & Feed Store",
        slug: uniqueSlug,
        village: admin?.village || "Main Village",
        serviceVillages: [admin?.village || "Main Village"],
        phone: admin?.mobile || "",
        email: admin?.email || "",
      });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("getMyStoreProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update the Store Profile & Geofence Settings
 */
exports.updateMyStoreProfile = async (req, res) => {
  try {
    const adminId = req.admin._id || req.admin.id;
    const {
      storeName,
      tagline,
      description,
      bannerImage,
      logoImage,
      village,
      serviceVillages,
      coordinates,
      deliveryRadiusKm,
      deliveryFee,
      freeDeliveryThreshold,
      allowSelfPickup,
      phone,
      email,
      addressDetails,
      isOpen,
      operatingHours,
      upiId,
    } = req.body;

    const updateData = {};
    if (storeName) updateData.storeName = storeName.trim();
    if (tagline !== undefined) updateData.tagline = tagline;
    if (description !== undefined) updateData.description = description;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (logoImage !== undefined) updateData.logoImage = logoImage;
    if (village) updateData.village = village.trim();
    if (Array.isArray(serviceVillages)) updateData.serviceVillages = serviceVillages.map((v) => v.trim()).filter(Boolean);
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      updateData.location = { type: "Point", coordinates: [Number(coordinates[0]), Number(coordinates[1])] };
    }
    if (deliveryRadiusKm !== undefined) updateData.deliveryRadiusKm = Number(deliveryRadiusKm);
    if (deliveryFee !== undefined) updateData.deliveryFee = Number(deliveryFee);
    if (freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    if (allowSelfPickup !== undefined) updateData.allowSelfPickup = Boolean(allowSelfPickup);
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (addressDetails !== undefined) updateData.addressDetails = addressDetails;
    if (isOpen !== undefined) updateData.isOpen = Boolean(isOpen);
    if (operatingHours !== undefined) updateData.operatingHours = operatingHours;
    if (upiId !== undefined) updateData.upiId = upiId;

    const profile = await StoreProfileModel.findOneAndUpdate(
      { adminId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: "Store profile updated successfully", profile });
  } catch (error) {
    console.error("updateMyStoreProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Get Store Profile by Outlet Slug
 */
exports.getPublicStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const profile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() }).populate("adminId", "shopName name mobile village email Status");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Dairy outlet not found" });
    }

    if (!profile.isStoreEnabled) {
      return res.status(403).json({ success: false, message: "This online store is currently disabled by administrator." });
    }

    const [dairyCount, farmingCount, kiranaCount] = await Promise.all([
      StoreProductModel.countDocuments({ adminId: profile.adminId, category: "dairy", isAvailable: true }),
      StoreProductModel.countDocuments({ adminId: profile.adminId, category: "farming", isAvailable: true }),
      StoreProductModel.countDocuments({ adminId: profile.adminId, category: "kirana", isAvailable: true }),
    ]);

    res.status(200).json({
      success: true,
      store: profile,
      categoryCounts: {
        dairy: dairyCount,
        farming: farmingCount,
        kirana: kiranaCount,
      },
    });
  } catch (error) {
    console.error("getPublicStoreBySlug error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Validate Delivery Geofence & Village for a checkout address
 */
exports.validateDeliveryEligibility = async (req, res) => {
  try {
    const { slug } = req.params;
    const { village, latitude, longitude } = req.body;

    const profile = await StoreProfileModel.findOne({ slug: slug.toLowerCase() });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Store outlet not found" });
    }

    const outletLng = profile.location?.coordinates?.[0] || 77.2090;
    const outletLat = profile.location?.coordinates?.[1] || 28.6139;
    const maxRadiusKm = profile.deliveryRadiusKm || 8;

    let distanceKm = 0;
    if (latitude && longitude) {
      distanceKm = calculateHaversineDistanceKm(outletLat, outletLng, Number(latitude), Number(longitude));
    }

    const normalizedInputVillage = (village || "").trim().toLowerCase();
    const primaryVillage = (profile.village || "").toLowerCase();
    const serviceList = (profile.serviceVillages || []).map((v) => v.toLowerCase());

    const isVillageMatched =
      normalizedInputVillage === primaryVillage || serviceList.includes(normalizedInputVillage);

    const isDistanceEligible = distanceKm > 0 ? distanceKm <= maxRadiusKm : true;
    const isDeliveryAvailable = isVillageMatched || isDistanceEligible;

    res.status(200).json({
      success: true,
      eligible: isDeliveryAvailable,
      outletVillage: profile.village,
      serviceVillages: profile.serviceVillages,
      deliveryRadiusKm: maxRadiusKm,
      computedDistanceKm: distanceKm,
      allowSelfPickup: profile.allowSelfPickup,
      deliveryFee: profile.deliveryFee,
      freeDeliveryThreshold: profile.freeDeliveryThreshold,
      message: isDeliveryAvailable
        ? `Delivery available in ${village || "your area"} (approx. ${distanceKm} km from dairy).`
        : `Delivery is currently restricted to ${profile.village} and neighbouring villages within ${maxRadiusKm} km. You may select In-Store Counter Pickup.`,
    });
  } catch (error) {
    console.error("validateDeliveryEligibility error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
