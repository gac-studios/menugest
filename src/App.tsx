import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useTenant } from "@/hooks/useTenant";
import { useAppAdmin } from "@/hooks/useAppAdmin";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Pages
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import PendingSubscription from "./pages/PendingSubscription";
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
import OrdersPage from "./pages/admin/OrdersPage";
import SuperAdminClients from "./pages/admin/SuperAdminClients";
import PlanFeaturesPage from "./pages/admin/PlanFeaturesPage";
import PublicMenu from "./pages/public/PublicMenu";
import Checkout from "./pages/public/Checkout";
import PublicLayout from "./components/public/PublicLayout";

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function TenantErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <p className="text-destructive font-medium">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function ProtectedRoute({ children, skipTenantCheck }: { children: React.ReactNode; skipTenantCheck?: boolean }) {
  const { user, loading } = useAuth();
  const { hasTenant, loading: tenantLoading, fetchError, refetch } = useTenant();

  if (loading || tenantLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (fetchError) return <TenantErrorScreen message={fetchError} onRetry={refetch} />;
  if (!skipTenantCheck && !hasTenant) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** Blocks access to routes that require at least a basic/pro plan */
function PlanRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { hasNoPlan, loading: tenantLoading, fetchError, refetch } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !tenantLoading && !fetchError && user && hasNoPlan) {
      toast({
        title: 'Recurso bloqueado',
        description: 'Recurso disponível apenas com plano ativo.',
        variant: 'destructive',
      });
    }
  }, [loading, tenantLoading, fetchError, user, hasNoPlan]);

  if (loading || tenantLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (fetchError) return <TenantErrorScreen message={fetchError} onRetry={refetch} />;
  if (hasNoPlan) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { hasTenant, loading: tenantLoading, fetchError, refetch } = useTenant();

  if (loading || tenantLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  // If there was a real query error, show it — never assume "no tenant" on error
  if (fetchError) return <TenantErrorScreen message={fetchError} onRetry={refetch} />;
  // Only redirect to dashboard if we CONFIRMED the user has a tenant
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

// Redirects legacy /checkout to /menu/:slug/checkout using localStorage fallback
function CheckoutRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const slug = localStorage.getItem('last_menu_slug');
    if (slug) {
      navigate(`/menu/${slug}/checkout`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  return null;
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
              <Route path="/pending" element={<PendingSubscription />} />

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

                {/* Plan-gated routes (require at least basic/pro plan) */}
                <Route path="/menu/categories" element={<PlanRoute><MenuCategories /></PlanRoute>} />
                <Route path="/menu/items" element={<PlanRoute><MenuItems /></PlanRoute>} />
                <Route path="/menu/items/new" element={<PlanRoute><MenuItems /></PlanRoute>} />
                <Route path="/menu/items/:id/edit" element={<PlanRoute><MenuItems /></PlanRoute>} />
                <Route path="/promotions" element={<PlanRoute><Promotions /></PlanRoute>} />
                <Route path="/orders" element={<PlanRoute><OrdersPage /></PlanRoute>} />
                <Route path="/promotions/new" element={<PlanRoute><div className="text-foreground">Nova promoção — em breve</div></PlanRoute>} />
                <Route path="/promotions/:id/edit" element={<PlanRoute><div className="text-foreground">Editar promoção — em breve</div></PlanRoute>} />
                <Route path="/settings/users" element={<PlanRoute><UsersPage /></PlanRoute>} />

                {/* Settings (always accessible) */}
                <Route path="/settings/company" element={<Settings />} />
                <Route path="/settings/branding" element={<Settings />} />
                <Route path="/settings/whatsapp" element={<Settings />} />
                <Route path="/settings/business-hours" element={<Settings />} />

                {/* Pro modules */}
                <Route path="/inventory" element={<PlanRoute><InventoryPage /></PlanRoute>} />
                <Route path="/purchases" element={<PlanRoute><PurchasesPage /></PlanRoute>} />
                <Route path="/sales" element={<PlanRoute><SalesPage /></PlanRoute>} />
                <Route path="/reports/financial" element={<PlanRoute><FinancialPage /></PlanRoute>} />

                {/* Super Admin (protected by SuperAdminRoute rendered inside) */}
                <Route path="/superadmin/clients" element={<SuperAdminRoute><SuperAdminClients /></SuperAdminRoute>} />
                <Route path="/superadmin/plan-features" element={<SuperAdminRoute><PlanFeaturesPage /></SuperAdminRoute>} />
              </Route>

              {/* Public menu (tenant slug) — wrapped in PublicLayout for shared theme */}
              <Route path="/menu/:slug" element={<PublicLayout />}>
                <Route index element={<PublicMenu />} />
                <Route path="checkout" element={<Checkout />} />
              </Route>
              <Route path="/menu" element={<PublicMenu />} />
              {/* Legacy /checkout redirect */}
              <Route path="/checkout" element={<CheckoutRedirect />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
