# StockPilot AI - Kirana Smart Inventory & High-Speed Barcode Scanner

> **Enterprise-Grade AI-Powered Inventory Forecasting, High-Speed Camera Barcode Scanning, and POS System for Indian Kirana & Retail Superstores.**

StockPilot AI is a full-stack, offline-capable Progressive Web Application (PWA) engineered to transform traditional retail inventory management. Designed specifically for Kirana store owners, supermarkets, and FMCG retailers, StockPilot AI merges 25 FPS web-camera hardware barcode scanning with real-time Firebase Cloud Firestore synchronization and Groq Llama-3.3-70B AI predictive demand analytics.

---

## Table of Contents

- [Overview](#overview)
  - [The Business Problem](#the-business-problem)
  - [Why StockPilot AI Exists](#why-stockpilot-ai-exists)
  - [How AI Solves Inventory Management](#how-ai-solves-inventory-management)
  - [Application Screenshots](#application-screenshots)
  - [Complete User Journey](#complete-user-journey)
- [Key Features](#key-features)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Project Directory Structure](#project-directory-structure)
- [Step-by-Step Firebase Setup](#step-by-step-firebase-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Firestore Database Design & Schemas](#firestore-database-design--schemas)
  - [Collection 1: stores](#1-stores-collection)
  - [Collection 2: users](#2-users-collection)
  - [Collection 3: products](#3-products-collection)
  - [Collection 4: inventoryHistory](#4-inventoryhistory-collection)
  - [Collection 5: sales](#5-sales-collection)
  - [Collection 6: predictions](#6-predictions-collection)
  - [Collection 7: notifications](#7-notifications-collection)
  - [Collection 8: scanHistory](#8-scanhistory-collection)
  - [Collection 9: settings](#9-settings-collection)
  - [Collection 10: aiLogs](#10-ailogs-collection)
- [Firestore Composite Indexes](#firestore-composite-indexes)
- [Firebase Security Rules](#firebase-security-rules)
  - [Firestore Rules (`firestore.rules`)](#firestore-rules-firestorerules)
  - [Firebase Storage Rules (`storage.rules`)](#firebase-storage-rules-storagerules)
- [Firebase Storage Directory Structure](#firebase-storage-directory-structure)
- [Authentication & Role Authorization Flow](#authentication--role-authorization-flow)
- [End-to-End Barcode Workflow](#end-to-end-barcode-workflow)
- [Realtime Synchronization Architecture](#realtime-synchronization-architecture)
- [AI Engine Architecture & Prompt Engineering](#ai-engine-architecture--prompt-engineering)
- [Progressive Web App (PWA) & Offline Sync](#progressive-web-app-pwa--offline-sync)
- [API Endpoints & Service Layer Reference](#api-endpoints--service-layer-reference)
- [Error Handling & Resiliency Patterns](#error-handling--resiliency-patterns)
- [Production Deployment Guide](#production-deployment-guide)
  - [Firebase Hosting](#deploying-to-firebase-hosting)
  - [Vercel](#deploying-to-vercel)
  - [Netlify](#deploying-to-netlify)
  - [Docker / Cloud Run](#deploying-via-docker--cloud-run)
- [Product Roadmap](#product-roadmap)
- [License](#license)
- [Contributing Guidelines](#contributing-guidelines)

---

## Overview

### The Business Problem
Over 12 million Kirana stores in India handle more than 88% of the nation's retail market. Despite their dominance, small Kirana merchants suffer from:
1. **Manual Inventory Tracking**: Stock counts are maintained on paper registers or mental notes, leading to discrepancies, misplaced stock, and shrinkage.
2. **Loss of Revenue from Stockouts**: High-velocity FMCG items (e.g., Maggi, Amul Milk, Parle-G, Sunpure Oil) run out unexpectedly during peak hours or weekends, driving customers to competitors.
3. **Overstocking & Capital Lockup**: Slow-moving SKUs consume shelf space and working capital without clear velocity insights.
4. **Barcode Friction**: Commercial handheld USB barcode scanners require tethered PCs, which are impractical for fast-paced Kirana counters.
5. **Connectivity Drops**: Unstable internet in semi-urban regions breaks cloud-only POS systems.

### Why StockPilot AI Exists
StockPilot AI eliminates these pain points by turning any camera-enabled smartphone, tablet, or desktop web browser into an instant, high-speed barcode terminal with predictive AI capability:
- **Instant Camera Barcode Recognition**: Uses HTML5 canvas camera feeds operating at 25 FPS with zero additional hardware cost.
- **Offline-First Resilience**: Full PWA Service Worker caching and background IndexedDB/localStorage queueing allow uninterrupted barcode scanning during network outages.
- **Microsecond AI Demand Predictions**: Leverages Groq Llama-3.3-70B ultra-low-latency LLM inference to predict out-of-stock dates, stockout risk levels, and exact reorder quantities.

### How AI Solves Inventory Management
Unlike static reorder rules, StockPilot AI's predictive model evaluates:
- **Historical Sales Velocity**: Calculates unit burn rates over 1-day, 7-day, and 30-day windows.
- **Indian Retail Demand Cycles**: Accounts for morning fresh dairy spikes, weekend FMCG surges, and seasonal demand variations.
- **Lead-Time Buffer**: Computes exact days remaining before stock reaches zero, comparing it against vendor delivery lead times.
- **Confidence Scoring**: Outputs a calibrated confidence percentage (e.g., `94%`) along with human-readable reasoning (e.g., *"Maggi stock is projected to deplete in 48 hours. Typical high-velocity weekend demand is starting early."*).

### Application Screenshots

```
+-----------------------------------------------------------------------------------+
|  [Dashboard Overview]                                                             |
|  +---------------------+  +---------------------+  +--------------------------+  |
|  | Total SKUs: 20      |  | Low Stock Alerts: 2 |  | Total Stock Value: ₹8.4k |  |
|  +---------------------+  +---------------------+  +--------------------------+  |
|  [Live Analytics Chart: Sales vs Stock Burn Rate]                                 |
|  [AI Critical Out-of-Stock Warnings Banner]                                       |
+-----------------------------------------------------------------------------------+
|  [Camera Barcode Scanner Viewport]               | [Live Scan Log Stream]         |
|  +--------------------------------------------+  | - Maggi 2-Min (+1 Stock In)    |
|  | [Camera Feed - 25 FPS Auto Focus Box]      |  | - Amul Milk (-1 POS Sale)      |
|  +--------------------------------------------+  | - Parle-G 800g (+1 Stock In)   |
+-----------------------------------------------------------------------------------+
```

### Complete User Journey
1. **Onboarding / Authentication**: Shop owner logs in via Firebase Authentication.
2. **Stock In / Receiving Goods**: Owner opens the Live Camera Barcode Scanner, points the camera at incoming stock crates (e.g., EAN-13 barcodes), and scans items continuously. Stock counts increment in real time (+1 per scan).
3. **Unknown Item Handling**: Scanning an unregistered GTIN immediately presents an **Unknown Product Modal**, allowing 1-click catalog entry with pre-filled barcode values.
4. **POS Customer Checkout**: Switch mode to `STOCK_OUT / SALE`. Scanning items decrements inventory instantly (-1) and logs a sale record with revenue tracking.
5. **Realtime Synchronization**: Firestore listeners (`onSnapshot`) push stock updates to all connected devices instantly without page refresh.
6. **Groq AI Demand Forecasting**: Inventory stock updates trigger background Groq Llama-3.3 AI evaluation. The AI computes stockout dates and generates automated low-stock notifications.
7. **Purchase Order Generation**: Owner reviews AI-recommended reorder quantities in the **Purchase Orders** tab and generates vendor order summaries with a single click.

---

## Key Features

- **Real-Time Inventory Management**: Reactive stock level tracking with auto-categorization, brand filtering, low-stock threshold badges, and SKU search.
- **25 FPS Live Camera Barcode Scanner**: Built-in camera scanner supporting EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, and QR codes with audio beep feedback and haptic vibration.
- **Duplicate Scan Buffer**: 800ms intelligent debouncing prevents accidental double-scanning of identical SKUs.
- **Flashlight Torch Toggle**: One-touch hardware torch activation for low-light storage rooms and warehouse shelves.
- **Unknown Barcode Intercept**: Automatic detection of unregistered barcodes with instant catalog registration popup.
- **Groq Llama-3.3-70B AI Demand Forecasting**: Instant predictive stockout dates, risk levels (`High`, `Moderate`, `Low`), confidence ratings, and reorder quantities.
- **Gemini API Backup**: Server-side fallback to `@google/genai` (Gemini 2.5) if Groq credentials are unavailable.
- **Offline Scanning & Background Sync**: Full PWA support with Service Worker (`sw.js`) and background operation queue (`offlineSync.ts`) that auto-syncs when network connectivity returns.
- **Interactive POS Sales Recorder**: Record quick POS customer checkout transactions with instant total revenue calculation.
- **Realtime Firestore Data Engine**: Zero-latency UI updates using document snapshot listeners across multi-device setups.
- **Scan Activity Stream & Audit Logs**: Detailed timeline of every scan event, user ID, device fingerprint, and stock delta transition.
- **Indian Kirana Pre-Loaded Catalog**: Pre-configured with 20 realistic Kirana SKUs (Maggi, Parle-G, Amul Taaza, Good Day, Tata Salt, Surf Excel, Colgate, etc.) with INR (₹) pricing.
- **Mobile Responsive & PWA Installable**: Standalone mobile view with home screen shortcuts, splash screen, and responsive desktop/tablet layouts.

---

## Tech Stack & Architecture

| Layer | Technology | Purpose & Selection Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Lightning-fast HMR, component modularity, and optimized bundle size. |
| **Language** | TypeScript 5.x | Strict type safety for data models, API payloads, and Firestore schemas. |
| **Styling & UI** | Tailwind CSS v4 | Utility-first, responsive, dark/light theme styling with custom UI components. |
| **Icons** | Lucide React | High-performance vector icons for Kirana inventory domain. |
| **Charts & Visuals** | Recharts | Responsive SVG charting for sales velocity, stock burn rates, and revenue trends. |
| **Barcode Engine** | HTML5-QRCode / ZXing | High-speed browser camera barcode decoding supporting EAN, UPC, and Code128. |
| **Database & Auth** | Firebase Firestore & Auth | Real-time NoSQL database, document listeners (`onSnapshot`), and secure authentication. |
| **Backend Server** | Node.js + Express + `tsx` | Full-stack API proxy for Groq AI & Gemini API key protection. |
| **Primary AI Engine** | Groq Llama-3.3-70B Versatile | Ultra-low-latency (~200ms) LLM inference for real-time demand forecasting. |
| **Fallback AI Engine**| `@google/genai` (Gemini 2.5) | Backup AI inference engine for deep natural language inventory insights. |
| **PWA & Offline** | Web Service Worker (`sw.js`) | Asset pre-caching, offline sync (`SyncManager`), and Web Push notifications. |

---

## Project Directory Structure

```
stockpilot-ai/
├── public/                     # Static Web Assets & PWA Config
│   ├── manifest.json           # Web App Manifest (PWA metadata & shortcuts)
│   ├── sw.js                   # Service Worker (offline cache, background sync, push)
│   └── favicon.ico             # Application Favicon
├── src/                        # Main Application Source
│   ├── components/             # Reusable UI Components
│   │   ├── AIChatDrawer.tsx    # Floating Kirana AI Assistant Drawer
│   │   ├── AddProductModal.tsx # New SKU Registration Modal
│   │   ├── Header.tsx          # Top Bar with Search, Status, & Quick Actions
│   │   ├── PWAInstallBanner.tsx# PWA Home Screen Installation Prompt
│   │   ├── RealBarcodeScanner.tsx # 25 FPS Camera Barcode Scanner Viewport
│   │   ├── RecordSaleModal.tsx # Quick POS Customer Sale Checkout Modal
│   │   ├── Sidebar.tsx         # Navigation Drawer with Store Branding
│   │   └── UnknownProductModal.tsx # Unregistered Barcode Intercept Dialog
│   ├── contexts/               # React Context Providers
│   │   ├── AuthContext.tsx     # Firebase Auth & Shop Owner Session State
│   │   └── InventoryContext.tsx# Reactive Inventory, History, & AI State Manager
│   ├── firebase/               # Firebase Configuration
│   │   └── config.ts           # Firebase SDK Initialization & Firestore Credentials
│   ├── pages/                  # Page Views
│   │   ├── AIForecastPage.tsx  # Groq AI Predictive Demand & Risk Center
│   │   ├── AnalyticsPage.tsx   # Recharts Sales Velocity & Category Distribution
│   │   ├── DashboardPage.tsx   # Main Overview with Stats, Critical Alerts, & Quick Actions
│   │   ├── InventoryPage.tsx   # Product Catalog Grid/Table with Filters
│   │   ├── NotificationsPage.tsx # AI Stockout Alerts & Order Notifications
│   │   ├── OrdersPage.tsx      # Automated Supplier Purchase Order Generator
│   │   ├── ProductDetailPage.tsx # SKU Deep-Dive with Stock History Timeline
│   │   ├── QRScannerPage.tsx   # Live Camera Scanning Workflow View
│   │   ├── ReportsPage.tsx     # Audit Logs, Scan Stream, & CSV Export Engine
│   │   └── SettingsPage.tsx    # Store Profile, Firebase Status, & Groq API Config
│   ├── services/               # Data & AI Service Layers
│   │   ├── firebaseService.ts  # Firestore CRUD, Seed Data, & Realtime Listeners
│   │   └── offlineSync.ts      # Offline Operation Queueing & Sync Processor
│   ├── types/                  # TypeScript Type Definitions
│   │   └── index.ts            # Product, Sale, Prediction, & History Interfaces
│   ├── App.tsx                 # Root Component & Tab Router
│   ├── main.tsx                # Application Entry Point
│   └── index.css               # Global Tailwind CSS Imports
├── server.ts                   # Express Backend & AI Proxy Server
├── firestore.rules             # Production Firestore Security Rules
├── storage.rules               # Production Firebase Storage Security Rules
├── .env.example                # Environment Variable Template
├── metadata.json               # Platform Metadata & Frame Permissions
├── package.json                # Project Dependencies & Build Scripts
├── tsconfig.json               # TypeScript Compiler Configuration
└── vite.config.ts              # Vite Bundler & Server Configuration
```

---

## Step-by-Step Firebase Setup

To connect StockPilot AI to your own live Firebase project:

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, enter `StockPilot-Kirana`, and create the project.

### Step 2: Enable Firebase Authentication
1. In the left navigation bar, click **Build > Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, enable **Email/Password** and **Google**.

### Step 3: Enable Cloud Firestore
1. Navigate to **Build > Firestore Database**.
2. Click **Create Database**.
3. Select your cloud region (e.g., `asia-south1` for India or `us-central1`).
4. Select **Start in Production Mode** and click **Create**.

### Step 4: Enable Firebase Storage
1. Navigate to **Build > Storage**.
2. Click **Get Started**, choose default security rules, and click **Done**.

### Step 5: Register a Web App
1. In Project Settings (`⚙️`), under **Your apps**, click the **Web icon (`</>`)**.
2. Register the app as `StockPilot Web`.
3. Check **Also set up Firebase Hosting**.
4. Copy the `firebaseConfig` credentials object.

### Step 6: Configure Environment Variables
Copy your Firebase credentials into `.env` (or set them in your hosting environment):

```env
VITE_FIREBASE_API_KEY="AIzaSyA..."
VITE_FIREBASE_AUTH_DOMAIN="stockpilot-kirana.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="stockpilot-kirana"
VITE_FIREBASE_STORAGE_BUCKET="stockpilot-kirana.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abc123def456"
GROQ_API_KEY="gsk_..."
```

---

## Environment Variables Configuration

| Variable | Scope | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | Server-Side | API Key for Groq Llama-3.3-70B ultra-fast AI inference. | Yes | `gsk_...` |
| `GEMINI_API_KEY` | Server-Side | Fallback API Key for Google Gemini 2.5 model. | Optional | `AIzaSy...` |
| `VITE_FIREBASE_API_KEY` | Client-Side | Firebase Web SDK API Key. | Yes | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client-Side | Firebase Auth Domain. | Yes | `app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Client-Side | Firebase Cloud Project Identifier. | Yes | `stockpilot-prod` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client-Side | Firebase Storage Bucket URL. | Yes | `app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Client-Side | FCM Cloud Messaging Sender ID. | Yes | `1234567890` |
| `VITE_FIREBASE_APP_ID` | Client-Side | Firebase Web App Identifier. | Yes | `1:123456789:web:...` |

---

## Firestore Database Design & Schemas

### 1. `stores` Collection
Stores metadata for each Kirana retail outlet.
- **Document ID**: `storeId` (e.g., `store_rajesh_kirana_001`)

```typescript
interface Store {
  storeId: string;       // Primary Key
  name: string;          // e.g. "Rajesh Kirana Super Store"
  ownerId: string;       // Foreign key to users.userId
  location: string;      // e.g. "Indiranagar, Bengaluru"
  createdAt: string;     // ISO 8601 Timestamp
}
```

### 2. `users` Collection
User profiles and access management.
- **Document ID**: `userId` (Firebase Auth `uid`)

```typescript
interface UserProfile {
  userId: string;        // Primary Key
  name: string;          // e.g. "Rajesh Kumar"
  email: string;         // e.g. "rajesh@kiranastore.in"
  assignedStore: string; // Foreign key to stores.storeId
  createdAt: string;     // ISO 8601 Timestamp
}
```

### 3. `products` Collection
Main inventory catalog containing barcode and stock attributes.
- **Document ID**: `productId` (e.g., `prod_maggi_001`)

```typescript
interface Product {
  productId: string;           // Primary Key
  barcode: string;             // GTIN / EAN-13 / UPC (Indexed)
  sku: string;                 // Stock Keeping Unit code (e.g. "MAG-001-N")
  productName: string;         // e.g. "Maggi 2-Minute Noodles 70g"
  category: string;            // e.g. "Instant Food", "Dairy", "Snacks"
  brand?: string;              // e.g. "Nestle"
  image: string;               // CDN image URL
  description: string;         // Item description
  mrp?: number;                // Maximum Retail Price in INR (₹)
  purchasePrice?: number;      // Wholesale cost price
  sellingPrice?: number;       // Discounted POS retail price
  supplier: string;            // Vendor distributor name
  unit: string;                // "packet", "pouch", "bottle", "box"
  reorderLevel: number;        // Threshold triggering reorder warning
  recommendedReorder?: number; // AI-suggested reorder batch size
  reorderQuantity: number;     // Standard order batch size
  currentStock: number;        // Real-time available stock count
  minimumStock: number;        // Buffer safety stock
  maximumStock: number;        // Maximum shelf capacity
  createdAt: string;           // ISO 8601 Timestamp
  updatedAt: string;           // ISO 8601 Timestamp
}
```

### 4. `inventoryHistory` Collection
Audit log tracking every manual or automated stock level transition.
- **Document ID**: `historyId` (e.g., `hist_1718901234_a1b2`)

```typescript
interface InventoryHistory {
  historyId: string;     // Primary Key
  productId: string;     // Foreign key to products.productId
  barcode: string;       // Barcode scanned
  productName?: string;  // Product name cache
  previousStock: number; // Stock count before action
  updatedStock: number;  // Stock count after action
  action: 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'MANUAL_EDIT';
  timestamp: string;     // ISO 8601 Timestamp
  userId: string;        // ID of shop owner or employee
}
```

### 5. `sales` Collection
Completed POS customer checkout transactions.
- **Document ID**: `saleId` (e.g., `sale_1718901234`)

```typescript
interface SaleRecord {
  saleId: string;        // Primary Key
  productId: string;     // Foreign key to products.productId
  barcode: string;       // Item barcode
  productName: string;   // Product title
  quantity: number;      // Quantity sold
  unitPrice?: number;    // Selling price per unit
  totalPrice?: number;   // Total transaction amount
  soldAt: string;        // ISO 8601 Timestamp
  employeeId: string;    // User ID who completed sale
}
```

### 6. `predictions` Collection
Groq AI demand forecasting outputs and predictive stockout risks.
- **Document ID**: `predictionId` (e.g., `pred_prod_maggi_001`)

```typescript
interface AIPrediction {
  predictionId: string;           // Primary Key
  productId: string;              // Foreign key to products.productId
  barcode?: string;               // Product barcode
  productName?: string;           // Product title
  predictedOutOfStockDate: string;// YYYY-MM-DD
  daysRemaining: number;          // Estimated days until stockout
  confidence: string;             // e.g. "94%"
  recommendedOrder: number;       // Suggested order units
  reasoning: string;              // Natural language AI explanation
  riskLevel: 'High' | 'Moderate' | 'Low';
  trend: 'Upwards' | 'Stable' | 'Downwards';
  generatedAt: string;            // ISO 8601 Timestamp
}
```

### 7. `notifications` Collection
Actionable low-stock alerts and AI reorder notifications.
- **Document ID**: `notificationId` (e.g., `notif_1718901234`)

```typescript
interface NotificationItem {
  notificationId: string; // Primary Key
  productId?: string;     // Associated SKU ID
  title: string;          // e.g. "AI Forecast: Maggi May Run Out"
  message: string;        // Alert body text
  status: 'unread' | 'read';
  priority?: 'High' | 'Medium' | 'Low';
  type?: 'AI Forecast' | 'Low Stock' | 'Order' | 'System';
  createdAt: string;      // ISO 8601 Timestamp
  read: boolean;          // Boolean flag
}
```

### 8. `scanHistory` Collection
High-speed log recording camera barcode scan events.
- **Document ID**: `scanId` (e.g., `scan_1718901234_c3d4`)

```typescript
interface ScanHistoryRecord {
  scanId: string;        // Primary Key
  barcode: string;       // Barcode string
  productId?: string;    // Product ID (if matched)
  productName?: string;  // Product name
  timestamp: string;     // ISO 8601 Timestamp
  action: 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'MANUAL_EDIT';
  stockBefore: number;   // Stock prior to scan
  stockAfter: number;    // Stock after scan
  deviceInfo?: string;   // Device user-agent string
}
```

### 9. `settings` Collection
Application configuration and store preferences.
- **Document ID**: `settingId` (e.g., `store_config`)

```typescript
interface StoreSettings {
  settingId: string;
  autoReorderEnabled: boolean;
  lowStockThresholdDefault: number;
  currencySymbol: string; // "₹"
  aiModelPreference: string; // "groq-llama-3.3-70b"
}
```

### 10. `aiLogs` Collection
Audit logs for server-side AI API latency and prompt payloads.
- **Document ID**: `logId` (e.g., `log_1718901234`)

```typescript
interface AILog {
  logId: string;
  request: string;        // Input prompt payload
  response: string;       // AI completion JSON
  processingTime: number; // Duration in milliseconds
  createdAt: string;      // ISO 8601 Timestamp
}
```

---

## Firestore Composite Indexes

To support high-performance queries, configure these composite indexes in the Firebase Console or via `firestore.indexes.json`:

| Collection | Fields Indexed | Order | Query Purpose |
| :--- | :--- | :--- | :--- |
| `products` | `category` (ASC), `productName` (ASC) | Composite | Category filter with alphabetical sorting. |
| `products` | `currentStock` (ASC), `reorderLevel` (ASC) | Composite | Quick retrieval of low-stock items. |
| `sales` | `productId` (ASC), `soldAt` (DESC) | Composite | SKU sales history and velocity calculation. |
| `inventoryHistory` | `productId` (ASC), `timestamp` (DESC) | Composite | Product detail stock movement timeline. |
| `scanHistory` | `timestamp` (DESC) | Single Field | Real-time live scan stream feed. |
| `notifications` | `read` (ASC), `createdAt` (DESC) | Composite | Unread notifications queue rendering. |

---

## Firebase Security Rules

### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isShopOwner() {
      return isAuthenticated();
    }

    match /stores/{storeId} {
      allow read, write: if isAuthenticated();
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId;
    }

    match /products/{productId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }

    match /inventoryHistory/{historyId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isShopOwner();
    }

    match /sales/{saleId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isShopOwner();
    }

    match /predictions/{predictionId} {
      allow read, write: if isAuthenticated();
    }

    match /notifications/{notificationId} {
      allow read, create, update, delete: if isAuthenticated();
    }

    match /scanHistory/{scanId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isShopOwner();
    }

    match /settings/{settingId} {
      allow read, write: if isAuthenticated();
    }

    match /ai_logs/{logId} {
      allow read, create: if isAuthenticated();
    }
  }
}
```

### Firebase Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024;
    }

    match /products/{imageId} {
      allow read: if true;
      allow write: if isAuthenticated() && isImage();
    }

    match /receipts/{receiptId} {
      allow read, write: if isAuthenticated();
    }

    match /reports/{reportId} {
      allow read, write: if isAuthenticated();
    }

    match /exports/{exportId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

## Firebase Storage Directory Structure

```
gs://stockpilot-kirana.appspot.com/
├── products/       # High-resolution SKU product images (5MB max)
├── receipts/       # Vendor invoices and POS digital receipts
├── reports/        # Monthly CSV export logs and PDF inventory audits
└── exports/        # Downloadable JSON backup archives
```

---

## Authentication & Role Authorization Flow

```
   +-----------------------+
   |   Shop Owner / Staff  |
   +-----------------------+
               |
               v
  +-------------------------+
  | Firebase Auth Session   |
  +-------------------------+
               |
      +--------+--------+
      |                 |
      v                 v
[ authenticated ]   [ unauthenticated ]
      |                 |
      v                 v
+---------------+  +---------------------+
| Full Access   |  | Fallback Local      |
| to Firestore  |  | Reactive Store Mode |
| Collections   |  | (Demo / Offline)    |
+---------------+  +---------------------+
```

---

## End-to-End Barcode Workflow

```
[ Camera Barcode Scanner Viewport (25 FPS) ]
                     |
                     v
       [ Barcode Decoded (e.g. 8901058852312) ]
                     |
                     v
   [ Duplicate Scan Debounce Buffer (800ms) ]
                     |
                     v
    [ Query Firestore / Local Store Catalog ]
            /                 \
     ( Match Found )    ( Unknown Barcode )
          /                     \
         v                       v
[ Update Stock Count ]    [ Open Unknown Barcode Modal ]
   (+1 or -1)                    |
         |                       v
         v             [ Register New Item ]
[ Save Audit History ]
         |
         v
[ Realtime Firestore Listener Triggered ]
         |
         v
[ Express Server Proxy Calls Groq AI ]
         |
         v
[ Groq Llama-3.3 AI Demand Prediction Generated ]
         |
         v
[ Create Low-Stock Alert Notification ]
```

---

## Realtime Synchronization Architecture

StockPilot AI implements zero-latency, multi-device state synchronization via Cloud Firestore `onSnapshot` subscriptions:

1. **Document Listeners**: `listenProductsService()`, `listenInventoryHistoryService()`, and `listenNotificationsService()` register active snapshot channels with Firestore.
2. **Local Reactive Cache**: If the user is offline, `LocalFirebaseStore` maintains local state and triggers subscribers immediately upon state changes.
3. **Optimistic UI Updates**: Stock counter increments render immediately in the UI before network acknowledgment.

---

## AI Architecture & Prompt Engineering

### Groq Llama-3.3-70B Pipeline
1. **Server Endpoint**: Express server exposes `/api/ai/forecast`.
2. **Context Construction**: Assembles current stock count, minimum stock, category burn velocity, and purchase pricing into a structured prompt.
3. **Groq Execution**: Invokes Groq API (`llama-3.3-70b-versatile`) with `temperature: 0.2` and `response_format: { type: "json_object" }`.
4. **Response Parsing**: Parses JSON schema containing `predictionDate`, `daysRemaining`, `confidence`, `recommendedOrder`, `reasoning`, `riskLevel`, and `trend`.

#### Server Prompt Structure Example
```javascript
const prompt = `You are StockPilot AI, an expert inventory demand forecasting engine for Indian Kirana stores.
Analyze the following SKU:
Product: "${product.productName}"
Category: "${product.category}"
Current Stock: ${currentStock}
Reorder Threshold: ${reorderLevel}

Respond with strictly valid JSON:
{
  "predictionDate": "YYYY-MM-DD",
  "daysRemaining": number,
  "confidence": "94%",
  "recommendedOrder": number,
  "reasoning": "Clear, concise sentence explanation.",
  "riskLevel": "High" | "Moderate" | "Low",
  "trend": "Upwards" | "Stable" | "Downwards"
}`;
```

---

## Progressive Web App (PWA) & Offline Sync

### Service Worker (`sw.js`)
- **Pre-Caching**: Caches `/index.html`, `/manifest.json`, CSS, and JavaScript bundles on `install` event.
- **Network-First Strategy**: Fetches fresh network responses, falling back to cache when offline.
- **Background Sync**: Listens for `sync-offline-scans` tag to flush pending offline scan operations from IndexedDB/localStorage.

### Offline Queue Processor (`offlineSync.ts`)
When offline, barcode scans are queued as `QueuedOperation` objects in `localStorage`. When the browser emits the `online` event, `processOfflineQueue()` iterates through pending operations and updates Firestore.

---

## API Endpoints & Service Layer Reference

| Endpoint / Service | Method | Functionality |
| :--- | :--- | :--- |
| `POST /api/ai/forecast` | Express Route | Proxies Groq Llama-3.3-70B AI inventory demand calculations. |
| `POST /api/ai/chat` | Express Route | Conversational Kirana AI Assistant for stocking advice. |
| `getProductsService()` | Service Function | Fetches product catalog from Firestore with fallback seed data. |
| `updateProductStockService()` | Service Function | Atomically updates stock level, logs history, and triggers AI forecast. |
| `createProductService()` | Service Function | Registers a new SKU in the catalog. |
| `processOfflineQueue()` | Service Function | Flushes queued offline scans to Firestore upon network reconnection. |

---

## Error Handling & Resiliency Patterns

- **Unknown Barcode Intercept**: Intercepts uncataloged GTIN scans and opens a modal with auto-populated barcode data.
- **Camera Permission Fallback**: Displays clean error states if camera access is denied, offering manual barcode input.
- **Groq API Fallback**: Automatically switches to Google Gemini API or client-side velocity estimation if Groq API key is missing or throttled.
- **Offline Queue Recovery**: Retains un-synced operations safely across browser restarts until internet access is restored.

---

## Production Deployment Guide

### Building the Application
```bash
npm run build
```

### Deploying to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

### Deploying to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploying to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Deploying via Docker / Cloud Run
```bash
# Build production bundle and bundle server
npm run build

# Launch server
npm start
```

---

## Product Roadmap

- [x] **Phase 1**: 25 FPS Live Camera Barcode Scanner & PWA Service Worker.
- [x] **Phase 2**: Realtime Firestore Integration & Groq Llama-3.3 AI Demand Forecasting.
- [x] **Phase 3**: Offline Sync Queue, Unknown Barcode Intercept, & POS Sales Checkout.
- [ ] **Phase 4**: WhatsApp Vendor Purchase Order Dispatch (Twilio / WhatsApp Business API).
- [ ] **Phase 5**: OCR Invoice & Receipt Scanner for Automatic Stock-In.
- [ ] **Phase 6**: Multi-Store Chain Management & GST Tax Report Export.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 StockPilot AI Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## Contributing Guidelines

1. **Fork the Repository**: Create a topic branch (`git checkout -b feature/amazing-feature`).
2. **Commit Changes**: Use conventional commit messages (`git commit -m 'feat: add WhatsApp supplier dispatch'`).
3. **Run Code Quality Checks**:
   ```bash
   npm run lint
   ```
4. **Push & Open Pull Request**: Submit your PR for code review.

---

*StockPilot AI — Empowering Kirana Retailers with Ultra-Fast Barcode Scanning & AI Intelligence.*
