"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist, useAuth } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { Trash2, ShoppingBag, Eye, Heart, ArrowLeft } from "lucide-react";

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlist, moveToCart, toggleWishlist, isLoadingWishlist } = useWishlist();

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-4">
          <Heart className="w-12 h-12 text-ink-tertiary animate-pulse" />
          <h1 className="text-xl font-semibold tracking-tight">Access Denied</h1>
          <p className="text-xs text-ink-subtle">
            You must be logged in to view and manage your personal wishlist.
          </p>
          <Link
            href="/auth/login?redirect=/gallery/wishlist"
            className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-sm border border-primary transition-all hover:bg-primary-hover"
          >
            Sign In to Account
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        {/* Back Link & Header */}
        <div className="flex flex-col gap-2">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-xs text-ink-subtle hover:text-ink transition-colors font-medium self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
          <h1 className="text-3xl font-semibold tracking-[-0.8px] mt-2 flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500 fill-red-500" />
            My Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs sm:text-sm text-ink-subtle">
            Save original canvases you love. Review options, move them to your cart, or remove them at any time.
          </p>
        </div>

        {isLoadingWishlist ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[350px] w-full bg-surface-1 border border-hairline rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-4 text-ink-subtle max-w-2xl mx-auto w-full">
            <Heart className="w-10 h-10 text-ink-tertiary" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink">Your wishlist is empty</span>
              <span className="text-xs text-ink-subtle">Browse the gallery collection and like paintings to save them here.</span>
            </div>
            <Link
              href="/gallery"
              className="mt-2 px-5 py-2 bg-primary border border-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary-hover transition-colors"
            >
              Explore Artworks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((painting) => {
              const isAvailable = painting.status === "AVAILABLE";
              return (
                <div
                  key={painting.id}
                  className="bg-surface-1 border border-hairline rounded-md p-4 flex flex-col justify-between animate-in fade-in duration-200"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-surface-2 mb-4">
                      <Image
                        src={painting.imageUrl}
                        alt={painting.title}
                        fill
                        sizes="(max-w-7xl) 33vw, 400px"
                        className="object-cover"
                      />
                      {!isAvailable && (
                        <span className="absolute top-2 right-2 px-2.5 py-0.5 text-[9px] font-bold rounded-sm bg-black/70 border border-hairline text-ink-subtle">
                          {painting.status}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-ink truncate max-w-[200px]">
                          {painting.title}
                        </h3>
                        <p className="text-[11px] text-ink-subtle mt-1">
                          {painting.width}&quot; &times; {painting.height}&quot; &bull; {painting.medium}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-ink">
                        ₹{painting.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-hairline/60">
                    <button
                      onClick={() => toggleWishlist(painting.id)}
                      className="py-2 px-3 bg-surface-2 hover:bg-surface-3 border border-hairline rounded-sm text-xs text-ink-muted hover:text-red-400 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>

                    {isAvailable ? (
                      <button
                        onClick={() => moveToCart(painting.id)}
                        className="py-2 px-3 bg-primary hover:bg-primary-hover border border-primary rounded-sm text-xs text-primary-foreground font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Buy Original
                      </button>
                    ) : (
                      <Link
                        href={`/gallery/${painting.id}`}
                        className="py-2 px-3 bg-surface-2 hover:bg-surface-3 border border-hairline rounded-sm text-xs text-ink-tertiary font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Page
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
