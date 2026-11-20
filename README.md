<div align="center">

# 🥛 Milkify — Next-Gen Multi-Tenant Dairy SaaS Platform

**Empowering rural dairy cooperatives, procurement centers, and enterprise milk plants with real-time digital collections, automated Fat/SNF pricing engines, cycle billing, and multi-tenant SaaS governance.**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

<br />

<p align="center">
  <a href="#-screens-tour-of-milkify">View Screens Tour</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-dual-tier-architecture">Architecture</a> •
  <a href="#-local-setup--quickstart">Quickstart</a>
</p>

</div>

---

## 📖 Overview

**Milkify** is a production-grade, full-stack multi-tenant SaaS platform built to replace traditional paper registers and fragmented legacy software across dairy procurement societies. It manages end-to-end milk collection workflows—from lactometer & fat testing intake to 10-day automated payment cycle settlements—with precision, transparency, and speed.

Milkify operates on a **dual-tier management architecture**:
1. **Dairy Admin Workspace (Tenant Level)**: Tailored for local dairy owners and collection agents to log daily milk batches (Cow/Buffalo), calculate rates dynamically based on Fat & SNF/CLR, manage farmer registers, issue bilingual thermal slips, and track revenue analytics.
2. **Master Superadmin Workspace (Platform Level)**: An orchestration suite for platform owners to govern tenant lifecycle subscriptions, configure SaaS pricing tiers, manage promo vouchers, broadcast alerts, monitor real-time GeoIP visitor telemetry, and handle global support tickets.

---

## ⚡ Key Features

### 🥛 Dairy Admin (Tenant) Capabilities
- **Real-Time Milk Procurement**: Fast intake entry supporting Cow and Buffalo milk across Morning and Evening shifts with automated Fat, SNF, CLR degree, and volume calculations.
- **Dynamic Pricing Engine**: Granular rate matrix configuration allowing variable base prices, bonus incentives, and custom formulas based on fat and solids non-fat percentages.
- **Automated 10-Day Cycle Billing**: Automated reconciliation of milk deliveries across standard 10-day payment cycles, generating structured payment invoices and deduction slips.
- **Thermal & PDF Slip Generation**: Instant receipt printing with bilingual support (English & Marathi/Devanagari) for milk collection slips and payment vouchers.
- **Farmer Portfolio & Ledger**: Complete records for registered farmers, including membership codes, cattle count, bank details, and historic ledger balances.
- **Collection Analytics & Insights**: Interactive visual charts powered by Recharts, showing daily volume trends, fat-quality distribution, and revenue-vs-payout forecasting.
- **SaaS Subscription Desk**: In-app subscription tier status, coupon redemptions, and integrated Razorpay checkout for seamless license renewals.
- **Support Ticket System**: Direct communication channel with platform administrators for incident reporting and technical assistance.

### 🛡️ Master Superadmin Capabilities
- **Platform Analytics & Health**: Real-time multi-tenant monitoring showing active dairy subscriptions, total platform milk volume, and aggregate SaaS MRR.
- **Global Farmer & Tenant Directory**: Cross-tenant visibility into all registered farmers, dairy centers, and operator profiles with audit tools.
- **Visitor Telemetry & GeoIP Tracking**: Real-time logging of application traffic with IP address, city, country, device type, and visit counts via GeoIP-Lite.
- **SaaS Pricing Tier Manager**: Dynamic configuration of subscription packages (Free Trial, Starter, Professional, Enterprise), duration rules, and feature limits.
- **Promotional Code Engine**: Creation of discount vouchers with usage quotas, expiration dates, and percentage or flat-rate deductions.
- **System Broadcast Alerts & Advertisements**: Banner announcements and emergency maintenance notices dispatched across all tenant dashboards.
- **Master Support Helpdesk**: Centralized triage desk to review, prioritize, assign, and resolve support requests submitted by dairy operators.
- **System Architecture & Database Schema Visualizer**: In-dashboard interactive schema diagrams and MindMapFlow architecture maps for rapid debugging.

---

## 🖥️ Tech Stack

Milkify is architected using a modern, decoupled full-stack stack designed for low latency, high uptime, and zero-loss financial accounting.

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend Framework** | **Next.js 14.2** (App Router, Server & Client Components), **React 18.3** |
| **Styling & UI Components** | **Tailwind CSS 3.4**, **Radix UI** primitives, **Lucide React** Icons, **Framer Motion 11** |
| **State Management** | **Zustand 4.5** (lightweight reactive state), **React Hook Form**, **Zod 3.23** |
| **Data Visualization** | **Recharts 2.12** (interactive SVG analytics, collection trends, fat/snf distributions) |
| **Backend Runtime & API** | **Node.js 18+**, **Express.js 4.18**, **Socket.io 4.8** (live real-time updates) |
| **Database & ODM** | **MongoDB Atlas**, **Mongoose 8.0** (with Decimal128 schema precision for monetary data) |
| **Authentication & Security**| **JWT (JSON Web Tokens)**, **Bcryptjs**, **Helmet**, **Express Rate Limit**, **CORS** |
| **Payment Gateway** | **Razorpay Node SDK** (Webhooks, order generation, automated subscription billing) |
| **PDF & Slip Generation** | **PDFKit**, **PDFKit-Table**, `@fontsource/noto-sans-devanagari` (Bilingual Indian printing) |
| **Cloud & Media Storage** | **Cloudinary SDK**, **AWS S3 Client** (`@aws-sdk/client-s3`) |
| **AI & Telemetry** | **Google Generative AI SDK** (`@google/generative-ai`), **OpenAI SDK**, **GeoIP-Lite** |

