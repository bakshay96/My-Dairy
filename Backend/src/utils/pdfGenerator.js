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
    title: "THERMAL MILK COLLECTION SLIP",
    slipSubtitle: "POS 80mm Cycle Statement",
    farmer: "FARMER", memberId: "MEMBER ID", mobile: "MOBILE",
    village: "VILLAGE", period: "PERIOD", filter: "VIEW",
    date: "DATE", shift: "S", category: "CAT", liters: "LTR",
    fat: "FAT", snf: "SNF", amount: "AMT(Rs)", status: "STATUS",
    days: "DAYS", total: "TOTAL",
    totalQty: "Total Quantity", avgFatSnf: "Avg FAT / SNF",
    avgRate: "Avg Rate / Ltr", grossTotal: "Gross Bill Total",
    paidAmount: "Paid Amount", unpaidBalance: "Balance Payable",
    netPayable: "NET PAYABLE",
    paidStamp: "*** FULLY PAID / पूर्ण चुकता ***",
    unpaidStamp: "*** BALANCE DUE / देय बाकी ***",
    partialStamp: "*** PARTIALLY PAID / अंशतः चुकता ***",
    receiverSign: "Farmer Sign", officeSign: "Authorized Sign",
    generated: "Generated", footer: "System Generated - POS Thermal Slip",
    morning: "M", evening: "E",
    statusPaid: "PAID", statusUnpaid: "UNPD",
    allFilter: "All Entries", unpaidFilter: "Unpaid Only", paidFilter: "Paid Only",
  },
  hi: {
    title: "थर्मल दूध संग्रह पर्ची",
    slipSubtitle: "पीओएस 80mm चक्र विवरण",
    farmer: "किसान", memberId: "सदस्य ID", mobile: "मोबाइल",
    village: "गाँव", period: "अवधि", filter: "श्रेणी",
    date: "तारीख", shift: "प", category: "प्र", liters: "लीटर",
    fat: "फैट", snf: "एसएनएफ", amount: "राशि", status: "स्थिति",
    days: "दिन", total: "कुल",
    totalQty: "कुल दूध मात्रा", avgFatSnf: "औसत FAT / SNF",
    avgRate: "औसत दर / लीटर", grossTotal: "कुल चक्र बिल",
    paidAmount: "चुकता राशि", unpaidBalance: "बाकी देय राशि",
    netPayable: "अंतिम देय राशि",
    paidStamp: "*** पूर्ण चुकता / ALL PAID ***",
    unpaidStamp: "*** देय बाकी / UNPAID ***",
    partialStamp: "*** अंशतः चुकता / PARTIAL ***",
    receiverSign: "किसान हस्ताक्षर", officeSign: "कार्यालय हस्ताक्षर",
    generated: "निर्मिती समय", footer: "Milkify डेयरी - थर्मल पावती",
    morning: "स", evening: "श",
    statusPaid: "चुकता", statusUnpaid: "बाकी",
    allFilter: "सभी प्रविष्टियां", unpaidFilter: "केवल बाकी", paidFilter: "केवल चुकता",
  },
  mr: {
    title: "थर्मल दूध संकलन पावती",
    slipSubtitle: "POS 80mm सायकल पावती",
    farmer: "शेतकरी", memberId: "सदस्य ID", mobile: "मोबाइल",
    village: "गाव", period: "कालावधी", filter: "प्रवर्ग",
    date: "तारीख", shift: "स", category: "प्र", liters: "लिटर",
    fat: "फॅट", snf: "SNF", amount: "रक्कम", status: "स्थिती",
    days: "दिवस", total: "एकूण",
    totalQty: "एकूण दूध प्रमाण", avgFatSnf: "सरासरी FAT / SNF",
    avgRate: "सरासरी दर / लिटर", grossTotal: "एकूण चक्र बिल",
    paidAmount: "चुकता रक्कम", unpaidBalance: "बाकी देय रक्कम",
    netPayable: "एकूण देय रक्कम",
    paidStamp: "*** पूर्ण चुकता / ALL PAID ***",
    unpaidStamp: "*** देय बाकी / UNPAID ***",
    partialStamp: "*** अंशतः चुकता / PARTIAL ***",
    receiverSign: "शेतकरी स्वाक्षरी", officeSign: "डेअरी स्वाक्षरी",
    generated: "निर्मिती वेळ", footer: "Milkify डेअरी - POS थर्मल पावती",
    morning: "स", evening: "सं",
    statusPaid: "चुकता", statusUnpaid: "बाकी",
    allFilter: "सर्व नोंदी", unpaidFilter: "फक्त बाकी नोंदी", paidFilter: "फक्त चुकता नोंदी",
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
  en: { morning: "M", evening: "E" },
  hi: { morning: "स", evening: "श" },
  mr: { morning: "स", evening: "सं" },
};

