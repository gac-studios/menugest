import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProModule from './ProModule';

interface Sale {
  id: string;
  tenant_id: string;
  total: number;
  payment_method: string;
  description?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

interface SaleLine {
  menu_item_id: string;
  item_name: string;
  qty: number;
  unit_price: number;
}

const paymentLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
};

export default function SalesPage() {
  const { tenant, isProEnabled } = useTenant();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Auto-generated description from selected items
  const autoDescription = lines.length > 0
    ? lines.map(l => `${l.item_name} x${l.qty}`).join(', ')
    : '';

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);
    const [salesRes, itemsRes] = await Promise.all([
      supabase
        .from('sales')
        .select('*')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('menu_items')
        .select('id, name, price')
        .eq('tenant_id', tenant.id)
        .eq('is_available', true)
        .eq('is_active', true)
        .order('name'),
    ]);

    if (salesRes.error) console.error('Error fetching sales:', salesRes.error);
    if (itemsRes.error) console.error('Error fetching menu items:', itemsRes.error);

    setSales(salesRes.data || []);
    setMenuItems(itemsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isProEnabled) fetchData();
  }, [tenant, isProEnabled]);

  if (!isProEnabled) return <ProModule />;

  const openDialog = () => {
    setLines([]);
    setPaymentMethod('dinheiro');
    setDialogOpen(true);
  };

  const addLine = () => {
    if (menuItems.length === 0) {
      toast({ title: 'Cadastre itens no cardápio primeiro', variant: 'destructive' });
      return;
    }
    const first = menuItems[0];
    setLines(l => [...l, { menu_item_id: first.id, item_name: first.name, qty: 1, unit_price: Number(first.price) }]);
  };

  const removeLine = (idx: number) => setLines(l => l.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: string, value: any) => {
    setLines(l => l.map((line, i) => {
      if (i !== idx) return line;
      if (field === 'menu_item_id') {
        const item = menuItems.find(it => it.id === value);
        return { ...line, menu_item_id: value, item_name: item?.name || '', unit_price: Number(item?.price) || 0 };
      }
      return { ...line, [field]: value };
    }));
  };

  const total = lines.reduce((sum, l) => sum + l.qty * l.unit_price, 0);

  const handleConfirm = async () => {
    if (!tenant) return;
    if (lines.length === 0) {
      toast({ title: 'Adicione ao menos um item', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: tenant.id,
          total: parseFloat(total.toFixed(2)),
          payment_method: paymentMethod,
          description: autoDescription,
        })
        .select('id')
        .single();

      if (saleError || !sale) {
        toast({ title: 'Erro ao criar venda', description: saleError?.message, variant: 'destructive' });
        return;
      }

      const saleItems = lines.map(l => ({
        tenant_id: tenant.id,
        sale_id: sale.id,
        menu_item_id: l.menu_item_id,
        qty: l.qty,
        unit_price: l.unit_price,
        subtotal: parseFloat((l.qty * l.unit_price).toFixed(2)),
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) console.error('Error inserting sale items:', itemsError);

      const { error: finError } = await supabase.from('financial_transactions').insert({
        tenant_id: tenant.id,
        type: 'income',
        category: 'Venda',
        amount: parseFloat(total.toFixed(2)),
        reference_id: sale.id,
        reference_type: 'sale',
      });
      if (finError) console.error('Error inserting financial transaction:', finError);

      toast({ title: 'Venda registrada com sucesso!' });
      setDialogOpen(false);
      setLines([]);
      setPaymentMethod('dinheiro');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erro inesperado', description: err?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('sales')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id ?? null,
        })
        .eq('id', deleteTarget.id);

      if (error) {
        toast({ title: 'Erro ao excluir venda', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Venda excluída com sucesso!' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erro inesperado', description: err?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground text-sm">Registre vendas manuais e acompanhe o histórico</p>
        </div>
        <Button onClick={openDialog} className="gap-2">
          <Plus size={16} /> Nova Venda
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma venda registrada</p>
          <p className="text-sm mt-1">Clique em "Nova Venda" para começar</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap">{new Date(s.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">{s.description || '-'}</TableCell>
                  <TableCell>{paymentLabels[s.payment_method] || s.payment_method}</TableCell>
                  <TableCell className="text-right font-semibold">R$ {Number(s.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens do Cardápio</Label>
                <Button size="sm" variant="outline" onClick={addLine} className="gap-1">
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs">Item</Label>
                        <Select value={line.menu_item_id} onValueChange={v => updateLine(idx, 'menu_item_id', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {menuItems.map(it => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.name} — R$ {Number(it.price).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <Label className="text-xs">Subtotal</Label>
                        <p className="h-10 flex items-center justify-end font-semibold text-sm">
                          R$ {(line.qty * line.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => removeLine(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground px-1">
                    <span className="font-medium">Descrição gerada:</span> {autoDescription}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-lg font-bold text-foreground">Total: R$ {total.toFixed(2)}</span>
              <Button onClick={handleConfirm} disabled={lines.length === 0 || saving}>
                {saving ? 'Salvando...' : 'Confirmar Venda'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
