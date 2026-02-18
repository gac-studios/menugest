import { useState, useMemo } from 'react';
import { Search, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MenuCard from '@/components/public/MenuCard';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { MenuItem } from '@/lib/types';
import { motion } from 'framer-motion';

// Mock data for demo
const mockCategories = [
  { id: '1', name: 'Hambúrgueres' },
  { id: '2', name: 'Acompanhamentos' },
  { id: '3', name: 'Bebidas' },
  { id: '4', name: 'Sobremesas' },
];

const mockItems: MenuItem[] = [
  { id: '1', tenant_id: '1', category_id: '1', name: 'Smash Burger Clássico', slug: 'smash-classico', description: 'Pão brioche, blend 150g, queijo cheddar, alface, tomate e molho especial', price: 28.90, image_url: '', is_available: true, is_promotion: false, sort_order: 1 },
  { id: '2', tenant_id: '1', category_id: '1', name: 'Burger Bacon Supreme', slug: 'bacon-supreme', description: 'Duplo blend, bacon crocante, queijo, cebola caramelizada e molho BBQ', price: 35.90, original_price: 42.90, image_url: '', is_available: true, is_promotion: true, promotion_label: 'OFERTA', sort_order: 2 },
  { id: '3', tenant_id: '1', category_id: '1', name: 'Veggie Burger', slug: 'veggie', description: 'Hambúrguer de grão de bico com rúcula e molho tahine', price: 29.90, image_url: '', is_available: true, is_promotion: false, sort_order: 3 },
  { id: '4', tenant_id: '1', category_id: '2', name: 'Batata Frita Grande', slug: 'batata-g', description: 'Porção generosa com sal e orégano', price: 18.90, image_url: '', is_available: true, is_promotion: false, sort_order: 4 },
  { id: '5', tenant_id: '1', category_id: '2', name: 'Onion Rings', slug: 'onion-rings', description: 'Anéis de cebola empanados e crocantes', price: 16.90, image_url: '', is_available: true, is_promotion: true, promotion_label: '-20%', original_price: 21.90, sort_order: 5 },
  { id: '6', tenant_id: '1', category_id: '3', name: 'Milkshake Oreo', slug: 'milkshake-oreo', description: 'Sorvete de baunilha com Oreo', price: 22.90, image_url: '', is_available: true, is_promotion: false, sort_order: 6 },
  { id: '7', tenant_id: '1', category_id: '3', name: 'Suco Natural', slug: 'suco', description: 'Laranja, limão ou abacaxi', price: 12.90, image_url: '', is_available: true, is_promotion: false, sort_order: 7 },
  { id: '8', tenant_id: '1', category_id: '4', name: 'Brownie com Sorvete', slug: 'brownie', description: 'Brownie quentinho com sorvete de creme', price: 19.90, image_url: '', is_available: false, is_promotion: false, sort_order: 8 },
];

const tenantName = 'Burger House';

export default function PublicMenu() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { itemCount, total } = useCart();

  const promotions = useMemo(() => mockItems.filter(i => i.is_promotion && i.is_available), []);
  const filtered = useMemo(() => {
    let items = mockItems;
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (activeCategory) items = items.filter(i => i.category_id === activeCategory);
    return items.filter(i => !i.is_promotion || !activeCategory);
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero text-primary-foreground px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <UtensilsCrossed size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{tenantName}</h1>
              <p className="text-sm text-primary-foreground/60">Aberto agora • Pedido mínimo R$ 15,00</p>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40 border-0 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !activeCategory ? 'gradient-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
            }`}
          >
            Todos
          </button>
          {mockCategories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === c.id ? 'gradient-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Promotions */}
        {!activeCategory && !search && promotions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              🔥 Promoções
            </h2>
            <div className="space-y-2">
              {promotions.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <MenuCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items by Category */}
        {mockCategories.filter(c => !activeCategory || c.id === activeCategory).map(cat => {
          const catItems = filtered.filter(i => i.category_id === cat.id && (!i.is_promotion || activeCategory));
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id} className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3">{cat.name}</h2>
              <div className="space-y-2">
                {catItems.map(item => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Watermark for basic plan */}
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground/50">Cardápio digital por MenuGest</p>
        </div>
      </div>

      {/* Floating cart button */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border"
        >
          <div className="max-w-lg mx-auto">
            <Link to="/checkout">
              <Button className="w-full gradient-primary text-primary-foreground border-0 h-14 text-base" size="lg">
                <ShoppingCart size={20} className="mr-2" />
                Ver carrinho ({itemCount}) — R$ {total.toFixed(2)}
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