---

## 📸 Screens Tour of Milkify

Explore the live interface of Milkify running directly on local and production environments.

### 🌐 1. Public & Authentication Portals

<table>
  <tr>
    <td align="center" width="50%">
      <b>Modern SaaS Landing Page</b><br />
      <sub>High-converting hero, live milk collection counter, feature cards, and dual-portal entry</sub>
    </td>
    <td align="center" width="50%">
      <b>Dairy Admin Login & Registration</b><br />
      <sub>Secure credential entry, OTP verification, and instant tenant onboarding</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/01-landing-page.png" alt="Milkify Landing Page" /></td>
    <td><img src="./screenshots/02-admin-login.png" alt="Dairy Admin Login" /></td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <b>Master Superadmin Authentication Portal</b><br />
      <sub>Restricted security-shielded authentication gateway for platform governors</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="./screenshots/03-master-login.png" alt="Master Admin Login" width="85%" /></td>
  </tr>
</table>

<br />

### 👨‍🌾 2. Dairy Admin Workspace Tour

<table>
  <tr>
    <td align="center" width="50%">
      <b>Dashboard Overview</b><br />
      <sub>Real-time milk intake counters, today's volume, active farmers, and shift metrics</sub>
    </td>
    <td align="center" width="50%">
      <b>Milk Collection Entry</b><br />
      <sub>Rapid intake form with automated Fat/SNF calculations and thermal slip printing</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/admin/01-dashboard-overview.png" alt="Admin Dashboard Overview" /></td>
    <td><img src="./screenshots/admin/02-add-milk.png" alt="Milk Entry Screen" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Farmers Directory</b><br />
      <sub>Comprehensive farmer registry, membership codes, cattle profiles, and balances</sub>
    </td>
    <td align="center" width="50%">
      <b>Dynamic Pricing & Rate Matrix</b><br />
      <sub>Customizable Fat and SNF base rate tables for Cow and Buffalo milk</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/admin/03-farmers.png" alt="Farmers Directory" /></td>
    <td><img src="./screenshots/admin/04-pricing-rates.png" alt="Pricing Engine Matrix" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Billing Hub & Invoices</b><br />
      <sub>Automated 10-day payment cycle settlement sheets, PDF downloads, and payout logs</sub>
    </td>
    <td align="center" width="50%">
      <b>Analytics & Quality Trends</b><br />
      <sub>Visual Recharts metrics comparing Morning vs Evening yields and average fat curves</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/admin/05-billing.png" alt="Billing Hub" /></td>
    <td><img src="./screenshots/admin/06-analytics.png" alt="Analytics and Insights" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Subscription Management</b><br />
      <sub>Active SaaS license status, plan upgrades, promo code input, and Razorpay checkout</sub>
    </td>
    <td align="center" width="50%">
      <b>Support & Helpdesk</b><br />
      <sub>Direct ticketing desk with priority status tracking and technical support records</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/admin/07-subscription.png" alt="Subscription Management" /></td>
    <td><img src="./screenshots/admin/08-support.png" alt="Support Desk" /></td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <b>Dairy Settings & Profile</b><br />
      <sub>Center naming, print slip headers, bilingual language preferences, and security</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="./screenshots/admin/09-settings.png" alt="Dairy Settings" width="85%" /></td>
  </tr>
</table>

<br />

### 👑 3. Master Superadmin Workspace Tour

