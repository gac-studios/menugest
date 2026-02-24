import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buildOrderMessage, openWhatsApp } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const paymentMethodMap: Record<string, string> = {
  Pix: 'pix',
  Dinheiro: 'dinheiro',
  Crédito: 'credito',
  Débito: 'debito',
};

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const { items, updateQuantity, updateObservation, removeItem, clearCart, total, itemCount } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [orderType, setOrderType] = useState<'retirada' | 'entrega'>('retirada');
  const [address, setAddress] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [tenantData, setTenantData] = useState<{ id: string; name: string; whatsapp_phone?: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setCustomerPhone(formatted);
    if (phoneError) setPhoneError('');
  };

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('tenants')
      .select('id, name, whatsapp_phone')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTenantData(data);
      });
  }, [slug]);

  const storeName = tenantData?.name || 'Restaurante';
  const storePhone = tenantData?.whatsapp_phone || '5500000000000';

  const handleSendWhatsApp = async () => {
    if (items.length === 0 || !tenantData) return;

    const digits = customerPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Informe um telefone válido com DDD');
      return;
    }

    setSending(true);
    try {
      // 1) Create the sale record
      const dbPayment = paymentMethodMap[paymentMethod] || paymentMethod.toLowerCase() || 'dinheiro';
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: tenantData.id,
          total: parseFloat(total.toFixed(2)),
          payment_method: dbPayment,
          description: items.map(ci => `${ci.item.name} x${ci.quantity}`).join(', '),
          status: 'new',
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          delivery_address: orderType === 'entrega' ? (address || null) : null,
          notes: generalNote || null,
          sold_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (saleError || !sale) {
        console.error('Error creating sale:', saleError);
        // Still send WhatsApp even if DB fails
      } else {
        // 2) Create sale_items
        const saleItems = items.map(ci => ({
          tenant_id: tenantData.id,
          sale_id: sale.id,
          menu_item_id: ci.item.id,
          qty: ci.quantity,
          unit_price: ci.item.price,
          subtotal: parseFloat((ci.item.price * ci.quantity).toFixed(2)),
        }));
        const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
        if (itemsError) console.error('Error inserting sale items:', itemsError);
      }

      // 3) Build WhatsApp message & open
      const message = buildOrderMessage(
        storeName,
        items,
        customerName || undefined,
        orderType,
        orderType === 'entrega' ? address || undefined : undefined,
        generalNote || undefined,
        customerPhone,
        paymentMethod || undefined
      );
      openWhatsApp(storePhone, message);

      toast({ title: 'Pedido enviado!', description: 'Seu pedido foi registrado e aberto no WhatsApp.' });
      clearCart();
      navigate(`/menu/${slug}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({ title: 'Erro ao enviar pedido', description: err?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h1 className="text-xl font-bold text-foreground">Carrinho vazio</h1>
          <p className="text-muted-foreground mt-2">Adicione itens do cardápio</p>
          <Link to={slug ? `/menu/${slug}` : '/'}>
            <Button className="mt-6 gradient-primary text-primary-foreground border-0">Ver Cardápio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-card/90 backdrop-blur-lg border-b border-border z-10">
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
            <div key={ci.item.id} className="bg-card rounded-xl p-4 border border-border/50 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground">{ci.item.name}</h3>
                  <p className="text-sm text-primary font-medium mt-0.5">R$ {(ci.item.price * ci.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{ci.quantity}</span>
                  <button onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)} className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeItem(ci.item.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <Input
                  value={ci.observation || ''}
                  onChange={e => updateObservation(ci.item.id, e.target.value)}
                  placeholder="Observação do item (opcional)"
                  className="text-xs h-8"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Customer info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Seus dados (opcional)</h2>
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Telefone <span className="text-destructive">*</span></Label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className={`mt-1 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
          </div>
          <div>
            <Label className="text-xs">Tipo do pedido</Label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setOrderType('retirada')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${orderType === 'retirada' ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card text-foreground border-border'}`}
              >
                Retirada
              </button>
              <button
                onClick={() => setOrderType('entrega')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${orderType === 'entrega' ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card text-foreground border-border'}`}
              >
                Entrega
              </button>
            </div>
          </div>
          {orderType === 'entrega' && (
            <div>
              <Label className="text-xs">Endereço de entrega</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" className="mt-1" />
            </div>
          )}
          <div>
            <Label className="text-xs">Forma de pagamento</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Pix', 'Dinheiro', 'Crédito', 'Débito'].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === m ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card text-foreground border-border'}`}
                >
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
      <div className="fixed bottom-0 inset-x-0 bg-card/90 backdrop-blur-lg border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            <span className="text-lg font-bold text-foreground">R$ {total.toFixed(2)}</span>
          </div>
          <Button onClick={handleSendWhatsApp} disabled={sending} className="w-full h-14 text-base gradient-primary text-primary-foreground border-0" size="lg">
            <MessageCircle size={20} className="mr-2" /> {sending ? 'Enviando...' : 'Enviar pedido no WhatsApp'}
          </Button>
        </div>
      </div>
    </div>
  );
}