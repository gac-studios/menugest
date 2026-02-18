import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProModule from './ProModule';

interface Purchase {
  id: string;
  tenant_id: string;
  supplier: string;
  total: number;
  status: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock_current: number;
  cost_avg: number;
}

interface PurchaseLine {
  item_id: string;
  item_name: string;
  qty: number;
  unit_cost: number;
}

export default function PurchasesPage() {
  const { tenant, isProEnabled } = useTenant();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  const fetchData = async () => {
    if (!tenant) return;
    setLoading(true);
    const [purchasesRes, itemsRes] = await Promise.all([
      supabase.from('purchases').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
      supabase.from('inventory_items').select('id, name, unit, stock_current, cost_avg').eq('tenant_id', tenant.id).order('name'),
    ]);
    setPurchases(purchasesRes.data || []);
    setInventoryItems(itemsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { if (isProEnabled) fetchData(); }, [tenant, isProEnabled]);

  if (!isProEnabled) return <ProModule />;

  const addLine = () => {
    if (inventoryItems.length === 0) { toast({ title: 'Cadastre itens de estoque primeiro', variant: 'destructive' }); return; }
    setLines(l => [...l, { item_id: inventoryItems[0].id, item_name: inventoryItems[0].name, qty: 1, unit_cost: 0 }]);
  };

  const removeLine = (idx: number) => setLines(l => l.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: string, value: any) => {
    setLines(l => l.map((line, i) => {
      if (i !== idx) return line;
      if (field === 'item_id') {
        const item = inventoryItems.find(it => it.id === value);
        return { ...line, item_id: value, item_name: item?.name || '' };
      }
      return { ...line, [field]: value };
    }));
  };

  const total = lines.reduce((sum, l) => sum + l.qty * l.unit_cost, 0);

  const handleConfirm = async () => {
    if (!tenant || lines.length === 0) { toast({ title: 'Adicione ao menos um item', variant: 'destructive' }); return; }

    // 1. Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({ tenant_id: tenant.id, supplier: supplier || 'Sem fornecedor', total, status: 'confirmed' })
      .select('id')
      .single();

    if (purchaseError || !purchase) {
      toast({ title: 'Erro ao criar compra', description: purchaseError?.message, variant: 'destructive' });
      return;
    }

    // 2. Create purchase items
    const purchaseItems = lines.map(l => ({
      tenant_id: tenant.id,
      purchase_id: purchase.id,
      item_id: l.item_id,
      qty: l.qty,
      unit_cost: l.unit_cost,
      subtotal: l.qty * l.unit_cost,
    }));
    await supabase.from('purchase_items').insert(purchaseItems);

    // 3. Create inventory movements and update stock
    for (const line of lines) {
      await supabase.from('inventory_movements').insert({
        tenant_id: tenant.id,
        item_id: line.item_id,
        type: 'in',
        qty: line.qty,
        unit_cost: line.unit_cost,
        note: `Compra #${purchase.id.slice(0, 8)}`,
      });

      const item = inventoryItems.find(it => it.id === line.item_id);
      if (item) {
        const newStock = item.stock_current + line.qty;
        const totalOld = item.cost_avg * item.stock_current;
        const totalNew = line.unit_cost * line.qty;
        const newCostAvg = newStock > 0 ? (totalOld + totalNew) / newStock : line.unit_cost;
        await supabase.from('inventory_items').update({ stock_current: newStock, cost_avg: newCostAvg }).eq('id', item.id);
      }
    }

    // 4. Create financial transaction (expense)
    await supabase.from('financial_transactions').insert({
      tenant_id: tenant.id,
      type: 'expense',
      category: 'Compra',
      amount: total,
      reference_id: purchase.id,
      reference_type: 'purchase',
    });

    toast({ title: 'Compra registrada com sucesso' });
    setDialogOpen(false);
    setLines([]);
    setSupplier('');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras</h1>
          <p className="text-muted-foreground text-sm">Registre compras e atualize o estoque automaticamente</p>
        </div>
        <Button onClick={() => { setDialogOpen(true); setLines([]); setSupplier(''); }} className="gap-2">
          <Plus size={16} /> Nova Compra
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma compra registrada</p>
          <p className="text-sm mt-1">Clique em "Nova Compra" para começar</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell className="text-right font-semibold">R$ {p.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-accent/10 text-accent font-medium">
                      {p.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Purchase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Fornecedor</Label>
              <Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nome do fornecedor" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens</Label>
                <Button size="sm" variant="outline" onClick={addLine} className="gap-1">
                  <Plus size={14} /> Adicionar Item
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
                        <Select value={line.item_id} onValueChange={v => updateLine(idx, 'item_id', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map(it => (
                              <SelectItem key={it.id} value={it.id}>{it.name} ({it.unit})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Qtd</Label>
                        <Input type="number" value={line.qty} onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Custo Unit.</Label>
                        <Input type="number" step="0.01" value={line.unit_cost} onChange={e => updateLine(idx, 'unit_cost', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="w-24 text-right">
                        <Label className="text-xs">Subtotal</Label>
                        <p className="h-10 flex items-center justify-end font-semibold text-sm">R$ {(line.qty * line.unit_cost).toFixed(2)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => removeLine(idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-lg font-bold text-foreground">Total: R$ {total.toFixed(2)}</span>
              <Button onClick={handleConfirm} disabled={lines.length === 0}>Confirmar Compra</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
