import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import ProModule from './ProModule';

interface InventoryItem {
  id: string;
  tenant_id: string;
  name: string;
  unit: string;
  stock_current: number;
  stock_min: number;
  cost_avg: number;
  created_at: string;
}

export default function InventoryPage() {
  const { tenant, isProEnabled } = useTenant();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialog, setMovementDialog] = useState<{ open: boolean; item: InventoryItem | null; type: 'in' | 'out' }>({ open: false, item: null, type: 'in' });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: '', unit: 'un', stock_current: '0', stock_min: '0' });
  const [movForm, setMovForm] = useState({ qty: '', unit_cost: '', note: '' });

  const fetchItems = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name');
    if (error) {
      console.error('Error fetching inventory:', error);
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (isProEnabled) fetchItems(); }, [tenant, isProEnabled]);

  if (!isProEnabled) return <ProModule />;

  const handleSaveItem = async () => {
    if (!tenant || !form.name.trim()) return;
    const payload = {
      tenant_id: tenant.id,
      name: form.name.trim(),
      unit: form.unit,
      stock_current: parseFloat(form.stock_current) || 0,
      stock_min: parseFloat(form.stock_min) || 0,
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase.from('inventory_items').update(payload).eq('id', editingItem.id));
    } else {
      ({ error } = await supabase.from('inventory_items').insert(payload));
    }

    if (error) {
      toast({ title: 'Erro ao salvar item', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingItem ? 'Item atualizado' : 'Item criado' });
      setDialogOpen(false);
      setEditingItem(null);
      setForm({ name: '', unit: 'un', stock_current: '0', stock_min: '0' });
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item excluído' });
      fetchItems();
    }
  };

  const handleMovement = async () => {
    const item = movementDialog.item;
    if (!item || !tenant) return;
    const qty = parseFloat(movForm.qty);
    if (!qty || qty <= 0) { toast({ title: 'Quantidade inválida', variant: 'destructive' }); return; }

    const unitCost = movForm.unit_cost ? parseFloat(movForm.unit_cost) : null;
    const type = movementDialog.type;

    if (type === 'out' && qty > item.stock_current) {
      toast({ title: 'Estoque insuficiente', variant: 'destructive' });
      return;
    }

    // Insert movement
    const { error: movError } = await supabase.from('inventory_movements').insert({
      tenant_id: tenant.id,
      item_id: item.id,
      type,
      qty,
      unit_cost: unitCost,
      note: movForm.note || null,
    });

    if (movError) {
      toast({ title: 'Erro ao registrar movimento', description: movError.message, variant: 'destructive' });
      return;
    }

    // Update stock
    const newStock = type === 'in' ? item.stock_current + qty : item.stock_current - qty;
    let newCostAvg = item.cost_avg;
    if (type === 'in' && unitCost && unitCost > 0) {
      const totalOld = item.cost_avg * item.stock_current;
      const totalNew = unitCost * qty;
      newCostAvg = (totalOld + totalNew) / (item.stock_current + qty);
    }

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ stock_current: newStock, cost_avg: newCostAvg })
      .eq('id', item.id);

    if (updateError) {
      toast({ title: 'Erro ao atualizar estoque', description: updateError.message, variant: 'destructive' });
    } else {
      toast({ title: `${type === 'in' ? 'Entrada' : 'Saída'} registrada` });
      setMovementDialog({ open: false, item: null, type: 'in' });
      setMovForm({ qty: '', unit_cost: '', note: '' });
      fetchItems();
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ name: item.name, unit: item.unit, stock_current: String(item.stock_current), stock_min: String(item.stock_min) });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingItem(null);
    setForm({ name: '', unit: 'un', stock_current: '0', stock_min: '0' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus insumos e materiais</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus size={16} /> Novo Item
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhum item cadastrado</p>
          <p className="text-sm mt-1">Clique em "Novo Item" para começar</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Custo Médio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.stock_current <= item.stock_min && (
                        <AlertTriangle size={16} className="text-destructive" />
                      )}
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className={`text-right font-semibold ${item.stock_current <= item.stock_min ? 'text-destructive' : 'text-foreground'}`}>
                    {item.stock_current}
                  </TableCell>
                  <TableCell className="text-right">{item.stock_min}</TableCell>
                  <TableCell className="text-right">R$ {(item.cost_avg || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-accent" onClick={() => { setMovementDialog({ open: true, item, type: 'in' }); setMovForm({ qty: '', unit_cost: '', note: '' }); }}>
                        <ArrowDownCircle size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { setMovementDialog({ open: true, item, type: 'out' }); setMovForm({ qty: '', unit_cost: '', note: '' }); }}>
                        <ArrowUpCircle size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Farinha de trigo" />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="un">Unidade</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="g">Gramas</SelectItem>
                  <SelectItem value="l">Litros</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="cx">Caixa</SelectItem>
                  <SelectItem value="pct">Pacote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estoque Atual</Label>
                <Input type="number" value={form.stock_current} onChange={e => setForm(f => ({ ...f, stock_current: e.target.value }))} />
              </div>
              <div>
                <Label>Estoque Mínimo</Label>
                <Input type="number" value={form.stock_min} onChange={e => setForm(f => ({ ...f, stock_min: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleSaveItem} className="w-full">{editingItem ? 'Salvar' : 'Criar Item'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movementDialog.open} onOpenChange={o => setMovementDialog(p => ({ ...p, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{movementDialog.type === 'in' ? 'Entrada de Estoque' : 'Saída de Estoque'} — {movementDialog.item?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={movForm.qty} onChange={e => setMovForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
            </div>
            {movementDialog.type === 'in' && (
              <div>
                <Label>Custo Unitário (R$)</Label>
                <Input type="number" step="0.01" value={movForm.unit_cost} onChange={e => setMovForm(f => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" />
              </div>
            )}
            <div>
              <Label>Observação</Label>
              <Input value={movForm.note} onChange={e => setMovForm(f => ({ ...f, note: e.target.value }))} placeholder="Opcional" />
            </div>
            <Button onClick={handleMovement} className="w-full">
              {movementDialog.type === 'in' ? 'Registrar Entrada' : 'Registrar Saída'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
