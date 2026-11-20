"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  Network, Database, ArrowLeftRight, Search,
  RefreshCw, CheckCircle2, Shield,
  Zap, Plus, Minus,
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw,
  GitBranch, Check, Copy, Monitor, Layout, Terminal,
  Columns, Rows, Move, Cpu, Server, Wifi, Code2,
  Smartphone, Radio, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ── Complete MindMapFlow Hierarchical Tree Dataset ───────────────────────────
const TREE_DATA = {
  id: "root",
  name: "Milkify Full-Stack Architecture Engine",
  subtitle: "Frontend Next.js App Router ⟷ REST/WebSocket Transport ⟷ MongoDB Atlas Database",
  role: "system",
  badge: "Full-Stack System",
  color: "purple",
  icon: Database,
  description: "Complete full-stack architectural skeleton illustrating how Frontend UI routes connect through REST APIs and WebSockets to Backend Controllers and MongoDB Collections.",
  children: [
    // ══════════════════════════════════════════════════════════════════════════
    // BRANCH 1: FRONTEND ARCHITECTURE (milkify-next)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: "domain-frontend",
      name: "Frontend Architecture (milkify-next)",
      subtitle: "Next.js 14 App Router, Client Portals & Transport",
      role: "frontend",
      badge: "Client Layer",
      color: "blue",
      icon: Monitor,
      description: "Responsive Next.js React 18 client application partitioned into Master Admin and Dairy Admin operational portals with unified state and transport.",
      children: [
        // ── Master Admin UI Portal ───────────────────────────────────────────
        {
          id: "fe-master-portal",
          name: "Master Admin UI Portal (/master/*)",
          subtitle: "Super-Admin Control Plane & Governance Dashboard",
          role: "master",
          badge: "Master UI",
          color: "emerald",
          description: "Administrative console for managing tenant agencies, reviewing global farmer registries, configuring subscriptions, and answering support tickets.",
          children: [
            {
              id: "fe-m-overview",
              name: "/master/dashboard (Agency Overview)",
              badge: "Route",
              color: "emerald",
              description: "Master dashboard displaying real-time tenant counts, active subscriptions, and dairy list with quick actions.",
              uiComponent: "milkify-next/app/master/dashboard/page.jsx",
              apiEndpoint: "GET /master/dashboard/stats, GET /master/admins",
              dbTarget: "db.admins, db.subscriptions",
              authHeader: "Authorization: Bearer <master_token>",
              fields: [
                { name: "Dairy List Table", type: "React Component", desc: "Displays all tenant agencies with status & MI-DA-### badges" },
                { name: "Credentials Modal", type: "Modal Dialog", desc: "Allows Master Admin to modify Dairy Admin mobile & password" },
                { name: "Audit Trail", type: "UI Signature", desc: "Displays modifiedBy email and timestamp on updated records" },
              ],
            },
            {
              id: "fe-m-farmers",
              name: "/master/dashboard/farmers (Global Directory)",
              badge: "Route",
              color: "emerald",
              description: "Cross-tenant farmer directory allowing Master Admin to view, filter, and update credentials for all farmers across all dairies.",
              uiComponent: "milkify-next/app/master/dashboard/farmers/page.jsx",
              apiEndpoint: "GET /master/farmers, PATCH /master/farmers/:id/credentials",
              dbTarget: "db.farmers, db.admins",
              authHeader: "Authorization: Bearer <master_token>",
              fields: [
                { name: "Search & Filter", type: "Client Filter", desc: "Real-time search across farmer name, mobile, MI-FAR id, and dairy" },
                { name: "Credential Modal", type: "Modal Dialog", desc: "Allows updating mobile login ID and assigning generated passwords" },
                { name: "Audit Signature", type: "Audit Stamp", desc: "Stamps modifiedBy with current Master Admin email" },
              ],
            },
            {
              id: "fe-m-application",
              name: "/master/dashboard/application (My Application)",
              badge: "Route",
              color: "emerald",
              description: "Master application tech hub featuring MindMapFlow full-stack tree, framework blueprint, API registry, and roadmap.",
              uiComponent: "milkify-next/app/master/dashboard/application/page.jsx",
              apiEndpoint: "GET /master/database/schema-stats",
              dbTarget: "All 14 MongoDB Collections",
              authHeader: "Authorization: Bearer <master_token>",
              fields: [
                { name: "MindMapFlow Canvas", type: "SVG Tree", desc: "Horizontal/Vertical interactive tree with pan/zoom and collapsible branches" },
                { name: "Tech Stack Blueprint", type: "Architecture Matrix", desc: "Full breakdown of frameworks, runtimes, and databases" },
                { name: "API Registry", type: "Endpoint Table", desc: "Catalogue of all REST endpoints and WebSocket events" },
              ],
            },
            {
              id: "fe-m-tickets",
              name: "/master/dashboard/tickets (Support Desk)",
              badge: "Route",
              color: "emerald",
              description: "Real-time helpdesk resolution center for answering support inquiries submitted by Dairy Admins.",
              uiComponent: "milkify-next/app/master/dashboard/tickets/page.jsx",
              apiEndpoint: "GET /tickets/master/all, POST /tickets/master/reply",
              dbTarget: "db.tickets",
              authHeader: "Authorization: Bearer <master_token>",
              fields: [
                { name: "Ticket Queue", type: "Thread List", desc: "Categorized by Priority (urgent, high, medium, low) and Status" },
                { name: "Live Chat Thread", type: "WebSocket Chat", desc: "Instant bi-directional messaging with markdown support" },
              ],
            },
            {
              id: "fe-m-pricing-promos",
              name: "/master/dashboard/pricing & promos (Monetization)",
              badge: "Route",
              color: "emerald",
              description: "Management of monthly/quarterly/yearly SaaS pricing plans and discount promo codes.",
              uiComponent: "milkify-next/app/master/dashboard/pricing/page.jsx",
              apiEndpoint: "GET/PUT /master/plan-config, CRUD /master/promo-codes",
              dbTarget: "db.planconfigs, db.promocodes",
              authHeader: "Authorization: Bearer <master_token>",
              fields: [
                { name: "Tier Price Controls", type: "Form Input", desc: "Configures trial days, monthly, quarterly, yearly base prices" },
                { name: "Promo Voucher Manager", type: "Table & Dialog", desc: "Issues percentage or flat INR discount codes with usage limits" },
              ],
            },
            {
              id: "fe-m-advertisements",
              name: "/master/dashboard/advertisements (Alert Banners)",
              badge: "Route",
              color: "emerald",
              description: "Broadcast announcements and system maintenance banners delivered to Dairy Admin dashboards.",
              uiComponent: "milkify-next/app/master/dashboard/advertisements/page.jsx",
              apiEndpoint: "CRUD /master/advertisements",
              dbTarget: "db.advertisements",
              authHeader: "Authorization: Bearer <master_token>",
              fields: [
                { name: "Banner Composer", type: "Rich Editor", desc: "Composes info, warning, promo alerts with optional CTA links" },
                { name: "Targeting Matrix", type: "Multiselect", desc: "Broadcast to ALL dairies or filter to specific tenants" },
              ],
            },
          ],
        },

        // ── Dairy Admin Agency Portal ─────────────────────────────────────────
        {
          id: "fe-admin-portal",
          name: "Dairy Admin Agency Portal (/dashboard/*)",
          subtitle: "Dairy Agency Operational Workspace",
          role: "admin",
          badge: "Tenant UI",
          color: "blue",
          description: "Daily dairy intake center, farmer registry, slab-based rate charts, batch billing payouts, and analytics.",
          children: [
            {
              id: "fe-a-overview",
              name: "/dashboard (Agency Dashboard)",
              badge: "Route",
              color: "blue",
              description: "Daily operational overview showing morning/evening milk volume, revenue, average FAT, and quick links.",
              uiComponent: "milkify-next/app/dashboard/page.jsx",
              apiEndpoint: "GET /admin/dashboard-stats, GET /milk/today",
              dbTarget: "db.milks, db.farmers, db.admins",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "Live Shift Cards", type: "KPI Cards", desc: "Real-time Litres, FAT%, and total INR payable for current shift" },
                { name: "Broadcast Banner", type: "Alert Banner", desc: "Renders active announcements published by Master Admin" },
              ],
            },
            {
              id: "fe-a-milk",
              name: "/dashboard/add-milk (Milk Intake Session)",
              badge: "Route",
              color: "amber",
              description: "High-speed laboratory milk collection session. Records FAT, SNF, degree, volume, and computes instant payout.",
              uiComponent: "milkify-next/app/dashboard/add-milk/page.jsx",
              apiEndpoint: "POST /milk/create, GET /milk/recent",
              dbTarget: "db.milks, db.farmers, db.ratechartconfigs",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "Farmer Quick Search", type: "Search Input", desc: "Matches farmer by mobile, name, or MI-FAR memberId" },
                { name: "Quality Form", type: "Input Form", desc: "Inputs FAT%, SNF%, Lactometer Degree, and Litres" },
                { name: "Instant Rate Calculation", type: "Math Engine", desc: "Calculates total amount dynamically using tenant rate chart" },
              ],
            },
            {
              id: "fe-a-farmers",
              name: "/dashboard/farmers (Farmer Registry)",
              badge: "Route",
              color: "amber",
              description: "Dairy-specific farmer roster management. Registration of milk providers and dairy cattle self-profiles.",
              uiComponent: "milkify-next/app/dashboard/farmers/page.jsx",
              apiEndpoint: "GET /farmer/list, POST /farmer/create",
              dbTarget: "db.farmers",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "Farmer Roster Table", type: "Data Table", desc: "Lists farmers with MI-FAR-#### or MI-DAS-### badges" },
                { name: "Self-Farmer Profile", type: "Cattle Account", desc: "Tracks dairy owner's own herd milk contributions" },
              ],
            },
            {
              id: "fe-a-rates",
              name: "/dashboard/rates (Pricing & Slabs)",
              badge: "Route",
              color: "amber",
              description: "Configuration of base rate multipliers and multi-slab variable increment rate charts.",
              uiComponent: "milkify-next/app/dashboard/rates/page.jsx",
              apiEndpoint: "GET/PUT /milk/rate-settings, GET/PUT /milk/rate-chart-config",
              dbTarget: "db.ratesettings, db.ratechartconfigs",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "Animal Category Tabs", type: "Tab Bar", desc: "Independent rate charts for Cow, Buffalo, Goat, Sheep" },
                { name: "Slab Editor", type: "Curve Configurator", desc: "Configures variable INR increments per 0.1% FAT/SNF point" },
              ],
            },
            {
              id: "fe-a-billing",
              name: "/dashboard/billing (Farmer Disbursements)",
              badge: "Route",
              color: "emerald",
              description: "Milk payment settlement portal. Batches unpaid milk records and executes disbursements via Razorpay or Cash.",
              uiComponent: "milkify-next/app/dashboard/billing/page.jsx",
              apiEndpoint: "POST /payment/create-order, POST /payment/verify",
              dbTarget: "db.payments, db.milks",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "Billing Cycle Filter", type: "Date Range Filter", desc: "Calculates total dues for selected weekly/monthly cycle" },
                { name: "Razorpay Checkout", type: "Payment SDK", desc: "Executes instant online bank transfer payouts in Paise" },
                { name: "Bill Receipt Export", type: "PDF Generator", desc: "Generates printable milk slips and settlement statements" },
              ],
            },
            {
              id: "fe-a-subscription",
              name: "/dashboard/subscription (SaaS License)",
              badge: "Route",
              color: "blue",
              description: "Dairy agency subscription status, trial countdown timer, plan renewals, and invoice history.",
              uiComponent: "milkify-next/app/dashboard/subscription/page.jsx",
              apiEndpoint: "GET /master/subscription/my, POST /master/subscription/order",
              dbTarget: "db.subscriptions, db.planconfigs, db.promocodes",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "Plan Card", type: "Status Card", desc: "Displays current tier (trial, monthly, yearly) and days remaining" },
                { name: "Promo Voucher Input", type: "Redemption Form", desc: "Applies discount codes before Razorpay checkout" },
              ],
            },
            {
              id: "fe-a-support",
              name: "/dashboard/support (Helpdesk Desk)",
              badge: "Route",
              color: "indigo",
              description: "Direct support channel connecting Dairy Admin with Master Admin.",
              uiComponent: "milkify-next/app/dashboard/support/page.jsx",
              apiEndpoint: "POST /tickets/create, GET /tickets/my",
              dbTarget: "db.tickets",
              authHeader: "Authorization: Bearer <token>",
              fields: [
                { name: "New Ticket Form", type: "Modal Form", desc: "Submits title, category, priority, and markdown description" },
                { name: "Live Thread", type: "Chat UI", desc: "Real-time communication with Master Admin team" },
              ],
            },
          ],
        },

        // ── Client Transport & Communication Layer ────────────────────────────
        {
          id: "fe-transport",
          name: "Client Transport & State Layer",
          subtitle: "Axios REST Client, WebSockets & Local Session",
          role: "system",
          badge: "Transport Protocol",
          color: "purple",
          description: "Underlying network transport mechanisms that securely link Next.js React components to the Express backend.",
          children: [
            {
              id: "trans-axios",
              name: "Axios REST API Client (lib/api.js)",
              badge: "REST",
              color: "purple",
              description: "Configured Axios instance with request/response interceptors, automatic JWT bearer attachment, and timeout guards.",
              uiComponent: "milkify-next/lib/api.js",
              apiEndpoint: "Base URL: process.env.NEXT_PUBLIC_API_URL || http://localhost:8080",
              dbTarget: "All Express API Endpoints",
              authHeader: "Authorization: Bearer <token | master_token>",
              fields: [
                { name: "Request Interceptor", type: "Middleware", desc: "Pulls JWT from localStorage and attaches to Authorization header" },
                { name: "Response Interceptor", type: "Error Handler", desc: "Detects 401 Unauthorized and redirects to login" },
              ],
            },
            {
              id: "trans-socket",
              name: "Socket.io Client (lib/socket.js)",
              badge: "WebSocket",
              color: "purple",
              description: "Real-time bidirectional WebSocket client powering live ticket notifications and master broadcasts.",
              uiComponent: "milkify-next/lib/socket.js",
              apiEndpoint: "WebSocket Protocol (ws://localhost:8080)",
              dbTarget: "Live Message Bus",
              authHeader: "Handshake Auth",
              fields: [
                { name: "Auto Reconnection", type: "Socket Engine", desc: "Maintains active connection with automatic backoff" },
                { name: "Room Isolation", type: "Event Scoping", desc: "Scopes notifications to specific masterId or adminId" },
              ],
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // BRANCH 2: BACKEND DATABASE ENGINE (Express & MongoDB Atlas)
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: "domain-backend",
      name: "Backend Database Engine (MongoDB Atlas)",
      subtitle: "14 BSON Collections, Scoped Indexing & TTL Cleaners",
      role: "backend",
      badge: "Storage Engine",
      color: "emerald",
      icon: Database,
      description: "Scalable MongoDB Atlas cluster housing tenant identities, transaction ledgers, slab pricing matrix, and automated TTL caches.",
      children: [
        {
          id: "coll-masteradmin",
          name: "MasterAdmin Collection",
          collection: "masters",
          badge: "MI-MST-###",
          color: "emerald",
          description: "Root super-admin identity accounts. Authors of audits and global configs.",
          indexes: ["_id (Unique)", "email (Unique, Sparse)", "memberId (Unique, Sparse, Indexed)"],
          foreignKeys: [
            { target: "Ticket", field: "assignedTo", desc: "Resolves submitted tickets" },
            { target: "Advertisement", field: "createdBy", desc: "Authors broadcasts" },
            { target: "PlanConfig", field: "updatedBy", desc: "Updates pricing plans" },
            { target: "PromoCode", field: "createdBy", desc: "Issues discount vouchers" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary MongoDB key" },
            { name: "memberId", type: "String", required: true, desc: "Unique prefix MI-MST-### format" },
            { name: "name", type: "String", required: true, desc: "Super Admin full name" },
            { name: "email", type: "String", required: true, desc: "Login email & audit signature" },
            { name: "password", type: "String (Hashed)", required: true, desc: "Bcrypt salted hash" },
            { name: "role", type: "String", required: true, desc: "Default 'master_admin'" },
            { name: "modifiedBy", type: "String", required: false, desc: "Audit email of editor" },
            { name: "modifiedAt", type: "Date", required: false, desc: "Timestamp of last edit" },
            { name: "createdAt / updatedAt", type: "Date", required: true, desc: "Auto timestamps" },
          ],
        },
        {
          id: "coll-admin",
          name: "Admin Collection",
          collection: "admins",
          badge: "MI-DA-###",
          color: "blue",
          description: "Dairy agency tenant owners. Partition root for all milk, farmers, rates, and payments.",
          indexes: ["_id (Unique)", "mobile (Unique, Sparse)", "email (Unique, Sparse)", "memberId (Unique, Sparse, Indexed)"],
          foreignKeys: [
            { target: "Farmer", field: "adminId", desc: "Owns all farmers in this dairy" },
            { target: "Milk", field: "adminId", desc: "Scopes daily milk collections" },
            { target: "RateSetting", field: "adminId", desc: "Configures base milk rates" },
            { target: "RateChartConfig", field: "adminId", desc: "Configures slab pricing charts" },
            { target: "Payment", field: "adminId", desc: "Disburses farmer payout batches" },
            { target: "Subscription", field: "adminId", desc: "1:1 SaaS license lifecycle" },
            { target: "NotificationSettings", field: "adminId", desc: "1:1 alert delivery preferences" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary MongoDB key" },
            { name: "memberId", type: "String", required: true, desc: "Unique prefix MI-DA-### format" },
            { name: "shopName", type: "String", required: true, desc: "Dairy collection center name" },
            { name: "name", type: "String", required: true, desc: "Dairy owner full name" },
            { name: "mobile", type: "String", required: true, desc: "10-digit login mobile ID" },
            { name: "email", type: "String", required: true, desc: "Email for notifications & billing" },
            { name: "password", type: "String (Hashed)", required: true, desc: "Bcrypt salted hash" },
            { name: "role", type: "String", required: true, desc: "Default 'admin'" },
            { name: "village", type: "String", required: true, desc: "Dairy geographic location" },
            { name: "pincode", type: "String", required: false, desc: "Postal code" },
            { name: "status", type: "String", required: true, desc: "Enum: 'active' | 'inactive' | 'suspended'" },
            { name: "modifiedBy", type: "String", required: false, desc: "Audit signature by Master Admin" },
            { name: "modifiedAt", type: "Date", required: false, desc: "Timestamp of Master Admin edit" },
          ],
        },
        {
          id: "coll-farmer",
          name: "Farmer Collection",
          collection: "farmers",
          badge: "MI-FAR-#### / MI-DAS-###",
          color: "amber",
          description: "Milk providers supplying milk to a specific Dairy Admin. Includes dairy owner self-herd profiles.",
          indexes: ["_id (Unique)", "adminId: 1, mobile: 1 (Compound Unique)", "memberId (Indexed)"],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Belongs to specific Dairy Admin tenant" },
            { target: "Milk", field: "farmerId", desc: "Supplies milk intake sessions" },
            { target: "Payment", field: "farmerId", desc: "Receives payout settlements" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary MongoDB key" },
            { name: "memberId", type: "String", required: true, desc: "MI-FAR-#### (or MI-DAS-### for admin cattle)" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Tenant owner partition key" },
            { name: "name", type: "String", required: true, desc: "Farmer full name" },
            { name: "mobile", type: "String", required: true, desc: "10-digit login mobile ID" },
            { name: "key", type: "String", required: false, desc: "Plaintext password replica for support" },
            { name: "village", type: "String", required: true, desc: "Farmer residential village" },
            { name: "isSelfFarmer", type: "Boolean", required: false, desc: "True if representing Dairy Admin herd" },
            { name: "status", type: "String", required: true, desc: "Enum: 'active' | 'pause'" },
            { name: "modifiedBy", type: "String", required: false, desc: "Audit signature by Master Admin" },
            { name: "modifiedAt", type: "Date", required: false, desc: "Timestamp of Master Admin edit" },
          ],
        },
        {
          id: "coll-milk",
          name: "Milk Collection",
          collection: "milks",
          badge: "Quality Ledger",
          color: "amber",
          description: "Core transactional ledger recording milk volume, laboratory quality metrics (FAT, SNF, Degree), calculated rate, and payment status.",
          indexes: [
            "_id (Unique)",
            "adminId: 1, date: -1 (Compound Tenant Query)",
            "farmerId: 1, date: -1 (Compound Farmer Query)",
            "paymentStatus: 1 (Status Index)",
            "isActive: 1 (Soft Delete Index)",
          ],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Belongs to Dairy Admin tenant" },
            { target: "Farmer", field: "farmerId", desc: "Supplied by Farmer" },
            { target: "Payment", field: "paymentId", desc: "Linked to payout ledger when settled" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary transaction ID" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Tenant isolation foreign key" },
            { name: "farmerId", type: "ObjectId (ref: Farmer)", required: true, desc: "Supplier foreign key" },
            { name: "shift", type: "String", required: true, desc: "Enum: 'morning' | 'evening'" },
            { name: "category", type: "String", required: true, desc: "Enum: 'cow' | 'buffalo' | 'goat' | 'sheep'" },
            { name: "fat", type: "Number", required: true, desc: "Fat percentage (1.0 to 20.0)" },
            { name: "snf", type: "Number", required: false, desc: "Solid-not-fat percentage (0.0 to 15.0)" },
            { name: "degree", type: "Number", required: false, desc: "Lactometer degree reading (0 to 35)" },
            { name: "water", type: "Number", required: false, desc: "Added water percentage (0 to 100)" },
            { name: "litter", type: "Number", required: true, desc: "Volume in litres (0.1 to 1000.0)" },
            { name: "fatRate", type: "Number", required: true, desc: "Base rate multiplier per FAT point" },
            { name: "rate", type: "Number", required: true, desc: "Computed rate per litre (₹)" },
            { name: "calculatedAmount", type: "Number", required: true, desc: "Total pay payable (rate × litres)" },
            { name: "paymentStatus", type: "String", required: true, desc: "Enum: 'unpaid' | 'paid'" },
            { name: "paymentId", type: "ObjectId (ref: Payment)", required: false, desc: "Disbursement batch link" },
            { name: "date", type: "String", required: true, desc: "YYYY-MM-DD operational date" },
          ],
        },
        {
          id: "coll-ratesetting",
          name: "RateSetting Collection",
          collection: "ratesettings",
          badge: "Base Multipliers",
          color: "amber",
          description: "Base rate configuration for FAT, SNF, and Degree per animal category for a specific dairy agency.",
          indexes: ["_id (Unique)", "adminId: 1, milkCategory: 1 (Compound Unique)"],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Configured by Dairy Admin" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Tenant foreign key" },
            { name: "milkCategory", type: "String", required: true, desc: "Enum: 'cow' | 'buffalo' | 'sheep' | 'goat'" },
            { name: "ratePerFat", type: "Number", required: true, desc: "Base rate multiplied by FAT % × litres" },
            { name: "useSnf", type: "Boolean", required: false, desc: "Toggle whether SNF is factored into payout" },
            { name: "ratePerSnf", type: "Number", required: false, desc: "Rate multiplier for SNF points" },
            { name: "useDegree", type: "Boolean", required: false, desc: "Toggle whether Degree is factored" },
            { name: "ratePerDegree", type: "Number", required: false, desc: "Rate multiplier for Degree points" },
            { name: "status", type: "String", required: true, desc: "Enum: 'Active' | 'Inactive'" },
          ],
        },
        {
          id: "coll-ratechartconfig",
          name: "RateChartConfig Collection",
          collection: "ratechartconfigs",
          badge: "Slab Increments",
          color: "amber",
          description: "Advanced slab-based variable increment matrix overriding flat rates with fine-grained Indian dairy pricing curves.",
          indexes: ["_id (Unique)", "adminId: 1, animalType: 1 (Compound Unique)"],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Configured by Dairy Admin" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Tenant foreign key" },
            { name: "animalType", type: "String", required: true, desc: "Enum: 'cow' | 'buffalo' | 'sheep' | 'goat'" },
            { name: "baseRate", type: "Number", required: true, desc: "Reference base price at baseline" },
            { name: "baseFat", type: "Number", required: true, desc: "Base FAT baseline (default 3.5%)" },
            { name: "baseSnf", type: "Number", required: true, desc: "Base SNF baseline (default 8.5%)" },
            { name: "fatPointValue", type: "Number", required: true, desc: "Increment per 0.1% FAT point" },
            { name: "snfPointValue", type: "Number", required: true, desc: "Increment per 0.1% SNF point" },
            { name: "fatSlabs", type: "Array[{fromFat, toFat, increment}]", required: false, desc: "Segmented FAT curves" },
            { name: "snfSlabs", type: "Array[{fromSnf, toSnf, increment}]", required: false, desc: "Segmented SNF curves" },
            { name: "status", type: "String", required: true, desc: "Enum: 'Active' | 'Inactive'" },
          ],
        },
        {
          id: "coll-payment",
          name: "Payment Collection",
          collection: "payments",
          badge: "Paise Precision",
          color: "emerald",
          description: "Disbursement and milk settlement orders. Connects milk records to Razorpay payouts or cash vouchers.",
          indexes: [
            "_id (Unique)",
            "adminId: 1 (Tenant Index)",
            "internalOrderId (Unique, Indexed)",
            "razorpayOrderId (Unique, Sparse)",
            "status: 1 (Status Index)",
          ],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Issued by Dairy Admin tenant" },
            { target: "Farmer", field: "farmerId", desc: "Paid to Farmer supplier" },
            { target: "Milk", field: "paymentId", desc: "Settles multiple milk records" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary transaction ID" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Tenant foreign key" },
            { name: "farmerId", type: "ObjectId (ref: Farmer)", required: false, desc: "Beneficiary farmer" },
            { name: "internalOrderId", type: "String", required: true, desc: "Unique ledger order sequence" },
            { name: "razorpayOrderId", type: "String", required: false, desc: "Razorpay payout reference ID" },
            { name: "razorpayPaymentId", type: "String", required: false, desc: "Payment gateway transaction ID" },
            { name: "amount", type: "Number", required: true, desc: "Amount in Paise (INR × 100)" },
            { name: "status", type: "String", required: true, desc: "Enum: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded'" },
            { name: "paymentMode", type: "String", required: true, desc: "Enum: 'cash' | 'online'" },
            { name: "paymentChannel", type: "String", required: true, desc: "Enum: 'razorpay' | 'upi' | 'cash' | 'bank_transfer'" },
            { name: "isVerified", type: "Boolean", required: true, desc: "Digital signature verification flag" },
          ],
        },
        {
          id: "coll-subscription",
          name: "Subscription Collection",
          collection: "subscriptions",
          badge: "SaaS License",
          color: "blue",
          description: "Dairy agency SaaS billing status, trial countdown, promo discounts, and payment history.",
          indexes: ["_id (Unique)", "adminId (Unique, Indexed)"],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "1:1 link to dairy tenant" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "1:1 tenant foreign key" },
            { name: "plan", type: "String", required: true, desc: "Enum: 'trial' | 'monthly' | 'quarterly' | 'yearly'" },
            { name: "status", type: "String", required: true, desc: "Enum: 'trial' | 'active' | 'expired' | 'cancelled' | 'pending'" },
            { name: "trialStartDate / trialEndDate", type: "Date", required: false, desc: "10-day trial window" },
            { name: "startDate / endDate", type: "Date", required: false, desc: "Active subscription cycle" },
            { name: "basePrice / finalPrice", type: "Number", required: true, desc: "Pricing before & after promo" },
            { name: "promoCode", type: "String", required: false, desc: "Applied voucher code" },
            { name: "paymentHistory", type: "Array[{paymentId, orderId, amount, paidAt}]", required: false, desc: "Past payments" },
          ],
        },
        {
          id: "coll-planconfig",
          name: "PlanConfig Collection",
          collection: "planconfigs",
          badge: "Global Pricing",
          color: "emerald",
          description: "Global SaaS pricing configuration dictating subscription fees for monthly, quarterly, and yearly tiers.",
          indexes: ["_id (Unique)"],
          foreignKeys: [
            { target: "MasterAdmin", field: "updatedBy", desc: "Maintained by Master Admin" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Singleton config key" },
            { name: "monthlyPrice", type: "Number", required: true, desc: "Default ₹499" },
            { name: "quarterlyPrice", type: "Number", required: true, desc: "Default ₹1,299" },
            { name: "yearlyPrice", type: "Number", required: true, desc: "Default ₹4,499" },
            { name: "trialDays", type: "Number", required: true, desc: "Default 10 days" },
            { name: "currency", type: "String", required: true, desc: "Default 'INR'" },
            { name: "updatedBy", type: "ObjectId (ref: MasterAdmin)", required: false, desc: "Editor reference" },
          ],
        },
        {
          id: "coll-promocode",
          name: "PromoCode Collection",
          collection: "promocodes",
          badge: "Discounts",
          color: "emerald",
          description: "Promotional discount codes redeemable by Dairy Admins during SaaS renewal or upgrades.",
          indexes: ["_id (Unique)", "code (Unique, Uppercase, Indexed)"],
          foreignKeys: [
            { target: "MasterAdmin", field: "createdBy", desc: "Created by Master Admin" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "code", type: "String", required: true, desc: "Unique code (e.g. DIWALI50)" },
            { name: "discountType", type: "String", required: true, desc: "Enum: 'percentage' | 'flat'" },
            { name: "discountValue", type: "Number", required: true, desc: "Percentage (%) or flat INR (₹)" },
            { name: "maxUses", type: "Number", required: false, desc: "Usage ceiling (null = unlimited)" },
            { name: "usedCount", type: "Number", required: true, desc: "Total times redeemed" },
            { name: "validFrom / validUntil", type: "Date", required: false, desc: "Active date window" },
            { name: "isActive", type: "Boolean", required: true, desc: "Enable/disable switch" },
          ],
        },
        {
          id: "coll-ticket",
          name: "Ticket Collection",
          collection: "tickets",
          badge: "MLK-YYYY-####",
          color: "indigo",
          description: "Helpdesk support tickets connecting Dairy Admins with Master Admins for technical and operational support.",
          indexes: ["_id (Unique)", "ticketId (Unique, Indexed)", "adminId: 1", "status: 1"],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Filed by Dairy Admin" },
            { target: "MasterAdmin", field: "assignedTo", desc: "Assigned to Master Admin resolver" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "ticketId", type: "String", required: true, desc: "Auto sequence MLK-YYYY-####" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Filing tenant" },
            { name: "assignedTo", type: "ObjectId (ref: MasterAdmin)", required: false, desc: "Handling Master Admin" },
            { name: "category", type: "String", required: true, desc: "Enum: 'personal' | 'technical' | 'improvement' | 'feature'" },
            { name: "priority", type: "String", required: true, desc: "Enum: 'low' | 'medium' | 'high' | 'urgent'" },
            { name: "title", type: "String", required: true, desc: "Subject line (max 200 chars)" },
            { name: "description", type: "String", required: true, desc: "Markdown formatted issue" },
            { name: "status", type: "String", required: true, desc: "Enum: 'open' | 'in_progress' | 'resolved' | 'closed'" },
            { name: "replies", type: "Array[{from, fromName, message, createdAt}]", required: false, desc: "Threaded conversation" },
          ],
        },
        {
          id: "coll-advertisement",
          name: "Advertisement Collection",
          collection: "advertisements",
          badge: "Alert Banners",
          color: "indigo",
          description: "Broadcast announcements and alerts published by Master Admins targeting all or specific Dairy Admins.",
          indexes: ["_id (Unique)", "isActive: 1, expiresAt: 1", "targetAdmins: 1"],
          foreignKeys: [
            { target: "MasterAdmin", field: "createdBy", desc: "Created by Master Admin" },
            { target: "Admin", field: "targetAdmins", desc: "Targeted to specific Dairy Admins" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "createdBy", type: "ObjectId (ref: MasterAdmin)", required: true, desc: "Author reference" },
            { name: "title", type: "String", required: true, desc: "Announcement title (max 120 chars)" },
            { name: "message", type: "String", required: true, desc: "Banner content (max 1000 chars)" },
            { name: "type", type: "String", required: true, desc: "Enum: 'info' | 'success' | 'warning' | 'promo' | 'update'" },
            { name: "targetAdmins", type: "Array[ObjectId (ref: Admin)]", required: false, desc: "Empty = broadcast to all" },
            { name: "expiresAt", type: "Date", required: true, desc: "Auto-computed expiry date" },
            { name: "dismissedBy", type: "Array[ObjectId (ref: Admin)]", required: false, desc: "Dismissed tracking" },
          ],
        },
        {
          id: "coll-notificationsettings",
          name: "NotificationSettings Collection",
          collection: "notificationsettings",
          badge: "Alert Controls",
          color: "indigo",
          description: "Dairy admin email alert delivery preferences and temporary mute schedules.",
          indexes: ["_id (Unique)", "adminId (Unique, Indexed)", "emailNotifications.pausedUntil: 1"],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "1:1 preferences for dairy tenant" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "1:1 tenant foreign key" },
            { name: "emailNotifications.enabled", type: "Boolean", required: true, desc: "Master email toggle" },
            { name: "emailNotifications.pausedUntil", type: "Date", required: false, desc: "Pause schedule expiry" },
            { name: "notificationTypes.paymentAlert", type: "Boolean", required: true, desc: "Payout notices" },
            { name: "notificationTypes.farmerUpdate", type: "Boolean", required: true, desc: "Farmer registrations" },
            { name: "notificationTypes.subscriptionAlert", type: "Boolean", required: true, desc: "Renewal alerts" },
            { name: "notificationTypes.ticketReply", type: "Boolean", required: true, desc: "Support ticket updates" },
          ],
        },
        {
          id: "coll-aiinsightcache",
          name: "AiInsightCache Collection",
          collection: "aiinsightcaches",
          badge: "7-Day TTL",
          color: "cyan",
          description: "Pre-computed AI predictive yield and average FAT trends. Features automated 7-day MongoDB TTL self-purging.",
          indexes: [
            "_id (Unique)",
            "cacheKey (Unique, Indexed)",
            "createdAt: 1 (TTL Expire Index: 7 Days = 604,800s)",
          ],
          foreignKeys: [
            { target: "Admin", field: "adminId", desc: "Computed for Dairy Admin" },
            { target: "Farmer", field: "farmerId", desc: "Scoped to specific farmer (or whole dairy)" },
          ],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary key" },
            { name: "cacheKey", type: "String", required: true, desc: "Compound unique hash: adminId + farmerId + weekKey" },
            { name: "adminId", type: "ObjectId (ref: Admin)", required: true, desc: "Tenant link" },
            { name: "farmerId", type: "ObjectId (ref: Farmer)", required: false, desc: "Optional farmer filter" },
            { name: "weekKey", type: "String", required: true, desc: "e.g., '2026-W20'" },
            { name: "dataHash", type: "String", required: true, desc: "MD5 hash of historical data for invalidation" },
            { name: "insight", type: "String", required: true, desc: "Generated analytical summary" },
            { name: "predictedYieldNext7Days", type: "Number", required: true, desc: "Forecasted volume (Litres)" },
            { name: "predictedAvgFat", type: "Number", required: true, desc: "Forecasted average FAT (%)" },
            { name: "createdAt", type: "Date", required: true, desc: "TTL Trigger (auto deleted in 7 days)" },
          ],
        },
        {
          id: "coll-visitorstats",
          name: "VisitorStats Collection",
          collection: "visitorstats",
          badge: "90-Day TTL",
          color: "cyan",
          description: "Real-time web traffic, IP telemetry, device types, and geographic visit distribution with 90-day TTL self-pruning.",
          indexes: [
            "_id (Unique)",
            "ipAddress: 1, timestamp: -1 (Compound Telemetry Index)",
            "timestamp: 1 (TTL Expire Index: 90 Days = 7,776,000s)",
            "userId: 1, timestamp: -1 (Sparse User Audit Index)",
          ],
          foreignKeys: [],
          fields: [
            { name: "_id", type: "ObjectId", required: true, desc: "Primary log ID" },
            { name: "ipAddress", type: "String", required: true, desc: "Visitor remote IP" },
            { name: "userId", type: "ObjectId", required: false, desc: "Optional authenticated user ref" },
            { name: "userAgent", type: "String", required: false, desc: "Browser client header" },
            { name: "country", type: "String", required: false, desc: "Geo-IP country code (e.g., IN, US)" },
            { name: "deviceType", type: "String", required: true, desc: "Enum: 'mobile' | 'tablet' | 'desktop'" },
            { name: "path", type: "String", required: false, desc: "Request endpoint visited" },
            { name: "method", type: "String", required: true, desc: "HTTP Method (GET, POST, etc.)" },
            { name: "statusCode", type: "Number", required: false, desc: "HTTP Response status (200, 401, etc.)" },
            { name: "timestamp", type: "Date", required: true, desc: "TTL Trigger (auto deleted in 90 days)" },
          ],
        },
      ],
    },
  ],
};

