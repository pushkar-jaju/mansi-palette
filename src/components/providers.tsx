"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWishlistAction, toggleWishlistAction } from "@/app/actions";

// Types
export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
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

interface WishlistContextType {
  wishlist: any[];
  wishlistCount: number;
  toggleWishlist: (paintingId: string) => Promise<void>;
  isInWishlist: (paintingId: string) => boolean;
  moveToCart: (paintingId: string) => Promise<void>;
  isLoadingWishlist: boolean;
}

// Contexts
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CartContext = createContext<CartContextType | undefined>(undefined);
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

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
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
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
      setWishlist([]);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Wishlist Functions
  const loadWishlist = async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setIsLoadingWishlist(true);
    try {
      const res = await getWishlistAction();
      if (res.success && res.items) {
        setWishlist(res.items);
      }
    } catch (e) {
      console.error("Failed to fetch wishlist:", e);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const toggleWishlist = async (paintingId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    try {
      const res = await toggleWishlistAction(paintingId);
      if (res.success) {
        await loadWishlist();
      }
    } catch (e) {
      console.error("Failed to toggle wishlist:", e);
    }
  };

  const isInWishlist = (paintingId: string) => {
    return wishlist.some((item) => item.id === paintingId);
  };

  const moveToCart = async (paintingId: string) => {
    const item = wishlist.find((i) => i.id === paintingId);
    if (!item) return;

    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.imageUrl,
      medium: item.medium,
      width: item.width,
      height: item.height,
    });

    try {
      const res = await toggleWishlistAction(paintingId);
      if (res.success) {
        await loadWishlist();
      }
    } catch (e) {
      console.error("Failed to remove from wishlist after moving to cart:", e);
    }
  };

  const cartCount = cart.length;
  const cartTotal = cart.reduce((total, item) => total + item.price, 0);
  const wishlistCount = wishlist.length;

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
        <WishlistContext.Provider
          value={{
            wishlist,
            wishlistCount,
            toggleWishlist,
            isInWishlist,
            moveToCart,
            isLoadingWishlist,
          }}
        >
          {children}
        </WishlistContext.Provider>
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

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
