import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useTenant } from "@/hooks/useTenant";
import { useAppAdmin } from "@/hooks/useAppAdmin";

// Pages
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Onboarding from "./pages/admin/Onboarding";
import MenuCategories from "./pages/admin/MenuCategories";
import MenuItems from "./pages/admin/MenuItems";
import Promotions from "./pages/admin/Promotions";
import Settings from "./pages/admin/Settings";
import UsersPage from "./pages/admin/UsersPage";
import InventoryPage from "./pages/admin/InventoryPage";
import PurchasesPage from "./pages/admin/PurchasesPage";
import SalesPage from "./pages/admin/SalesPage";
import FinancialPage from "./pages/admin/FinancialPage";
import SuperAdminClients from "./pages/admin/SuperAdminClients";
import PublicMenu from "./pages/public/PublicMenu";
import Checkout from "./pages/public/Checkout";

const queryClient = new QueryClient();

function ProtectedRoute({ children, skipTenantCheck }: { children: React.ReactNode; skipTenantCheck?: boolean }) {
  const { user, loading } = useAuth();
  const { hasTenant, loading: tenantLoading } = useTenant();

  if (loading || tenantLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!skipTenantCheck && !hasTenant) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { hasTenant, loading: tenantLoading } = useTenant();

  if (loading || tenantLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (hasTenant) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAppAdmin, loading: adminLoading } = useAppAdmin();

  if (loading || adminLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAppAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public landing */}
              <Route path="/" element={<Index />} />
              <Route path="/plans" element={<Plans />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Onboarding */}
              <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

              {/* Admin */}
              <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/menu/categories" element={<MenuCategories />} />
                <Route path="/menu/items" element={<MenuItems />} />
                <Route path="/menu/items/new" element={<MenuItems />} />
                <Route path="/menu/items/:id/edit" element={<MenuItems />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/promotions/new" element={<div className="text-foreground">Nova promoção — em breve</div>} />
                <Route path="/promotions/:id/edit" element={<div className="text-foreground">Editar promoção — em breve</div>} />
                <Route path="/settings/company" element={<Settings />} />
                <Route path="/settings/branding" element={<Settings />} />
                <Route path="/settings/whatsapp" element={<Settings />} />
                <Route path="/settings/business-hours" element={<Settings />} />
                <Route path="/settings/users" element={<UsersPage />} />

                {/* Pro modules */}
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/reports/financial" element={<FinancialPage />} />

                {/* Super Admin (protected by SuperAdminRoute rendered inside) */}
                <Route path="/superadmin/clients" element={<SuperAdminRoute><SuperAdminClients /></SuperAdminRoute>} />
              </Route>

              {/* Public menu (tenant slug) */}
              <Route path="/menu/:slug" element={<PublicMenu />} />
              <Route path="/menu" element={<PublicMenu />} />
              <Route path="/checkout" element={<Checkout />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
