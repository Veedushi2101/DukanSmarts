import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  Product,
  InventoryHistory,
  ScanHistoryRecord,
  SaleRecord,
  AIPrediction,
  NotificationItem,
  Customer
} from "../types";

export const TARGET_STORES = {
  RAO: {
    storeId: "store_rao_super_market_1789297474690",
    userId: "IuIYre1GfedJ1NeUIbxMWSj64pb2",
    name: "Rao SUPER MARKET"
  },
  KUMAR: {
    storeId: "store_kumar_store_1789461542785",
    userId: "PFMST0vDPzSuj9gOOg5aKGpKSmh2",
    name: "Kumar Store"
  },
  SHARMA: {
    storeId: "store_sharma_mart_1789461497723",
    userId: "jxFeeoUJzNe0AVOnlPsMmgGxj4A3",
    name: "Sharma Mart"
  }
};

export const injectStoreData = async (
  target: "ALL" | "RAO" | "KUMAR" | "SHARMA" = "ALL",
  onProgress?: (msg: string) => void
) => {
  const nowIso = new Date().toISOString();
  const dateKey = nowIso.split("T")[0];
  const log = (msg: string) => onProgress && onProgress(msg);

  // =========================================================
  // 1. STORE 1: RAO SUPER MARKET (High Stock + 2 Low Stock)
  // =========================================================
  if (target === "ALL" || target === "RAO") {
    log("Injecting Rao SUPER MARKET (High & Low Stock)...");
    const { storeId, userId } = TARGET_STORES.RAO;

    const raoProducts: Product[] = [
      {
        productId: "prod_rao_atta_5kg",
        storeId,
        barcode: "8901030927129",
        sku: "SKU-AASHIRVAAD-5KG",
        productName: "Aashirvaad Superior MP Atta 5kg",
        category: "Staples",
        brand: "ITC",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
        description: "Whole wheat grain flour",
        mrp: 290,
        purchasePrice: 240,
        sellingPrice: 275,
        supplier: "ITC Wholesale Bangalore",
        unit: "packet",
        reorderLevel: 15,
        reorderQuantity: 40,
        currentStock: 85, // HIGH STOCK
        minimumStock: 5,
        maximumStock: 120,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        productId: "prod_rao_oil_1l",
        storeId,
        barcode: "8901491101837",
        sku: "SKU-FORTUNE-OIL-1L",
        productName: "Fortune Sunlite Sunflower Oil 1L",
        category: "Staples",
        brand: "Fortune",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
        description: "Refined sunflower cooking oil pouch",
        mrp: 165,
        purchasePrice: 135,
        sellingPrice: 155,
        supplier: "Adani Wilmar Dist",
        unit: "pouch",
        reorderLevel: 20,
        reorderQuantity: 50,
        currentStock: 92, // HIGH STOCK
        minimumStock: 10,
        maximumStock: 150,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        productId: "prod_rao_maggi_70g",
        storeId,
        barcode: "8901058852312",
        sku: "SKU-MAGGI-70G",
        productName: "Maggi 2-Minute Masala Noodles 70g",
        category: "Instant Food",
        brand: "Nestle",
        image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400",
        description: "Instant noodles with tastemaker",
        mrp: 14,
        purchasePrice: 10.5,
        sellingPrice: 14,
        supplier: "Nestle India Depot",
        unit: "packet",
        reorderLevel: 25,
        reorderQuantity: 100,
        currentStock: 4, // LOW STOCK WARNING
        minimumStock: 10,
        maximumStock: 150,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        productId: "prod_rao_amul_gold_500",
        storeId,
        barcode: "8901262010011",
        sku: "SKU-AMUL-GOLD-500",
        productName: "Amul Gold Pasteurised Milk 500ml",
        category: "Dairy",
        brand: "Amul",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
        description: "Standardized fresh homogenized milk",
        mrp: 34,
        purchasePrice: 29.5,
        sellingPrice: 34,
        supplier: "Amul Federation",
        unit: "pouch",
        reorderLevel: 10,
        reorderQuantity: 30,
        currentStock: 2, // LOW STOCK WARNING
        minimumStock: 8,
        maximumStock: 50,
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    for (const prod of raoProducts) {
      // 1. Write product document
      await setDoc(doc(db, "products", prod.productId), prod);

      // 2. Write history document
      const hId = `hist_${prod.productId}`;
      const historyItem: InventoryHistory = {
        historyId: hId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        previousStock: prod.currentStock + 2,
        updatedStock: prod.currentStock,
        action: "SALE",
        timestamp: nowIso,
        userId
      };
      await setDoc(doc(db, "inventory_history", hId), historyItem);

      // 3. Write scan record
      const sId = `scan_${prod.productId}`;
      const scanItem: ScanHistoryRecord = {
        scanId: sId,
        storeId,
        barcode: prod.barcode,
        productId: prod.productId,
        productName: prod.productName,
        timestamp: nowIso,
        action: "SALE",
        stockBefore: prod.currentStock + 1,
        stockAfter: prod.currentStock,
        deviceInfo: "POS Counter Terminal"
      };
      await setDoc(doc(db, "scans", sId), scanItem);

      // 4. Write sale record
      const saleId = `sale_${prod.productId}`;
      const saleItem: SaleRecord = {
        saleId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        quantity: 2,
        unitPrice: prod.sellingPrice || 0,
        totalPrice: (prod.sellingPrice || 0) * 2,
        soldAt: nowIso,
        dateKey,
        employeeId: userId
      };
      await setDoc(doc(db, "sales", saleId), saleItem);

      // 5. Write AI Prediction
      const predId = `pred_${prod.productId}`;
      const isLow = prod.currentStock <= prod.reorderLevel;
      const predItem: AIPrediction = {
        predictionId: predId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        predictedOutOfStockDate: new Date(Date.now() + (isLow ? 86400000 : 86400000 * 7)).toISOString(),
        daysRemaining: isLow ? 1 : 14,
        confidence: isLow ? "98.4%" : "94.2%",
        recommendedOrder: isLow ? prod.reorderQuantity : 0,
        reasoning: isLow
          ? `Stock critically low (${prod.currentStock} left). Urgent restock recommended.`
          : `Healthy stock buffer. Stock projected to last 14+ days.`,
        riskLevel: isLow ? "High" : "Low",
        trend: isLow ? "Downwards" : "Stable",
        generatedAt: nowIso
      };
      await setDoc(doc(db, "predictions", predId), predItem);
    }

    // 6. Write Notification
    const notifItem: NotificationItem = {
      notificationId: "notif_rao_low_stock",
      storeId,
      title: "Stock Alert: Maggi 70g & Amul Milk",
      message: "Current stocks for Maggi 70g and Amul Milk are below reorder limits.",
      status: "unread",
      priority: "High",
      type: "Low Stock",
      createdAt: nowIso,
      read: false
    };
    await setDoc(doc(db, "notifications", notifItem.notificationId), notifItem);

    const sampleCustomers: Customer[] = [
    {
      customerId: "cust_rao_suresh",
      storeId,
      name: "Suresh Gupta",
      phone: "+91 9845012345",
      address: "Shop #4, Near Old Shiv Mandir, Main Market",
      creditLimit: 3000,
      currentUdhaar: 550,
      isVerified: false,
      totalSpent: 1420,
      visitCount: 6,
      lastVisit: nowIso,
      visitIntervalDays: 4,
      favoriteProducts: ["Aashirvaad Superior MP Atta 5kg", "Maggi 2-Minute Masala Noodles 70g"],
      purchaseHistory: [
        {
          billId: "BILL-RAO-101",
          timestamp: nowIso,
          totalAmount: 550,
          paymentType: "UDHAAR",
          items: [
            {
              productId: "prod_rao_atta_5kg",
              productName: "Aashirvaad Superior MP Atta 5kg",
              barcode: "8901030927129",
              quantity: 2,
              unitPrice: 275,
              totalAmount: 550
            }
          ]
        }
      ],
      createdAt: nowIso
    },
    {
      customerId: "cust_rao_naina",
      storeId,
      name: "Naina Verma",
      phone: "+91 9876543210",
      address: "House 12B, Ward 7, Kothri Kalan",
      creditLimit: 2000,
      currentUdhaar: 0,
      isVerified: false,
      totalSpent: 890,
      visitCount: 3,
      lastVisit: nowIso,
      visitIntervalDays: 5,
      favoriteProducts: ["Uncle Chips Lays"],
      purchaseHistory: [],
      createdAt: nowIso
    }
  ];

  for (const cust of sampleCustomers) {
    await setDoc(doc(db, "customers", cust.customerId), cust);
  }
};
  // =========================================================
  // 2. STORE 2: KUMAR STORE (Normal Balanced Stock)
  // =========================================================
  if (target === "ALL" || target === "KUMAR") {
    log("Injecting Kumar Store (Normal Stock Baseline)...");
    const { storeId, userId } = TARGET_STORES.KUMAR;

    const kumarProducts: Product[] = [
      {
        productId: "prod_kumar_parleg_800g",
        storeId,
        barcode: "8901719101038",
        sku: "SKU-PARLE-G-800",
        productName: "Parle-G Gold Glucose Biscuits 800g",
        category: "Biscuits",
        brand: "Parle",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
        description: "Family pack glucose biscuits",
        mrp: 80,
        purchasePrice: 66,
        sellingPrice: 75,
        supplier: "Parle Biscuits Hub",
        unit: "packet",
        reorderLevel: 10,
        reorderQuantity: 30,
        currentStock: 35, // NORMAL
        minimumStock: 5,
        maximumStock: 60,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        productId: "prod_kumar_coke_750ml",
        storeId,
        barcode: "8901764012217",
        sku: "SKU-COCA-COLA-750",
        productName: "Coca-Cola Original 750ml PET",
        category: "Beverage",
        brand: "Coca Cola",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400",
        description: "Carbonated soft drink bottle",
        mrp: 40,
        purchasePrice: 32,
        sellingPrice: 40,
        supplier: "Moon Beverages",
        unit: "bottle",
        reorderLevel: 12,
        reorderQuantity: 48,
        currentStock: 28, // NORMAL
        minimumStock: 6,
        maximumStock: 60,
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    for (const prod of kumarProducts) {
      await setDoc(doc(db, "products", prod.productId), prod);

      const hId = `hist_${prod.productId}`;
      await setDoc(doc(db, "inventory_history", hId), {
        historyId: hId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        previousStock: prod.currentStock + 1,
        updatedStock: prod.currentStock,
        action: "SALE",
        timestamp: nowIso,
        userId
      });

      const predId = `pred_${prod.productId}`;
      await setDoc(doc(db, "predictions", predId), {
        predictionId: predId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        predictedOutOfStockDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        daysRemaining: 10,
        confidence: "91.5%",
        recommendedOrder: 0,
        reasoning: "Steady sales velocity. Inventory levels are healthy.",
        riskLevel: "Low",
        trend: "Stable",
        generatedAt: nowIso
      });
    }

    await setDoc(doc(db, "customers", "cust_kumar_rajesh"), {
      customerId: "cust_kumar_rajesh",
      storeId,
      name: "Rajesh Kulkarni",
      phone: "+91 9448011223",
      totalSpent: 480,
      visitCount: 3,
      lastVisit: nowIso,
      createdAt: nowIso
    });
  }

  // =========================================================
  // 3. STORE 3: SHARMA MART (Zero Stock Depleted)
  // =========================================================
  if (target === "ALL" || target === "SHARMA") {
    log("Injecting Sharma Mart (Zero Stock / Depleted Out)...");
    const { storeId, userId } = TARGET_STORES.SHARMA;

    const zeroProducts: Product[] = [
      {
        productId: "prod_sharma_goodday",
        storeId,
        barcode: "8901063012114",
        sku: "SKU-BRITANNIA-GOODDAY",
        productName: "Britannia Good Day Butter 200g",
        category: "Biscuits",
        brand: "Britannia",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
        description: "Cashew butter cookies",
        mrp: 45,
        purchasePrice: 36,
        sellingPrice: 42,
        supplier: "Britannia Logistics",
        unit: "packet",
        reorderLevel: 10,
        reorderQuantity: 50,
        currentStock: 0, // ZERO STOCK
        minimumStock: 5,
        maximumStock: 80,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        productId: "prod_sharma_surf_excel",
        storeId,
        barcode: "8901030894124",
        sku: "SKU-SURF-EXCEL-1KG",
        productName: "Surf Excel Easy Wash Detergent 1kg",
        category: "Staples",
        brand: "Surf Excel",
        image: "https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=400",
        description: "Detergent powder pack",
        mrp: 140,
        purchasePrice: 112,
        sellingPrice: 130,
        supplier: "HUL Depot",
        unit: "packet",
        reorderLevel: 12,
        reorderQuantity: 36,
        currentStock: 0, // ZERO STOCK
        minimumStock: 4,
        maximumStock: 60,
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    for (const prod of zeroProducts) {
      await setDoc(doc(db, "products", prod.productId), prod);

      const hId = `hist_${prod.productId}`;
      await setDoc(doc(db, "inventory_history", hId), {
        historyId: hId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        previousStock: 1,
        updatedStock: 0,
        action: "STOCK_OUT",
        timestamp: nowIso,
        userId
      });

      const predId = `pred_${prod.productId}`;
      await setDoc(doc(db, "predictions", predId), {
        predictionId: predId,
        storeId,
        productId: prod.productId,
        barcode: prod.barcode,
        productName: prod.productName,
        predictedOutOfStockDate: nowIso,
        daysRemaining: 0,
        confidence: "99.9%",
        recommendedOrder: prod.reorderQuantity,
        reasoning: "CRITICAL: Stock is completely depleted (0 units). Reorder immediately.",
        riskLevel: "High",
        trend: "Downwards",
        generatedAt: nowIso
      });
    }

    await setDoc(doc(db, "notifications", "notif_sharma_out_of_stock"), {
      notificationId: "notif_sharma_out_of_stock",
      storeId,
      title: "Store Out of Stock",
      message: "Britannia Good Day and Surf Excel are completely sold out.",
      status: "unread",
      priority: "High",
      type: "Low Stock",
      createdAt: nowIso,
      read: false
    });
  }

  log("Injection complete! All records written directly to Cloud Firestore.");
};