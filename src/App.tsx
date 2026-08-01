import React, { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { InventoryProvider, useInventory } from "./contexts/InventoryContext";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AIChatDrawer } from "./components/AIChatDrawer";
import { AddProductModal } from "./components/AddProductModal";
import { RecordSaleModal } from "./components/RecordSaleModal";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { QRScannerPage } from "./pages/QRScannerPage";
import { AIForecastPage } from "./pages/AIForecastPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Product } from "./types";

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab | "product-detail">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialBarcodeForAdd, setInitialBarcodeForAdd] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const { products, selectedProduct, setSelectedProduct } = useInventory();

  // Register PWA Service Worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[StockPilot] PWA Service Worker registered:", reg.scope))
        .catch((err) => console.warn("[StockPilot] PWA Service Worker registration issue:", err));
    } else if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[StockPilot] Service worker registered in dev mode:", reg.scope))
        .catch((err) => console.warn("[StockPilot] Service worker dev register:", err));
    }
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab("product-detail");
  };

  const handleSelectProductById = (productId: string) => {
    const p = products.find((x) => x.productId === productId);
    if (p) {
      setSelectedProduct(p);
      setActiveTab("product-detail");
    }
  };

  const handleOpenAddWithBarcode = (barcode: string) => {
    setInitialBarcodeForAdd(barcode);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab === "product-detail" ? "inventory" : activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedProduct(null);
        }}
      />

      {/* Main Content View Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Header (No flex shrinking so it retains its full height) */}
        <div className="shrink-0">
          <Header
            onOpenScanner={() => setActiveTab("scanner")}
            onOpenSaleModal={() => setIsSaleModalOpen(true)}
            onOpenNotifications={() => setActiveTab("notifications")}
            searchTerm={searchTerm}
            setSearchTerm={(term) => {
              setSearchTerm(term);
              if (term && activeTab !== "inventory") setActiveTab("inventory");
            }}
          />
        </div>

        {/* Scrollable Page Body Container */}
        <main className="flex-1 overflow-y-auto pb-16">
          {activeTab === "dashboard" && (
            <DashboardPage
              onSelectProduct={handleSelectProductById}
              onOpenScanner={() => setActiveTab("scanner")}
              onOpenSaleModal={() => setIsSaleModalOpen(true)}
              onNavigateTab={(t) => setActiveTab(t as NavTab)}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryPage
              onSelectProduct={handleSelectProduct}
              onOpenAddModal={() => {
                setInitialBarcodeForAdd("");
                setIsAddModalOpen(true);
              }}
              onOpenSaleModal={() => setIsSaleModalOpen(true)}
              searchTerm={searchTerm}
            />
          )}

          {activeTab === "product-detail" && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              onBack={() => setActiveTab("inventory")}
              onOpenSaleModal={() => setIsSaleModalOpen(true)}
            />
          )}

          {activeTab === "scanner" && (
            <QRScannerPage
              onOpenAddProductModalWithBarcode={handleOpenAddWithBarcode}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {activeTab === "forecast" && <AIForecastPage />}

          {activeTab === "notifications" && <NotificationsPage />}

          {activeTab === "analytics" && <AnalyticsPage />}

          {activeTab === "orders" && <OrdersPage />}

          {activeTab === "reports" && <ReportsPage />}

          {activeTab === "settings" && <SettingsPage />}
        </main>

        {/* Floating Kirana AI Assistant Drawer */}
        <AIChatDrawer />

        {/* Modals */}
        {isAddModalOpen && (
          <AddProductModal
            initialBarcode={initialBarcodeForAdd}
            onClose={() => setIsAddModalOpen(false)}
          />
        )}

        {isSaleModalOpen && (
          <RecordSaleModal onClose={() => setIsSaleModalOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <MainApp />
      </InventoryProvider>
    </AuthProvider>
  );
}