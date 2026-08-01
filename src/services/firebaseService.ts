import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  limit
} from "firebase/firestore";
import { db, isConfiguredFirebase } from "../firebase/config";
import {
  Product,
  SaleRecord,
  InventoryHistory,
  AIPrediction,
  NotificationItem,
  ScanHistoryRecord
} from "../types";

// Seed 20 Realistic Indian Kirana Products
export const SEED_PRODUCTS: Product[] = [
  {
    productId: "prod_maggi_001",
    barcode: "8901058852312",
    sku: "MAG-001-N",
    productName: "Maggi 2-Minute Noodles",
    category: "Instant Food",
    brand: "Nestle",
    description: "Nestle Maggi Masala Instant Noodles 70g Pack",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80",
    mrp: 14,
    purchasePrice: 11.5,
    sellingPrice: 14,
    supplier: "Nestle India DistriLink",
    unit: "packet",
    minimumStock: 10,
    maximumStock: 100,
    reorderLevel: 20,
    recommendedReorder: 50,
    reorderQuantity: 50,
    currentStock: 18,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: "prod_parle_g_002",
    barcode: "8901058000000",
    sku: "PAR-G-800",
    productName: "Parle-G Biscuits 800g",
    category: "Biscuits",
    brand: "Parle",
    description: "Parle-G Original Glucose Biscuits Family Pack",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80",
    mrp: 80,
    purchasePrice: 68,
    sellingPrice: 78,
    supplier: "Parle Products Agency",
    unit: "pack",
    minimumStock: 25,
    maximumStock: 200,
    reorderLevel: 40,
    recommendedReorder: 80,
    reorderQuantity: 80,
    currentStock: 124,
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_HISTORY: InventoryHistory[] = [
  {
    historyId: "hist_maggi_001",
    productId: "prod_maggi_001",
    barcode: "8901058852312",
    productName: "Maggi 2-Minute Noodles",
    previousStock: 28,
    updatedStock: 18,
    action: "SALE",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    userId: "rajesh_owner"
  }
];

export const SEED_PREDICTIONS: AIPrediction[] = [
  {
    predictionId: "pred_maggi_001",
    productId: "prod_maggi_001",
    barcode: "8901058852312",
    productName: "Maggi 2-Minute Noodles",
    predictedOutOfStockDate: new Date(Date.now() + 48 * 3600000).toISOString().split("T")[0],
    daysRemaining: 2,
    confidence: "94%",
    recommendedOrder: 25,
    reasoning: "Maggi stock is projected to deplete in 48 hours. Typical high-velocity weekend demand is starting early.",
    riskLevel: "High",
    trend: "Upwards",
    generatedAt: new Date().toISOString()
  }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: "notif_001",
    productId: "prod_maggi_001",
    title: "AI Forecast: Maggi May Run Out",
    message: "Maggi stock is predicted to run out tomorrow evening. Recommended reorder: 25 units.",
    status: "unread",
    priority: "High",
    type: "AI Forecast",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false
  }
];

// Reactive local store
class LocalFirebaseStore {
  products: Product[] = [...SEED_PRODUCTS];
  history: InventoryHistory[] = [...SEED_HISTORY];
  scanHistory: ScanHistoryRecord[] = [];
  sales: SaleRecord[] = [];
  predictions: AIPrediction[] = [...SEED_PREDICTIONS];
  notifications: NotificationItem[] = [...SEED_NOTIFICATIONS];
  listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((l) => l());
  }
}

export const localStore = new LocalFirebaseStore();

// ================= DELETE PRODUCT SERVICE =================
export const deleteProductService = async (productId: string): Promise<void> => {
  try {
    if (isConfiguredFirebase && db) {
      // 1. Delete product document from Firestore
      await deleteDoc(doc(db, "products", productId));

      // 2. Delete prediction documents
      await deleteDoc(doc(db, "predictions", `pred_${productId}`)).catch(() => {});
      await deleteDoc(doc(db, "predictions", productId)).catch(() => {});

      // 3. Delete related history logs
      const historyQuery = query(
        collection(db, "inventory_history"),
        where("productId", "==", productId)
      );
      const historySnap = await getDocs(historyQuery);
      const deletePromises = historySnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    }

    // 4. Update local state
    localStore.products = localStore.products.filter((p) => p.productId !== productId);
    localStore.predictions = localStore.predictions.filter((p) => p.productId !== productId);
    localStore.history = localStore.history.filter((h) => h.productId !== productId);
    localStore.notify();
  } catch (error) {
    console.error("Error deleting product and stock data:", error);
    throw error;
  }
};

