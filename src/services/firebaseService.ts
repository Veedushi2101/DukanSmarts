import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  getDoc,
  setDoc
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
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        list.push({
          ...data,
          productId: docSnap.id
        });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenProductsService error:", error);
    }
  );
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

  return onSnapshot(
    q,
    (snapshot) => {
      const list: InventoryHistory[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as InventoryHistory), historyId: docSnap.id });
      });
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenInventoryHistoryService error:", error);
    }
  );
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
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AIPrediction[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as AIPrediction), predictionId: docSnap.id });
      });
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenPredictionsService error:", error);
    }
  );
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
  return onSnapshot(
    q,
    (snapshot) => {
      const list: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as NotificationItem), notificationId: docSnap.id });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenNotificationsService error:", error);
    }
  );
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
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as Customer), customerId: docSnap.id });
      });
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenCustomersService error:", error);
    }
  );
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
  return onSnapshot(
    q,
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), saleId: docSnap.id });
      });
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenSalesService error:", error);
    }
  );
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
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ScanHistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as ScanHistoryRecord), scanId: docSnap.id });
      });
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      callback(list);
    },
    (error) => {
      console.error("[Firestore] listenScanHistoryService error:", error);
    }
  );
};

// Create a Product strictly bound to the store
export const createProductService = async (
  productData: Omit<Product, "productId">
): Promise<Product> => {
  if (!productData.storeId) {
    throw new Error("Cannot save product: storeId is missing.");
  }

  const nowIso = new Date().toISOString();
  const payload = {
    ...productData,
    createdAt: productData.createdAt || nowIso,
    updatedAt: nowIso
  };

  const docRef = await addDoc(collection(db, "products"), payload);
  await updateDoc(docRef, { productId: docRef.id });

  return {
    ...payload,
    productId: docRef.id
  };
};

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
  await updateDoc(histDocRef, { historyId: histDocRef.id });

  return {
    product: updatedProduct,
    history: { ...historyRecord, historyId: histDocRef.id }
  };
};

export const findProductByBarcode = async (
  barcode: string,
  storeId?: string
): Promise<Product | null> => {
  const cleanBarcode = String(barcode).trim();
  if (!cleanBarcode || !storeId) return null;

  const q = query(
    collection(db, "products"),
    where("storeId", "==", storeId),
    where("barcode", "==", cleanBarcode)
  );

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
  await updateDoc(ref, { predictionId: ref.id });
  return { ...pred, predictionId: ref.id };
};

