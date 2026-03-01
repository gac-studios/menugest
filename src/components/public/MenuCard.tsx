import { MenuItem } from '@/lib/types';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

interface MenuCardProps {
  item: MenuItem;
  compact?: boolean;
}

export default function MenuCard({ item, compact }: MenuCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [imgError, setImgError] = useState(false);
  const cartItem = items.find(ci => ci.item.id === item.id);
  const qty = cartItem?.quantity ?? 0;

  if (!item.is_available) {
    return (
      <div className="flex gap-3 p-3 rounded-xl bg-muted/50 opacity-50">
        {item.image_url && !imgError && (
          <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover grayscale" onError={() => setImgError(true)} />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-muted-foreground line-through">{item.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">Indisponível</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 p-3 rounded-xl shadow-card hover:shadow-elevated transition-shadow border border-border/50"
      style={{ backgroundColor: 'var(--brand-card-bg, hsl(var(--card)))' }}
    >
      {item.image_url && !imgError ? (
        <div className="relative shrink-0">
          <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover" onError={() => setImgError(true)} />
          {item.is_promotion && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              PROMO
            </span>
          )}
        </div>
      ) : (
        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <span className="text-2xl">🍽️</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
        {item.description && !compact && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold" style={{ color: 'var(--brand-price, var(--brand, hsl(var(--primary))))' }}>
              R$ {item.price.toFixed(2)}
            </span>
            {item.original_price && item.original_price > item.price && (
              <span className="text-xs text-muted-foreground line-through">R$ {item.original_price.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {qty > 0 && (
              <>
                <button onClick={() => updateQuantity(item.id, qty - 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{qty}</span>
              </>
            )}
            <button
              onClick={() => addItem(item)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--brand-button-plus, var(--brand-button, var(--brand, var(--gradient-primary))))' }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