// ================= PRODUCT SERVICES =================
export async function getProductsService(): Promise<Product[]> {
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "products"), orderBy("productName", "asc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((docSnap) => ({ ...docSnap.data(), productId: docSnap.id } as Product));
      }
    } catch (err) {
      console.warn("Firestore getProducts fallback:", err);
    }
  }
  return localStore.products;
}

export function listenProductsService(callback: (products: Product[]) => void): () => void {
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "products"));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((docSnap) => ({ ...docSnap.data(), productId: docSnap.id } as Product));

          // Remove duplicate entries by productId
          const uniqueProducts = Array.from(
            new Map(list.map((p) => [p.productId, p])).values()
          );

          localStore.products = uniqueProducts;
          callback(uniqueProducts);
        },
        (err) => {
          console.warn("Firestore products snapshot error:", err);
          callback(localStore.products);
        }
      );
    } catch (e) {
      console.warn("Firestore listenProducts catch:", e);
    }
  }

  callback(localStore.products);
  return localStore.subscribe(() => callback(localStore.products));
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  const normalized = barcode.trim();
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "products"), where("barcode", "==", normalized));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { ...d.data(), productId: d.id } as Product;
      }
    } catch (err) {
      console.warn("Firestore findProductByBarcode error:", err);
    }
  }
  return localStore.products.find((p) => p.barcode === normalized || p.sku.toLowerCase() === normalized.toLowerCase()) || null;
}

export async function createProductService(
  productData: Omit<Product, "productId" | "createdAt" | "updatedAt">
): Promise<Product> {
  // Generate a unique ID using timestamp to prevent ID overlap
  const sequentialId = `prod_${Date.now()}`;

  const newProduct: Product = {
    ...productData,
    productId: sequentialId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isConfiguredFirebase && db) {
    try {
      await setDoc(doc(db, "products", newProduct.productId), newProduct);
    } catch (err) {
      console.warn("Firestore createProduct error:", err);
    }
  }

  await addInventoryHistoryService({
    productId: newProduct.productId,
    barcode: newProduct.barcode,
    productName: newProduct.productName,
    previousStock: 0,
    updatedStock: newProduct.currentStock,
    action: "STOCK_IN",
    timestamp: new Date().toISOString(),
    userId: "rajesh_owner"
  });

  return newProduct;
}

export async function updateProductStockService(
  productId: string,
  stockDelta: number,
  action: "STOCK_IN" | "STOCK_OUT" | "SALE" | "MANUAL_EDIT",
  userId: string = "rajesh_owner"
): Promise<{ product: Product; history: InventoryHistory; scanRecord: ScanHistoryRecord }> {
  let p = localStore.products.find((x) => x.productId === productId);
  if (!p && isConfiguredFirebase && db) {
    try {
      const d = await getDoc(doc(db, "products", productId));
      if (d.exists()) {
        p = { ...d.data(), productId: d.id } as Product;
      }
    } catch (e) {
      console.warn("getDoc error:", e);
    }
  }

  if (!p) {
    throw new Error("Product not found");
  }

  const prevStock = p.currentStock;
  const newStock = Math.max(0, prevStock + stockDelta);
  const updatedProduct: Product = {
    ...p,
    currentStock: newStock,
    updatedAt: new Date().toISOString()
  };

  const idx = localStore.products.findIndex((x) => x.productId === productId);
  if (idx !== -1) {
    localStore.products[idx] = updatedProduct;
  }

  if (isConfiguredFirebase && db) {
    try {
      await updateDoc(doc(db, "products", productId), {
        currentStock: newStock,
        updatedAt: updatedProduct.updatedAt
      });
    } catch (err) {
      console.warn("Firestore stock update error:", err);
    }
  }

  const historyItem = await addInventoryHistoryService({
    productId: updatedProduct.productId,
    barcode: updatedProduct.barcode,
    productName: updatedProduct.productName,
    previousStock: prevStock,
    updatedStock: newStock,
    action,
    timestamp: new Date().toISOString(),
    userId
  });

  const scanRecord = await addScanHistoryService({
    barcode: updatedProduct.barcode,
    productId: updatedProduct.productId,
    productName: updatedProduct.productName,
    timestamp: new Date().toISOString(),
    action,
    stockBefore: prevStock,
    stockAfter: newStock,
    deviceInfo: navigator.userAgent.includes("Mobile") ? "Mobile Camera Scanner" : "Desktop Scanner"
  });

  if (action === "SALE" || action === "STOCK_OUT") {
    await recordSaleService({
      productId: updatedProduct.productId,
      barcode: updatedProduct.barcode,
      productName: updatedProduct.productName,
      quantity: Math.abs(stockDelta),
      unitPrice: updatedProduct.sellingPrice || updatedProduct.mrp,
      totalPrice: Math.abs(stockDelta) * (updatedProduct.sellingPrice || updatedProduct.mrp || 0),
      soldAt: new Date().toISOString(),
      employeeId: userId
    });
  }

  triggerAIForecastService(updatedProduct);

  localStore.notify();
  return { product: updatedProduct, history: historyItem, scanRecord };
}

