import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Package, DollarSign, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Pedidos no mês', value: '0', icon: <ShoppingCart size={20} />, color: 'text-primary' },
  { label: 'Itens no cardápio', value: '0', icon: <Package size={20} />, color: 'text-success' },
  { label: 'Categorias', value: '0', icon: <TrendingUp size={20} />, color: 'text-warning' },
  { label: 'Promoções ativas', value: '0', icon: <DollarSign size={20} />, color: 'text-pro' },
];

export default function Dashboard() {
  // TODO: fetch real data from Supabase
  const tenantPlan = 'basic';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do seu negócio</p>
        </div>
        <Link to="/plans">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink size={14} /> Ver cardápio público
          </Button>
        </Link>
      </div>

      {/* Plan banner */}
      {tenantPlan === 'basic' && (
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
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border/50"
          >
            <div className={`${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
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
