"use client";

import React, { useTransition } from "react";
import { Heart } from "lucide-react";
import { useAuth, useWishlist } from "./providers";
import { useRouter } from "next/navigation";

interface WishlistHeartButtonProps {
  paintingId: string;
  className?: string;
  size?: number;
}

export function WishlistHeartButton({ paintingId, className = "", size = 18 }: WishlistHeartButtonProps) {
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isLiked = isInWishlist(paintingId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/auth/login?redirect=/gallery`);
      return;
    }

    startTransition(async () => {
      await toggleWishlist(paintingId);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`p-2.5 rounded-full transition-all duration-300 transform active:scale-90 flex items-center justify-center cursor-pointer border ${
        isLiked
          ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 shadow-md shadow-red-500/10"
          : "bg-black/60 backdrop-blur-xs border-hairline text-ink-subtle hover:text-ink hover:scale-105"
      } ${className}`}
      title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
      style={{ width: `${size + 16}px`, height: `${size + 16}px` }}
    >
      <Heart
        className={`transition-all duration-300 ${
          isLiked ? "fill-red-500 scale-110" : ""
        }`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </button>
  );
}
