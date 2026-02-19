import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem, MenuCategory } from '@/lib/types';

// ── Colunas usadas no banco ──────────────────────────────────────────────────
// menu_items: tenant_id, category_id, name, description, price (numeric/reais),
//             original_price, image_url, is_available, is_active,
//             is_promotion, sort_order, created_at
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  /** valor em reais digitado pelo usuário */
  price: string;
  /** valor em reais digitado pelo usuário */
  original_price: string;
  category_id: string;
  is_available: boolean;
  is_active: boolean;
  is_promotion: boolean;
  image_url: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  category_id: '',
  is_available: true,
  is_active: true,
  is_promotion: false,
  image_url: '',
};

/** Converte string "29,90" ou "29.90" para número */
function parseBRL(val: string): number {
  return parseFloat(val.replace(',', '.'));
}

export default function MenuItems() {
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);

    const [itemsRes, catsRes] = await Promise.all([
      supabase
        .from('menu_items')
        .select('id, tenant_id, category_id, name, description, price, original_price, image_url, is_available, is_active, is_promotion, sort_order, created_at')
        .eq('tenant_id', tenant.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('menu_categories')
        .select('id, tenant_id, name, description, image_url, is_active, sort_order, created_at')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('sort_order'),
    ]);

    if (itemsRes.error) {
      toast({ title: 'Erro ao carregar itens', description: itemsRes.error.message, variant: 'destructive' });
    } else {
      setItems((itemsRes.data || []) as MenuItem[]);
    }
    setCategories((catsRes.data || []) as MenuCategory[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenant?.id]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toFixed(2).replace('.', ','),
      original_price: item.original_price != null ? item.original_price.toFixed(2).replace('.', ',') : '',
      category_id: item.category_id,
      is_available: item.is_available,
      is_active: item.is_active,
      is_promotion: item.is_promotion,
      image_url: item.image_url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenant?.id) return;

    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!form.category_id) {
      toast({ title: 'Selecione uma categoria', variant: 'destructive' });
      return;
    }

    const priceNum = parseBRL(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Preço inválido', variant: 'destructive' });
      return;
    }

    const originalPriceNum = form.original_price ? parseBRL(form.original_price) : null;
    if (form.original_price && (originalPriceNum === null || isNaN(originalPriceNum!))) {
      toast({ title: 'Preço original inválido', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Payload alinhado ao schema exato do banco
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: priceNum,                                          // numeric (reais)
      original_price: originalPriceNum ?? null,                // numeric (reais) ou null
      category_id: form.category_id,
      is_available: form.is_available,
      is_active: form.is_active,
      is_promotion: form.is_promotion,
      image_url: form.image_url.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editingId)
        .eq('tenant_id', tenant.id);

      if (error) {
        toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Item atualizado!' });
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
      const { error } = await supabase
        .from('menu_items')
        .insert({ ...payload, tenant_id: tenant.id, sort_order: nextOrder });

      if (error) {
        toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Item criado!' });
        setDialogOpen(false);
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!tenant?.id) return;
    setDeleting(id);
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item excluído' });
      setItems(prev => prev.filter(i => i.id !== id));
    }
    setDeleting(null);
  };

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Itens do Cardápio</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? 'Carregando...' : `${items.length} itens cadastrados`}
          </p>
        </div>
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground border-0 gap-1.5">
          <Plus size={16} /> Novo Item
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar itens..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search ? 'Nenhum item encontrado.' : 'Nenhum item cadastrado.'}</p>
          {!search && <p className="text-xs mt-1">Crie seu primeiro item de cardápio.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 shadow-card ${!item.is_available || !item.is_active ? 'opacity-50' : ''}`}
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🍽️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                  {item.is_promotion && (
                    <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                      PROMO
                    </span>
                  )}
                  {!item.is_available && (
                    <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      INDISPONÍVEL
                    </span>
                  )}
                  {!item.is_active && (
                    <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      INATIVO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{categoryName(item.category_id)}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-primary text-sm block">
                  R$ {Number(item.price).toFixed(2)}
                </span>
                {item.original_price != null && (
                  <span className="text-[11px] text-muted-foreground line-through">
                    R$ {Number(item.original_price).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Item' : 'Novo Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">

            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Smash Burger Clássico"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ingredientes e detalhes..."
                className="mt-1.5 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="29,90"
                  className="mt-1.5"
                  inputMode="decimal"
                />
              </div>
              <div>
                <Label>Preço original (promoção)</Label>
                <Input
                  value={form.original_price}
                  onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                  placeholder="39,90"
                  className="mt-1.5"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>URL da imagem (opcional)</Label>
              <Input
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label>Disponível</Label>
                <p className="text-xs text-muted-foreground">Item aparece no cardápio público</p>
              </div>
              <Switch
                checked={form.is_available}
                onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label>Ativo</Label>
                <p className="text-xs text-muted-foreground">Item está ativo no sistema</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label>É uma promoção</Label>
                <p className="text-xs text-muted-foreground">Aparece na seção de promoções</p>
              </div>
              <Switch
                checked={form.is_promotion}
                onCheckedChange={v => setForm(f => ({ ...f, is_promotion: v }))}
              />
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground border-0"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