// ── Tech Stack Blueprint Dataset ─────────────────────────────────────────────
const TECH_STACK = [
  {
    category: "Frontend Layer",
    color: "blue",
    icon: Monitor,
    items: [
      { name: "Next.js 14", version: "14.2.29", desc: "React Server Components, App Router, Nested Layouts, Fast Refresh" },
      { name: "React 18", version: "18.3.1", desc: "Concurrent rendering, useMemo, useCallback, Suspense" },
      { name: "Tailwind CSS", version: "3.4.1", desc: "Utility-first design tokens, dark mode with class strategy" },
      { name: "Lucide React", version: "0.400.0", desc: "Tree-shakeable modern feather icons" },
      { name: "Zustand & LocalStorage", version: "4.5.4", desc: "Lightweight client state store with session token persistence" },
      { name: "Recharts", version: "2.12.7", desc: "SVG-based responsive time-series charts and KPIs" },
    ],
  },
  {
    category: "Backend & Runtime",
    color: "emerald",
    icon: Server,
    items: [
      { name: "Node.js", version: "v20.13.0 LTS", desc: "Asynchronous event-driven JavaScript server runtime" },
      { name: "Express.js", version: "4.19.2", desc: "RESTful HTTP server framework with modular routing" },
      { name: "Socket.io", version: "4.7.5", desc: "Full-duplex WebSocket server for instant ticket responses" },
      { name: "Bcrypt.js", version: "2.4.3", desc: "Salted password hashing (cost factor 10) for all user roles" },
      { name: "JSON Web Token (JWT)", version: "9.0.2", desc: "Stateless cryptographically signed Bearer authentication" },
      { name: "Custom DNS Resolver", version: "Google + Cloudflare", desc: "Forced IPv4 and 8.8.8.8 DNS servers resolving MongoDB Atlas" },
    ],
  },
  {
    category: "Database & Storage",
    color: "purple",
    icon: Database,
    items: [
      { name: "MongoDB Atlas", version: "v7.0+ Sharded", desc: "Managed cloud NoSQL database with replica set high availability" },
      { name: "Mongoose ODM", version: "8.3.2", desc: "Strict schema typing, virtuals, compound indexes, pre-save hooks" },
      { name: "TTL Auto-Prune Indexes", version: "MongoDB Native", desc: "Automatic background document expiration (7d AI, 90d Logs)" },
      { name: "Compound Unique Indexes", version: "B-Tree", desc: "Tenant-isolated indexes (adminId + mobile, adminId + date)" },
    ],
  },
  {
    category: "Payments & Banking",
    color: "amber",
    icon: Zap,
    items: [
      { name: "Razorpay Standard Checkout", version: "v2 API", desc: "UPI, Cards, Netbanking for SaaS subscription renewals" },
      { name: "Razorpay Payouts", version: "X Direct", desc: "Direct farmer milk bill disbursements with HMAC-SHA256 signatures" },
      { name: "Paise Integer Arithmetic", version: "ISO Standard", desc: "Zero floating-point rounding errors (stored as INR × 100)" },
    ],
  },
];

