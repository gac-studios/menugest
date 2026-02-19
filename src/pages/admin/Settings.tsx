import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';

/** Converts a string to a URL-friendly slug (removes accents, lowercases, replaces spaces with hyphens) */
function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface CompanyForm {
  name: string;
  slug: string;
  description: string;
  address: string;
}

interface WhatsAppForm {
  phone_whatsapp: string;
}

export default function Settings() {
  const { tenant, refetch } = useTenant();
  const { toast } = useToast();

  // ── Company tab ────────────────────────────────────────────────────────────
  const [company, setCompany] = useState<CompanyForm>({
    name: '',
    slug: '',
    description: '',
    address: '',
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const slugManuallyEdited = useRef(false);

  // ── WhatsApp tab ───────────────────────────────────────────────────────────
  const [whatsapp, setWhatsapp] = useState<WhatsAppForm>({ phone_whatsapp: '' });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Populate form when tenant loads
  useEffect(() => {
    if (tenant) {
      setCompany({
        name: tenant.name ?? '',
        slug: tenant.slug ?? '',
        description: tenant.description ?? '',
        address: tenant.address ?? '',
      });
      setWhatsapp({ phone_whatsapp: tenant.phone_whatsapp ?? '' });
      slugManuallyEdited.current = false;
    }
  }, [tenant]);

  // Auto-generate slug from name, unless user has manually edited slug
  const handleNameChange = (value: string) => {
    setCompany(prev => {
      const next = { ...prev, name: value };
      if (!slugManuallyEdited.current) {
        next.slug = toSlug(value);
      }
      return next;
    });
  };

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = true;
    setCompany(prev => ({ ...prev, slug: toSlug(value) }));
  };

  const saveCompany = async () => {
    if (!tenant?.id) return;
    if (!company.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!company.slug.trim()) {
      toast({ title: 'Slug é obrigatório', variant: 'destructive' });
      return;
    }

    setSavingCompany(true);
    const { error } = await supabase
      .from('tenants')
      .update({
        name: company.name.trim(),
        slug: company.slug.trim(),
        description: company.description.trim() || null,
        address: company.address.trim() || null,
      })
      .eq('id', tenant.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dados da empresa salvos!' });
      await refetch();
    }
    setSavingCompany(false);
  };

  const saveWhatsApp = async () => {
    if (!tenant?.id) return;
    setSavingWhatsapp(true);
    const { error } = await supabase
      .from('tenants')
      .update({ phone_whatsapp: whatsapp.phone_whatsapp.trim() })
      .eq('id', tenant.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'WhatsApp salvo!' });
      await refetch();
    }
    setSavingWhatsapp(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie as configurações do seu negócio</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
        </TabsList>

        {/* ── Empresa ─────────────────────────────────────────────────────── */}
        <TabsContent value="company" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Nome do estabelecimento</Label>
              <Input
                value={company.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Burger House"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Slug (URL pública)</Label>
              <Input
                value={company.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="burger-house"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Seu cardápio estará em: <span className="font-mono">/menu/{company.slug || 'seu-slug'}</span>
              </p>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={company.description}
                onChange={e => setCompany(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva seu negócio..."
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={company.address}
                onChange={e => setCompany(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua..."
                className="mt-1.5"
              />
            </div>
            <Button
              className="gradient-primary text-primary-foreground border-0"
              onClick={saveCompany}
              disabled={savingCompany}
            >
              {savingCompany ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {savingCompany ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        {/* ── WhatsApp ─────────────────────────────────────────────────────── */}
        <TabsContent value="whatsapp" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Número do WhatsApp</Label>
              <Input
                value={whatsapp.phone_whatsapp}
                onChange={e => setWhatsapp({ phone_whatsapp: e.target.value })}
                placeholder="(34) 99999-9999"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Este número receberá os pedidos dos clientes</p>
            </div>
            <Button
              className="gradient-primary text-primary-foreground border-0"
              onClick={saveWhatsApp}
              disabled={savingWhatsapp}
            >
              {savingWhatsapp ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {savingWhatsapp ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Marca ────────────────────────────────────────────────────────── */}
        <TabsContent value="branding" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Logo</Label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique para enviar</p>
              </div>
            </div>
            <div>
              <Label>Imagem de capa</Label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique para enviar</p>
              </div>
            </div>
            <Button className="gradient-primary text-primary-foreground border-0">Salvar</Button>
          </div>
        </TabsContent>

        {/* ── Horários ─────────────────────────────────────────────────────── */}
        <TabsContent value="hours" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-foreground">{day}</span>
                <Input type="time" defaultValue="11:00" className="w-28" />
                <span className="text-muted-foreground">às</span>
                <Input type="time" defaultValue="23:00" className="w-28" />
              </div>
            ))}
            <Button className="gradient-primary text-primary-foreground border-0">Salvar</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
