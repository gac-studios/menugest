import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UtensilsCrossed, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<'basic' | 'pro'>('basic');
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const validateSlug = (value: string) => {
    if (value.length < 3) return 'Slug deve ter pelo menos 3 caracteres';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return 'Apenas letras, números e hífens';
    return '';
  };

  const checkSlugUnique = useCallback(async (slugValue: string) => {
    const validationError = validateSlug(slugValue);
    if (validationError) {
      setSlugError(validationError);
      return false;
    }

    setSlugChecking(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slugValue)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSlugError('Slug já em uso. Escolha outro.');
        setSlugChecking(false);
        return false;
      }

      setSlugError('');
      setSlugChecking(false);
      return true;
    } catch {
      setSlugError('Erro ao verificar slug');
      setSlugChecking(false);
      return false;
    }
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    const newSlug = generateSlug(value);
    setSlug(newSlug);
    if (newSlug.length >= 3) {
      checkSlugUnique(newSlug);
    } else {
      setSlugError(newSlug.length > 0 ? 'Slug deve ter pelo menos 3 caracteres' : '');
    }
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(sanitized);
    if (sanitized.length >= 3) {
      checkSlugUnique(sanitized);
    } else {
      setSlugError(sanitized.length > 0 ? 'Slug deve ter pelo menos 3 caracteres' : '');
    }
  };

  const handleContinue = async () => {
    const isUnique = await checkSlugUnique(slug);
    if (isUnique) setStep(2);
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
          description: description || null,
          plan: 'basic',
          is_active: true,
          hide_unavailable: false,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create tenant_user as owner
      const { error: userError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: user.id,
          tenant_id: tenant.id,
          role: 'owner',
        });

      if (userError) throw userError;

      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
        });

      if (profileError) console.error('Profile upsert error:', profileError);

      toast({ title: 'Empresa criada!', description: 'Seu cardápio digital está pronto.' });

      // If pro was selected, show WhatsApp CTA
      if (plan === 'pro') {
        const msg = encodeURIComponent(
          `Olá, quero contratar o Plano Pro do MenuGest.\n\nEmpresa: ${name}\nSlug: ${slug}\nEmail: ${user.email}\nPlano escolhido: Pro (R$ 99,90/mês)`
        );
        window.open(`https://wa.me/553432466279?text=${msg}`, '_blank');
      }

      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = name.trim().length > 0 && slug.length >= 3 && !slugError && !slugChecking && phone.trim().length > 0;

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
                <Label>Nome do estabelecimento *</Label>
                <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Ex: Burger House" className="mt-1.5" maxLength={100} />
              </div>
              <div>
                <Label>Slug (URL do cardápio) *</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="burger-house"
                    maxLength={60}
                    className={slugError ? 'border-destructive' : ''}
                  />
                  {slugChecking && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
                  {!slugChecking && slug.length >= 3 && !slugError && <Check size={16} className="text-green-500" />}
                </div>
                {slugError && <p className="text-xs text-destructive mt-1">{slugError}</p>}
                {slug.length >= 3 && !slugError && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Seu cardápio: <span className="font-medium text-primary">{slug}.menugest.com</span>
                  </p>
                )}
              </div>
              <div>
                <Label>WhatsApp *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(34) 99999-9999" className="mt-1.5" maxLength={20} />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva seu negócio..." className="mt-1.5" rows={3} maxLength={500} />
              </div>
              <div>
                <Label>Plano desejado</Label>
                <RadioGroup value={plan} onValueChange={(v) => setPlan(v as 'basic' | 'pro')} className="mt-2 grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 cursor-pointer transition-colors ${plan === 'basic' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="basic" className="sr-only" />
                    <span className="text-sm font-semibold text-foreground">Básico</span>
                    <span className="text-xs text-muted-foreground">R$ 49,90/mês</span>
                  </label>
                  <label className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 cursor-pointer transition-colors ${plan === 'pro' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value="pro" className="sr-only" />
                    <span className="text-sm font-semibold text-foreground">Pro ⭐</span>
                    <span className="text-xs text-muted-foreground">R$ 99,90/mês</span>
                  </label>
                </RadioGroup>
              </div>
            </div>
            <Button onClick={handleContinue} className="w-full gradient-primary text-primary-foreground border-0" size="lg" disabled={!isStep1Valid}>
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
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">URL</span><span className="text-sm font-medium text-primary">{slug}.menugest.com</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">WhatsApp</span><span className="text-sm font-medium text-foreground">{phone}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Plano</span><span className="text-sm font-medium text-primary">{plan === 'pro' ? 'Pro ⭐' : 'Básico'}</span></div>
            </div>
            {plan === 'pro' && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                Ao clicar em "Criar Empresa", você será direcionado ao WhatsApp para finalizar a contratação do Plano Pro. O plano será ativado após confirmação do pagamento.
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">Voltar</Button>
              <Button onClick={handleSubmit} className="flex-1 gradient-primary text-primary-foreground border-0" size="lg" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Criando...</> : 'Criar Empresa'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