// ── Application API Registry Dataset ─────────────────────────────────────────
const API_REGISTRY = [
  { method: "GET", path: "/master/dashboard/stats", auth: "Master JWT", desc: "Fetches global tenant counts, subscriptions, active admins" },
  { method: "GET", path: "/master/admins", auth: "Master JWT", desc: "Lists all registered dairy tenants with pagination and filter" },
  { method: "PATCH", path: "/master/admins/:id/credentials", auth: "Master JWT", desc: "Updates dairy admin login mobile, password, memberId (stamps audit)" },
  { method: "GET", path: "/master/farmers", auth: "Master JWT", desc: "Cross-dairy directory of all farmers with login credentials" },
  { method: "PATCH", path: "/master/farmers/:id/credentials", auth: "Master JWT", desc: "Updates farmer login mobile, password, memberId (stamps audit)" },
  { method: "GET", path: "/master/database/schema-stats", auth: "Master JWT", desc: "Live collection counts, cluster ping latency, and database health" },
  { method: "POST", path: "/milk/create", auth: "Dairy Admin JWT", desc: "Creates milk intake session; calculates rate and total amount" },
  { method: "GET", path: "/farmer/list", auth: "Dairy Admin JWT", desc: "Returns tenant-scoped farmers list (enforces adminId isolation)" },
  { method: "POST", path: "/payment/create-order", auth: "Dairy Admin JWT", desc: "Generates disbursement batch order for unpaid milk records" },
  { method: "WS", path: "ticket_created / ticket_reply", auth: "Socket.io Room", desc: "Bi-directional event broadcast to join_master_room and join_admin_room" },
];

