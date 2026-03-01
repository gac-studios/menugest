import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Lock, Palette, Plus, ShoppingCart, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const FONT_OPTIONS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
];

const DEFAULTS = {
  primaryColor: '#f97316',
  priceColor: '#f97316',
  buttonColor: '#f97316',
  buttonPlusColor: '#f97316',
  headerColor: '#1a1a1a',
  bgColor: '#ffffff',
  cardBgColor: '#ffffff',
  font: 'Plus Jakarta Sans',
};

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function ColorField({ label, value, onChange, disabled }: ColorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className={disabled ? 'text-muted-foreground' : ''}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-12 h-10 rounded-lg border border-border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#ffffff"
          disabled={disabled}
          className="w-32 font-mono text-sm"
        />
        <div
          className="w-10 h-10 rounded-lg border border-border shrink-0"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

// ─── Live Preview ──────────────────────────────────────────────────────────────
interface PreviewProps {
  primaryColor: string;
  priceColor: string;
  buttonColor: string;
  buttonPlusColor: string;
  headerColor: string;
  bgColor: string;
  cardBgColor: string;
  font: string;
}

function MenuPreview({ priceColor, buttonColor, buttonPlusColor, headerColor, bgColor, cardBgColor, font }: PreviewProps) {
  return (
    <div
      className="rounded-xl border border-border overflow-hidden shadow-card"
      style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: bgColor }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: headerColor }}>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <span className="text-white text-sm">🍔</span>
        </div>
        <span className="text-white font-bold text-sm">Meu Restaurante</span>
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {[
          { name: 'X-Burger Especial', price: 'R$ 28,90' },
          { name: 'Batata Frita G', price: 'R$ 16,50' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-black/5" style={{ backgroundColor: cardBgColor }}>
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-lg">
              {i === 0 ? '🍔' : '🍟'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>{item.name}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: priceColor }}>{item.price}</p>
            </div>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: buttonPlusColor }}
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Cart bar */}
      <div className="px-3 pb-3">
        <div
          className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-white text-xs font-semibold"
          style={{ backgroundColor: buttonColor }}
        >
          <ShoppingCart size={14} />
          Ver carrinho (2) — R$ 45,40
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PersonalizationTab() {
  const { tenant, refetch } = useTenant();
  const { toast } = useToast();
  const isPro = tenant?.plan === 'pro';

  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primaryColor);
  const [priceColor, setPriceColor] = useState(DEFAULTS.priceColor);
  const [buttonColor, setButtonColor] = useState(DEFAULTS.buttonColor);
  const [buttonPlusColor, setButtonPlusColor] = useState(DEFAULTS.buttonPlusColor);
  const [headerColor, setHeaderColor] = useState(DEFAULTS.headerColor);
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor);
  const [cardBgColor, setCardBgColor] = useState(DEFAULTS.cardBgColor);
  const [font, setFont] = useState(DEFAULTS.font);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      const primary = tenant.theme_primary_color || DEFAULTS.primaryColor;
      setPrimaryColor(primary);
      setPriceColor(tenant.price_color || primary);
      setButtonColor(tenant.button_color || primary);
      setButtonPlusColor(tenant.theme_button_plus_color || primary);
      setHeaderColor(tenant.theme_header_color || DEFAULTS.headerColor);
      setBgColor(tenant.theme_background_color || tenant.theme_bg_color || DEFAULTS.bgColor);
      setCardBgColor(tenant.card_background_color || DEFAULTS.cardBgColor);
      setFont(tenant.theme_font || DEFAULTS.font);
    }
  }, [tenant]);

  const save = async (overrides?: Record<string, string>) => {
    if (!tenant?.id) return;
    setSaving(true);
    const payload = overrides || {
      theme_primary_color: primaryColor,
      price_color: priceColor,
      button_color: buttonColor,
      theme_button_plus_color: buttonPlusColor,
      theme_header_color: headerColor,
      theme_background_color: bgColor,
      card_background_color: cardBgColor,
      theme_font: font,
    };
    const { error } = await supabase.from('tenants').update(payload).eq('id', tenant.id);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: overrides ? 'Tema resetado para o padrão!' : 'Personalização salva!' });
      await refetch();
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setPrimaryColor(DEFAULTS.primaryColor);
    setPriceColor(DEFAULTS.priceColor);
    setButtonColor(DEFAULTS.buttonColor);
    setButtonPlusColor(DEFAULTS.buttonPlusColor);
    setHeaderColor(DEFAULTS.headerColor);
    setBgColor(DEFAULTS.bgColor);
    setCardBgColor(DEFAULTS.cardBgColor);
    setFont(DEFAULTS.font);

    await save({
      theme_primary_color: DEFAULTS.primaryColor,
      price_color: DEFAULTS.priceColor,
      button_color: DEFAULTS.buttonColor,
      theme_button_plus_color: DEFAULTS.buttonPlusColor,
      theme_header_color: DEFAULTS.headerColor,
      theme_background_color: DEFAULTS.bgColor,
      card_background_color: DEFAULTS.cardBgColor,
      theme_font: DEFAULTS.font,
    });
  };

  const previewProps: PreviewProps = {
    primaryColor, priceColor, buttonColor, buttonPlusColor, headerColor, bgColor, cardBgColor, font,
  };

  if (!isPro) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card">
        <div className="flex flex-col items-center text-center py-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock size={20} className="text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Recurso exclusivo do Plano Pro</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Personalize cores, fontes e a aparência completa do seu cardápio público com o Plano Pro.
          </p>
          <Link to="/plans">
            <Button className="gradient-pro text-pro-foreground border-0 mt-2">Fazer upgrade</Button>
          </Link>
        </div>

        {/* Disabled preview */}
        <div className="mt-6 opacity-50 pointer-events-none select-none">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Prévia (bloqueada)</p>
          <MenuPreview {...{ ...DEFAULTS, primaryColor: DEFAULTS.primaryColor, priceColor: DEFAULTS.priceColor, buttonColor: DEFAULTS.buttonColor, buttonPlusColor: DEFAULTS.buttonPlusColor, headerColor: DEFAULTS.headerColor, bgColor: DEFAULTS.bgColor, cardBgColor: DEFAULTS.cardBgColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Palette size={18} className="text-primary" />
            Personalização Premium
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Configure as cores e fonte do seu cardápio</p>
        </div>

        <ColorField label="Cor principal (fallback geral)" value={primaryColor} onChange={setPrimaryColor} />
        <ColorField label="Cor do preço" value={priceColor} onChange={setPriceColor} />
        <ColorField label="Cor dos botões (ações, chips, finalizar)" value={buttonColor} onChange={setButtonColor} />
        <ColorField label="Cor do botão +" value={buttonPlusColor} onChange={setButtonPlusColor} />
        <ColorField label="Cor do header" value={headerColor} onChange={setHeaderColor} />
        <ColorField label="Cor de fundo da página" value={bgColor} onChange={setBgColor} />
        <ColorField label="Cor de fundo dos cards" value={cardBgColor} onChange={setCardBgColor} />

        <div className="space-y-1.5">
          <Label>Fonte do cardápio</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map(f => (
                <SelectItem key={f.value} value={f.value}>
                  <span style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button className="gradient-primary text-primary-foreground border-0 flex-1" onClick={() => save()} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin mr-2" />}
            {saving ? 'Salvando...' : 'Salvar personalização'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={saving} className="gap-2">
                <RotateCcw size={16} />
                Resetar padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar tema para o padrão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todas as cores e a fonte serão restauradas para o tema padrão do MenuGest (laranja). Esta ação será salva imediatamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Resetar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Prévia em tempo real</p>
        <MenuPreview {...previewProps} />
      </div>
    </div>
  );
}
