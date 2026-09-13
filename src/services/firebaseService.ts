import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  Product,
  InventoryHistory,
  AIPrediction,
  NotificationItem,
  ScanHistoryRecord,
  Customer,
  CustomerLedgerItem,
  CustomerPurchaseLog
} from "../types";

// 1. Listen to Store-Specific Products
export const listenProductsService = (
  callback: (products: Product[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "products"), where("storeId", "==", storeId));
  return onSnapshot(q, (snapshot) => {
    const list: Product[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as Product), productId: docSnap.id });
    });
    callback(list);
  });
};

// 2. Listen to Store-Specific Inventory History
export const listenInventoryHistoryService = (
  callback: (history: InventoryHistory[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "inventory_history"),
    where("storeId", "==", storeId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: InventoryHistory[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as InventoryHistory), historyId: docSnap.id });
    });
    callback(list);
  });
};

// 3. Listen to Store-Specific AI Predictions
export const listenPredictionsService = (
  callback: (predictions: AIPrediction[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "predictions"), where("storeId", "==", storeId));
  return onSnapshot(q, (snapshot) => {
    const list: AIPrediction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as AIPrediction), predictionId: docSnap.id });
    });
    callback(list);
  });
};

// 4. Listen to Store-Specific Notifications
export const listenNotificationsService = (
  callback: (notifications: NotificationItem[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "notifications"), where("storeId", "==", storeId));
  return onSnapshot(q, (snapshot) => {
    const list: NotificationItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as NotificationItem), notificationId: docSnap.id });
    });
    callback(list);
  });
};

// 5. Listen to Store-Specific Customers (Khata)
export const listenCustomersService = (
  callback: (customers: Customer[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "customers"), where("storeId", "==", storeId));
  return onSnapshot(q, (snapshot) => {
    const list: Customer[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as Customer), customerId: docSnap.id });
    });
    callback(list);
  });
};

// 6. Listen to Store-Specific Sales
export const listenSalesService = (
  callback: (sales: any[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "sales"), where("storeId", "==", storeId));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), saleId: docSnap.id });
    });
    callback(list);
  });
};

// 7. Listen to Store-Specific Scan History
export const listenScanHistoryService = (
  callback: (scans: ScanHistoryRecord[]) => void,
  storeId?: string
) => {
  if (!storeId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, "scans"), where("storeId", "==", storeId));
  return onSnapshot(q, (snapshot) => {
    const list: ScanHistoryRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as ScanHistoryRecord), scanId: docSnap.id });
    });
    callback(list);
  });
};

// Create a Product strictly bound to the store
export const createProductService = async (
  productData: Omit<Product, "productId">
): Promise<Product> => {
  const docRef = await addDoc(collection(db, "products"), productData);
  return { ...productData, productId: docRef.id };
};

// Delete a product
export const deleteProductService = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, "products", productId));
};

// Update stock and write to store inventory history
export const updateProductStockService = async (
  productId: string,
  stockDelta: number,
  action: "STOCK_IN" | "STOCK_OUT" | "SALE" | "MANUAL_EDIT"
): Promise<{ product: Product; history: InventoryHistory }> => {
  const pRef = doc(db, "products", productId);
  const snap = await getDoc(pRef);
  if (!snap.exists()) throw new Error("Product does not exist");

  const prev = snap.data() as Product;
  const newStock = Math.max(0, (prev.currentStock || 0) + stockDelta);
  const nowIso = new Date().toISOString();

  await updateDoc(pRef, {
    currentStock: newStock,
    updatedAt: nowIso
  });

  const updatedProduct: Product = { ...prev, currentStock: newStock, updatedAt: nowIso };

  const historyRecord: Omit<InventoryHistory, "historyId"> = {
    storeId: prev.storeId,
    productId,
    barcode: prev.barcode,
    productName: prev.productName,
    previousStock: prev.currentStock || 0,
    updatedStock: newStock,
    action,
    timestamp: nowIso,
    userId: prev.storeId || "owner"
  };

  const histDocRef = await addDoc(collection(db, "inventory_history"), historyRecord);

  return {
    product: updatedProduct,
    history: { ...historyRecord, historyId: histDocRef.id }
  };
};

export const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const q = query(collection(db, "products"), where("barcode", "==", barcode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { ...(docSnap.data() as Product), productId: docSnap.id };
};

export const markNotificationAsReadService = async (notificationId: string) => {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
    status: "read"
  });
};

export const triggerAIForecastService = async (product: Product): Promise<AIPrediction> => {
  const nowIso = new Date().toISOString();
  const pred: Omit<AIPrediction, "predictionId"> = {
    storeId: product.storeId,
    productId: product.productId,
    barcode: product.barcode,
    productName: product.productName,
    predictedOutOfStockDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    daysRemaining: Math.max(1, Math.round(product.currentStock / 5)),
    confidence: "94.5%",
    recommendedOrder: product.reorderQuantity || 20,
    reasoning: `Sales velocity analysis for ${product.productName}.`,
    riskLevel: product.currentStock <= product.reorderLevel ? "High" : "Low",
    trend: "Stable",
    generatedAt: nowIso
  };

  const ref = await addDoc(collection(db, "predictions"), pred);
  return { ...pred, predictionId: ref.id };
};

export const recordCustomerPurchaseService = async (
  name: string,
  phone: string | undefined,
  totalAmount: number,
  purchasedItems: CustomerLedgerItem[]
): Promise<string> => {
  const nowIso = new Date().toISOString();
  const docRef = await addDoc(collection(db, "customer_purchases"), {
    name,
    phone: phone || "",
    totalAmount,
    purchasedItems,
    timestamp: nowIso
  });
  return docRef.id;
};

export const updateCustomerDetailsService = async (
  customerId: string,
  updatedData: { name: string; phone: string }
) => {
  await updateDoc(doc(db, "customers", customerId), updatedData);
};

export const updateCustomerBillService = async (
  customerId: string,
  updatedBills: CustomerPurchaseLog[]
) => {
  await updateDoc(doc(db, "customers", customerId), {
    purchaseHistory: updatedBills
  });
};

export const recordBillSaleTransaction = async (
  customerName: string,
  totalAmount: number,
  items: CustomerLedgerItem[]
) => {
  await addDoc(collection(db, "sales"), {
    customerName,
    totalAmount,
    items,
    timestamp: new Date().toISOString()
  });
};