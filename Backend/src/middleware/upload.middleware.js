const multer = require("multer");

// Store file in memory so we can pipe it to S3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
  if (allowed.test(file.originalname)) cb(null, true);
  else cb(new Error("Only image files (jpg, png, gif, webp) and PDFs are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

module.exports = { upload };
