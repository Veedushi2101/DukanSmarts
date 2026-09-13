import React, { createContext, useContext, useState, useEffect } from "react";
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
import {
  listenProductsService,
  listenInventoryHistoryService,
  listenPredictionsService,
  listenNotificationsService,
  listenScanHistoryService,
  listenCustomersService,
  listenSalesService,
  updateProductStockService,
  createProductService,
  markNotificationAsReadService,
  findProductByBarcode,
  triggerAIForecastService,
  deleteProductService,
  recordCustomerPurchaseService,
  updateCustomerDetailsService,
  updateCustomerBillService,
  recordBillSaleTransaction
} from "../services/firebaseService";

interface InventoryContextType {
  products: Product[];
  history: InventoryHistory[];
  scanHistory: ScanHistoryRecord[];
  predictions: AIPrediction[];
  notifications: NotificationItem[];
  customers: Customer[];
  sales: any[];
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
  recordCustomerPurchase: (
    name: string,
    phone: string | undefined,
    totalAmount: number,
    purchasedItems: CustomerLedgerItem[]
  ) => Promise<string>;
  updateCustomerDetails: (
    customerId: string,
    updatedData: { name: string; phone: string }
  ) => Promise<void>;
  updateCustomerBill: (
    customerId: string,
    updatedBills: CustomerPurchaseLog[]
  ) => Promise<void>;
  recordSaleTransaction: (
    customerName: string,
    totalAmount: number,
    items: CustomerLedgerItem[]
  ) => Promise<void>;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<any[]>([]);
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

    const unsubCustomers = listenCustomersService((data) => {
      setCustomers(data);
    });

    const unsubSales = listenSalesService((data) => {
      setSales(data);
    });

    return () => {
      unsubProducts();
      unsubHistory();
      unsubScanHistory();
      unsubPredictions();
      unsubNotifs();
      unsubCustomers();
      unsubSales();
    };
  }, []);

  const scanBarcode = async (barcode: string): Promise<Product | null> => {
    return await findProductByBarcode(barcode);
  };

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
    const now = new Date().toISOString();
    return await createProductService({
      ...productData,
      createdAt: now,
      updatedAt: now
    });
  };

  const recordSale = async (productId: string, quantity: number) => {
    await updateStock(productId, -Math.abs(quantity), "SALE");
  };

  const deleteProduct = async (productId: string) => {
    await deleteProductService(productId);
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

  const recordCustomerPurchase = async (
    name: string,
    phone: string | undefined,
    totalAmount: number,
    purchasedItems: CustomerLedgerItem[]
  ): Promise<string> => {
    return await recordCustomerPurchaseService(name, phone, totalAmount, purchasedItems);
  };

  const updateCustomerDetails = async (
    customerId: string,
    updatedData: { name: string; phone: string }
  ): Promise<void> => {
    await updateCustomerDetailsService(customerId, updatedData);
  };

  const updateCustomerBill = async (
    customerId: string,
    updatedBills: CustomerPurchaseLog[]
  ): Promise<void> => {
    await updateCustomerBillService(customerId, updatedBills);
  };

  const recordSaleTransaction = async (
    customerName: string,
    totalAmount: number,
    items: CustomerLedgerItem[]
  ): Promise<void> => {
    await recordBillSaleTransaction(customerName, totalAmount, items);
  };

  const unreadNotificationsCount = notifications.filter(
    (n) => !n.read && n.status !== "read"
  ).length;

  return (
    <InventoryContext.Provider
      value={{
        products,
        history,
        scanHistory,
        predictions,
        notifications,
        customers,
        sales,
        unreadNotificationsCount,
        loading,
        isOnline,
        scanBarcode,
        updateStock,
        addProduct,
        recordSale,
        markNotificationRead,
        triggerProductAI,
        recordCustomerPurchase,
        updateCustomerDetails,
        updateCustomerBill,
        recordSaleTransaction,
        selectedProduct,
        setSelectedProduct,
        deleteProduct
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