import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, InventoryHistory, SaleRecord, AIPrediction, NotificationItem, ScanHistoryRecord } from "../types";
import {
  listenProductsService,
  listenInventoryHistoryService,
  listenPredictionsService,
  listenNotificationsService,
  listenScanHistoryService,
  updateProductStockService,
  createProductService,
  markNotificationAsReadService,
  findProductByBarcode,
  triggerAIForecastService,
  deleteProductService
} from "../services/firebaseService";

interface InventoryContextType {
  products: Product[];
  history: InventoryHistory[];
  scanHistory: ScanHistoryRecord[];
  predictions: AIPrediction[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  loading: boolean;
  isOnline: boolean;
  scanBarcode: (barcode: string) => Promise<Product | null>;
  updateStock: (
    productId: string,
    stockDelta: number,
    action: "STOCK_IN" | "STOCK_OUT" | "SALE" | "MANUAL_EDIT"
  ) => Promise<{ product: Product; history: InventoryHistory; scanRecord?: ScanHistoryRecord }>;
  addProduct: (productData: Omit<Product, "productId" | "createdAt" | "updatedAt">) => Promise<Product>;
  recordSale: (productId: string, quantity: number) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  triggerProductAI: (product: Product) => Promise<AIPrediction>;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  deleteProduct: (productId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time Subscriptions (Single Source of Truth)
  useEffect(() => {
    const unsubProducts = listenProductsService((data) => {
      setProducts(data);
      setLoading(false);
      setSelectedProduct((prev) => {
        if (!prev) return null;
        return data.find((p) => p.productId === prev.productId) || null;
      });
    });

    const unsubHistory = listenInventoryHistoryService((data) => {
      setHistory(data);
    });

    const unsubScanHistory = listenScanHistoryService((data) => {
      setScanHistory(data);
    });

    const unsubPredictions = listenPredictionsService((data) => {
      setPredictions(data);
    });

    const unsubNotifs = listenNotificationsService((data) => {
      setNotifications(data);
    });

    return () => {
      unsubProducts();
      unsubHistory();
      unsubScanHistory();
      unsubPredictions();
      unsubNotifs();
    };
  }, []);

  const scanBarcode = async (barcode: string): Promise<Product | null> => {
    return await findProductByBarcode(barcode);
  };

  // Clean Stock Update — delegate state sync to Firestore/Store listeners
  const updateStock = async (
    productId: string,
    stockDelta: number,
    action: "STOCK_IN" | "STOCK_OUT" | "SALE" | "MANUAL_EDIT"
  ) => {
    const res = await updateProductStockService(productId, stockDelta, action);

    if (selectedProduct && selectedProduct.productId === productId) {
      setSelectedProduct(res.product);
    }

    return res;
  };

  const addProduct = async (productData: Omit<Product, "productId" | "createdAt" | "updatedAt">) => {
    return await createProductService(productData);
  };

  const recordSale = async (productId: string, quantity: number) => {
    await updateStock(productId, -Math.abs(quantity), "SALE");
  };

  // Delete Product Handler
  const deleteProduct = async (productId: string) => {
    await deleteProductService(productId);
    // Instant UI fallback update
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
    if (selectedProduct?.productId === productId) {
      setSelectedProduct(null);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    await markNotificationAsReadService(notificationId);
  };

  const triggerProductAI = async (product: Product) => {
    return await triggerAIForecastService(product);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read && n.status !== "read").length;

  return (
    <InventoryContext.Provider
      value={{
        products,
        history,
        scanHistory,
        predictions,
        notifications,
        unreadNotificationsCount,
        loading,
        isOnline,
        scanBarcode,
        updateStock,
        addProduct,
        recordSale,
        markNotificationRead,
        triggerProductAI,
        selectedProduct,
        setSelectedProduct,
        deleteProduct // <-- Included in provider value
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};