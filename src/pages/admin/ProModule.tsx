import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';

const moduleInfo: Record<string, { title: string; description: string; icon: string }> = {
  '/inventory': { title: 'Gestão de Estoque', description: 'Controle seus insumos, movimentações e receba alertas de estoque baixo.', icon: '📦' },
  '/purchases': { title: 'Compras', description: 'Cadastre fornecedores e registre suas compras com atualização automática de estoque.', icon: '🛒' },
  '/sales': { title: 'Vendas', description: 'Registre vendas manuais com diferentes formas de pagamento e acompanhe o histórico.', icon: '💰' },
  '/reports/financial': { title: 'Financeiro', description: 'Relatório mensal com faturamento, custos, lucro e margem. Exporte para Excel e PDF.', icon: '📊' },
};

export default function ProModule() {
  const location = useLocation();
  const info = moduleInfo[location.pathname] || { title: 'Módulo Pro', description: 'Este módulo requer o Plano Pro.', icon: '⭐' };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{info.icon}</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{info.title}</h1>
        <p className="text-muted-foreground mb-8">{info.description}</p>
        <div className="bg-card rounded-xl p-6 border border-pro/30 shadow-card mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown size={20} className="text-pro" />
            <span className="font-semibold text-foreground">Recurso exclusivo do Plano Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">Faça upgrade para desbloquear este e outros módulos avançados de gestão.</p>
        </div>
        <Link to="/plans">
          <Button size="lg" className="gradient-pro text-pro-foreground border-0 gap-2">
            <Crown size={18} /> Desbloquear Plano Pro — R$ 99,90/mês
          </Button>
        </Link>
      </div>
    </div>
  );
}
