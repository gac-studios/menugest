import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import PersonalizationTab from '@/components/admin/PersonalizationTab';

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

// ─── Image Upload Zone ────────────────────────────────────────────────────────
interface ImageUploadZoneProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  uploading: boolean;
  accept?: string;
}

function ImageUploadZone({ label, currentUrl, onUpload, onRemove, uploading, accept = 'image/*' }: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [onUpload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 relative">
        {currentUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img src={currentUrl} alt={label} className="w-full h-40 object-cover" />
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Upload size={18} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Arraste uma imagem ou <span className="text-primary font-medium">clique para enviar</span>
                </p>
                <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP até 5MB</p>
              </div>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────
export default function Settings() {
  const { tenant, refetch } = useTenant();
  const { toast } = useToast();

  // ── Company tab ─────────────────────────────────────────────────────────────
  const [company, setCompany] = useState<CompanyForm>({ name: '', slug: '', description: '', address: '' });
  const [savingCompany, setSavingCompany] = useState(false);
  const slugManuallyEdited = useRef(false);

  // ── WhatsApp tab ────────────────────────────────────────────────────────────
  const [whatsapp, setWhatsapp] = useState({ phone_whatsapp: '' });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // ── Branding tab ────────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    if (tenant) {
      setCompany({
        name: tenant.name ?? '',
        slug: tenant.slug ?? '',
        description: tenant.description ?? '',
        address: tenant.address ?? '',
      });
      setWhatsapp({ phone_whatsapp: tenant.phone_whatsapp ?? '' });
      setLogoUrl(tenant.logo_url ?? null);
      setCoverUrl(tenant.cover_url ?? null);
      slugManuallyEdited.current = false;
    }
  }, [tenant]);

  const handleNameChange = (value: string) => {
    setCompany(prev => {
      const next = { ...prev, name: value };
      if (!slugManuallyEdited.current) next.slug = toSlug(value);
      return next;
    });
  };

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = true;
    setCompany(prev => ({ ...prev, slug: toSlug(value) }));
  };

  const saveCompany = async () => {
    if (!tenant?.id) return;
    if (!company.name.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return; }
    if (!company.slug.trim()) { toast({ title: 'Slug é obrigatório', variant: 'destructive' }); return; }
    setSavingCompany(true);
    const { error } = await supabase.from('tenants').update({
      name: company.name.trim(),
      slug: company.slug.trim(),
      description: company.description.trim() || null,
      address: company.address.trim() || null,
    }).eq('id', tenant.id);
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
    const { error } = await supabase.from('tenants').update({ phone_whatsapp: whatsapp.phone_whatsapp.trim() }).eq('id', tenant.id);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'WhatsApp salvo!' });
      await refetch();
    }
    setSavingWhatsapp(false);
  };

  // ── Branding helpers ────────────────────────────────────────────────────────
  const uploadBrandImage = async (file: File, type: 'logo' | 'cover') => {
    if (!tenant?.id) return;
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingCover;
    const setUrl = type === 'logo' ? setLogoUrl : setCoverUrl;
    const prefix = type === 'logo' ? 'logo' : 'cover';
    setUploading(true);
    try {
      const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
      const ext = extMap[file.type] || 'jpg';
      const safeFilename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const path = `${tenant.id}/brand/${prefix}-${safeFilename}`;
      const { error: uploadError } = await supabase.storage.from('tenant-assets').upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('tenant-assets').getPublicUrl(path);
      setUrl(data.publicUrl);
      toast({ title: `${type === 'logo' ? 'Logo' : 'Capa'} enviada! Clique em Salvar para confirmar.` });
    } catch (err: unknown) {
      toast({ title: 'Erro no upload', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveBranding = async () => {
    if (!tenant?.id) return;
    setSavingBranding(true);
    const { error } = await supabase.from('tenants').update({
      logo_url: logoUrl,
      cover_url: coverUrl,
    }).eq('id', tenant.id);
    if (error) {
      toast({ title: 'Erro ao salvar marca', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Marca salva com sucesso!' });
      await refetch();
    }
    setSavingBranding(false);
  };

  const isBrandingUploading = uploadingLogo || uploadingCover;

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
          <TabsTrigger value="personalization">Personalização</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
        </TabsList>

        {/* ── Empresa ──────────────────────────────────────────────────────── */}
        <TabsContent value="company" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Nome do estabelecimento</Label>
              <Input value={company.name} onChange={e => handleNameChange(e.target.value)} placeholder="Burger House" className="mt-1.5" />
            </div>
            <div>
              <Label>Slug (URL pública)</Label>
              <Input value={company.slug} onChange={e => handleSlugChange(e.target.value)} placeholder="burger-house" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                Seu cardápio estará em: <span className="font-mono">/menu/{company.slug || 'seu-slug'}</span>
              </p>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={company.description} onChange={e => setCompany(prev => ({ ...prev, description: e.target.value }))} placeholder="Descreva seu negócio..." className="mt-1.5" rows={3} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={company.address} onChange={e => setCompany(prev => ({ ...prev, address: e.target.value }))} placeholder="Rua..." className="mt-1.5" />
            </div>
            <Button className="gradient-primary text-primary-foreground border-0" onClick={saveCompany} disabled={savingCompany}>
              {savingCompany && <Loader2 size={16} className="animate-spin mr-2" />}
              {savingCompany ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        {/* ── WhatsApp ─────────────────────────────────────────────────────── */}
        <TabsContent value="whatsapp" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <div>
              <Label>Número do WhatsApp</Label>
              <Input value={whatsapp.phone_whatsapp} onChange={e => setWhatsapp({ phone_whatsapp: e.target.value })} placeholder="(34) 99999-9999" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Este número receberá os pedidos dos clientes</p>
            </div>
            <Button className="gradient-primary text-primary-foreground border-0" onClick={saveWhatsApp} disabled={savingWhatsapp}>
              {savingWhatsapp && <Loader2 size={16} className="animate-spin mr-2" />}
              {savingWhatsapp ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Marca ────────────────────────────────────────────────────────── */}
        <TabsContent value="branding" className="mt-6 space-y-4">
          <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
            <ImageUploadZone
              label="Logo"
              currentUrl={logoUrl}
              onUpload={f => uploadBrandImage(f, 'logo')}
              onRemove={() => setLogoUrl(null)}
              uploading={uploadingLogo}
            />
            <ImageUploadZone
              label="Imagem de capa"
              currentUrl={coverUrl}
              onUpload={f => uploadBrandImage(f, 'cover')}
              onRemove={() => setCoverUrl(null)}
              uploading={uploadingCover}
            />
            <Button
              className="gradient-primary text-primary-foreground border-0"
              onClick={saveBranding}
              disabled={savingBranding || isBrandingUploading}
            >
              {(savingBranding || isBrandingUploading) && <Loader2 size={16} className="animate-spin mr-2" />}
              {isBrandingUploading ? 'Aguardando upload...' : savingBranding ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Personalização (Pro) ─────────────────────────────────────────── */}
        <TabsContent value="personalization" className="mt-6">
          <PersonalizationTab />
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
