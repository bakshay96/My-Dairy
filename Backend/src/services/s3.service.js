const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path   = require("path");

const BUCKET  = process.env.AWS_S3_BUCKET_NAME;
const REGION  = process.env.AWS_REGION
const DOMAIN  = process.env.AWS_S3_CUSTOM_DOMAIN; // optional CloudFront domain

let _s3 = null;

function getS3() {
  if (_s3) return _s3;
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in .env");
  }
  _s3 = new S3Client({
    region:      REGION,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return _s3;
}

/**
 * Upload a file Buffer to S3.
 * @param {Buffer}  buffer
 * @param {string}  originalName - original filename for extension detection
 * @param {string}  folder       - S3 prefix folder e.g. "tickets"
 * @returns {Promise<string>}    - public URL
 */
async function uploadToS3(buffer, originalName, folder = "uploads") {
  const ext  = path.extname(originalName).toLowerCase() || ".bin";
  const key  = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  const mime = {
    ".jpg":  "image/jpeg", ".jpeg": "image/jpeg",
    ".png":  "image/png",  ".gif":  "image/gif",
    ".webp": "image/webp", ".pdf":  "application/pdf",
  }[ext] || "application/octet-stream";

  await getS3().send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mime,
  }));

  // Public URL (assumes bucket has public-read or you have a CloudFront distribution)
  const base = DOMAIN ? `https://${DOMAIN}` : `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
  return `${base}/${key}`;
}

/**
 * Delete a file from S3 by its full URL.
 */
async function deleteFromS3(url) {
  try {
    const urlObj = new URL(url);
    const key    = urlObj.pathname.slice(1); // remove leading /
    await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.warn("[S3] delete failed:", e.message);
  }
}

module.exports = { uploadToS3, deleteFromS3 };
