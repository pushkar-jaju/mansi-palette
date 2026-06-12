import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar, Footer } from "@/components/navigation";
import { ArrowRight, Sparkles, Paintbrush, Layers, ShieldCheck } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  // Fetch featured paintings from PostgreSQL database
  let featuredPaintings: any[] = [];
  try {
    featuredPaintings = await prisma.painting.findMany({
      where: { isFeatured: true },
      take: 3,
    });
  } catch (error) {
    console.error("Failed to fetch featured paintings:", error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 sm:pt-28 sm:pb-36 border-b border-hairline">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Description */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-surface-1 border border-hairline text-[11px] font-semibold text-primary uppercase tracking-[0.4px]">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Original Fine Art Studio</span>
              </div>
              
              <h1 className="font-sans font-normal text-4xl sm:text-5xl lg:text-[64px] leading-[1.1] tracking-[-1.6px] text-ink max-w-xl">
                Exquisite brush strokes, <span className="font-serif italic text-3xl sm:text-4xl lg:text-[64px]">timeless feelings</span>.
              </h1>
              
              <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-lg">
                Explore hand-painted fine art, textured abstracts, and serene landscapes crafted on premium cotton canvas. Welcome to Mansi’s Palette—where colors speak the language of emotions.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/gallery"
                  className="w-full sm:w-auto text-center text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-sm border border-primary-focus transition-all flex items-center justify-center gap-2"
                >
                  Explore Gallery
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/commissions"
                  className="w-full sm:w-auto text-center text-xs font-semibold bg-surface-1 hover:bg-surface-2 border border-hairline text-ink px-5 py-2.5 rounded-sm transition-all flex items-center justify-center gap-2"
                >
                  Commission Custom Art
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Art Showcase */}
            <div className="lg:col-span-6 flex justify-center w-full">
              <div className="relative w-full max-w-[500px] aspect-[4/5] bg-surface-1 border border-hairline rounded-md p-4 group overflow-hidden">
                <div className="relative w-full h-full rounded-sm overflow-hidden bg-surface-2">
                  <Image
                    src="/paintings/misty_forest.png"
                    alt="Featured Artwork: Whispers of the Forest"
                    fill
                    sizes="(max-w-7xl) 50vw, 500px"
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-canvas/80 border-t border-hairline p-4 flex flex-col justify-end">
                    <p className="text-[11px] font-semibold text-primary tracking-widest uppercase mb-1">Featured Painting</p>
                    <h3 className="text-sm font-semibold text-ink tracking-tight">Whispers of the Forest</h3>
                    <p className="text-[11px] text-ink-subtle mt-0.5">24&quot; &times; 36&quot; &bull; Oil on Canvas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Paintings Section */}
      <section className="py-24 border-b border-hairline bg-surface-1/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-primary mb-1">Curated Inventory</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.6px] text-ink">
                Featured Originals
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              View Full Gallery
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPaintings.length > 0 ? (
              featuredPaintings.map((painting) => (
                <Link
                  key={painting.id}
                  href={`/gallery/${painting.id}`}
                  className="bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2 transition-all duration-200 rounded-md p-4 flex flex-col group"
                >
                  <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-surface-2 mb-4">
                    <Image
                      src={painting.imageUrl}
                      alt={painting.title}
                      fill
                      sizes="(max-w-7xl) 33vw, 400px"
                      className="object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    {painting.status === "SOLD" && (
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 text-[9px] font-bold rounded-sm bg-black/70 border border-hairline text-ink-subtle">
                        SOLD
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors truncate max-w-[200px]">
                        {painting.title}
                      </h3>
                      <p className="text-[11px] text-ink-subtle mt-1">
                        {painting.width}&quot; &times; {painting.height}&quot; &bull; {painting.medium}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-ink text-right">
                      ${painting.price.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-ink-subtle text-xs">
                No featured paintings found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Artist Statement Section */}
      <section className="py-24 border-b border-hairline relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-1 border border-hairline text-primary mb-6">
            <Paintbrush className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-primary mb-2">Behind the Palette</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.6px] text-ink mb-6">
            Artist Statement
          </h2>
          <blockquote className="text-base sm:text-lg text-ink-muted italic leading-relaxed mb-6 font-light max-w-2xl mx-auto">
            &ldquo;Every canvas starts as an unspoken feeling. My palette is a medium to capture fleeting moments of beauty—whether it&apos;s the gold reflections in a coastal wave or the deep calm of a misty morning. Art should not just decorate a wall; it should anchor a room and evoke a conversation.&rdquo;
          </blockquote>
          <cite className="block text-xs font-semibold text-ink uppercase tracking-wider not-italic">
            — Mansi Sharma
          </cite>
        </div>
      </section>

      {/* Commission Teaser Banner */}
      <section className="py-24 bg-surface-1/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-1 border border-hairline rounded-md p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-4 text-center md:text-left max-w-md relative z-10">
              <div className="inline-flex self-center md:self-start items-center gap-1 px-2.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary uppercase tracking-[0.4px]">
                <Layers className="w-3 h-3" />
                <span>Custom Artwork</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
                Commission a Custom Painting
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Looking for a specific dimensions, medium, or color palette to match your home? Work directly with Mansi to bring your unique vision to life on canvas.
              </p>
            </div>
 
            <div className="relative z-10 w-full md:w-auto">
              <Link
                href="/commissions"
                className="w-full md:w-auto text-center inline-flex items-center justify-center gap-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-3 rounded-sm border border-primary-focus transition-all"
              >
                Start Commission Request
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Trust badging */}
      <section className="py-12 border-t border-b border-hairline bg-canvas/30 text-ink-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
            <div className="flex flex-col items-center gap-2 p-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-ink">Museum-Quality Canvas</h4>
              <p className="text-[11px] text-ink-tertiary">Acid-free substrates, lightfast archival pigments.</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-2">
              <Paintbrush className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-ink">Handmade Authenticity</h4>
              <p className="text-[11px] text-ink-tertiary">Signed, varnished, and delivered with a Certificate of Authenticity.</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-2">
              <Layers className="w-6 h-6 text-primary" />
              <h4 className="font-semibold text-ink">Secure Art Packaging</h4>
              <p className="text-[11px] text-ink-tertiary">Professional crating and fully insured trackable global shipping.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
