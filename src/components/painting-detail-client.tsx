"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, CartItem } from "./providers";
import { Sparkles, ShoppingBag, Eye, X, Check, ArrowLeft, Ruler } from "lucide-react";

interface PaintingDetailClientProps {
  painting: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    price: number;
    width: number;
    height: number;
    medium: string;
    canvasType: string;
    frameOption: string;
    category: string;
    status: "AVAILABLE" | "SOLD";
    isFeatured: boolean;
  };
}

export function PaintingDetailClient({ painting }: PaintingDetailClientProps) {
  const { addToCart, isInCart } = useCart();
  const [viewInRoomOpen, setViewInRoomOpen] = useState(false);
  const [wallColor, setWallColor] = useState("#1e2022"); // Default Slate Dark

  const wallColors = [
    { name: "Sleek Charcoal", hex: "#111215" },
    { name: "Deep Navy", hex: "#131e2d" },
    { name: "Muted Teal", hex: "#1a2a29" },
    { name: "Warm Clay", hex: "#2f2622" },
  ];

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: painting.id,
      title: painting.title,
      price: painting.price,
      imageUrl: painting.imageUrl,
      medium: painting.medium,
      width: painting.width,
      height: painting.height,
    };
    addToCart(cartItem);
  };

  const isAlreadyInCart = isInCart(painting.id);
  const isAvailable = painting.status === "AVAILABLE";

  // Sizing ratios: We assume a standard modern sofa is 80 inches wide.
  // We represent the 80 inches with a CSS container of width 320px.
  // Thus, 1 inch = 4px.
  const pixelWidth = painting.width * 4.5;
  const pixelHeight = painting.height * 4.5;

  return (
    <div className="w-full flex flex-col gap-12">
      {/* Back to Gallery Link */}
      <div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-xs text-ink-subtle hover:text-ink transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </Link>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Image and Zoom */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full bg-surface-1 border border-hairline rounded-md overflow-hidden p-4">
            <div className="relative w-full h-full rounded-sm overflow-hidden bg-surface-2">
              <Image
                src={painting.imageUrl}
                alt={painting.title}
                fill
                priority
                sizes="(max-w-7xl) 60vw, 700px"
                className="object-contain"
              />
            </div>
            {painting.status === "SOLD" && (
              <span className="absolute top-6 right-6 px-3 py-1 text-[10px] font-bold rounded-sm bg-black/80 border border-hairline text-ink-subtle">
                SOLD
              </span>
            )}
          </div>

          {/* Interactive Viewer Button */}
          <button
            onClick={() => setViewInRoomOpen(true)}
            className="w-full py-3 rounded-sm bg-surface-1 hover:bg-surface-2 border border-hairline text-xs font-semibold text-ink flex items-center justify-center gap-2 transition-all hover:border-hairline-strong active:scale-[0.99]"
          >
            <Eye className="w-4.5 h-4.5 text-primary" />
            View in a Room (Virtual Scale Mockup)
          </button>
        </div>

        {/* Right Column: Copy & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary">
              Original Fine Art &bull; {painting.category}
            </span>
            <h1 className="text-3xl font-semibold tracking-[-0.8px] leading-tight text-ink">
              {painting.title}
            </h1>
            <p className="text-xl font-medium text-ink">
              ${painting.price.toLocaleString()}
            </p>
          </div>

          <hr className="border-hairline" />

          {/* Core Info Details */}
          <div className="flex flex-col gap-4">
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {painting.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs mt-2 bg-surface-1/50 border border-hairline/80 rounded-md p-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-ink-subtle uppercase tracking-wide">Medium</span>
                <span className="font-semibold text-ink-muted">{painting.medium}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-ink-subtle uppercase tracking-wide">Dimensions</span>
                <span className="font-semibold text-ink-muted flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-primary" />
                  {painting.width}&quot; &times; {painting.height}&quot; inches
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-ink-subtle uppercase tracking-wide">Substrate</span>
                <span className="font-semibold text-ink-muted">{painting.canvasType}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-ink-subtle uppercase tracking-wide">Framing</span>
                <span className="font-semibold text-ink-muted">{painting.frameOption}</span>
              </div>
            </div>
          </div>

          <hr className="border-hairline" />

          {/* Cart Buttons */}
          <div className="flex flex-col gap-3">
            {isAvailable ? (
              <button
                onClick={handleAddToCart}
                disabled={isAlreadyInCart}
                className={`w-full py-3.5 rounded-sm text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  isAlreadyInCart
                    ? "bg-surface-2 border-hairline text-ink-subtle cursor-default"
                    : "bg-primary border-primary hover:bg-primary-hover text-primary-foreground active:scale-[0.98]"
                }`}
              >
                {isAlreadyInCart ? (
                  <>
                    <Check className="w-4 h-4 text-primary" />
                    Already in Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Purchase Original Artwork
                  </>
                )}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 rounded-sm bg-surface-2 border border-hairline text-xs font-semibold text-ink-tertiary cursor-not-allowed flex items-center justify-center gap-2"
              >
                Sold Out (Original Artwork)
              </button>
            )}

            <p className="text-[10px] text-ink-subtle leading-normal text-center mt-1">
              Museum-quality packaging. Includes a signed Certificate of Authenticity. Shipped insured with tracking.
            </p>
          </div>
        </div>
      </div>

      {/* VIEW IN A ROOM MODAL (VIRTUAL SIMULATOR) */}
      {viewInRoomOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-4xl bg-surface-1 border border-hairline rounded-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">View in a Room Simulator</h3>
                <p className="text-[10px] text-ink-subtle mt-0.5">
                  Visual scale preview: painting size is proportional to an 80&quot; sofa (approx. 1:1 scale).
                </p>
              </div>
              <button
                onClick={() => setViewInRoomOpen(false)}
                className="p-1 rounded-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all"
                aria-label="Close Simulator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wall Container Area */}
            <div 
              className="flex-1 min-h-[380px] relative flex flex-col items-center justify-end p-8 transition-colors duration-500 overflow-hidden"
              style={{ backgroundColor: wallColor }}
            >
              {/* Painting */}
              <div 
                className="absolute shadow-2xl border-4 border-black/85 bg-white/5 transition-all duration-300 flex items-center justify-center"
                style={{ 
                  width: `${pixelWidth}px`, 
                  height: `${pixelHeight}px`,
                  bottom: "185px", // Anchored above the sofa backrest
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={painting.imageUrl}
                    alt={painting.title}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              </div>

              {/* Modern Minimalist Sofa (Vector Representation) */}
              <div className="w-[360px] h-[120px] relative flex flex-col justify-end z-10 pointer-events-none mb-4">
                {/* Backrest cushion */}
                <div className="w-full h-[60px] bg-slate-800/95 border-b border-slate-700/50 rounded-t-lg shadow-md flex justify-between px-4">
                  <div className="w-[150px] h-full border-r border-slate-700/30 bg-slate-800/90 rounded-t" />
                  <div className="w-[150px] h-full bg-slate-800/90 rounded-t" />
                </div>
                {/* Seat Cushion */}
                <div className="w-full h-[40px] bg-slate-800 border-t border-slate-700/50 rounded shadow-inner flex px-2 gap-1">
                  <div className="flex-1 h-full bg-slate-800" />
                  <div className="flex-1 h-full bg-slate-800 border-l border-slate-700/30" />
                </div>
                {/* Armrests */}
                <div className="absolute left-[-10px] bottom-[10px] w-[20px] h-[75px] bg-slate-700 rounded-lg shadow-md" />
                <div className="absolute right-[-10px] bottom-[10px] w-[20px] h-[75px] bg-slate-700 rounded-lg shadow-md" />
                {/* Base Legs */}
                <div className="w-full h-[15px] flex justify-between px-10">
                  <div className="w-1.5 h-full bg-amber-900 rounded-b shadow" />
                  <div className="w-1.5 h-full bg-amber-900 rounded-b shadow" />
                </div>
              </div>

              {/* Room floor mockup */}
              <div className="absolute bottom-0 inset-x-0 h-[25px] bg-neutral-900/60 border-t border-black/80 z-0" />
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-hairline bg-surface-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] text-ink-subtle uppercase tracking-wider">Wall Tone Palette</span>
                <div className="flex gap-2">
                  {wallColors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setWallColor(color.hex)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        wallColor === color.hex ? "border-primary scale-110" : "border-hairline"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="text-right text-[11px] text-ink-subtle">
                Artwork Dimensions: <span className="font-semibold text-ink">{painting.width}&quot; &times; {painting.height}&quot;</span> inches
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
