import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { CartItem } from "@/types/cart";
import { CART_STORAGE_KEY } from "@/types/cart";

interface CartContextType {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  removeItem: (hotelId: string, roomId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.hotel_id === item.hotel_id && i.room_id === item.room_id);
      if (exists) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((hotelId: string, roomId: string) => {
    setItems((prev) => prev.filter((i) => !(i.hotel_id === hotelId && i.room_id === roomId)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getCartTotal = useCallback(() => items.reduce((sum, i) => sum + i.price, 0), [items]);

  const value: CartContextType = {
    items,
    count: items.length,
    addItem,
    removeItem,
    clearCart,
    getCartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
