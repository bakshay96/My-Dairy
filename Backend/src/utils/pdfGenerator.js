/**
 * pdfGenerator.js
 * Uses puppeteer-core + MS Edge to generate 100% accurate, perfect PDFs 
 * with full complex text layout (ligatures, conjuncts) for Marathi and Hindi.
 */
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

// ── i18n labels ────────────────────────────────────────────────────────────
const LABELS = {
  en: {
    title: "DIGITAL MILK COLLECTION SLIP",
    farmer: "FARMER", memberId: "MEMBER ID", mobile: "MOBILE",
    village: "VILLAGE", period: "PERIOD",
    date: "DATE", shift: "S", category: "CAT", liters: "LTR",
    fat: "FAT", snf: "SNF", amount: "AMT(Rs)",
    days: "DAYS", total: "TOTAL",
    totalQty: "Total Quantity", avgFatSnf: "Avg FAT / SNF",
    avgRate: "Avg Rate / Ltr", netPayable: "NET PAYABLE",
    receiverSign: "RECEIVER SIGN", officeSign: "OFFICE SIGN",
    generated: "Generated", footer: "System Generated - Milkify Dairy",
    morning: "M", evening: "E",
  },
  hi: {
    title: "दूध संग्रह पर्ची",
    farmer: "किसान", memberId: "सदस्य ID", mobile: "मोबाइल",
    village: "गाँव", period: "अवधि",
    date: "तारीख", shift: "प", category: "प्र", liters: "लीटर",
    fat: "फैट", snf: "एसएनएफ", amount: "राशि",
    days: "दिन", total: "कुल",
    totalQty: "कुल मात्रा", avgFatSnf: "औसत FAT / SNF",
    avgRate: "औसत दर / लीटर", netPayable: "कुल देय राशि",
    receiverSign: "प्राप्तकर्ता हस्ताक्षर", officeSign: "कार्यालय हस्ताक्षर",
    generated: "निर्मिती समय", footer: "Milkify डेयरी प्रबंधन प्रणाली",
    morning: "स", evening: "श",
  },
  mr: {
    title: "दूध संकलन स्लिप",
    farmer: "शेतकरी", memberId: "सदस्य ID", mobile: "मोबाइल",
    village: "गाव", period: "कालावधी",
    date: "तारीख", shift: "स", category: "प्र", liters: "लिटर",
    fat: "फॅट", snf: "SNF", amount: "रक्कम",
    days: "दिवस", total: "एकूण",
    totalQty: "एकूण प्रमाण", avgFatSnf: "सरासरी FAT / SNF",
    avgRate: "सरासरी दर / लिटर", netPayable: "एकूण देय रक्कम",
    receiverSign: "प्राप्तकर्ता स्वाक्षरी", officeSign: "कार्यालय स्वाक्षरी",
    generated: "निर्मिती वेळ", footer: "Milkify डेअरी व्यवस्थापन प्रणाली",
    morning: "स", evening: "सं",
  },
};

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" }) : "-";

const fmtShortDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Kolkata" }) : "-";

const fmtDateTime = () =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date());

const SHIFT_MAP = {
  en: { morning: "Morning", evening: "Evening" },
  hi: { morning: "सुबह", evening: "शाम" },
  mr: { morning: "सकाळ", evening: "संध्याकाळ" },
};

const CAT_MAP = {
  en: { cow: "Cow", goat: "Goat", buffalo: "Buffalo" },
  hi: { cow: "गाय", goat: "बकरी", buffalo: "भैंस" },
  mr: { cow: "गाय", goat: "बकरी", buffalo: "म्हैस" },
};