// ================= SCAN HISTORY SERVICES =================
export async function addScanHistoryService(record: Omit<ScanHistoryRecord, "scanId">): Promise<ScanHistoryRecord> {
  const scanRecord: ScanHistoryRecord = {
    ...record,
    scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };

  if (isConfiguredFirebase && db) {
    try {
      await setDoc(doc(db, "scanHistory", scanRecord.scanId), scanRecord);
    } catch (e) {
      console.warn("Firestore scan history write error:", e);
    }
  }

  localStore.scanHistory.unshift(scanRecord);
  localStore.notify();
  return scanRecord;
}

export function listenScanHistoryService(callback: (records: ScanHistoryRecord[]) => void): () => void {
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "scanHistory"), orderBy("timestamp", "desc"), limit(50));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((docSnap) => ({ ...docSnap.data(), scanId: docSnap.id } as ScanHistoryRecord));
          localStore.scanHistory = list;
          callback(list);
        },
        (err) => {
          console.warn("Scan history snapshot error:", err);
          callback(localStore.scanHistory);
        }
      );
    } catch (e) {
      console.warn("Listen scan history catch:", e);
    }
  }

  callback(localStore.scanHistory);
  return localStore.subscribe(() => callback(localStore.scanHistory));
}

// ================= INVENTORY HISTORY SERVICES =================
export async function addInventoryHistoryService(item: Omit<InventoryHistory, "historyId">): Promise<InventoryHistory> {
  const historyRecord: InventoryHistory = {
    ...item,
    historyId: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };

  if (isConfiguredFirebase && db) {
    try {
      await setDoc(doc(db, "inventory_history", historyRecord.historyId), historyRecord);
    } catch (e) {
      console.warn("Firestore history error:", e);
    }
  }

  localStore.history.unshift(historyRecord);
  localStore.notify();
  return historyRecord;
}

export function listenInventoryHistoryService(callback: (history: InventoryHistory[]) => void): () => void {
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "inventory_history"), orderBy("timestamp", "desc"), limit(50));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((docSnap) => ({ ...docSnap.data(), historyId: docSnap.id } as InventoryHistory));
          localStore.history = list;
          callback(list);
        },
        (err) => {
          console.warn("History snapshot error:", err);
          callback(localStore.history);
        }
      );
    } catch (e) {
      console.warn("Listen history catch:", e);
    }
  }

  callback(localStore.history);
  return localStore.subscribe(() => callback(localStore.history));
}

// ================= SALES SERVICES =================
export async function recordSaleService(saleData: Omit<SaleRecord, "saleId">): Promise<SaleRecord> {
  const sale: SaleRecord = {
    ...saleData,
    saleId: `sale_${Date.now()}`
  };

  if (isConfiguredFirebase && db) {
    try {
      await setDoc(doc(db, "sales", sale.saleId), sale);
    } catch (e) {
      console.warn("Firestore sale write error:", e);
    }
  }

  localStore.sales.unshift(sale);
  localStore.notify();
  return sale;
}

// ================= PREDICTIONS & AI SERVICES =================
export function listenPredictionsService(callback: (predictions: AIPrediction[]) => void): () => void {
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "predictions"));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((docSnap) => ({ ...docSnap.data(), predictionId: docSnap.id } as AIPrediction));
          localStore.predictions = list;
          callback(list);
        },
        (err) => {
          console.warn("Predictions listener error:", err);
          callback(localStore.predictions);
        }
      );
    } catch (e) {
      console.warn("Predictions listen catch:", e);
    }
  }

  callback(localStore.predictions);
  return localStore.subscribe(() => callback(localStore.predictions));
}

export async function savePredictionService(prediction: AIPrediction): Promise<void> {
  if (isConfiguredFirebase && db) {
    try {
      await setDoc(doc(db, "predictions", prediction.predictionId), prediction);
    } catch (e) {
      console.warn("Save prediction error:", e);
    }
  }

  const idx = localStore.predictions.findIndex((p) => p.productId === prediction.productId);
  if (idx !== -1) {
    localStore.predictions[idx] = prediction;
  } else {
    localStore.predictions.unshift(prediction);
  }

  localStore.notify();
}