const CAT_MAP = {
  en: { cow: "Cow", goat: "Goat", buffalo: "Buf" },
  hi: { cow: "गाय", goat: "बकरी", buffalo: "भैंस" },
  mr: { cow: "गाय", goat: "बकरी", buffalo: "म्हैस" },
};

function buildHtml(data, lang) {
  const { farmer, entries, summary, dateRange, adminShopName = "Milkify Dairy", filterStatus = "all", payment = {} } = data;
  const L = LABELS[lang] || LABELS.en;
  
  const avgRate = summary.totalLiters > 0 ? (summary.totalAmount / summary.totalLiters) : 0;
  const uniqueDays = new Set(entries.map((e) => new Date(e.createdAt).toDateString())).size;

  const paidAmt = Number(summary.paidAmount != null ? summary.paidAmount : (payment.paidAmount || 0));
  const unpaidAmt = Number(summary.unpaidAmount != null ? summary.unpaidAmount : (payment.unpaidAmount || summary.totalAmount));
  const isPaidAll = summary.unpaidEntries === 0 && entries.length > 0;
  const isPartial = (summary.paidEntries || 0) > 0 && (summary.unpaidEntries || 0) > 0;

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

  const filterLabel = 
    filterStatus === "unpaid" ? L.unpaidFilter :
    filterStatus === "paid" ? L.paidFilter : L.allFilter;

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

      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 10px 8px;
        font-family: 'Noto Sans Devanagari', 'Courier New', Courier, monospace;
        color: #000;
        width: 290px;
        background: #fff;
        font-size: 10.5px;
        line-height: 1.3;
      }
      .center { text-align: center; }
      .bold { font-weight: 700; }
      .shop-name { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 2px; }
      .title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #222; }
      .subtitle { font-size: 8.5px; color: #555; }
      
      .dashed-divider { border-top: 1.5px dashed #000; margin: 5px 0; }
      .double-divider { border-top: 2px solid #000; border-bottom: 1px solid #000; height: 2px; margin: 5px 0; }
      
      .info-row { display: flex; justify-content: space-between; margin-bottom: 2.5px; font-size: 10px; }
      .info-row:last-child { margin-bottom: 0; }
      
      table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 9.5px; }
      th { text-align: left; border-bottom: 1.5px dashed #000; border-top: 1.5px dashed #000; padding: 3px 1px; font-weight: 700; }
      td { padding: 3px 1px; border-bottom: 1px dotted #ccc; }
      th.right, td.right { text-align: right; }
      th.center, td.center { text-align: center; }
      
      .badge-paid {
        display: inline-block;
        font-size: 8px;
        font-weight: 800;
        background: #e6f4ea;
        color: #137333;
        padding: 0 3px;
        border-radius: 2px;
        border: 0.5px solid #a8dab5;
      }
      .badge-unpaid {
        display: inline-block;
        font-size: 8px;
        font-weight: 800;
        background: #fef7e0;
        color: #b06000;
        padding: 0 3px;
        border-radius: 2px;
        border: 0.5px solid #f9ab00;
      }
      
      .total-row { font-weight: 700; border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; }
      .total-row td { border-bottom: none; padding: 4px 1px; }

      .summary-box { margin: 6px 0; font-size: 10px; }
      .summary-line { display: flex; justify-content: space-between; margin-bottom: 3px; }
      
      .net-payable {
        background: #000;
        color: #fff;
        padding: 6px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        font-weight: 800;
        margin: 6px 0;
      }

      .stamp-box {
        border: 2px dashed #000;
        padding: 5px;
        margin: 6px 0;
        text-align: center;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.5px;
      }
      
      .signatures { display: flex; justify-content: space-between; margin-top: 24px; font-size: 9px; font-weight: 700; }
      .sig-line { width: 42%; border-top: 1px dashed #444; margin-top: 20px; }
      
      .footer { margin-top: 10px; font-size: 8px; color: #444; text-align: center; }
      .barcode {
        letter-spacing: 4px;
        font-family: monospace;
        font-weight: 800;
        font-size: 13px;
        margin-top: 4px;
      }
    </style>
  </head>
  <body>
    <div class="center">
      ${logoBase64 ? `<img src="${logoBase64}" width="42" style="margin-bottom:3px">` : ''}
      <div class="shop-name">${adminShopName.toUpperCase()}</div>
      <div class="title">${L.title}</div>
      <div class="subtitle">${L.slipSubtitle} • ${filterLabel}</div>
    </div>
    
    <div class="dashed-divider"></div>
    
    <div class="info-row bold"><span>${L.farmer}:</span> <span>${(farmer?.name || "Unknown").toUpperCase()}</span></div>
    <div class="info-row"><span>${L.memberId}:</span> <span style="font-family:monospace;font-weight:700;">${farmer?.memberId || "#" + (farmer?.id || "").toString().slice(-6).toUpperCase()}</span></div>
    <div class="info-row"><span>${L.mobile}:</span> <span>${farmer?.mobile || "N/A"}</span></div>
    <div class="info-row"><span>${L.village}:</span> <span>${farmer?.village || "N/A"}</span></div>
    <div class="info-row bold"><span>${L.period}:</span> <span>${fmtDate(dateRange.startDate)} - ${fmtDate(dateRange.endDate)}</span></div>
    <div class="info-row"><span>${L.filter}:</span> <span class="bold">${filterLabel}</span></div>
    
    <table>
      <thead>
        <tr>
          <th>${L.date}</th>
          <th>${L.shift}</th>
          <th>${L.category}</th>
          <th class="right">${L.liters}</th>
          <th class="right">${L.fat}</th>
          <th class="right">${L.amount}</th>
          <th class="center">${L.status}</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(e => {
          const isEPaid = e.paymentStatus === "paid";
          return `
          <tr>
            <td>${fmtShortDate(e.createdAt)}</td>
            <td>${SHIFT_MAP[lang]?.[e.shift] || e.shift?.charAt(0).toUpperCase()}</td>
            <td>${CAT_MAP[lang]?.[e.category?.toLowerCase()] || e.category?.charAt(0).toUpperCase()}</td>
            <td class="right">${Number(e.litter || 0).toFixed(1)}</td>
            <td class="right">${Number(e.fat || 0).toFixed(1)}</td>
            <td class="right bold">${Number(e.calculatedAmount || 0).toFixed(0)}</td>
            <td class="center">
              <span class="${isEPaid ? 'badge-paid' : 'badge-unpaid'}">
                ${isEPaid ? L.statusPaid : L.statusUnpaid}
              </span>
            </td>
          </tr>
          `;
        }).join("")}
        <tr class="total-row">
          <td colspan="2">${L.days}:${uniqueDays}</td>
          <td>${L.total}</td>
          <td class="right">${summary.totalLiters.toFixed(1)}L</td>
          <td class="right">${summary.avgFat.toFixed(1)}%</td>
          <td class="right bold">${Number(summary.totalAmount || 0).toFixed(0)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    
    <div class="summary-box">
      <div class="summary-line"><span>${L.totalQty}:</span> <span class="bold">${summary.totalLiters.toFixed(2)} L</span></div>
      <div class="summary-line"><span>${L.avgFatSnf}:</span> <span>${summary.avgFat.toFixed(2)}% / ${summary.avgSnf.toFixed(2)}</span></div>
      <div class="summary-line"><span>${L.avgRate}:</span> <span>Rs. ${avgRate.toFixed(2)} / L</span></div>
      <div class="dashed-divider"></div>
      <div class="summary-line"><span>${L.grossTotal}:</span> <span>${formatINR(summary.totalAmount)}</span></div>
      <div class="summary-line"><span>${L.paidAmount}:</span> <span style="color:#137333;font-weight:700;">${formatINR(paidAmt)}</span></div>
      <div class="summary-line bold"><span>${L.unpaidBalance}:</span> <span style="color:#b06000;">${formatINR(unpaidAmt)}</span></div>
    </div>
    
    <div class="net-payable">
      <span>${L.netPayable}</span>
      <span>${formatINR(filterStatus === 'paid' ? paidAmt : (filterStatus === 'unpaid' ? unpaidAmt : unpaidAmt))}</span>
    </div>
    
    <div class="stamp-box">
      ${isPaidAll ? L.paidStamp : (isPartial ? L.partialStamp : L.unpaidStamp)}
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
      <div class="barcode">|| | | ||| || ||| | |||</div>
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
