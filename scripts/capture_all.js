const path = require("path");
const fs = require("fs");
const axios = require(path.join(__dirname, "../Backend/node_modules/axios"));
const puppeteer = require(path.join(__dirname, "../Backend/node_modules/puppeteer-core"));

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("==================================================");
  console.log("Starting Full Milkify Live Screen Capture Tour");
  console.log("==================================================");

  // 1. Authenticate via APIs directly to ensure 100% reliable session state
  console.log("\n[1/4] Authenticating via API...");
  const adminRes = await axios.post(`${BASE_URL}/api/admin/login`, {
    mobile: "1234567890",
    password: "test",
  });
  console.log("✓ Admin Authenticated:", adminRes.data?.data?.admin?.name);

  let tokenCookieValue = "";
  const setCookieHeader = adminRes.headers["set-cookie"];
  if (setCookieHeader) {
    for (const c of setCookieHeader) {
      const m = c.match(/token=([^;]+)/);
      if (m) tokenCookieValue = m[1];
    }
  }

  const masterRes = await axios.post(`${BASE_URL}/api/master/login`, {
    username: "masteradmin",
    password: "Milkify@Master2024",
  });
  const masterToken = masterRes.data?.data?.token;
  console.log("✓ Master Authenticated, token received:", !!masterToken);

  // 2. Launch Chromium
  console.log("\n[2/4] Launching Chromium (Retina 2x, 1440x900)...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1440,920",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--run-all-compositor-stages-before-draw",
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
  });

  const screenshotsDir = path.join(__dirname, "../screenshots");
  const adminDir = path.join(screenshotsDir, "admin");
  const masterDir = path.join(screenshotsDir, "master");

  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(adminDir, { recursive: true });
  fs.mkdirSync(masterDir, { recursive: true });

  // Helper to ensure full UI load without loading states
  async function snap(targetPage, url, filePath, extraWaitMs = 4000) {
    console.log(`\nNavigating to ${url} -> ${path.basename(filePath)}...`);
    await targetPage.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

    // Wait for loaders to disappear
    await targetPage.waitForFunction(() => {
      const hasMilkifyLoader = !!document.querySelector('.z-\\[100\\]');
      const hasSpinners = !!document.querySelector('.animate-spin');
      const text = document.body ? document.body.innerText.toLowerCase() : '';
      const isStillLoading = text.includes('hydrating dashboard') ||
                             text.includes('synthesizing ledger') ||
                             text.includes('loading analytics') ||
                             text.includes('loading farmers') ||
                             text.includes('loading subscription') ||
                             text.includes('checking secure session');
      return !hasMilkifyLoader && !hasSpinners && !isStillLoading;
    }, { timeout: 15000 }).catch(() => {});

    // Allow charts (Recharts), Framer Motion, and counters to completely settle
    await sleep(extraWaitMs);

    // Make sure no animation opacity was left stuck at 0
    await targetPage.evaluate(() => {
      document.querySelectorAll("*").forEach((el) => {
        if (window.getComputedStyle(el).opacity === "0") {
          el.style.opacity = "1";
        }
      });
    }).catch(() => {});

    await sleep(400);
    await targetPage.screenshot({ path: filePath, fullPage: false });
    console.log(`✓ Saved ${path.basename(filePath)}`);
  }

  // ==============================================================
  // 3. PUBLIC & AUTH PAGES
  // ==============================================================
  console.log("\n[3/4] Capturing Public & Auth Pages...");
  const publicPage = await browser.newPage();
  
  // 3A. Landing Page
  await snap(publicPage, `${BASE_URL}/`, path.join(screenshotsDir, "01-landing-page.png"), 3500);

  // 3B. Dairy Admin Login
  await publicPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await publicPage.waitForSelector('input[type="password"]', { timeout: 20000 });
  await sleep(2500);
  await publicPage.evaluate(() => {
    document.querySelectorAll("*").forEach((el) => {
      if (window.getComputedStyle(el).opacity === "0") el.style.opacity = "1";
    });
  }).catch(() => {});
  await sleep(400);
  await publicPage.screenshot({ path: path.join(screenshotsDir, "02-admin-login.png"), fullPage: false });
  console.log("✓ Saved 02-admin-login.png");

  // 3C. Master Admin Login
  await publicPage.goto(`${BASE_URL}/master/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await publicPage.waitForSelector('input[type="password"]', { timeout: 20000 });
  await sleep(2500);
  await publicPage.evaluate(() => {
    document.querySelectorAll("*").forEach((el) => {
      if (window.getComputedStyle(el).opacity === "0") el.style.opacity = "1";
    });
  }).catch(() => {});
  await sleep(400);
  await publicPage.screenshot({ path: path.join(screenshotsDir, "03-master-login.png"), fullPage: false });
  console.log("✓ Saved 03-master-login.png");
  await publicPage.close();

  // ==============================================================
  // 4. DAIRY ADMIN WORKFLOW SCREENS
  // ==============================================================
  console.log("\n[4/4A] Capturing Dairy Admin Screens...");
  const adminPage = await browser.newPage();
  if (tokenCookieValue) {
    await adminPage.setCookie({
      name: "token",
      value: tokenCookieValue,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    });
  }

  await adminPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await adminPage.evaluate((adminData) => {
    localStorage.setItem("milkify-auth", JSON.stringify({
      state: {
        user: adminData.admin,
        token: null,
        sessionExpiresAt: adminData.sessionExpiresAt,
      },
      version: 0,
    }));
  }, adminRes.data.data);

  // Capture all 9 Admin screens
  await snap(adminPage, `${BASE_URL}/dashboard`, path.join(adminDir, "01-dashboard-overview.png"), 4500);
  await snap(adminPage, `${BASE_URL}/dashboard/add-milk`, path.join(adminDir, "02-add-milk.png"), 3500);
  await snap(adminPage, `${BASE_URL}/dashboard/farmers`, path.join(adminDir, "03-farmers.png"), 4000);
  await snap(adminPage, `${BASE_URL}/dashboard/rates`, path.join(adminDir, "04-pricing-rates.png"), 3500);
  await snap(adminPage, `${BASE_URL}/dashboard/billing`, path.join(adminDir, "05-billing.png"), 4500);
  await snap(adminPage, `${BASE_URL}/dashboard/analytics`, path.join(adminDir, "06-analytics.png"), 4500);
  await snap(adminPage, `${BASE_URL}/dashboard/subscription`, path.join(adminDir, "07-subscription.png"), 4000);
  await snap(adminPage, `${BASE_URL}/dashboard/support`, path.join(adminDir, "08-support.png"), 4000);
  await snap(adminPage, `${BASE_URL}/dashboard/settings`, path.join(adminDir, "09-settings.png"), 3500);
  await adminPage.close();

  // ==============================================================
  // 5. MASTER ADMIN WORKFLOW SCREENS
  // ==============================================================
  console.log("\n[4/4B] Capturing Master Admin Screens...");
  const masterPage = await browser.newPage();
  await masterPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await masterPage.evaluate((tok) => {
    localStorage.setItem("master_token", tok);
  }, masterToken);

  // Capture all 11 Master Admin screens
  await snap(masterPage, `${BASE_URL}/master/dashboard`, path.join(masterDir, "01-master-dashboard.png"), 4500);
  await snap(masterPage, `${BASE_URL}/master/dashboard/farmers`, path.join(masterDir, "02-farmers-directory.png"), 4000);
  await snap(masterPage, `${BASE_URL}/master/dashboard/visitor-stats`, path.join(masterDir, "03-visitor-analytics.png"), 4500);
  await snap(masterPage, `${BASE_URL}/master/dashboard/notifications`, path.join(masterDir, "04-notifications.png"), 4000);
  await snap(masterPage, `${BASE_URL}/master/dashboard/pricing`, path.join(masterDir, "05-pricing-plans.png"), 4000);
  await snap(masterPage, `${BASE_URL}/master/dashboard/promos`, path.join(masterDir, "06-promo-codes.png"), 4000);
  await snap(masterPage, `${BASE_URL}/master/dashboard/advertisements`, path.join(masterDir, "07-advertisements.png"), 4000);
  await snap(masterPage, `${BASE_URL}/master/dashboard/tickets`, path.join(masterDir, "08-support-desk.png"), 4000);
  await snap(masterPage, `${BASE_URL}/master/dashboard/application`, path.join(masterDir, "09-application-schema.png"), 4500);
  await snap(masterPage, `${BASE_URL}/master/dashboard/architecture`, path.join(masterDir, "10-architecture.png"), 4500);
  await snap(masterPage, `${BASE_URL}/master/dashboard/settings`, path.join(masterDir, "11-master-settings.png"), 4000);
  await masterPage.close();

  console.log("\n=======================================================");
  console.log("🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED & SAVED!");
  console.log("=======================================================");

  await browser.close();
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
