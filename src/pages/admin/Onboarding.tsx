import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name,
          slug,
          phone_whatsapp: phone,
          description,
          plan: 'basic',
          is_active: true,
          hide_unavailable: false,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create tenant_user
      const { error: userError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: user.id,
          tenant_id: tenant.id,
          role: 'owner',
        });

      if (userError) throw userError;

      toast({ title: 'Empresa criada!', description: 'Seu cardápio digital está pronto.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <UtensilsCrossed size={22} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">MenuGest</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'gradient-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dados do seu negócio</h1>
              <p className="text-muted-foreground text-sm mt-1">Vamos configurar seu cardápio digital</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Nome do estabelecimento</Label>
                <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Ex: Burger House" className="mt-1.5" />
              </div>
              <div>
                <Label>Slug (URL do cardápio)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="burger-house" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">.menugest.com</span>
                </div>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(34) 99999-9999" className="mt-1.5" />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva seu negócio..." className="mt-1.5" rows={3} />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full gradient-primary text-primary-foreground border-0" size="lg" disabled={!name || !slug || !phone}>
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Confirme seus dados</h1>
              <p className="text-muted-foreground text-sm mt-1">Revise antes de criar seu cardápio</p>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card border border-border/50 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Nome</span><span className="text-sm font-medium text-foreground">{name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">URL</span><span className="text-sm font-medium text-foreground">{slug}.menugest.com</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">WhatsApp</span><span className="text-sm font-medium text-foreground">{phone}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Plano</span><span className="text-sm font-medium text-primary">Básico</span></div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">Voltar</Button>
              <Button onClick={handleSubmit} className="flex-1 gradient-primary text-primary-foreground border-0" size="lg" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Empresa'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
