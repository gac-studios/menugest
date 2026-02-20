import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { useAppAdmin } from '@/hooks/useAppAdmin';
import {
  LayoutDashboard, UtensilsCrossed, Tag, Settings, Package, ShoppingCart,
  DollarSign, BarChart3, Users, Menu, X, LogOut, Crown, ChevronDown,
  ShieldCheck, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  pro?: boolean;
  /** blocked for plan='none' users (everything except dashboard & settings) */
  requiresPlan?: boolean;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  {
    label: 'Cardápio', path: '/menu/categories', icon: <UtensilsCrossed size={20} />,
    requiresPlan: true,
    children: [
      { label: 'Categorias', path: '/menu/categories' },
      { label: 'Itens', path: '/menu/items' },
    ],
  },
  { label: 'Promoções', path: '/promotions', icon: <Tag size={20} />, requiresPlan: true },
  { label: 'Estoque', path: '/inventory', icon: <Package size={20} />, pro: true, requiresPlan: true },
  { label: 'Compras', path: '/purchases', icon: <ShoppingCart size={20} />, pro: true, requiresPlan: true },
  { label: 'Vendas', path: '/sales', icon: <DollarSign size={20} />, pro: true, requiresPlan: true },
  { label: 'Financeiro', path: '/reports/financial', icon: <BarChart3 size={20} />, pro: true, requiresPlan: true },
  { label: 'Usuários', path: '/settings/users', icon: <Users size={20} />, requiresPlan: true },
  { label: 'Configurações', path: '/settings/company', icon: <Settings size={20} /> },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isProEnabled, hasNoPlan } = useTenant();
  const { isAppAdmin } = useAppAdmin();

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleNavClick = (item: NavItem) => {
    // Blocked for no-plan users
    if (hasNoPlan && item.requiresPlan) {
      setPlanModalOpen(true);
      return;
    }
    // Pro lock
    if (item.pro && !isProEnabled) {
      navigate('/plans');
      return;
    }
    if (item.children) {
      toggleExpanded(item.label);
    } else {
      navigate(item.path);
      setSidebarOpen(false);
    }
  };

  const isItemLocked = (item: NavItem) => {
    if (hasNoPlan && item.requiresPlan) return 'none';
    if (item.pro && !isProEnabled) return 'pro';
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* No-plan modal */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} className="text-primary" /> Recurso bloqueado
            </DialogTitle>
            <DialogDescription>
              Assine um plano para liberar este recurso e começar a usar o MenuGest completo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPlanModalOpen(false)}>
              Fechar
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground border-0"
              onClick={() => { setPlanModalOpen(false); navigate('/plans'); }}
            >
              Ver Planos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <UtensilsCrossed size={18} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-accent-foreground">MenuGest</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const lockType = isItemLocked(item);
              const locked = !!lockType;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    } ${locked ? 'opacity-50' : ''}`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {lockType === 'none' && <Lock size={14} className="text-muted-foreground" />}
                    {lockType === 'pro' && <Crown size={14} className="text-pro" />}
                    {!locked && item.children && (
                      <ChevronDown size={14} className={`transition-transform ${expandedItems.includes(item.label) ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  {!locked && item.children && expandedItems.includes(item.label) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            location.pathname === child.path
                              ? 'text-sidebar-primary-foreground bg-sidebar-primary/80'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Super Admin section */}
            {isAppAdmin && (
              <div className="pt-3 mt-3 border-t border-sidebar-border/50">
                <div>
                  <button
                    onClick={() => toggleExpanded('superadmin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/superadmin')
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <ShieldCheck size={20} />
                    <span className="flex-1 text-left">Super Admin</span>
                    <ChevronDown size={14} className={`transition-transform ${expandedItems.includes('superadmin') ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedItems.includes('superadmin') && (
                    <div className="ml-8 mt-1 space-y-1">
                      <Link
                        to="/superadmin/clients"
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          location.pathname === '/superadmin/clients'
                            ? 'text-sidebar-primary-foreground bg-sidebar-primary/80'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        }`}
                      >
                        Clientes
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </nav>

          {/* Sidebar bottom banner */}
          {hasNoPlan ? (
            <div className="mx-3 mb-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-semibold text-sidebar-accent-foreground">Sem plano ativo</p>
              <p className="text-xs text-sidebar-foreground/70 mt-1">Assine para liberar todos os recursos</p>
              <Button
                size="sm"
                className="mt-3 w-full text-xs gradient-primary text-primary-foreground border-0"
                onClick={() => navigate('/plans')}
              >
                Ver Planos
              </Button>
            </div>
          ) : !isProEnabled ? (
            <div className="mx-3 mb-3 p-4 rounded-lg gradient-pro">
              <p className="text-sm font-semibold text-pro-foreground">Plano Pro</p>
              <p className="text-xs text-pro-foreground/80 mt-1">Desbloqueie gestão completa</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full text-xs"
                onClick={() => navigate('/plans')}
              >
                <Crown size={14} className="mr-1" /> Upgrade
              </Button>
            </div>
          ) : null}

          {/* User */}
          <div className="border-t border-sidebar-border px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sidebar-foreground truncate">{user?.email}</span>
              <button onClick={signOut} className="text-sidebar-foreground hover:text-destructive transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 bg-card">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 text-foreground">
            <Menu size={24} />
          </button>
          <div className="flex-1" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
