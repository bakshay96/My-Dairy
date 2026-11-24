# Milkify Ecosystem Changelog

All notable changes to the Milkify SaaS platform are documented in this file.
The project adheres to [Semantic Versioning (SemVer 2.0.0)](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0] - 2026-11-24
### 🚀 Major Feature Release: Dairy Products & Cattle Feed E-Commerce Ecosystem called Milki_Store

#### ✨ Added
- **Omnichannel E-Commerce Storefront (`/store/[slug]`)**:
  - Public end-user storefront tailored per dairy outlet.
  - Three distinct product vertical categories:
    1. 🥛 `dairy`: Milk, Paneer, Curd, Ghee, Butter, Sweets.
    2. 🌾 `farming`: Cattle Feed (Sudha, Amul, Kapila, Khal, Chuni), Mineral Mixtures, Milking essentials.
    3. 🛒 `kirana`: Daily groceries and rural household staples.
  - Live search, category pills, price & rating sorting.
  - Slide-over Cart and Wishlist Drawers with real-time stock limits.
  - Instant promo code support (`WELCOME50`).
- **Hyper-Local Village Geofenced Delivery Engine**:
  - Haversine mathematical distance validation ($\text{km}$) between outlet GPS coordinates and customer address.
  - Village cluster white-listing against `serviceVillages`.
  - Automated fallback to In-Store Counter Pickup for customers located outside delivery perimeter.
- **Dairy Admin Store Hub (`/dashboard/store`)**:
  - Unified 4-tab cockpit: Inventory Catalog, Orders Pipeline, POS Walk-in Counter Billing with instant thermal slips, and Village Geofence Configuration.
- **Physical POS Walk-in Counter Billing**:
  - Instant counter billing deducting from unified stock pool in real-time.
  - Generation of 2-inch and 3-inch thermal bill receipts for walk-in farmers and customers.
- **Live Order Tracking (`/store/track/[orderNumber]`)**:
  - 5-stage visual progress timeline (`placed` ➔ `confirmed` ➔ `packed` ➔ `out_for_delivery` ➔ `delivered`).
  - Delivery runner assignment details and digital invoice slip.
- **Master Admin Franchise Network Console (`/master/dashboard/store-network`)**:
  - Platform-wide Gross Merchandise Value (GMV ₹) aggregation.
  - Total registered outlets and product catalog analytics.
  - One-click outlet enablement and maintenance toggle.
- **Modular Audit-Ready Backend (`Backend/src/Store/`)**:
  - Split into distinct modular subdirectories: `models/`, `controllers/`, `services/`, and `routes/`.
  - Zero interference with existing dairy core operations (milk collection, rate charts, billing, farmers).

#### 🛠️ Fixed
- **Razorpay Checkout Contact Modal**:
  - Sanitized customer contact numbers to strict 10-digit Indian mobile formats (excluding `+91`).
  - Added `readonly: { contact: true, email: true, name: true }` in Razorpay options, eliminating the unwanted *"Enter mobile & email to continue"* popup modal.
- **Frontend Compilation & Toast Dependencies**:
  - Standardized toast messaging on internal `@/lib/toast` across all store pages.
  - Enhanced toast helper with `.info()` and `.warning()` fallback methods.
  - Fixed Next.js 14 dynamic parameter resolving for static compilation (32/32 pages build passed).

---

## [2.4.0] - 2026-11-22
### Added
- Cloud storage integration with AWS S3 Presigned URLs for media gallery.
- Audio payment announcements for live cashier terminals.
- Dynamic subscription promo code scroller and multi-tier plan lock.

---

## [2.0.0] - 2026-10-15
### Added
- Master Admin Multi-Tenant Architecture.
- Automated daily billing reports and SMS rate alerts.
- Farmer ledger and cattle records management.