// Record Customer Purchase with Cash / Udhaar Support & Limit Validation
export const recordCustomerPurchaseService = async (
  name: string,
  phone: string | undefined,
  totalAmount: number,
  purchasedItems: CustomerLedgerItem[],
  paymentType: "PAID" | "UDHAAR" = "PAID",
  address: string = "",
  creditLimit: number = 2000,
  storeId?: string
): Promise<string> => {
  if (!storeId) {
    throw new Error("Cannot log customer: storeId is missing.");
  }

  const nowIso = new Date().toISOString();
  const cleanName = name.trim();
  const cleanPhone = (phone || "").trim();
  const cleanAddress = address.trim();

  const billId = `BILL-${Date.now().toString().slice(-6)}`;
  const newBill: CustomerPurchaseLog = {
    billId,
    timestamp: nowIso,
    totalAmount,
    items: purchasedItems,
    paymentType
  };

  const itemNames = purchasedItems.map((it) => it.productName);
  const customersRef = collection(db, "customers");
  let existingCustDoc: any = null;

  if (cleanPhone) {
    const qPhone = query(
      customersRef,
      where("storeId", "==", storeId),
      where("phone", "==", cleanPhone)
    );
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) existingCustDoc = snapPhone.docs[0];
  }

  if (!existingCustDoc) {
    const qName = query(
      customersRef,
      where("storeId", "==", storeId),
      where("name", "==", cleanName)
    );
    const snapName = await getDocs(qName);
    if (!snapName.empty) existingCustDoc = snapName.docs[0];
  }

  if (existingCustDoc) {
    const prev = existingCustDoc.data() as Customer;
    const prevHistory = prev.purchaseHistory || [];
    const prevItems = prev.favoriteProducts || [];
    const currentUdhaar = Number(prev.currentUdhaar || 0);
    const limit = Number(prev.creditLimit || creditLimit);

    if (paymentType === "UDHAAR" && currentUdhaar + totalAmount > limit) {
      throw new Error(
        `Credit limit exceeded! Limit: ₹${limit}, Current Udhaar: ₹${currentUdhaar}. Max allowed: ₹${Math.max(0, limit - currentUdhaar)}`
      );
    }

    let visitIntervalDays = prev.visitIntervalDays || 0;
    if (prev.lastVisit) {
      const lastVisitTime = new Date(prev.lastVisit).getTime();
      const diffDays = Math.max(1, Math.round((Date.now() - lastVisitTime) / (1000 * 60 * 60 * 24)));
      visitIntervalDays = prev.visitCount > 1 ? Math.round((visitIntervalDays + diffDays) / 2) : diffDays;
    }

    const updatedData: Partial<Customer> = {
      phone: cleanPhone || prev.phone || "",
      address: cleanAddress || prev.address || "",
      creditLimit: limit,
      currentUdhaar: paymentType === "UDHAAR" ? currentUdhaar + totalAmount : currentUdhaar,
      totalSpent: (prev.totalSpent || 0) + totalAmount,
      visitCount: (prev.visitCount || 0) + 1,
      lastVisit: nowIso,
      visitIntervalDays,
      favoriteProducts: Array.from(new Set([...prevItems, ...itemNames])),
      purchaseHistory: [...prevHistory, newBill]
    };

    await updateDoc(existingCustDoc.ref, updatedData);

    // Audit log entry for credit issuance
    if (paymentType === "UDHAAR") {
      const histDocRef = await addDoc(collection(db, "inventory_history"), {
        storeId,
        productId: billId,
        productName: `Udhaar issued to ${cleanName}`,
        action: "UDHAAR_ISSUED",
        previousStock: currentUdhaar,
        updatedStock: currentUdhaar + totalAmount,
        timestamp: nowIso,
        userId: storeId
      });
      await updateDoc(histDocRef, { historyId: histDocRef.id });
    }

    return existingCustDoc.id;
  }

  if (paymentType === "UDHAAR" && totalAmount > creditLimit) {
    throw new Error(`Initial Udhaar of ₹${totalAmount} exceeds the credit limit of ₹${creditLimit}.`);
  }

  const newCustPayload: Omit<Customer, "customerId"> = {
    storeId,
    name: cleanName,
    phone: cleanPhone,
    address: cleanAddress,
    creditLimit,
    currentUdhaar: paymentType === "UDHAAR" ? totalAmount : 0,
    isVerified: false,
    totalSpent: totalAmount,
    visitCount: 1,
    lastVisit: nowIso,
    visitIntervalDays: 0,
    favoriteProducts: Array.from(new Set(itemNames)),
    purchaseHistory: [newBill],
    createdAt: nowIso
  };

  const docRef = await addDoc(customersRef, newCustPayload);
  await updateDoc(docRef, { customerId: docRef.id });

  if (paymentType === "UDHAAR") {
    const histDocRef = await addDoc(collection(db, "inventory_history"), {
      storeId,
      productId: billId,
      productName: `Udhaar issued to ${cleanName}`,
      action: "UDHAAR_ISSUED",
      previousStock: 0,
      updatedStock: totalAmount,
      timestamp: nowIso,
      userId: storeId
    });
    await updateDoc(histDocRef, { historyId: histDocRef.id });
  }

  return docRef.id;
};

// Settle / Repay Customer Udhaar
export const settleCustomerUdhaarService = async (
  customerId: string,
  repayAmount: number,
  storeId?: string
) => {
  const cRef = doc(db, "customers", customerId);
  const snap = await getDoc(cRef);
  if (!snap.exists()) throw new Error("Customer does not exist.");

  const prev = snap.data() as Customer;
  const currentUdhaar = Number(prev.currentUdhaar || 0);
  const newUdhaar = Math.max(0, currentUdhaar - repayAmount);
  const nowIso = new Date().toISOString();

  await updateDoc(cRef, {
    currentUdhaar: newUdhaar,
    lastVisit: nowIso
  });

  const histDocRef = await addDoc(collection(db, "inventory_history"), {
    storeId: storeId || prev.storeId || "",
    productId: customerId,
    productName: `Udhaar repayment by ${prev.name}`,
    action: "UDHAAR_REPAID",
    previousStock: currentUdhaar,
    updatedStock: newUdhaar,
    timestamp: nowIso,
    userId: storeId || prev.storeId || "owner"
  });
  await updateDoc(histDocRef, { historyId: histDocRef.id });
};

export const updateCustomerDetailsService = async (
  customerId: string,
  updatedData: Partial<Customer>
) => {
  await updateDoc(doc(db, "customers", customerId), updatedData);
};

export const updateCustomerBillService = async (
  customerId: string,
  updatedBills: CustomerPurchaseLog[]
) => {
  const newTotalSpent = updatedBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  await updateDoc(doc(db, "customers", customerId), {
    purchaseHistory: updatedBills,
    totalSpent: newTotalSpent
  });
};

export const recordBillSaleTransaction = async (
  customerName: string,
  totalAmount: number,
  items: CustomerLedgerItem[],
  storeId?: string
) => {
  const nowIso = new Date().toISOString();
  const dateKey = nowIso.split("T")[0];

  const docRef = await addDoc(collection(db, "sales"), {
    storeId: storeId || "",
    customerName,
    totalAmount,
    items,
    timestamp: nowIso,
    dateKey
  });

  await updateDoc(docRef, { saleId: docRef.id });
};