/**
 * fontManager.js
 * Resolves Noto Sans Devanagari font files from the installed npm package.
 * No network download — fonts are bundled at install time via @fontsource.
 */
const path = require("path");
const fs   = require("fs");

const PKG_DIR = path.dirname(
  require.resolve("@fontsource/noto-sans-devanagari/package.json")
);
const FILES_DIR = path.join(PKG_DIR, "files");

function fontFile(subset, weight, fmt = "woff") {
  return path.join(FILES_DIR, `noto-sans-devanagari-${subset}-${weight}-normal.${fmt}`);
}

const FONTS = {
  // Devanagari glyphs (Hindi / Marathi labels)
  devRegular: fontFile("devanagari", "400"),
  devBold:    fontFile("devanagari", "700"),
  // Latin glyphs (numbers, ASCII dates, amounts)
  latRegular: fontFile("latin", "400"),
  latBold:    fontFile("latin", "700"),
};

// Verify all files exist at startup
let _ready = false;
function verifyFonts() {
  if (_ready) return true;
  const missing = Object.entries(FONTS).filter(([, p]) => !fs.existsSync(p)).map(([k]) => k);
  if (missing.length) {
    console.error("[Fonts] Missing font files:", missing);
    return false;
  }
  _ready = true;
  console.log("[Fonts] Noto Sans Devanagari: all font files verified.");
  return true;
}

/**
 * Returns font file paths. Call at startup to log readiness.
 */
function preloadDevanagariFonts() {
  verifyFonts();
  return Promise.resolve(FONTS);
}

/**
 * Synchronously returns font paths (always available after npm install).
 */
function getDevanagariFontsSync() {
  verifyFonts();
  return FONTS;
}

module.exports = { preloadDevanagariFonts, getDevanagariFontsSync };
