import { InventoryAction, Product } from "../types";
import { updateProductStockService, createProductService } from "./firebaseService";

export interface QueuedOperation {
  id: string;
  type: "STOCK_UPDATE" | "ADD_PRODUCT";
  productId?: string;
  barcode?: string;
  stockDelta?: number;
  action?: InventoryAction;
  productData?: Omit<Product, "productId" | "createdAt" | "updatedAt">;
  timestamp: string;
}

const STORAGE_KEY = "stockpilot_offline_queue";

export function getOfflineQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineOperation(op: Omit<QueuedOperation, "id" | "timestamp">) {
  const queue = getOfflineQueue();
  const newItem: QueuedOperation = {
    ...op,
    id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };
  queue.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

  // Try registering background sync if service worker is active
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((reg: any) => {
      reg.sync.register("sync-offline-scans").catch((e: any) => console.log("Background sync error:", e));
    });
  }
}

export async function processOfflineQueue(): Promise<{ syncedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  console.log(`[Offline Sync] Syncing ${queue.length} offline operations with Firebase...`);
  let syncedCount = 0;
  const remaining: QueuedOperation[] = [];

  for (const item of queue) {
    try {
      if (item.type === "STOCK_UPDATE" && item.productId && item.stockDelta !== undefined && item.action) {
        await updateProductStockService(item.productId, item.stockDelta, item.action);
        syncedCount++;
      } else if (item.type === "ADD_PRODUCT" && item.productData) {
        await createProductService(item.productData);
        syncedCount++;
      }
    } catch (err) {
      console.warn("Failed syncing queue item:", item, err);
      remaining.push(item);
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return { syncedCount };
}
