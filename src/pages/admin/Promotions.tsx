import { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockPromos = [
  { id: '1', title: 'Combo do Dia', description: 'Burger + Batata + Bebida por R$ 39,90', is_active: true },
  { id: '2', title: 'Happy Hour', description: '2 burgers pelo preço de 1 das 17h-19h', is_active: true },
  { id: '3', title: 'Frete Grátis', description: 'Pedidos acima de R$ 60 - frete grátis', is_active: false },
];

export default function Promotions() {
  const [promos] = useState(mockPromos);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promoções</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas promoções e ofertas</p>
        </div>
        <Button className="gradient-primary text-primary-foreground border-0 gap-1.5">
          <Plus size={16} /> Nova Promoção
        </Button>
      </div>

      <div className="space-y-3">
        {promos.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border/50 shadow-card">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <Tag size={18} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {p.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={14} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
