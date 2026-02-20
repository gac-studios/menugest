import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import ProModule from './ProModule';

interface Transaction {
  id: string;
  tenant_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

interface SaleExport {
  created_at: string;
  description: string | null;
  payment_method: string;
  total: number;
}

const months = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
};

export default function FinancialPage() {
  const { tenant, isProEnabled } = useTenant();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const getDateRange = () => {
    const startDate = `${selectedYear}-${selectedMonth}-01`;
    const endMonth = parseInt(selectedMonth);
    const endYear = parseInt(selectedYear);
    const nextMonth = endMonth === 12 ? 1 : endMonth + 1;
    const nextYear = endMonth === 12 ? endYear + 1 : endYear;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    return { startDate, endDate };
  };

  const fetchTransactions = async () => {
    if (!tenant) return;
    setLoading(true);
    const { startDate, endDate } = getDateRange();

    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching transactions:', error);

    // Filter out transactions linked to soft-deleted sales
    const allIds = (data || [])
      .filter(t => t.reference_type === 'sale' && t.reference_id)
      .map(t => t.reference_id as string);

    let deletedSaleIds = new Set<string>();
    if (allIds.length > 0) {
      const { data: deletedSales } = await supabase
        .from('sales')
        .select('id')
        .in('id', allIds)
        .not('deleted_at', 'is', null);
      deletedSaleIds = new Set((deletedSales || []).map(s => s.id));
    }

    const filtered = (data || []).filter(t =>
      !(t.reference_type === 'sale' && t.reference_id && deletedSaleIds.has(t.reference_id))
    );

    setTransactions(filtered);
    setLoading(false);
  };

  useEffect(() => { if (isProEnabled) fetchTransactions(); }, [tenant, selectedMonth, selectedYear, isProEnabled]);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

  const chartData = useMemo(() => {
    const dayMap: Record<string, { day: string; income: number; expense: number }> = {};
    transactions.forEach(t => {
      const day = new Date(t.created_at).getDate().toString();
      if (!dayMap[day]) dayMap[day] = { day, income: 0, expense: 0 };
      if (t.type === 'income') dayMap[day].income += t.amount;
      else dayMap[day].expense += t.amount;
    });
    return Object.values(dayMap).sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [transactions]);

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  const handleExportCSV = async () => {
    if (!tenant) return;
    setExporting(true);
    try {
      const { startDate, endDate } = getDateRange();

      const { data: sales, error } = await supabase
        .from('sales')
        .select('created_at, description, payment_method, total')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) {
        toast({ title: 'Erro ao exportar', description: error.message, variant: 'destructive' });
        return;
      }

      if (!sales || sales.length === 0) {
        toast({ title: 'Não existem vendas no mês selecionado.' });
        return;
      }

      const header = 'Data;Descrição;Pagamento;Total';
      const rows = (sales as SaleExport[]).map(s => {
        const date = new Date(s.created_at).toLocaleDateString('pt-BR');
        const description = (s.description || '-').replace(/;/g, ',');
        const payment = paymentLabels[s.payment_method] || s.payment_method;
        const total = Number(s.total).toFixed(2).replace('.', ',');
        return `${date};${description};${payment};${total}`;
      });

      const csvContent = '\uFEFF' + [header, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-${selectedYear}-${selectedMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: 'Erro inesperado', description: err?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  if (!isProEnabled) return <ProModule />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Relatório mensal de receitas e despesas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} disabled={exporting} className="gap-2">
            <Download size={16} />
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receitas', value: totalIncome, icon: <TrendingUp size={20} />, color: 'text-accent' },
          { label: 'Despesas', value: totalExpense, icon: <TrendingDown size={20} />, color: 'text-destructive' },
          { label: 'Lucro Líquido', value: profit, icon: <DollarSign size={20} />, color: profit >= 0 ? 'text-accent' : 'text-destructive' },
          { label: 'Margem', value: null, icon: <DollarSign size={20} />, color: margin >= 0 ? 'text-accent' : 'text-destructive', display: `${margin.toFixed(1)}%` },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border/50"
          >
            <div className={`${card.color} mb-3`}>{card.icon}</div>
            <p className="text-2xl font-bold text-foreground">
              {card.display ?? `R$ ${(card.value ?? 0).toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receitas vs Despesas por dia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="income" fill="hsl(var(--accent))" name="Receita" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Despesa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma transação no período</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                      {t.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
