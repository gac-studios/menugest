import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  settings: 'Configurações',
  menu: 'Cardápio',
  orders_internal: 'Pedidos (interno)',
  sales: 'Vendas',
  purchases: 'Compras',
  inventory: 'Estoque',
  financial: 'Financeiro',
};

const FEATURE_KEYS = Object.keys(FEATURE_LABELS);
const PLANS = ['none', 'basic', 'pro'] as const;

const PLAN_LABELS: Record<string, string> = {
  none: 'Sem Plano',
  basic: 'Básico',
  pro: 'Pro',
};

interface PlanRow {
  plan: string;
  features: Record<string, boolean>;
}

export default function PlanFeaturesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_features')
        .select('plan, features')
        .in('plan', [...PLANS]);

      if (error) throw error;
      setRows(data ?? []);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar features', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getFeatures = (plan: string): Record<string, boolean> => {
    const row = rows.find(r => r.plan === plan);
    if (!row) return {};
    return row.features || {};
  };

  const toggleFeature = async (plan: string, feature: string, value: boolean) => {
    const current = getFeatures(plan);
    const updated = { ...current, [feature]: value };

    // Optimistic update
    setRows(prev =>
      prev.map(r => r.plan === plan ? { ...r, features: updated } : r)
    );

    setSaving(plan);
    try {
      const { error } = await supabase
        .from('plan_features')
        .update({ features: updated, updated_at: new Date().toISOString() })
        .eq('plan', plan);

      if (error) throw error;
      toast({ title: 'Salvo', description: `Feature "${FEATURE_LABELS[feature]}" atualizada para ${PLAN_LABELS[plan]}.` });
    } catch (err: any) {
      // Revert
      fetchAll();
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const planBadge = (plan: string) => {
    if (plan === 'pro') return <Badge className="bg-pro/20 text-pro border-pro/40">Pro</Badge>;
    if (plan === 'basic') return <Badge variant="secondary">Básico</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Sem plano</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos & Benefícios</h1>
          <p className="text-sm text-muted-foreground">Configure quais módulos cada plano pode acessar.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map(p => (
            <div key={p} className="bg-card rounded-xl border border-border/50 p-6">
              <Skeleton className="h-6 w-24 mb-6" />
              {FEATURE_KEYS.map(f => (
                <Skeleton key={f} className="h-8 w-full mb-3" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map(plan => {
            const feats = getFeatures(plan);
            const isSaving = saving === plan;
            return (
              <div key={plan} className="bg-card rounded-xl border border-border/50 shadow-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  {planBadge(plan)}
                  <span className="text-lg font-semibold text-foreground">{PLAN_LABELS[plan]}</span>
                  {isSaving && <Save size={14} className="text-muted-foreground animate-pulse" />}
                </div>
                <div className="space-y-4">
                  {FEATURE_KEYS.map(feature => (
                    <div key={feature} className="flex items-center justify-between">
                      <Label className="text-sm text-foreground cursor-pointer" htmlFor={`${plan}-${feature}`}>
                        {FEATURE_LABELS[feature]}
                      </Label>
                      <Switch
                        id={`${plan}-${feature}`}
                        checked={!!feats[feature]}
                        onCheckedChange={(val) => toggleFeature(plan, feature, val)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-muted/50 rounded-lg border border-border/50 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Nota:</strong> Alterações são salvas instantaneamente. Os módulos desabilitados não aparecerão no menu lateral do usuário e o acesso direto via URL será bloqueado.
        </p>
      </div>
    </div>
  );
}
