"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types
export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  medium: string;
  width: number;
  height: number;
}

interface AuthContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isInCart: (itemId: string) => boolean;
  cartCount: number;
  cartTotal: number;
}

// Contexts
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);

// Providers
export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: UserSession | null;
}) {
  const [user, setUser] = useState<UserSession | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("mp_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("mp_cart", JSON.stringify(newCart));
  };

  const addToCart = (item: CartItem) => {
    if (cart.some((i) => i.id === item.id)) return;
    updateCart([...cart, item]);
  };

  const removeFromCart = (itemId: string) => {
    updateCart(cart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    updateCart([]);
  };

  const isInCart = (itemId: string) => {
    return cart.some((item) => item.id === itemId);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = cart.length;
  const cartTotal = cart.reduce((total, item) => total + item.price, 0);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      <CartContext.Provider
        value={{
          cart,
          addToCart,
          removeFromCart,
          clearCart,
          isInCart,
          cartCount,
          cartTotal,
        }}
      >
        {children}
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

// Custom Hooks
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
