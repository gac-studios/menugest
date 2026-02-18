import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MenuItem } from '@/lib/types';

const mockItems: MenuItem[] = [
  { id: '1', tenant_id: '1', category_id: '1', name: 'Smash Burger Clássico', slug: 'smash-classico', description: 'Pão brioche, blend 150g, queijo cheddar, alface, tomate', price: 28.90, image_url: '', is_available: true, is_promotion: false, sort_order: 1 },
  { id: '2', tenant_id: '1', category_id: '1', name: 'Burger Bacon Supreme', slug: 'bacon-supreme', description: 'Duplo blend, bacon crocante, queijo, molho especial', price: 35.90, original_price: 42.90, image_url: '', is_available: true, is_promotion: true, promotion_label: '-16%', sort_order: 2 },
  { id: '3', tenant_id: '1', category_id: '2', name: 'Batata Frita G', slug: 'batata-g', description: 'Porção generosa com molho', price: 18.90, image_url: '', is_available: true, is_promotion: false, sort_order: 3 },
  { id: '4', tenant_id: '1', category_id: '3', name: 'Milkshake Oreo', slug: 'milkshake-oreo', description: 'Sorvete, leite, Oreo', price: 22.90, image_url: '', is_available: false, is_promotion: false, sort_order: 4 },
];

export default function MenuItems() {
  const [search, setSearch] = useState('');
  const filtered = mockItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Itens do Cardápio</h1>
          <p className="text-muted-foreground text-sm">{mockItems.length} itens cadastrados</p>
        </div>
        <Link to="/menu/items/new">
          <Button className="gradient-primary text-primary-foreground border-0 gap-1.5">
            <Plus size={16} /> Novo Item
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar itens..." className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className={`flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 shadow-card ${!item.is_available ? 'opacity-50' : ''}`}>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <span className="text-lg">🍔</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                {item.is_promotion && <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">PROMO</span>}
                {!item.is_available && <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">INDISPONÍVEL</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
            <span className="font-bold text-primary text-sm">R$ {item.price.toFixed(2)}</span>
            <div className="flex items-center gap-1">
              <Link to={`/menu/items/${item.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={14} /></Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
