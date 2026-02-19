import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, UtensilsCrossed, X, ImageIcon } from 'lucide-react';
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
  /** current persisted URL (null = no image) */
  image_url: string | null;
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
  image_url: null,
};

/** Converte string "29,90" ou "29.90" para número */
function parseBRL(val: string): number {
  return parseFloat(val.replace(',', '.'));
}

const BUCKET = 'menu-items';

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

  // ── Image upload state ─────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Reset image state when dialog closes ──────────────────────────────────
  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    resetImageState();
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
      image_url: item.image_url || null,
    });
    resetImageState();
    setDialogOpen(true);
  };

  // ── File selection & preview ───────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageRemoved(false);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Uploads the selected file and returns the public URL */
  const uploadImage = async (itemId: string): Promise<string | null> => {
    if (!imageFile || !tenant?.id) return null;
    const timestamp = Date.now();
    const ext = imageFile.name.split('.').pop();
    const path = `${tenant.id}/menu_items/${itemId}/${timestamp}-${imageFile.name}`;

    setUploading(true);
    const { error } = await supabase.storage.from(BUCKET).upload(path, imageFile, { upsert: true });
    setUploading(false);

    if (error) {
      toast({ title: 'Erro ao fazer upload', description: error.message, variant: 'destructive' });
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
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

    try {
      if (editingId) {
        // ── Update path ────────────────────────────────────────────────────
        let finalImageUrl = form.image_url;

        if (imageFile) {
          const uploaded = await uploadImage(editingId);
          if (uploaded) finalImageUrl = uploaded;
          // if upload failed, toast was already shown; keep old image
        } else if (imageRemoved) {
          finalImageUrl = null;
        }

        const payload = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: priceNum,
          original_price: originalPriceNum ?? null,
          category_id: form.category_id,
          is_available: form.is_available,
          is_active: form.is_active,
          is_promotion: form.is_promotion,
          image_url: finalImageUrl,
        };

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
        // ── Insert path ────────────────────────────────────────────────────
        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;

        // Insert first to get the ID, then upload image with it
        const { data: inserted, error: insertError } = await supabase
          .from('menu_items')
          .insert({
            tenant_id: tenant.id,
            category_id: form.category_id,
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: priceNum,
            original_price: originalPriceNum ?? null,
            is_available: form.is_available,
            is_active: form.is_active,
            is_promotion: form.is_promotion,
            image_url: null,
            sort_order: nextOrder,
          })
          .select('id')
          .single();

        if (insertError || !inserted) {
          toast({ title: 'Erro ao criar item', description: insertError?.message, variant: 'destructive' });
        } else {
          let finalImageUrl: string | null = null;
          if (imageFile) {
            finalImageUrl = await uploadImage(inserted.id);
          }

          if (finalImageUrl) {
            await supabase
              .from('menu_items')
              .update({ image_url: finalImageUrl })
              .eq('id', inserted.id);
          }

          toast({ title: 'Item criado!' });
          setDialogOpen(false);
          fetchData();
        }
      }
    } finally {
      setSaving(false);
    }
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

  // The current image to display in the form (preview > existing > none)
  const currentDisplayImage = imagePreview ?? (imageRemoved ? null : form.image_url);

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
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetImageState(); }}>
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

            {/* ── Image upload ──────────────────────────────────────────── */}
            <div>
              <Label>Imagem do item</Label>
              <div className="mt-1.5 space-y-2">
                {currentDisplayImage ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                    <img
                      src={currentDisplayImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1 border border-border"
                      title="Remover imagem"
                    >
                      <X size={14} className="text-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <ImageIcon size={24} />
                    <span className="text-sm">Clique para selecionar imagem</span>
                  </button>
                )}

                {currentDisplayImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Trocar imagem
                  </Button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
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
              disabled={saving || uploading}
            >
              {(saving || uploading) ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {uploading ? 'Enviando imagem...' : saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
