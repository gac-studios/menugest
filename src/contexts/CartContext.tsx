import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, MenuItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateObservation: (itemId: string, observation: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  updateObservation: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: MenuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [...prev, { item, quantity }];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(itemId);
    setItems((prev) =>
      prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity } : ci))
    );
  };

  const updateObservation = (itemId: string, observation: string) => {
    setItems((prev) =>
      prev.map((ci) => (ci.item.id === itemId ? { ...ci, observation } : ci))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const itemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateObservation, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