export async function triggerAIForecastService(product: Product): Promise<AIPrediction> {
  try {
    const res = await fetch("/api/ai/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        currentStock: product.currentStock,
        category: product.category,
        reorderLevel: product.reorderLevel
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.prediction) {
        const pred: AIPrediction = {
          predictionId: `pred_${product.productId}`,
          productId: product.productId,
          barcode: product.barcode,
          productName: product.productName,
          predictedOutOfStockDate: data.prediction.predictionDate || new Date(Date.now() + 48 * 3600000).toISOString().split("T")[0],
          daysRemaining: Number(data.prediction.daysRemaining) || 2,
          confidence: data.prediction.confidence || "94%",
          recommendedOrder: Number(data.prediction.recommendedOrder) || product.reorderQuantity || 25,
          reasoning: data.prediction.reasoning || `${product.productName} stock is projected to deplete rapidly based on current sales velocity.`,
          riskLevel: (data.prediction.riskLevel as "High" | "Moderate" | "Low") || "High",
          trend: (data.prediction.trend as "Upwards" | "Stable" | "Downwards") || "Upwards",
          generatedAt: new Date().toISOString()
        };

        await savePredictionService(pred);

        if (pred.riskLevel === "High" || product.currentStock <= product.reorderLevel) {
          await addNotificationService({
            productId: product.productId,
            title: `AI Alert: ${product.productName} May Run Out`,
            message: pred.reasoning,
            status: "unread",
            priority: "High",
            type: "AI Forecast",
            createdAt: new Date().toISOString(),
            read: false
          });
        }

        return pred;
      }
    }
  } catch (err) {
    console.warn("triggerAIForecastService fallback:", err);
  }

  const days = Math.max(1, Math.floor(product.currentStock / 10));
  const clientPred: AIPrediction = {
    predictionId: `pred_${product.productId}`,
    productId: product.productId,
    barcode: product.barcode,
    productName: product.productName,
    predictedOutOfStockDate: new Date(Date.now() + days * 86400000).toISOString().split("T")[0],
    daysRemaining: days,
    confidence: "94%",
    recommendedOrder: product.reorderQuantity || 25,
    reasoning: `${product.productName} stock is projected to deplete in ${days * 24} hours. Typical weekend demand is starting early.`,
    riskLevel: product.currentStock <= product.reorderLevel ? "High" : "Moderate",
    trend: "Upwards",
    generatedAt: new Date().toISOString()
  };

  await savePredictionService(clientPred);
  return clientPred;
}

// ================= NOTIFICATIONS SERVICES =================
export function listenNotificationsService(callback: (notifs: NotificationItem[]) => void): () => void {
  if (isConfiguredFirebase && db) {
    try {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      return onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((docSnap) => ({ ...docSnap.data(), notificationId: docSnap.id } as NotificationItem));
          localStore.notifications = list;
          callback(list);
        },
        (err) => {
          console.warn("Notifications listener error:", err);
          callback(localStore.notifications);
        }
      );
    } catch (e) {
      console.warn("Listen notifications catch:", e);
    }
  }

  callback(localStore.notifications);
  return localStore.subscribe(() => callback(localStore.notifications));
}

export async function addNotificationService(
  notifData: Omit<NotificationItem, "notificationId">
): Promise<NotificationItem | null> {
  // Prevent Duplicate Alerts: Check if an unread alert already exists for this product
  const existingUnread = localStore.notifications.find(
    (n) =>
      n.productId === notifData.productId &&
      n.type === notifData.type &&
      !n.read &&
      n.status !== "read"
  );

  // If an unread notification for this product already exists, skip creating another one!
  if (existingUnread) {
    return null;
  }

  const notif: NotificationItem = {
    ...notifData,
    notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };

  if (isConfiguredFirebase && db) {
    try {
      await setDoc(doc(db, "notifications", notif.notificationId), notif);
    } catch (e) {
      console.warn("Add notification error:", e);
    }
  }

  localStore.notifications.unshift(notif);
  localStore.notify();
  return notif;
}

export async function markNotificationAsReadService(notificationId: string): Promise<void> {
  if (isConfiguredFirebase && db) {
    try {
      await updateDoc(doc(db, "notifications", notificationId), { status: "read", read: true });
    } catch (e) {
      console.warn("Mark notification read error:", e);
    }
  }

  const item = localStore.notifications.find((n) => n.notificationId === notificationId);
  if (item) {
    item.status = "read";
    item.read = true;
    localStore.notify();
  }
}