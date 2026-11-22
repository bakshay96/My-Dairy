const path = require("path");
const { MediaModel } = require("./media.model");
const { uploadToS3, deleteFromS3 } = require("../services/s3.service");

// ─── Upload Media (Admin or Master Admin) ────────────────────────────────────
exports.uploadMedia = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const isMaster = Boolean(req.master || req.masterId || req.masterAdmin);
    const ownerId = isMaster
      ? (req.master?._id || req.masterId || req.masterAdmin?._id)
      : (req.admin?._id || req.admin?.id);

    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Authentication required: owner ID not found" });
    }

    const ownerModel = isMaster ? "MasterAdmin" : "Admin";
    const folder = isMaster ? "media/master" : `media/dairy-${ownerId}`;
    const category = req.body.category || "general";

    const uploadedRecords = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const s3Url = await uploadToS3(file.buffer, file.originalname, folder);

      // Extract key from URL
      let key = "";
      try {
        const u = new URL(s3Url);
        key = u.pathname.slice(1);
      } catch {
        key = `${folder}/${Date.now()}-${file.originalname}`;
      }

      const mediaDoc = await new MediaModel({
        ownerId,
        ownerModel,
        url: s3Url,
        key,
        fileName: path.basename(file.originalname),
        originalName: file.originalname,
        fileSize: file.size || file.buffer.length,
        mimeType: file.mimetype || "application/octet-stream",
        category,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(",").map(t => t.trim())) : [],
      }).save();

      uploadedRecords.push(mediaDoc);
    }

    return res.status(201).json({
      success: true,
      message: `${uploadedRecords.length} file(s) uploaded successfully`,
      data: uploadedRecords.length === 1 ? uploadedRecords[0] : uploadedRecords,
    });
  } catch (error) {
    console.error("[Media] uploadMedia error:", error);
    return res.status(500).json({ success: false, message: "Upload failed: " + error.message });
  }
};

// ─── List Media for Dairy Admin ──────────────────────────────────────────────
exports.getAdminMedia = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.admin?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { category, search } = req.query;

    const query = { ownerId: adminId, ownerModel: "Admin" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ fileName: regex }, { originalName: regex }, { tags: regex }];
    }

    const [media, total] = await Promise.all([
      MediaModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MediaModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        media,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[Media] getAdminMedia error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── List Media for Master Admin (Centralized) ───────────────────────────────
exports.getMasterMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const skip = (page - 1) * limit;
    const { category, search, scope, ownerId } = req.query;

    const query = {};

    if (scope === "master_only") {
      query.ownerModel = "MasterAdmin";
    } else if (scope === "dairy_only") {
      query.ownerModel = "Admin";
    }

    if (ownerId) {
      query.ownerId = ownerId;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ fileName: regex }, { originalName: regex }, { tags: regex }];
    }

    const [media, total, totalBytesResult] = await Promise.all([
      MediaModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MediaModel.countDocuments(query),
      MediaModel.aggregate([
        { $match: query },
        { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } }
      ])
    ]);

    const totalBytes = totalBytesResult[0]?.totalBytes || 0;

    return res.status(200).json({
      success: true,
      data: {
        media,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        stats: {
          totalFiles: total,
          totalBytes,
          formattedSize: (totalBytes / (1024 * 1024)).toFixed(2) + " MB",
        }
      },
    });
  } catch (error) {
    console.error("[Media] getMasterMedia error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Media (Admin or Master Admin) ────────────────────────────────────
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const isMaster = Boolean(req.master || req.masterId || req.masterAdmin);
    const ownerId = isMaster ? null : (req.admin?._id || req.admin?.id);

    const query = { _id: id };
    if (!isMaster) {
      query.ownerId = ownerId;
    }

    const media = await MediaModel.findOne(query);
    if (!media) {
      return res.status(404).json({ success: false, message: "Media file not found or unauthorized" });
    }

    // Delete from S3
    await deleteFromS3(media.url).catch((err) => console.warn("[S3] delete failed:", err.message));

    // Delete from DB
    await MediaModel.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully",
      id,
    });
  } catch (error) {
    console.error("[Media] deleteMedia error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Media Stats (for Admin) ────────────────────────────────────────────────
exports.getAdminMediaStats = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.admin?.id;
    const [stats] = await MediaModel.aggregate([
      { $match: { ownerId: adminId, ownerModel: "Admin" } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalBytes: { $sum: "$fileSize" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalFiles: stats?.totalFiles || 0,
        totalBytes: stats?.totalBytes || 0,
        formattedSize: ((stats?.totalBytes || 0) / (1024 * 1024)).toFixed(2) + " MB",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
