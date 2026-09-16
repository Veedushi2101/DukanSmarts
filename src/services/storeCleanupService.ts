import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

// List of all collections that store tenant-specific data
const TENANT_COLLECTIONS = [
  "products",
  "inventory_history",
  "scans",
  "sales",
  "predictions",
  "notifications",
  "customers",
  "customer_purchases"
];

/**
 * Permanently deletes all data associated with a storeId and owner uid.
 */
export const purgeStoreData = async (storeId: string, uid: string): Promise<void> => {
  if (!storeId || !uid) {
    throw new Error("Missing storeId or uid for deletion.");
  }

  // 1. Delete all documents in each tenant collection matching storeId
  for (const colName of TENANT_COLLECTIONS) {
    try {
      const q = query(collection(db, colName), where("storeId", "==", storeId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Firestore batches support up to 500 operations
        let batch = writeBatch(db);
        let count = 0;

        for (const docSnap of snapshot.docs) {
          batch.delete(docSnap.ref);
          count++;

          if (count === 450) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }

        if (count > 0) {
          await batch.commit();
        }
      }
    } catch (err) {
      console.error(`Error deleting documents from collection ${colName}:`, err);
      throw err;
    }
  }

  // 2. Delete the user's primary profile document
  const userDocRef = doc(db, "users", uid);
  await deleteDoc(userDocRef);
};