function buildHtml(data, lang) {
  const { farmer, entries, summary, dateRange, adminShopName = "Milkify Dairy" } = data;
  const L = LABELS[lang] || LABELS.en;
  
  const avgRate = summary.totalLiters > 0 ? summary.totalAmount / summary.totalLiters : 0;
  const uniqueDays = new Set(entries.map((e) => new Date(e.createdAt).toDateString())).size;

  let logoBase64 = "";
  try {
    const logoPath = path.join(__dirname, "../../../milkify-next/public/images/milkify-logo.png");
    const logoData = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;
  } catch (e) {}

  let fontBase64 = "";
  let fontBoldBase64 = "";
  try {
    const pkgDir = path.dirname(require.resolve("@fontsource/noto-sans-devanagari/package.json"));
    const filesDir = path.join(pkgDir, "files");
    const regWoff2 = fs.readFileSync(path.join(filesDir, "noto-sans-devanagari-devanagari-400-normal.woff2"));
    const bldWoff2 = fs.readFileSync(path.join(filesDir, "noto-sans-devanagari-devanagari-700-normal.woff2"));
    fontBase64 = `data:font/woff2;charset=utf-8;base64,${regWoff2.toString("base64")}`;
    fontBoldBase64 = `data:font/woff2;charset=utf-8;base64,${bldWoff2.toString("base64")}`;
  } catch (e) {}

  return `
  <!DOCTYPE html>
  <html lang="${lang}">
  <head>
    <meta charset="UTF-8">
    <style>
      @font-face {
        font-family: 'Noto Sans Devanagari';
        src: url('${fontBase64}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Noto Sans Devanagari';
        src: url('${fontBoldBase64}') format('woff2');
        font-weight: 700;
        font-style: normal;
      }

      body {
        margin: 0;
        padding: 16px;
        font-family: 'Noto Sans Devanagari', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #000;
        width: 300px;
        box-sizing: border-box;
      }
      .center { text-align: center; }
      .bold { font-weight: 700; }
      .shop-name { font-size: 16px; margin-bottom: 2px; }
      .title { font-size: 10px; color: #444; margin-bottom: 8px; }
      .divider { border-bottom: 1.5px solid #333; margin: 6px 0; }
      
      .info-box {
        background-color: #f0f9ff;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        padding: 8px;
        margin: 8px 0;
        font-size: 11px;
        color: #1e3a5f;
      }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .info-row:last-child { margin-bottom: 0; }
      
      table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5px; }
      th { text-align: left; border-bottom: 1.5px solid #1e3a5f; padding: 4px 0; font-weight: 700; color: #1e3a5f; }
      td { padding: 4px 0; border-bottom: 1px solid #eee; }
      th.right, td.right { text-align: right; }
      
      .total-row { font-weight: 700; background-color: #f8fafc; color: #1e3a5f; }
      .total-row td { border-bottom: 1.5px solid #1e3a5f; border-top: 1.5px solid #1e3a5f; }
      
      .summary { margin: 10px 0; font-size: 12px; }
      .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      
      .net-payable {
        background-color: #0d4f2f;
        color: #fff;
        padding: 10px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        font-weight: 700;
        margin: 12px 0;
      }
      
      .signatures { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; font-weight: 700; }
      .sig-line { width: 40%; border-top: 1px dashed #777; margin-top: 24px; }
      
      .footer { margin-top: 16px; font-size: 9px; color: #666; text-align: center; }
      
      .watermark {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 60px;
        font-weight: 900;
        color: rgba(0,0,0,0.04);
        pointer-events: none;
        z-index: -1;
      }
    </style>
  </head>
  <body>
    <div class="watermark">MILKIFY</div>
    
    <div class="center">
      ${logoBase64 ? `<img src="${logoBase64}" width="56" style="margin-bottom:6px">` : ''}
      <div class="bold shop-name">${adminShopName.toUpperCase()}</div>
      <div class="title">${L.title}</div>
    </div>
    <div class="divider"></div>
    
    <div class="info-box">
      <div class="info-row bold"><span>${L.farmer}:</span> <span>${(farmer?.name || "Unknown").toUpperCase()}</span></div>
      <div class="info-row"><span>${L.memberId}:</span> <span>${farmer?.memberId || "#" + (farmer?.id || "").toString().slice(-6).toUpperCase()}</span></div>
      <div class="info-row"><span>${L.mobile}:</span> <span>${farmer?.mobile || "N/A"}</span></div>
      <div class="info-row"><span>${L.village}:</span> <span>${farmer?.village || "N/A"}</span></div>
      <div class="info-row bold"><span>${L.period}:</span> <span>${fmtDate(dateRange.startDate)} - ${fmtDate(dateRange.endDate)}</span></div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>${L.date}</th>
          <th>${L.shift}</th>
          <th>${L.category}</th>
          <th class="right">${L.liters}</th>
          <th class="right">${L.fat}</th>
          <th class="right">${L.snf}</th>
          <th class="right">${L.amount}</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(e => `
        <tr>
          <td>${fmtShortDate(e.createdAt)}</td>
          <td>${SHIFT_MAP[lang]?.[e.shift] || e.shift}</td>
          <td>${CAT_MAP[lang]?.[e.category.toLowerCase()] || e.category.charAt(0).toUpperCase() + e.category.slice(1)}</td>
          <td class="right">${Number(e.litter || 0).toFixed(1)}</td>
          <td class="right">${Number(e.fat || 0).toFixed(1)}</td>
          <td class="right">${Number(e.snf || 0).toFixed(1)}</td>
          <td class="right">${Number(e.calculatedAmount || 0).toFixed(1)}</td>
        </tr>
        `).join("")}
        <tr class="total-row">
          <td>${L.days}:${uniqueDays}</td>
          <td></td>
          <td>${L.total}</td>
          <td class="right">${summary.totalLiters.toFixed(1)}</td>
          <td class="right">${summary.avgFat.toFixed(1)}</td>
          <td class="right">${summary.avgSnf.toFixed(1)}</td>
          <td class="right">${summary.totalAmount.toFixed(1)}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="summary">
      <div class="summary-row"><span>${L.totalQty}:</span> <span>${summary.totalLiters.toFixed(2)} L</span></div>
      <div class="summary-row"><span>${L.avgFatSnf}:</span> <span>${summary.avgFat.toFixed(2)} / ${summary.avgSnf.toFixed(2)}</span></div>
      <div class="summary-row"><span>${L.avgRate}:</span> <span>Rs. ${avgRate.toFixed(2)}</span></div>
    </div>
    
    <div class="net-payable">
      <span>${L.netPayable}</span>
      <span>${formatINR(summary.totalAmount)}</span>
    </div>
    
    <div class="signatures">
      <span>${L.receiverSign}</span>
      <span>${L.officeSign}</span>
    </div>
    <div style="display:flex; justify-content:space-between;">
      <div class="sig-line"></div>
      <div class="sig-line"></div>
    </div>
    
    <div class="footer">
      <div>${L.generated}: ${fmtDateTime()}</div>
      <div>${L.footer}</div>
    </div>
  </body>
  </html>
  `;
}

let _browser = null;

async function getBrowser() {
  if (!_browser) {
    try {
      _browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (e) {
      console.error("[PDF] Failed to launch Edge browser:", e.message);
      throw new Error("Unable to launch PDF engine (Edge).");
    }
  }
  return _browser;
}

async function createPdfBuffer(data, lang) {
  const html = buildHtml(data, lang);
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Set content and wait until network is idle (though resources are base64 inline so it's instant)
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Evaluate the height of the document
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle.boundingBox();
  // Provide extra bottom padding
  const contentHeight = Math.ceil(boundingBox.height) + 'px';
  
  const pdfBuffer = await page.pdf({
    width: '300px',
    height: contentHeight,
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });
  
  await page.close();
  return pdfBuffer;
}

exports.generateBillingPdf = async (data, res, lang = "en") => {
  try {
    const buffer = await createPdfBuffer(data, lang);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Bill_${data.farmer?.name || 'Farmer'}_${data.dateRange?.startDate || 'Report'}.pdf`);
    res.end(buffer);
  } catch (err) {
    console.error("[Billing] PDF Generation error:", err);
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};

exports.generateBillingPdfBuffer = async (data, lang = "en") => {
  return createPdfBuffer(data, lang);
};
