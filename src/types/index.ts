// ================= USER ROLES & AUTHENTICATION =================
export type UserRole = "OWNER" | "CASHIER";

export interface Store {
  storeId: string;
  name: string;
  ownerId: string;
  location?: string;
  phone?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
  storeName: string;
  billHeaderName?: string;
  address?: string;
  phone?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
}

// Alias for auth contexts
export type AppUser = UserProfile;

// ================= INVENTORY & PRODUCTS =================
export interface Product {
  productId: string;
  storeId?: string;
  barcode: string;
  sku: string;
  productName: string;
  category: string;
  brand?: string;
  image: string;
  description: string;
  mrp?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  supplier: string;
  unit: string;
  reorderLevel: number;
  recommendedReorder?: number;
  reorderQuantity: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryAction = "STOCK_IN" | "STOCK_OUT" | "SALE" | "MANUAL_EDIT";

export interface InventoryHistory {
  historyId: string;
  storeId?: string;
  productId: string;
  barcode: string;
  productName?: string;
  previousStock: number;
  updatedStock: number;
  action: InventoryAction;
  timestamp: string;
  userId: string;
}

export interface ScanHistoryRecord {
  scanId: string;
  storeId?: string;
  barcode: string;
  productId?: string;
  productName?: string;
  timestamp: string;
  action: InventoryAction;
  stockBefore: number;
  stockAfter: number;
  deviceInfo?: string;
}

// ================= SALES & ANALYTICS =================
export interface SaleRecord {
  saleId: string;
  storeId?: string;
  productId: string;
  barcode: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  soldAt: string;
  dateKey?: string;
  employeeId: string;
}

// ================= AI PREDICTIONS & FORECASTING =================
export interface AIPrediction {
  predictionId: string;
  storeId?: string;
  productId: string;
  barcode?: string;
  productName?: string;
  predictedOutOfStockDate: string;
  daysRemaining: number;
  confidence: string;
  recommendedOrder: number;
  reasoning: string;
  riskLevel: "High" | "Moderate" | "Low";
  trend: "Upwards" | "Stable" | "Downwards";
  generatedAt: string;
}

// ================= NOTIFICATIONS & ALERTS =================
export interface NotificationItem {
  notificationId: string;
  storeId?: string;
  productId?: string;
  title: string;
  message: string;
  status: "unread" | "read";
  priority?: "High" | "Medium" | "Low";
  type?: "AI Forecast" | "Low Stock" | "Order" | "System";
  createdAt: string;
  read: boolean;
}

// ================= CUSTOMERS & KHATA LEDGER =================
export interface CustomerLedgerItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface CustomerPurchaseLog {
  billId: string;
  timestamp: string;
  totalAmount: number;
  items: CustomerLedgerItem[];
}

export interface CustomerTransaction {
  transactionId: string;
  customerName: string;
  customerPhone?: string;
  items: CustomerLedgerItem[];
  totalAmount: number;
  timestamp: string;
  dateKey: string;
}

export interface CustomerSummary {
  customerName: string;
  totalSpent: number;
  totalItemsTaken: number;
  lastActive: string;
  transactions: CustomerTransaction[];
}

export interface Customer {
  customerId: string;
  storeId?: string;
  name: string;
  phone?: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  visitIntervalDays?: number;
  favoriteProducts?: string[];
  purchaseHistory?: CustomerPurchaseLog[];
  createdAt: string;
}