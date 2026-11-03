import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CartContextValue = {
  quantities: Record<string, number>;
  itemCount: number;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const addItem = useCallback((id: string) => {
    setQuantities((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }, []);
  const removeItem = useCallback((id: string) => {
    setQuantities((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) - 1;
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }, []);
  const clearCart = useCallback(() => setQuantities({}), []);
  const itemCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const value = useMemo(
    () => ({ quantities, itemCount, addItem, removeItem, clearCart }),
    [quantities, itemCount, addItem, removeItem, clearCart],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
