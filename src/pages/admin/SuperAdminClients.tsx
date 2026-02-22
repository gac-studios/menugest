import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, Search, Crown, ShieldOff, CheckCircle } from 'lucide-react';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  is_active: boolean;
  updated_at: string;
}

type ConfirmAction =
  | { type: 'basic' | 'pro' | 'block'; tenant: TenantRow }
  | null;

export default function SuperAdminClients() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, plan, subscription_status, is_active, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTenants(data ?? []);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar clientes', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const runAction = async (action: ConfirmAction) => {
    if (!action) return;
    const { tenant } = action;
    setActionLoading(tenant.id);

    let plan = tenant.plan;
    let status = tenant.subscription_status;

    if (action.type === 'basic') { plan = 'basic'; status = 'active'; }
    else if (action.type === 'pro') { plan = 'pro'; status = 'active'; }
    else if (action.type === 'block') { status = 'inactive'; }

    try {
      // Try RPC first
      const { error: rpcError } = await supabase.rpc('set_tenant_plan', {
        p_tenant_id: tenant.id,
        p_plan: plan,
        p_status: status,
      });

      if (rpcError) {
        // Fallback: direct update
        const { error: updateError } = await supabase
          .from('tenants')
          .update({ plan, subscription_status: status, is_active: status === 'active', updated_at: new Date().toISOString() })
          .eq('id', tenant.id);
        if (updateError) throw updateError;
      }

      toast({ title: 'Atualizado com sucesso!', description: `${tenant.name} → ${plan.toUpperCase()} / ${status}` });
      fetchTenants();
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const confirmLabel = (c: ConfirmAction) => {
    if (!c) return '';
    if (c.type === 'basic') return `Ativar plano Básico para "${c.tenant.name}"?`;
    if (c.type === 'pro') return `Ativar plano Pro para "${c.tenant.name}"?`;
    return `Bloquear acesso de "${c.tenant.name}"?`;
  };

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
    const matchPlan = planFilter === 'all' || t.plan === planFilter;
    const matchStatus = statusFilter === 'all' || t.subscription_status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const planBadge = (plan: string) => {
    if (plan === 'pro') return <Badge className="bg-pro/20 text-pro border-pro/40">Pro</Badge>;
    if (plan === 'none') return <Badge variant="outline" className="text-muted-foreground">Sem plano</Badge>;
    return <Badge variant="secondary">Basic</Badge>;
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-primary/20 text-primary border-primary/40">Ativo</Badge>;
    return <Badge variant="destructive">Inativo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Super Admin — Clientes</h1>
          <p className="text-sm text-muted-foreground">{tenants.length} estabelecimento(s) cadastrado(s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTenants} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            <SelectItem value="none">Sem plano</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Atualizado em</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const busy = actionLoading === t.id;
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                    <td className="px-4 py-3">{planBadge(t.plan)}</td>
                    <td className="px-4 py-3">{statusBadge(t.subscription_status)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {t.updated_at ? new Date(t.updated_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => setConfirm({ type: 'basic', tenant: t })}
                          className="h-7 text-xs"
                        >
                          <CheckCircle size={12} className="mr-1" /> Basic
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
          onClick={() => setConfirm({ type: 'pro', tenant: t })}
                          className="h-7 text-xs gradient-pro text-pro-foreground border-0"
                        >
                          <Crown size={12} className="mr-1" /> Pro
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => setConfirm({ type: 'block', tenant: t })}
                          className="h-7 text-xs"
                        >
                          <ShieldOff size={12} className="mr-1" /> Bloquear
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>{confirmLabel(confirm)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => runAction(confirm)}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
