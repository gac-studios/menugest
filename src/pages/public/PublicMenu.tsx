import { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, UtensilsCrossed, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuCard from '@/components/public/MenuCard';
import { useCart } from '@/contexts/CartContext';
import { Link, useParams } from 'react-router-dom';
import { MenuItem, MenuCategory as MenuCategoryType, Promotion } from '@/lib/types';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { usePublicTenant } from '@/contexts/PublicTenantContext';

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const { tenant: tenantData } = usePublicTenant();

  const [categories, setCategories] = useState<MenuCategoryType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { itemCount, total } = useCart();

  useEffect(() => {
    if (!tenantData?.id) return;
    const loadData = async () => {
      const now = new Date().toISOString();
      const [catRes, itemsRes, promosRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('tenant_id', tenantData.id).eq('is_active', true).order('sort_order'),
        supabase.from('menu_items').select('*').eq('tenant_id', tenantData.id).eq('is_available', true).order('sort_order'),
        supabase.from('promotions').select('*').eq('tenant_id', tenantData.id).eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`),
      ]);
      setCategories(catRes.data || []);
      setMenuItems(itemsRes.data || []);
      setActivePromos(promosRes.data || []);
      setLoadingData(false);
    };
    loadData();
  }, [tenantData?.id]);

  const itemPromotions = useMemo(() => menuItems.filter(i => i.is_promotion && i.is_available), [menuItems]);
  const filtered = useMemo(() => {
    let items = menuItems;
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (activeCategory) items = items.filter(i => i.category_id === activeCategory);
    return items.filter(i => !i.is_promotion || !activeCategory);
  }, [search, activeCategory, menuItems]);

  if (loadingData) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tenantName = tenantData?.name || 'Menu';
  const logoUrl = tenantData?.logo_url || null;
  const coverUrl = tenantData?.cover_url || null;

  return (
    <div className="pb-24">
      {/* Cover Banner */}
      {coverUrl && (
        <div className="w-full h-[220px] overflow-hidden relative">
          <img src={coverUrl} alt={`Capa de ${tenantName}`} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="text-primary-foreground px-4 pt-6 pb-6 relative">
        <div className={`max-w-lg mx-auto relative z-10 ${!coverUrl ? 'rounded-xl p-4' : ''}`}
          style={!coverUrl ? { background: 'var(--brand-header, var(--gradient-hero))' } : undefined}
        >
          <div className="flex items-center gap-3 mb-4"
            style={coverUrl ? { color: 'var(--foreground)' } : undefined}
          >
            <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${coverUrl ? 'bg-muted border border-border' : 'bg-white/10 border border-white/20'}`}>
              {logoUrl ? (
                <img src={logoUrl} alt={tenantName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <UtensilsCrossed size={24} className="text-primary-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className={`text-xl font-bold ${coverUrl ? 'text-foreground' : ''}`}>{tenantName}</h1>
              <p className={`text-sm ${coverUrl ? 'text-muted-foreground' : 'text-primary-foreground/80'}`}>Aberto agora • Pedido mínimo R$ 15,00</p>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${coverUrl ? 'text-muted-foreground' : 'text-primary-foreground/40'}`} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm ${coverUrl ? 'bg-muted text-foreground placeholder:text-muted-foreground border border-border' : 'bg-black/20 text-primary-foreground placeholder:text-primary-foreground/50 border border-white/10'}`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`brand-chip px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !activeCategory ? 'brand-chip-active' : 'bg-card text-foreground border border-border'
            }`}
            style={!activeCategory ? { background: 'var(--brand-button, var(--brand, var(--gradient-primary)))', color: '#fff' } : undefined}
          >
            Todos
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === c.id ? '' : 'bg-card text-foreground border border-border'
              }`}
              style={activeCategory === c.id ? { background: 'var(--brand-button, var(--brand, var(--gradient-primary)))', color: '#fff' } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Campaign Promotions */}
        {!activeCategory && !search && activePromos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">🔥 Promoções</h2>
            <div className="space-y-2">
              {activePromos.map(promo => (
                <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-border/50 shadow-card"
                    style={{ backgroundColor: 'var(--brand-card-bg, hsl(var(--card)))' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--brand, var(--gradient-primary))' }}>
                      <Tag size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{promo.title}</h3>
                      {promo.description && <p className="text-sm text-muted-foreground mt-0.5">{promo.description}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Item Promotions */}
        {!activeCategory && !search && itemPromotions.length > 0 && (
          <div className="mb-6">
            {activePromos.length === 0 && (
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">🔥 Em Promoção</h2>
            )}
            <div className="space-y-2">
              {itemPromotions.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <MenuCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items by Category */}
        {categories.filter(c => !activeCategory || c.id === activeCategory).map(cat => {
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

        {/* Watermark */}
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground/50">Cardápio digital por MenuGest</p>
        </div>
      </div>

      {/* Floating cart button */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 p-4 backdrop-blur-lg border-t border-border"
          style={{ backgroundColor: 'var(--brand-page-bg, hsl(var(--background) / 0.8))' }}
        >
          <div className="max-w-lg mx-auto">
            <Link to={`/menu/${slug}/checkout`}>
              <Button
                className="w-full text-white border-0 h-14 text-base"
                size="lg"
                style={{ background: 'var(--brand-button, var(--brand, var(--gradient-primary)))' }}
              >
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
