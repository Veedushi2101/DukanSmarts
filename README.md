# 📦 DukanSmarts

An AI-powered inventory management system designed for Kirana stores and small retailers. DukanSmarts combines QR/barcode scanning, real-time inventory tracking, AI-powered demand forecasting, and smart restock notifications to simplify inventory management and reduce stock-outs.

Instead of manually tracking products, store owners can scan items, update inventory instantly, receive predictive stock recommendations, and monitor business performance through an intuitive dashboard.

---

# Problem Statement

Small retail stores often rely on manual methods to manage inventory. This leads to:

- Frequent stock shortages of fast-selling products
- Overstocking of slow-moving inventory
- Manual stock updates that consume time
- Difficulty predicting future demand
- Missed sales opportunities due to unavailable products

Most existing inventory systems only display current stock levels—they don't help store owners predict what to order next.

---

# Solution

DukanSmarts helps retailers make inventory management smarter through AI.

The application allows users to:

- Scan products using QR codes or barcodes
- Automatically update inventory
- Monitor stock levels in real time
- Predict future stock requirements using AI
- Receive low-stock notifications
- View analytics and inventory history
- Interact with an AI assistant for inventory insights

The goal is to reduce manual work while helping retailers make better purchasing decisions.

---

# Features

## QR & Barcode Scanner

- Scan products using the device camera
- Automatically identify products
- Update inventory instantly
- Add unknown products to inventory

---

## Inventory Management

- View all products
- Search and filter inventory
- Add, edit and delete products
- Track available stock
- Maintain inventory history

---

## AI Demand Forecasting

Uses historical inventory information to generate:

- Stock-out predictions
- Demand trends
- Risk levels
- Recommended reorder quantities
- AI-generated explanations

---

## Smart Notifications

Automatically alerts users when:

- Stock reaches reorder level
- Products may run out soon
- AI predicts increased demand

---

## Analytics Dashboard

Visualize inventory using charts including:

- Stock distribution
- Sales trends
- Category insights
- Low-stock products

---

## 💬 AI Inventory Assistant

Ask natural language questions like:

- Which products are running low?
- What should I reorder today?
- Which products have high demand?

---

## 📱 Progressive Web App (PWA)

- Installable on desktop and mobile
- Background synchronization
- Responsive interface

---

# 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| AI | Groq Llama 3.3 + Gemini (Fallback) |
| Charts | Recharts |
| Barcode Scanner | HTML5 QRCode / ZXing |
| PWA | Service Worker |

---

# 🔄 User Workflow

```text
Scan Product
      │
      ▼
Inventory Updated
      │
      ▼
Dashboard Refreshes
      │
      ▼
AI Forecast Generated
      │
      ▼
Low Stock Detected
      │
      ▼
Notification Sent
      │
      ▼
Restock Recommendation
```

---