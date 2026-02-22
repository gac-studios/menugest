import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Package, DollarSign, Crown, ExternalLink, AlertCircle, Lock, Flame, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface DashboardStats {
  menuItems: number;
  categories: number;
  activePromotions: number;
  monthlySales: number;
}

interface OperationalStats {
  revenue_today: number;
  orders_today: number;
  avg_ticket_today: number;
}

interface TopProduct {
  name: string;
  total_sold: number;
}

export default function Dashboard() {
  const { tenant, hasNoPlan, hasActivePlan, isProEnabled, refetch } = useTenant();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [opStats, setOpStats] = useState<OperationalStats | null>(null);
  const [topProduct, setTopProduct] = useState<TopProduct | null>(null);
  const [loadingOp, setLoadingOp] = useState(true);

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (!tenant?.id) return;
    fetchStats(tenant.id);
    fetchOperational();
  }, [tenant?.id]);

  const fetchOperational = async () => {
    setLoadingOp(true);
    try {
      const [opRes, topRes] = await Promise.all([
        supabase.from('dashboard_operational').select('*').maybeSingle(),
        supabase.from('dashboard_top_product').select('*').maybeSingle(),
      ]);
      if (opRes.data) {
        setOpStats({
          revenue_today: Number(opRes.data.revenue_today) || 0,
          orders_today: Number(opRes.data.orders_today) || 0,
          avg_ticket_today: Number(opRes.data.avg_ticket_today) || 0,
        });
      }
      if (topRes.data) {
        setTopProduct({ name: topRes.data.name, total_sold: Number(topRes.data.total_sold) || 0 });
      }
    } catch (err) {
      console.error('Error fetching operational stats:', err);
    } finally {
      setLoadingOp(false);
    }
  };

  const fetchStats = async (tenantId: string) => {
    setLoadingStats(true);
    try {
      const now = new Date().toISOString();

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [itemsRes, catsRes, promoRes, salesRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),

        supabase
          .from('menu_categories')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),

        supabase
          .from('promotions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),

        supabase
          .from('sales')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)
          .gte('created_at', startOfMonth),
      ]);

      setStats({
        menuItems: itemsRes.count ?? 0,
        categories: catsRes.count ?? 0,
        activePromotions: promoRes.count ?? 0,
        monthlySales: salesRes.count ?? 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats({ menuItems: 0, categories: 0, activePromotions: 0, monthlySales: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  /** Navigate or open plan modal depending on plan state */
  const handleQuickAction = (path: string) => {
    if (hasNoPlan) {
      setPlanModalOpen(true);
    } else {
      navigate(path);
    }
  };

  const statCards = [
    {
      label: 'Itens no cardápio',
      value: stats?.menuItems ?? 0,
      icon: <Package size={20} />,
      color: 'text-green-500',
    },
    {
      label: 'Categorias',
      value: stats?.categories ?? 0,
      icon: <TrendingUp size={20} />,
      color: 'text-yellow-500',
    },
    {
      label: 'Promoções ativas',
      value: stats?.activePromotions ?? 0,
      icon: <DollarSign size={20} />,
      color: 'text-primary',
    },
    {
      label: 'Pedidos no mês',
      value: stats?.monthlySales ?? 0,
      icon: <ShoppingCart size={20} />,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Plan modal */}
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do seu negócio</p>
        </div>
        {tenant?.slug && (
          <Link to={`/menu/${tenant.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink size={14} /> Ver cardápio público
            </Button>
          </Link>
        )}
      </div>

      {/* No plan banner (plan='none') */}
      {hasNoPlan && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 flex items-center justify-between bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-primary" />
            <div>
              <p className="font-semibold text-foreground">Assine um plano para liberar recursos</p>
              <p className="text-sm text-muted-foreground">Cardápio, promoções, estoque e muito mais</p>
            </div>
          </div>
          <Link to="/plans">
            <Button size="sm" className="gradient-primary text-primary-foreground border-0">Ver Planos</Button>
          </Link>
        </motion.div>
      )}

      {/* No active plan banner (has plan but inactive) */}
      {!hasNoPlan && !hasActivePlan && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-yellow-600" />
            <div>
              <p className="font-semibold text-foreground">Assine um plano para liberar recursos</p>
              <p className="text-sm text-muted-foreground">Escolha um plano para começar a usar o MenuGest</p>
            </div>
          </div>
          <Link to="/plans">
            <Button size="sm">Ver Planos</Button>
          </Link>
        </motion.div>
      )}

      {/* Pro upgrade banner - only show when has active basic plan */}
      {!hasNoPlan && hasActivePlan && !isProEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-pro rounded-xl p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-pro-foreground" />
            <div>
              <p className="font-semibold text-pro-foreground">Desbloqueie Gestão Completa</p>
              <p className="text-sm text-pro-foreground/80">Estoque, vendas, financeiro e mais</p>
            </div>
          </div>
          <Link to="/plans">
            <Button variant="secondary" size="sm">Plano Pro</Button>
          </Link>
        </motion.div>
      )}

      {/* Operational cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faturamento Hoje', value: opStats?.revenue_today, icon: <DollarSign size={20} />, color: 'text-primary', isCurrency: true },
          { label: 'Pedidos Hoje', value: opStats?.orders_today, icon: <ShoppingCart size={20} />, color: 'text-accent-foreground' },
          { label: 'Ticket Médio', value: opStats?.avg_ticket_today, icon: <Receipt size={20} />, color: 'text-primary', isCurrency: true },
          { label: 'Campeão do Mês', value: topProduct ? `${topProduct.name} (${topProduct.total_sold})` : null, icon: <Flame size={20} />, color: 'text-destructive' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border/50"
          >
            <div className={`${card.color} mb-3`}>{card.icon}</div>
            {loadingOp ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground truncate">
                {card.value == null
                  ? 'Sem vendas hoje'
                  : card.isCurrency
                    ? Number(card.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : card.value}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border/50"
          >
            <div className={`${s.color} mb-3`}>{s.icon}</div>
            {loadingStats ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
        <h2 className="text-lg font-semibold text-foreground mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 relative"
            onClick={() => handleQuickAction('/menu/items')}
          >
            <Package size={20} />
            <span className="text-xs">Gerenciar Itens</span>
            {hasNoPlan && <Lock size={12} className="absolute top-2 right-2 text-muted-foreground" />}
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 relative"
            onClick={() => handleQuickAction('/menu/categories')}
          >
            <TrendingUp size={20} />
            <span className="text-xs">Categorias</span>
            {hasNoPlan && <Lock size={12} className="absolute top-2 right-2 text-muted-foreground" />}
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 relative"
            onClick={() => handleQuickAction('/promotions')}
          >
            <DollarSign size={20} />
            <span className="text-xs">Promoções</span>
            {hasNoPlan && <Lock size={12} className="absolute top-2 right-2 text-muted-foreground" />}
          </Button>
          <Link to="/settings/company">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <ExternalLink size={20} />
              <span className="text-xs">Configurações</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
