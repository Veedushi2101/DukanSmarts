export interface Store {
  storeId: string;
  name: string;
  ownerId: string;
  location: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  assignedStore: string;
  createdAt: string;
}

export interface Product {
  productId: string;
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

export type InventoryAction = 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'MANUAL_EDIT';

export interface InventoryHistory {
  historyId: string;
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
  barcode: string;
  productId?: string;
  productName?: string;
  timestamp: string;
  action: InventoryAction;
  stockBefore: number;
  stockAfter: number;
  deviceInfo?: string;
}

export interface SaleRecord {
  saleId: string;
  productId: string;
  barcode: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  soldAt: string;
  employeeId: string;
}

export interface AIPrediction {
  predictionId: string;
  productId: string;
  barcode?: string;
  productName?: string;
  predictedOutOfStockDate: string;
  daysRemaining: number;
  confidence: string;
  recommendedOrder: number;
  reasoning: string;
  riskLevel: 'High' | 'Moderate' | 'Low';
  trend: 'Upwards' | 'Stable' | 'Downwards';
  generatedAt: string;
}

export interface NotificationItem {
  notificationId: string;
  productId?: string;
  title: string;
  message: string;
  status: 'unread' | 'read';
  priority?: 'High' | 'Medium' | 'Low';
  type?: 'AI Forecast' | 'Low Stock' | 'Order' | 'System';
  createdAt: string;
  read: boolean;
}