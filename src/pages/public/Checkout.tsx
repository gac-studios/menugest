import { useState } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { buildOrderMessage, openWhatsApp } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';

const storeName = 'Burger House';
const storePhone = '5534999999999'; // TODO: from tenant

export default function Checkout() {
  const { items, updateQuantity, updateObservation, removeItem, clearCart, total, itemCount } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'retirada' | 'entrega'>('retirada');
  const [address, setAddress] = useState('');
  const [generalNote, setGeneralNote] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendWhatsApp = () => {
    if (items.length === 0) return;

    const message = buildOrderMessage(
      storeName,
      items,
      customerName || undefined,
      orderType,
      orderType === 'entrega' ? address || undefined : undefined,
      generalNote || undefined
    );

    openWhatsApp(storePhone, message);

    // TODO: register stats event in Supabase
    toast({ title: 'Pedido enviado!', description: 'Seu pedido foi aberto no WhatsApp.' });
    clearCart();
    navigate('/menu');
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h1 className="text-xl font-bold text-foreground">Carrinho vazio</h1>
          <p className="text-muted-foreground mt-2">Adicione itens do cardápio</p>
          <Link to="/menu">
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
          <Link to="/menu" className="text-foreground"><ArrowLeft size={20} /></Link>
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
          <Button onClick={handleSendWhatsApp} className="w-full h-14 text-base gradient-primary text-primary-foreground border-0" size="lg">
            <MessageCircle size={20} className="mr-2" /> Enviar pedido no WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
