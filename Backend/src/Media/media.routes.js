const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const masterAuthMiddleware = require("../middleware/masterAuthMiddleware");
const { upload } = require("../middleware/upload.middleware");
const {
  uploadMedia,
  getAdminMedia,
  getMasterMedia,
  deleteMedia,
  getAdminMediaStats,
} = require("./media.controller");

// ─── Dairy Admin Media Router ───────────────────────────────────────────────
const adminMediaRouter = express.Router();
adminMediaRouter.use(authMiddleware);

adminMediaRouter.get("/", getAdminMedia);
adminMediaRouter.get("/stats", getAdminMediaStats);
adminMediaRouter.post("/", upload.array("files", 10), uploadMedia);
adminMediaRouter.post("/single", upload.single("file"), uploadMedia);
adminMediaRouter.delete("/:id", deleteMedia);

// ─── Master Admin Media Router ──────────────────────────────────────────────
const masterMediaRouter = express.Router();
masterMediaRouter.use(masterAuthMiddleware);

masterMediaRouter.get("/", getMasterMedia);
masterMediaRouter.post("/", upload.array("files", 10), uploadMedia);
masterMediaRouter.post("/single", upload.single("file"), uploadMedia);
masterMediaRouter.delete("/:id", deleteMedia);

module.exports = {
  adminMediaRouter,
  masterMediaRouter,
};
