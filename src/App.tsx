import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import { LoginPage } from "./pages/LoginPage";
import { StoreSetupPage } from "./pages/StoreSetupPage";
import { Sidebar, type NavTab } from "./components/Sidebar";

// Core page views
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { CustomerLedgerTab } from "./pages/CustomerLedgerTab";
import { QRScannerPage } from "./pages/QRScannerPage";
import { AIForecastPage } from "./pages/AIForecastPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AIChatDrawer } from "./components/AIChatDrawer";
import { DevSeedModal } from "./components/DevSeedModal";
import { Sparkles, LogOut, Clock, Database } from "lucide-react";
import { useInactivityTimeout } from "./hooks/useInactivityTimeout";

const pathToTabMap: Record<string, NavTab> = {
  dashboard: "dashboard" as NavTab,
  inventory: "inventory" as NavTab,
  "customer-ledger": "customer-ledger" as NavTab,
  ledger: "customer-ledger" as NavTab,
  scanner: "scanner" as NavTab,
  forecast: "forecast" as NavTab,
  notifications: "notifications" as NavTab,
  alerts: "notifications" as NavTab,
  analytics: "analytics" as NavTab,
  orders: "orders" as NavTab,
  reports: "reports" as NavTab,
  settings: "settings" as NavTab,
};

const AuthenticatedApp: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);

  // Auto-logout after 3 hours of user inactivity
  useInactivityTimeout(async () => {
    setSessionExpired(true);
    await logout();
  }, !!currentUser);

  const getInitialTab = (): NavTab => {
    const slug = window.location.pathname.replace(/^\/+/, "").toLowerCase();
    return pathToTabMap[slug] || ("dashboard" as NavTab);
  };

  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialTab);

  const handleTabChange = (tab: NavTab) => {
    setActiveTabState(tab);
    const targetPath = `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const slug = window.location.pathname.replace(/^\/+/, "").toLowerCase();
      if (pathToTabMap[slug]) {
        setActiveTabState(pathToTabMap[slug]);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardPage
            onNavigateTab={(tab) => handleTabChange(tab as NavTab)}
            onOpenScanner={() => handleTabChange("scanner" as NavTab)}
            onOpenSaleModal={() => handleTabChange("customer-ledger" as NavTab)}
          />
        );
      case "inventory":
        return <InventoryPage />;
      case "customer-ledger":
        return <CustomerLedgerTab />;
      case "scanner":
        return <QRScannerPage />;
      case "forecast":
        return <AIForecastPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "orders":
        return <OrdersPage />;
      case "notifications":
        return <NotificationsPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigateTab={(tab) => handleTabChange(tab as NavTab)}
            onOpenScanner={() => handleTabChange("scanner" as NavTab)}
            onOpenSaleModal={() => handleTabChange("customer-ledger" as NavTab)}
          />
        );
    }
  };

  return (
    <InventoryProvider>
      <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentUser={currentUser}
          onLogout={() => setShowLogoutConfirm(true)}
        />

        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-900 capitalize">
                {String(activeTab).replace(/-/g, " ")}
              </h2>
              <p className="text-[11px] text-slate-500">
                {currentUser?.billHeaderName || currentUser?.storeName || "Dukaan Store Management"}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Test Data Injector Button */}
              <button
                onClick={() => setShowSeedModal(true)}
                className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Inject test scenarios into Firestore"
              >
                <Database className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Inject Test Data</span>
              </button>

              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {currentUser?.name || "Store Owner"} ({currentUser?.role || "OWNER"})
              </span>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {renderActiveView()}
          </main>
        </div>

        <AIChatDrawer />

        {/* Mock Data Injector Modal */}
        <DevSeedModal
          isOpen={showSeedModal}
          onClose={() => setShowSeedModal(false)}
        />

        {/* Inactivity Expiry Alert */}
        {sessionExpired && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
            <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Session Expired</h3>
                <p className="text-slate-500 text-xs mt-1">
                  You were automatically logged out after 3 hours of inactivity for store security.
                </p>
              </div>
              <button
                onClick={() => setSessionExpired(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Sign Back In
              </button>
            </div>
          </div>
        )}

        {/* Manual Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 text-xs">
            <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">Are you sure you want to log out?</h3>
                <p className="text-slate-500 text-xs mt-1">
                  You will need to sign back in to access the store register and inventory.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowLogoutConfirm(false);
                    await logout();
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InventoryProvider>
  );
};

const AppAuthRouter: React.FC = () => {
  const { currentUser, firebaseUser, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 font-medium">Verifying Dukaan Store Engine Session...</p>
      </div>
    );
  }

  // Not signed in to Firebase -> Show LoginPage
  if (!firebaseUser && !currentUser) {
    return <LoginPage />;
  }

  // Signed in, but no profile document found or setup incomplete -> Route to /setup
  if (needsOnboarding) {
    if (window.location.pathname !== "/setup") {
      window.history.replaceState(null, "", "/setup");
    }
    return <StoreSetupPage />;
  }

  // Fully authenticated with completed store profile -> Main App
  return <AuthenticatedApp />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppAuthRouter />
    </AuthProvider>
  );
};

export default App;