export default function MasterApplicationHub() {
  const [activeTab, setActiveTab] = useState("mindmap"); // 'mindmap' | 'stack' | 'apis' | 'roadmap'
  const [expandedNodes, setExpandedNodes] = useState(() => {
    return new Set(["root", "domain-frontend", "domain-backend", "fe-master-portal", "fe-admin-portal"]);
  });

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomScale, setZoomScale] = useState(1);
  const [orientation, setOrientation] = useState("horizontal"); // 'horizontal' | 'vertical'
  const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'master' | 'admin' | 'frontend' | 'backend'
  const [liveStats, setLiveStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drag-to-pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Fetch live backend metrics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/master/database/schema-stats");
      if (res.data?.success && res.data?.data) {
        setLiveStats(res.data.data);
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleExpand = (nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(["root"]);
    const traverse = (node) => {
      allIds.add(node.id);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(TREE_DATA);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(["root"]));
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const resetCanvasView = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Filter tree based on search
  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return false;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const totalDocuments = useMemo(() => {
    if (!liveStats?.collectionStats) return 0;
    return Object.values(liveStats.collectionStats).reduce((acc, c) => acc + (c.count || 0), 0);
  }, [liveStats]);

  return (
    <div className={`space-y-6 pb-12 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto" : ""}`}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-2xl border border-purple-200 dark:border-purple-800">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  My Application &amp; System Architecture
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  Tech Hub
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized technical control plane for Full-Stack MindMapFlow ({totalDocuments.toLocaleString()} records across 14 collections), Next.js Frontend UI architecture, MongoDB Backend Engine, and API contracts.
              </p>
            </div>
          </div>
        </div>

        {/* Global Hub Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loadingStats}
            className="text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? "animate-spin text-purple-600" : ""}`} />
            <span>{loadingStats ? "Syncing..." : "Sync Cluster Metrics"}</span>
          </Button>
        </div>
      </div>

      {/* ── Top Navigation Tabs for 'My Application' ───────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1">
        {[
          { key: "mindmap", label: "MindMapFlow Architecture", icon: Network },
          { key: "stack", label: "Tech Stack & Blueprint", icon: Server },
          { key: "apis", label: "REST & WebSocket Registry", icon: Code2 },
          { key: "roadmap", label: "Future App Modules & Extensibility", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: MINDMAPFLOW ARCHITECTURE TREE (CANVAS)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "mindmap" && (
        <div className="space-y-4">
          {/* Controls Bar for Mind Map */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">View Flow:</span>
              {[
                { key: "all", label: "Full-Stack (All)", icon: GitBranch },
                { key: "frontend", label: "Frontend UI Only", icon: Monitor },
                { key: "backend", label: "Backend DB Only", icon: Database },
                { key: "master", label: "Master Admin Flow", icon: Shield },
                { key: "admin", label: "Dairy Admin Flow", icon: Layout },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = roleFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRoleFilter(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Canvas Viewport Toolbar */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Orientation Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <Button
                  variant={orientation === "horizontal" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setOrientation("horizontal")}
                  className={`h-7 px-2.5 text-xs font-bold gap-1.5 ${orientation === "horizontal" ? "bg-white dark:bg-slate-950 text-purple-600 shadow-xs" : "text-slate-500"}`}
                  title="Horizontal Left-to-Right Mind Map"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Horizontal</span>
                </Button>
                <Button
                  variant={orientation === "vertical" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setOrientation("vertical")}
                  className={`h-7 px-2.5 text-xs font-bold gap-1.5 ${orientation === "vertical" ? "bg-white dark:bg-slate-950 text-purple-600 shadow-xs" : "text-slate-500"}`}
                  title="Vertical Top-to-Bottom Tree"
                >
                  <Rows className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Vertical</span>
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.1))}
                  className="h-7 w-7 p-0"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="px-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {Math.round(zoomScale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomScale((prev) => Math.min(1.5, prev + 0.1))}
                  className="h-7 w-7 p-0"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCanvasView}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-purple-600"
                  title="Reset Scale & Pan"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Min/Max Branch Expanders */}
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="text-xs font-bold gap-1 border-slate-200 dark:border-slate-800"
                title="Expand all branches to max depth"
              >
                <Plus className="h-3.5 w-3.5 text-purple-600" /> Max
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="text-xs font-bold gap-1 border-slate-200 dark:border-slate-800"
                title="Collapse all branches to root"
              >
                <Minus className="h-3.5 w-3.5 text-slate-500" /> Min
              </Button>

              {/* Fullscreen Maximize Viewport */}
              <Button
                variant={isFullscreen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-xs font-bold gap-1 border-slate-200 dark:border-slate-800"
                title={isFullscreen ? "Restore Viewport" : "Maximize Viewport"}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {isFullscreen ? "Exit Max" : "Max View"}
              </Button>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search mind map..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Canvas Drag Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`transition-all ${selectedEntity ? "lg:col-span-8" : "lg:col-span-12"}`}>
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md overflow-hidden min-h-[720px] relative select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(147, 51, 234, 0.05) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {/* Drag-to-pan helper label */}
                <div className="absolute right-4 bottom-4 flex items-center text-[10px] text-slate-400 font-medium pointer-events-none bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border shadow-xs">
                  <Move className="h-3 w-3 mr-1" />
                  <span>Click &amp; drag canvas to pan &bull; {orientation}</span>
                </div>

                {/* Scalable & Draggable Inner Tree */}
                <div
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transformOrigin: "top left",
                    transition: isPanning ? "none" : "transform 0.15s ease-out",
                  }}
                  className="space-y-8 min-w-max"
                >
                  {/* ── ROOT NODE ────────────────────────────────────────── */}
                  <div className={`flex ${orientation === "vertical" ? "justify-center" : "items-start"} gap-4`}>
                    <div
                      onClick={() => setSelectedEntity(TREE_DATA)}
                      className={`cursor-pointer group flex items-center gap-3 p-4 rounded-3xl border-2 transition-all shadow-lg ${
                        selectedEntity?.id === "root"
                          ? "bg-purple-600 text-white border-purple-500 ring-4 ring-purple-500/20"
                          : "bg-white dark:bg-slate-900 border-purple-400 dark:border-purple-800 hover:border-purple-500"
                      }`}
                    >
                      <div className="p-3 bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-2xl group-hover:scale-105 transition-transform">
                        <Database className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black">
                            FULL-STACK ROOT
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Frontend + Backend Linked</span>
                        </div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {TREE_DATA.name}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          {TREE_DATA.subtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand("root");
                        }}
                        className="ml-3 p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 text-purple-700 dark:text-purple-300 transition-colors"
                      >
                        {expandedNodes.has("root") ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* ── MAIN BRANCHES: FRONTEND & BACKEND ──────────────────── */}
                  {expandedNodes.has("root") && (
                    <div
                      className={
                        orientation === "horizontal"
                          ? "pl-6 border-l-2 border-dashed border-purple-300 dark:border-purple-800/80 space-y-8 ml-8"
                          : "pt-6 border-t-2 border-dashed border-purple-300 dark:border-purple-800/80 flex flex-wrap justify-center gap-8"
                      }
                    >
                      {TREE_DATA.children
                        .filter((branch) => {
                          if (roleFilter === "frontend") return branch.id === "domain-frontend";
                          if (roleFilter === "backend") return branch.id === "domain-backend";
                          return true;
                        })
                        .map((mainBranch) => {
                          const isMainExpanded = expandedNodes.has(mainBranch.id);
                          const isMainSelected = selectedEntity?.id === mainBranch.id;

                          return (
                            <div key={mainBranch.id} className="relative space-y-4">
                              {/* Curved Branch Connector */}
                              {orientation === "horizontal" ? (
                                <div className="absolute -left-6 top-5 w-6 h-0.5 bg-purple-300 dark:bg-purple-800" />
                              ) : (
                                <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-purple-300 dark:bg-purple-800 -translate-x-1/2" />
                              )}

                              {/* Branch Header Card */}
                              <div
                                onClick={() => setSelectedEntity(mainBranch)}
                                className={`cursor-pointer inline-flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all shadow-sm ${
                                  isMainSelected
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400"
                                }`}
                              >
                                <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl">
                                  <mainBranch.icon className="h-4 w-4" />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                      {mainBranch.badge}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {mainBranch.children.length} Sections
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    {mainBranch.name}
                                  </h3>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(mainBranch.id);
                                  }}
                                  className="ml-2 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                >
                                  {isMainExpanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                </button>
                              </div>

                              {/* ── LEVEL 2: SECTIONS ── */}
                              {isMainExpanded && (
                                <div
                                  className={
                                    orientation === "horizontal"
                                      ? "pl-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-5 ml-6"
                                      : "pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap gap-4"
                                  }
                                >
                                  {mainBranch.children
                                    .filter((section) => {
                                      if (roleFilter === "master") return section.role === "master";
                                      if (roleFilter === "admin") return section.role === "admin";
                                      return true;
                                    })
                                    .map((section) => {
                                      const isSectionExpanded = expandedNodes.has(section.id);
                                      const isSectionSelected = selectedEntity?.id === section.id;
                                      const hasChildren = !!section.children;

                                      return (
                                        <div key={section.id} className="relative space-y-3">
                                          {/* Branch Connector */}
                                          {orientation === "horizontal" ? (
                                            <div className="absolute -left-6 top-4 w-6 h-0.5 bg-slate-200 dark:bg-slate-800" />
                                          ) : (
                                            <div className="absolute left-1/2 -top-4 w-0.5 h-4 bg-slate-200 dark:bg-slate-800 -translate-x-1/2" />
                                          )}

                                          {/* Section Card */}
                                          <div
                                            onClick={() => setSelectedEntity(section)}
                                            className={`cursor-pointer inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all shadow-xs ${
                                              isSectionSelected
                                                ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/20"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300"
                                            }`}
                                          >
                                            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                                              {section.name.slice(0, 2).toUpperCase()}
                                            </div>

                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                                  {section.badge}
                                                </span>
                                                {section.collection && (
                                                  <span className="font-mono text-[9px] text-slate-400">
                                                    db.{section.collection}
                                                  </span>
                                                )}
                                              </div>
                                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                                {section.name}
                                              </h4>
                                            </div>

                                            {hasChildren && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleExpand(section.id);
                                                }}
                                                className="ml-2 p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                              >
                                                {isSectionExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                              </button>
                                            )}
                                          </div>

                                          {/* ── LEVEL 3: ROUTES / COMPONENTS OR FIELDS ── */}
                                          {isSectionExpanded && hasChildren && (
                                            <div
                                              className={
                                                orientation === "horizontal"
                                                  ? "pl-6 border-l-2 border-dashed border-purple-200 dark:border-purple-900/60 space-y-2 ml-5"
                                                  : "pt-3 border-t-2 border-dashed border-purple-200 dark:border-purple-900/60 space-y-2"
                                              }
                                            >
                                              {section.children.map((child) => {
                                                const isChildExpanded = expandedNodes.has(child.id);
                                                const isChildSelected = selectedEntity?.id === child.id;
                                                const hasSubfields = child.fields && child.fields.length > 0;

                                                return (
                                                  <div key={child.id} className="relative space-y-2">
                                                    {orientation === "horizontal" && (
                                                      <div className="absolute -left-6 top-3 w-6 h-px bg-purple-200 dark:border-purple-900" />
                                                    )}

                                                    <div
                                                      onClick={() => setSelectedEntity(child)}
                                                      className={`cursor-pointer inline-flex items-center gap-2 p-2 rounded-xl border text-[11px] transition-all ${
                                                        isChildSelected
                                                          ? "bg-purple-100 dark:bg-purple-950/60 border-purple-500 shadow-xs"
                                                          : matchesSearch(child.name)
                                                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20"
                                                          : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
                                                      }`}
                                                    >
                                                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                        {child.name}
                                                      </span>
                                                      {child.apiEndpoint && (
                                                        <span className="font-mono text-[9px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                                                          {child.apiEndpoint.split(",")[0]}
                                                        </span>
                                                      )}

                                                      {hasSubfields && (
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleExpand(child.id);
                                                          }}
                                                          className="ml-1 p-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                        >
                                                          {isChildExpanded ? <Minus className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                                                        </button>
                                                      )}
                                                    </div>

                                                    {/* ── LEVEL 4: INDIVIDUAL FIELDS / ACTIONS ── */}
                                                    {isChildExpanded && hasSubfields && (
                                                      <div className="pl-5 border-l-2 border-dotted border-purple-300 dark:border-purple-900/40 space-y-1 ml-4">
                                                        {child.fields.map((f, fIdx) => (
                                                          <div
                                                            key={fIdx}
                                                            className={`text-[10px] p-1.5 rounded-lg border flex items-center justify-between gap-2 max-w-md ${
                                                              matchesSearch(f.name) || matchesSearch(f.desc)
                                                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/20"
                                                                : "bg-white/70 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800"
                                                            }`}
                                                          >
                                                            <div className="flex items-center gap-1.5">
                                                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                                {f.name}
                                                              </span>
                                                              <span className="text-slate-400 truncate">— {f.desc}</span>
                                                            </div>
                                                            <span className="font-mono text-[9px] text-purple-600 dark:text-purple-400 shrink-0">
                                                              {f.type}
                                                            </span>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT SLIDE-OVER INSPECTION DRAWER ────────────────── */}
            {selectedEntity && (
              <div className="lg:col-span-4 space-y-4">
                <Card className="bg-white dark:bg-slate-950 border-purple-200 dark:border-purple-900/50 shadow-2xl sticky top-4">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded tracking-wider">
                        {selectedEntity.collection ? `db.${selectedEntity.collection}` : selectedEntity.badge}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEntity(null)}
                        className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/10"
                      >
                        ×
                      </Button>
                    </div>
                    <CardTitle className="text-xl font-black mt-1 text-white">
                      {selectedEntity.name}
                    </CardTitle>
                    <p className="text-xs text-white/90 mt-1">
                      {selectedEntity.description}
                    </p>
                  </CardHeader>

                  <CardContent className="p-5 space-y-5 text-xs max-h-[550px] overflow-y-auto">
                    {/* Linked Backend Endpoints (if Frontend Node) */}
                    {selectedEntity.apiEndpoint && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
                        <span className="font-bold text-blue-900 dark:text-blue-200 uppercase text-[10px] flex items-center gap-1">
                          <Terminal className="h-3 w-3 text-blue-600" /> Linked Backend REST APIs
                        </span>
                        <p className="font-mono text-[11px] text-blue-800 dark:text-blue-300">
                          {selectedEntity.apiEndpoint}
                        </p>
                        {selectedEntity.authHeader && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            Header: {selectedEntity.authHeader}
                          </p>
                        )}
                        {selectedEntity.dbTarget && (
                          <p className="text-[10px] text-slate-500">
                            Target DB Collections: <strong className="font-mono text-purple-600">{selectedEntity.dbTarget}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    {/* UI Component Source */}
                    {selectedEntity.uiComponent && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Frontend Next.js Component
                        </span>
                        <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border">
                          {selectedEntity.uiComponent}
                        </p>
                      </div>
                    )}

                    {/* Foreign Key Connections (if Backend Node) */}
                    {selectedEntity.foreignKeys && (
                      <div>
                        <h4 className="font-bold uppercase text-[11px] text-slate-400 flex items-center gap-1.5 mb-2">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-purple-600" />
                          Foreign Key Connectors ({selectedEntity.foreignKeys.length})
                        </h4>
                        <div className="space-y-1.5">
                          {selectedEntity.foreignKeys.map((fk, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                  → {fk.target}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  via <code>{fk.field}</code>
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{fk.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Defined Indexes */}
                    {selectedEntity.indexes && (
                      <div>
                        <h4 className="font-bold uppercase text-[11px] text-slate-400 flex items-center gap-1.5 mb-2">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          Active MongoDB Indexes ({selectedEntity.indexes.length})
                        </h4>
                        <div className="space-y-1 font-mono text-[11px]">
                          {selectedEntity.indexes.map((idx, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-900 dark:text-amber-200"
                            >
                              {idx}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Field-by-Field Breakdown */}
                    {selectedEntity.fields && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold uppercase text-[11px] text-slate-400">
                            {selectedEntity.collection ? "BSON Schema Fields" : "Component Attributes & State"} ({selectedEntity.fields.length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleCopy(JSON.stringify(selectedEntity.fields, null, 2), `copy-${selectedEntity.id}`)}
                            className="text-[10px] text-purple-600 font-bold hover:underline flex items-center gap-1"
                          >
                            {copiedKey === `copy-${selectedEntity.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            Copy JSON
                          </button>
                        </div>

                        <div className="space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                          {selectedEntity.fields.map((f, i) => (
                            <div key={i} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {f.name}
                                </span>
                                <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                                  {f.type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: TECH STACK & FRAMEWORK BLUEPRINT
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "stack" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TECH_STACK.map((group, gIdx) => {
              const Icon = group.icon;
              return (
                <Card key={gIdx} className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-md">
                  <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-4">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Icon className="h-4 w-4 text-purple-600" />
                      {group.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2.5">
                    {group.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {item.version}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: APPLICATION REST & WEBSOCKET REGISTRY
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "apis" && (
        <div className="space-y-4">
          <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-600" />
                Application API &amp; WebSocket Event Contracts
              </CardTitle>
              <CardDescription className="text-xs">
                Exhaustive catalogue of primary HTTP endpoints, WebSocket room events, and token authorization requirements.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-5 py-3">HTTP / Protocol</th>
                      <th className="px-5 py-3">API Route Path</th>
                      <th className="px-5 py-3">Security &amp; Token</th>
                      <th className="px-5 py-3">Description &amp; Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {API_REGISTRY.map((apiItem, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-5 py-3">
                          <span
                            className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                              apiItem.method === "GET"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : apiItem.method === "POST"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : apiItem.method === "PATCH"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            }`}
                          >
                            {apiItem.method}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {apiItem.path}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                            {apiItem.auth}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                          {apiItem.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: FUTURE APPLICATION TECH MODULES & ROADMAP
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "roadmap" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-600" />
                IoT Bluetooth Milk Analyzers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Direct Web-Bluetooth connectivity with standard ultrasonic milk analyzers (Ekomilk, Lactoscan) to stream FAT%, SNF%, and density readings straight into the intake session without manual keyboard entry.
              </p>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-purple-800 dark:text-purple-300 text-[11px] font-mono">
                Planned: Web Bluetooth API + Serial RS-232 bridge
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Wifi className="h-4 w-4 text-blue-600" />
                PWA Offline Sync &amp; Service Workers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Enables rural collection centers with spotty cellular reception to record morning and evening milk entries offline via IndexedDB, auto-syncing to MongoDB Atlas once internet connectivity is restored.
              </p>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-800 dark:text-blue-300 text-[11px] font-mono">
                Planned: Workbox + IndexedDB background sync
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                WhatsApp &amp; SMS Milk Slip Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                Instant automated WhatsApp &amp; SMS delivery of milk receipt slips to farmers immediately upon intake submission, reporting weight in Litres, FAT%, SNF%, calculated rate, and payout amount.
              </p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px] font-mono">
                Planned: Gupshup / Twilio WhatsApp Cloud API
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
