import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import type { MenuCategory } from '@/lib/types';

interface FormState {
  name: string;
  description: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = { name: '', description: '', is_active: true };

export default function MenuCategories() {
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchCategories = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('sort_order', { ascending: true });

    if (error) {
      toast({ title: 'Erro ao carregar categorias', description: error.message, variant: 'destructive' });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [tenant?.id]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cat: MenuCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || '', is_active: cat.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenant?.id || !form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name: form.name.trim(), description: form.description.trim() || null, is_active: form.is_active })
        .eq('id', editingId)
        .eq('tenant_id', tenant.id);

      if (error) {
        toast({ title: 'Erro ao atualizar categoria', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Categoria atualizada!' });
        setDialogOpen(false);
        fetchCategories();
      }
    } else {
      const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1;
      const { error } = await supabase
        .from('menu_categories')
        .insert({
          tenant_id: tenant.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          is_active: form.is_active,
          sort_order: nextOrder,
        });

      if (error) {
        toast({ title: 'Erro ao criar categoria', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Categoria criada!' });
        setDialogOpen(false);
        fetchCategories();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!tenant?.id) return;
    setDeleting(id);
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) {
      toast({ title: 'Erro ao excluir categoria', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoria excluída' });
      setCategories(prev => prev.filter(c => c.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground text-sm">
            {loading ? 'Carregando...' : `${categories.length} categorias cadastradas`}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gradient-primary text-primary-foreground border-0 gap-1.5">
              <Plus size={16} /> Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Hambúrgueres"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descrição"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativa</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhuma categoria cadastrada.</p>
          <p className="text-xs mt-1">Crie sua primeira categoria para organizar o cardápio.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 shadow-card ${!cat.is_active ? 'opacity-50' : ''}`}
            >
              <GripVertical size={16} className="text-muted-foreground cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
                {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                {!cat.is_active && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Inativa</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(cat.id)}
                  disabled={deleting === cat.id}
                >
                  {deleting === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