<table>
  <tr>
    <td align="center" width="50%">
      <b>Master Overview Dashboard</b><br />
      <sub>Global SaaS metrics, active tenant counts, subscription MRR, and platform activity</sub>
    </td>
    <td align="center" width="50%">
      <b>Global Farmers Registry</b><br />
      <sub>Multi-tenant farmers registry spanning all registered dairies with search & audit tools</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/master/01-master-dashboard.png" alt="Master Dashboard" /></td>
    <td><img src="./screenshots/master/02-farmers-directory.png" alt="Global Farmers Directory" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Visitor & GeoIP Telemetry</b><br />
      <sub>Geographic origin analytics, client IP logs, device types, and access frequency</sub>
    </td>
    <td align="center" width="50%">
      <b>System Broadcast Notifications</b><br />
      <sub>Global announcement broadcaster for maintenance notices and policy updates</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/master/03-visitor-analytics.png" alt="Visitor Analytics" /></td>
    <td><img src="./screenshots/master/04-notifications.png" alt="System Notifications" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>SaaS Pricing Plans Engine</b><br />
      <sub>Subscription tier creator, pricing limits, billing frequencies, and feature gates</sub>
    </td>
    <td align="center" width="50%">
      <b>Promo Codes & Vouchers</b><br />
      <sub>Promotional discount manager with usage limits, expiry controls, and redemption audits</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/master/05-pricing-plans.png" alt="Pricing Plans" /></td>
    <td><img src="./screenshots/master/06-promo-codes.png" alt="Promo Codes" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Platform Advertisements</b><br />
      <sub>Tenant-wide sponsor campaigns, promo banners, and marketing broadcasts</sub>
    </td>
    <td align="center" width="50%">
      <b>Superadmin Support Desk</b><br />
      <sub>Multi-tenant support queue with ticket prioritization, assignment, and resolution</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/master/07-advertisements.png" alt="Platform Advertisements" /></td>
    <td><img src="./screenshots/master/08-support-desk.png" alt="Superadmin Support Desk" /></td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Database Schema Visualizer</b><br />
      <sub>Live Mongoose database schema explorer mapping models and relationship constraints</sub>
    </td>
    <td align="center" width="50%">
      <b>System Architecture Map</b><br />
      <sub>Interactive MindMapFlow engine charting full-stack data flows and service pipelines</sub>
    </td>
  </tr>
  <tr>
    <td><img src="./screenshots/master/09-application-schema.png" alt="Application Schema" /></td>
    <td><img src="./screenshots/master/10-architecture.png" alt="System Architecture" /></td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <b>Master Security & Account Settings</b><br />
      <sub>Superadmin credentials, API key rotation, security controls, and platform logs</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="./screenshots/master/11-master-settings.png" alt="Master Settings" width="85%" /></td>
  </tr>
</table>

---

## 🏛️ Architecture & Multi-Tenancy

Milkify adopts a **Logical Multi-Tenancy Architecture** where every tenant's data is strictly partitioned and isolated:

```
                      +---------------------------------------+
                      |         Milkify Gateway / Cloud        |
                      +---------------------------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
       [ Master Superadmin ]                           [ Dairy Admin Tenant ]
       - SaaS Tier Management                          - Daily Milk Intake
       - Global Telemetry & GeoIP                      - Farmer Directory
       - Platform Broadcasts                           - 10-Day Cycle Billing
       - Global Support Triage                         - Thermal Slip Printing
                   |                                             |
                   +----------------------+----------------------+
                                          |
                              [ Express.js REST API ]
                             (JWT Auth & Role Guard)
                                          |
                  +-----------------------+-----------------------+
                  |                                               |
         [ MongoDB Database ]                            [ 3rd-Party APIs ]
         - adminId Scoped Partitioning                   - Razorpay Payments
         - Farmers / Milk Collections                    - Cloudinary & AWS S3
         - Invoices & Rate Settings                      - Nodemailer SMTP
```

- **Data Isolation**: All primary entity models (`Farmer`, `Milk`, `Payment`, `RateSetting`, `Ticket`) enforce an indexed `adminId` foreign key. All queries are scoped strictly to the authenticated tenant.
- **Master Admin Isolation**: Master admin functions operate on a separated authentication model with specialized permission verification.

---

## 🚀 Local Setup & Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas URI
- **Package Manager**: `npm` or `pnpm`

---

### 1. Clone the Repository
```bash
git clone https://github.com/bakshay96/My-Dairy.git
cd My-Dairy
```

---

### 2. Configure Backend Server
Navigate to the `Backend` directory and install dependencies:
```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/.env`:
```env
PORT=3030
NODE_ENV=development
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/milkify
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the Backend Server:
```bash
npm run dev
# Server runs at http://localhost:3030
```

---

### 3. Configure Frontend (Next.js 14)
Open a new terminal window, navigate to `milkify-next` and install dependencies:
```bash
cd ../milkify-next
npm install
```

Create `.env.local` in `milkify-next/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3030
```

Start the Frontend Development Server:
```bash
npm run dev
# Application runs at http://localhost:3000
```

---


---

## 👨‍💻 Author & Contact

Developed with ❤️ by **Akshay Bombatkar**

- **LinkedIn**: [linkedin.com/in/akshayb-profile](https://www.linkedin.com/in/akshayb-profile)
- **GitHub**: [@bakshay96](https://github.com/bakshay96)
- **Project Repository**: [github.com/bakshay96/My-Dairy](https://github.com/bakshay96/My-Dairy)

---

## 🌟 Show your support

If you find Milkify useful or inspiring, please star this repository! ⭐️
