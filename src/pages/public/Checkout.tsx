import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buildOrderMessage, openWhatsApp } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { fetchPlanFeatures, type PlanFeatures } from '@/hooks/usePlanFeatures';
import { usePublicTenant } from '@/contexts/PublicTenantContext';

const paymentMethodMap: Record<string, string> = {
  Pix: 'pix',
  Dinheiro: 'dinheiro',
  Crédito: 'credito',
  Débito: 'debito',
};

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const { tenant: tenantData } = usePublicTenant();
  const { items, updateQuantity, updateObservation, removeItem, clearCart, total, itemCount } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [orderType, setOrderType] = useState<'retirada' | 'entrega'>('retirada');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setCustomerPhone(formatted);
    if (phoneError) setPhoneError('');
  };

  useEffect(() => {
    if (!tenantData?.plan) return;
    fetchPlanFeatures(tenantData.plan || 'none').then(setPlanFeatures);
  }, [tenantData?.plan]);

  const useInternalOrders = planFeatures?.orders_internal === true;

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Adicione itens antes de finalizar.', variant: 'destructive' });
      return;
    }
    if (!tenantData) {
      toast({ title: 'Carregando dados...', description: 'Aguarde um momento e tente novamente.' });
      return;
    }

    const digits = customerPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Informe um telefone válido com DDD');
      return;
    }

    if (orderType === 'entrega' && !address.trim()) {
      setAddressError('Informe o endereço de entrega');
      return;
    }

    setSending(true);
    try {
      if (useInternalOrders) {
        const dbPayment = paymentMethodMap[paymentMethod] || paymentMethod.toLowerCase() || 'dinheiro';
        const salePayload = {
          tenant_id: tenantData.id,
          total: parseFloat(total.toFixed(2)),
          payment_method: dbPayment,
          description: items.map(ci => `${ci.item.name} x${ci.quantity}`).join(', '),
          status: 'new',
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          delivery_address: orderType === 'entrega' ? address : null,
          notes: generalNote || null,
          sold_at: new Date().toISOString(),
        };

        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert(salePayload)
          .select('id')
          .single();

        if (saleError || !newSale?.id) {
          console.error('[Checkout] Sale insert FAILED:', saleError);
          const msg = saleError?.message || 'Erro desconhecido';
          toast({ title: msg.includes('policy') ? 'Sem permissão para criar pedido' : 'Erro ao registrar pedido', description: msg, variant: 'destructive' });
          setSending(false);
          return;
        }

        const saleItems = items.map(ci => ({
          tenant_id: tenantData.id,
          sale_id: newSale.id,
          menu_item_id: ci.item.id,
          qty: ci.quantity,
          unit_price: ci.item.price,
          subtotal: parseFloat((ci.item.price * ci.quantity).toFixed(2)),
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
        if (itemsError) {
          console.error('[Checkout] Sale items insert FAILED:', itemsError);
          toast({ title: 'Erro ao registrar itens', description: itemsError.message, variant: 'destructive' });
          setSending(false);
          return;
        }

        clearCart();
        setOrderSuccess(true);
      } else {
        const storeName = tenantData.name || 'Restaurante';
        const storePhone = tenantData.phone_whatsapp || '5500000000000';

        const message = buildOrderMessage(
          storeName, items, customerName || undefined, orderType,
          orderType === 'entrega' ? address || undefined : undefined,
          generalNote || undefined, customerPhone, paymentMethod || undefined,
        );

        toast({ title: 'Abrindo WhatsApp...' });
        try { openWhatsApp(storePhone, message); } catch {
          toast({ title: 'Erro ao abrir WhatsApp', description: 'Não foi possível abrir o WhatsApp.', variant: 'destructive' });
          setSending(false);
          return;
        }

        clearCart();
        navigate(`/menu/${slug}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({ title: 'Erro ao finalizar pedido', description: err?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Pedido finalizado!</h1>
          <p className="text-muted-foreground mt-2">Seu pedido foi registrado com sucesso.</p>
          <Link to={slug ? `/menu/${slug}` : '/'}>
            <Button className="mt-6 text-white border-0" style={{ background: 'var(--brand-button, var(--brand, var(--gradient-primary)))' }}>Voltar ao Cardápio</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h1 className="text-xl font-bold text-foreground">Carrinho vazio</h1>
          <p className="text-muted-foreground mt-2">Adicione itens do cardápio</p>
          <Link to={slug ? `/menu/${slug}` : '/'}>
            <Button className="mt-6 text-white border-0" style={{ background: 'var(--brand-button, var(--brand, var(--gradient-primary)))' }}>Ver Cardápio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-lg border-b border-border z-10"
        style={{ backgroundColor: 'var(--brand-card-bg, hsl(var(--card) / 0.9))' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <Link to={slug ? `/menu/${slug}` : '/'} className="text-foreground"><ArrowLeft size={20} /></Link>
          <h1 className="text-lg font-bold text-foreground">Finalizar Pedido</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Cart items */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Seus itens</h2>
          {items.map(ci => (
            <div key={ci.item.id} className="rounded-xl p-4 border border-border/50 shadow-card"
              style={{ backgroundColor: 'var(--brand-card-bg, hsl(var(--card)))' }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{ci.item.name}</h3>
                  <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--brand-price, var(--brand, hsl(var(--primary))))' }}>
                    R$ {(ci.item.price * ci.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{ci.quantity}</span>
                  <button onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'var(--brand-button-plus, var(--brand-button, var(--brand, var(--gradient-primary))))' }}>
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeItem(ci.item.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <Input value={ci.observation || ''} onChange={e => updateObservation(ci.item.id, e.target.value)} placeholder="Observação do item (opcional)" className="text-xs h-8" />
              </div>
            </div>
          ))}
        </div>

        {/* Customer info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Seus dados</h2>
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Telefone <span className="text-destructive">*</span></Label>
            <Input type="tel" value={customerPhone} onChange={handlePhoneChange} placeholder="(00) 00000-0000"
              className={`mt-1 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
            {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
          </div>
          <div>
            <Label className="text-xs">Tipo do pedido</Label>
            <div className="flex gap-2 mt-1">
              {(['retirada', 'entrega'] as const).map(type => (
                <button key={type} onClick={() => { setOrderType(type); if (type === 'retirada') setAddressError(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${orderType === type ? 'text-white border-transparent' : 'text-foreground border-border'}`}
                  style={orderType === type ? { background: 'var(--brand-button, var(--brand, var(--gradient-primary)))' } : { backgroundColor: 'var(--brand-card-bg, hsl(var(--card)))' }}>
                  {type === 'retirada' ? 'Retirada' : 'Entrega'}
                </button>
              ))}
            </div>
          </div>
          {orderType === 'entrega' && (
            <div>
              <Label className="text-xs">Endereço de entrega <span className="text-destructive">*</span></Label>
              <Input value={address} onChange={e => { setAddress(e.target.value); if (addressError) setAddressError(''); }}
                placeholder="Rua, número, bairro"
                className={`mt-1 ${addressError ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
              {addressError && <p className="text-xs text-destructive mt-1">{addressError}</p>}
            </div>
          )}
          <div>
            <Label className="text-xs">Forma de pagamento</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Pix', 'Dinheiro', 'Crédito', 'Débito'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === m ? 'text-white border-transparent' : 'text-foreground border-border'}`}
                  style={paymentMethod === m ? { background: 'var(--brand-button, var(--brand, var(--gradient-primary)))' } : { backgroundColor: 'var(--brand-card-bg, hsl(var(--card)))' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Observação geral</Label>
            <Textarea value={generalNote} onChange={e => setGeneralNote(e.target.value)} placeholder="Alguma observação sobre o pedido?" className="mt-1" rows={2} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 backdrop-blur-lg border-t border-border p-4"
        style={{ backgroundColor: 'var(--brand-card-bg, hsl(var(--card) / 0.9))' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            <span className="text-lg font-bold text-foreground">R$ {total.toFixed(2)}</span>
          </div>
          <Button onClick={handleSubmitOrder} disabled={sending || !tenantData}
            className="w-full h-14 text-base text-white border-0" size="lg"
            style={{ background: 'var(--brand-button, var(--brand, var(--gradient-primary)))' }}>
            <ShoppingBag size={20} className="mr-2" />
            {sending ? 'Finalizando...' : 'Finalizar pedido'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {useInternalOrders ? 'Seu pedido será registrado no sistema do restaurante.' : 'Seu pedido será enviado via WhatsApp.'}
          </p>
        </div>
      </div>
    </div>
  );
}
