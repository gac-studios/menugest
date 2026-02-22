import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ShoppingCart, UtensilsCrossed, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuCard from '@/components/public/MenuCard';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { MenuItem, MenuCategory as MenuCategoryType, Promotion } from '@/lib/types';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [tenantData, setTenantData] = useState<{ id: string; name: string; logo_url?: string | null; cover_url?: string | null; theme_bg_color?: string | null; is_active: boolean } | null>(null);
  const [categories, setCategories] = useState<MenuCategoryType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { itemCount, total } = useCart();

  useEffect(() => {
    const loadTenant = async () => {
      if (!slug) { setNotFound(true); setLoadingTenant(false); return; }
      // Persist slug so legacy /checkout can redirect correctly
      localStorage.setItem('last_menu_slug', slug);
      const { data: t } = await supabase
        .from('tenants')
        .select('id, name, logo_url, cover_url, theme_bg_color, is_active')
        .eq('slug', slug)
        .maybeSingle();

      if (!t || !t.is_active) { setNotFound(true); setLoadingTenant(false); return; }
      setTenantData(t);

      const now = new Date().toISOString();
      const [catRes, itemsRes, promosRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('tenant_id', t.id).eq('is_active', true).order('sort_order'),
        supabase.from('menu_items').select('*').eq('tenant_id', t.id).eq('is_available', true).order('sort_order'),
        supabase.from('promotions').select('*').eq('tenant_id', t.id).eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`),
      ]);
      setCategories(catRes.data || []);
      setMenuItems(itemsRes.data || []);
      setActivePromos(promosRes.data || []);
      setLoadingTenant(false);
    };
    loadTenant();
  }, [slug]);

  const itemPromotions = useMemo(() => menuItems.filter(i => i.is_promotion && i.is_available), [menuItems]);
  const filtered = useMemo(() => {
    let items = menuItems;
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (activeCategory) items = items.filter(i => i.category_id === activeCategory);
    return items.filter(i => !i.is_promotion || !activeCategory);
  }, [search, activeCategory, menuItems]);

  if (loadingTenant) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground">Cardápio não encontrado</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar ao início</Link>
      </div>
    </div>
  );

  const tenantName = tenantData?.name || 'Menu';
  const logoUrl = tenantData?.logo_url || null;
  const coverUrl = tenantData?.cover_url || null;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: tenantData?.theme_bg_color || '#ffffff' }}>
      {/* Header */}
      <div
        className="text-primary-foreground px-4 pt-8 pb-6 relative"
        style={coverUrl
          ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
        }
      >
        {/* overlay for readability when cover image exists */}
        {coverUrl && <div className="absolute inset-0 bg-black/50" />}
        <div className={`max-w-lg mx-auto relative z-10 ${!coverUrl ? 'gradient-hero' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-white/10 border border-white/20">
              {logoUrl ? (
                <img src={logoUrl} alt={tenantName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center">
                  <UtensilsCrossed size={24} className="text-primary-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{tenantName}</h1>
              <p className="text-sm text-primary-foreground/80">Aberto agora • Pedido mínimo R$ 15,00</p>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/20 text-primary-foreground placeholder:text-primary-foreground/50 border border-white/10 outline-none text-sm"
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
          {categories.map(c => (
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

        {/* Campaign Promotions (from promotions table) */}
        {!activeCategory && !search && activePromos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              🔥 Promoções
            </h2>
            <div className="space-y-2">
              {activePromos.map(promo => (
                <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50 shadow-card">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Tag size={16} className="text-primary-foreground" />
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

        {/* Item Promotions (menu_items with is_promotion=true) */}
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
            <Link to={`/menu/${slug}/checkout`}>
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
