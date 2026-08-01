/**
 * Firebase Cloud Functions Triggers for DukanSmarts
 * Deployable to Firebase Cloud Functions environment
 */

export const cloudFunctionsDocumentation = {
  onInventoryUpdated: "Triggered whenever inventory level changes. Calls Groq AI forecasting engine and updates predictions collection.",
  onProductCreated: "Triggered when a new SKU/Product is added. Initializes baseline inventory history and runs initial AI forecasting.",
  onSalesCreated: "Triggered on POS purchase. Automatically decrements inventory, creates inventory history log, and re-triggers AI demand forecast.",
  generatePrediction: "Callable function to force refresh prediction for a specific product ID.",
  generateNotification: "Utility function to publish low-stock or critical AI alerts to notifications collection.",
  dailyForecastRefresh: "Scheduled Cron job (Every midnight - 00:00) to recalculate demand forecasts for all active SKUs."
};

export const functionsCodeSnippet = `
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.onInventoryUpdated = functions.firestore
  .document("products/{productId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    if (newData.currentStock !== oldData.currentStock) {
      console.log(\`Stock changed for \${newData.productName}: \${oldData.currentStock} -> \${newData.currentStock}\`);
      // Trigger Groq AI Analysis Pipeline...
    }
  });

exports.dailyForecastRefresh = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Running Midnight AI Forecast Refresh for all Kirana products...");
  });
`;
