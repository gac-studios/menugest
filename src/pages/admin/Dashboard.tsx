import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Package, DollarSign, Crown, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  menuItems: number;
  categories: number;
  activePromotions: number;
}

export default function Dashboard() {
  const { tenant, hasActivePlan, isProEnabled, refetch } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (!tenant?.id) return;
    fetchStats(tenant.id);
  }, [tenant?.id]);

  const fetchStats = async (tenantId: string) => {
    setLoadingStats(true);
    try {
      const now = new Date().toISOString();

      const [itemsRes, catsRes, promoRes] = await Promise.all([
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
          .eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`),
      ]);

      setStats({
        menuItems: itemsRes.count ?? 0,
        categories: catsRes.count ?? 0,
        activePromotions: promoRes.count ?? 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats({ menuItems: 0, categories: 0, activePromotions: 0 });
    } finally {
      setLoadingStats(false);
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
      value: 0,
      icon: <ShoppingCart size={20} />,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
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

      {/* No active plan banner */}
      {!hasActivePlan && (
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
      {hasActivePlan && !isProEnabled && (
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
          <Link to="/menu/items">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Package size={20} />
              <span className="text-xs">Gerenciar Itens</span>
            </Button>
          </Link>
          <Link to="/menu/categories">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <TrendingUp size={20} />
              <span className="text-xs">Categorias</span>
            </Button>
          </Link>
          <Link to="/promotions">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <DollarSign size={20} />
              <span className="text-xs">Promoções</span>
            </Button>
          </Link>
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
