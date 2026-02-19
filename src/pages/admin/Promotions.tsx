import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import type { Promotion } from '@/lib/types';

interface PromoForm {
  title: string;
  description: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyForm: PromoForm = {
  title: '',
  description: '',
  is_active: true,
  starts_at: '',
  ends_at: '',
};

function isPromoCurrentlyActive(p: Promotion): boolean {
  if (!p.is_active) return false;
  const now = new Date();
  if (p.starts_at && new Date(p.starts_at) > now) return false;
  if (p.ends_at && new Date(p.ends_at) < now) return false;
  return true;
}

export default function Promotions() {
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPromos = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar promoções', description: error.message, variant: 'destructive' });
    } else {
      setPromos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); }, [tenant?.id]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description ?? '',
      is_active: p.is_active,
      starts_at: p.starts_at ? p.starts_at.slice(0, 16) : '',
      ends_at: p.ends_at ? p.ends_at.slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!tenant?.id) return;
    if (!form.title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      tenant_id: tenant.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('promotions').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('promotions').insert(payload));
    }

    if (error) {
      toast({ title: 'Erro ao salvar promoção', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editing ? 'Promoção atualizada!' : 'Promoção criada!' });
      setModalOpen(false);
      await fetchPromos();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Promoção excluída' });
      setPromos(prev => prev.filter(p => p.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promoções</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas promoções e ofertas</p>
        </div>
        <Button className="gradient-primary text-primary-foreground border-0 gap-1.5" onClick={openCreate}>
          <Plus size={16} /> Nova Promoção
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhuma promoção cadastrada</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={openCreate}>
            <Plus size={14} /> Criar primeira promoção
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(p => {
            const active = isPromoCurrentlyActive(p);
            return (
              <div key={p.id} className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border/50 shadow-card">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Tag size={18} className="text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground truncate">{p.description}</p>}
                  {(p.starts_at || p.ends_at) && (
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} />
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString('pt-BR') : '—'}
                      {' → '}
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString('pt-BR') : 'sem fim'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Promoção' : 'Nova Promoção'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Combo do Dia"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes da promoção..."
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm(prev => ({ ...prev, starts_at: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm(prev => ({ ...prev, ends_at: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(prev => ({ ...prev, is_active: v }))}
              />
              <Label className="cursor-pointer">Promoção ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button className="gradient-primary text-primary-foreground border-0" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
