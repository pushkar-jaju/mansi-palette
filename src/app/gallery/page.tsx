import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar, Footer } from "@/components/navigation";
import { GalleryFilters } from "@/components/gallery-filters";
import { WishlistHeartButton } from "@/components/wishlist-heart-button";
import { getOptimizedUrl } from "@/lib/cloudinary-utils";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    medium?: string;
    status?: string;
    sort?: string;
  }>;
}

export const revalidate = 0; // Dynamic rendering

export default async function GalleryPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const category = resolvedParams.category || "All";
  const medium = resolvedParams.medium || "All";
  const status = resolvedParams.status || "All";
  const sort = resolvedParams.sort || "newest";

  // Build where clause
  const where: any = {};
  if (category !== "All") where.category = category;
  
  if (medium !== "All") {
    where.medium = { contains: medium, mode: "insensitive" };
  }
  
  if (status !== "All") {
    where.status = status;
  }
  
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  // Build order clause
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };

  let paintings: any[] = [];
  try {
    paintings = await prisma.painting.findMany({
      where,
      orderBy,
    });
  } catch (error) {
    console.error("Failed to query paintings:", error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
        {/* Page Header */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-primary">Original Fine Art</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-1.0px]">The Gallery Collection</h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
            Browse original hand-painted canvases by Mansi. Each piece is custom-stretched, signed, varnished, and accompanied by a certificate of authenticity.
          </p>
        </div>

        {/* Filters bar wrapped in Suspense to support useSearchParams inside client components */}
        <Suspense fallback={<div className="h-32 w-full bg-surface-1 border border-hairline rounded-md animate-pulse" />}>
          <GalleryFilters
            currentQuery={query}
            currentCategory={category}
            currentMedium={medium}
            currentStatus={status}
            currentSort={sort}
          />
        </Suspense>
 
        {/* Paintings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paintings.length > 0 ? (
            paintings.map((painting) => (
              <Link
                key={painting.id}
                href={`/gallery/${painting.id}`}
                className="bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2 transition-all duration-200 rounded-md p-4 flex flex-col group"
              >
                <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-surface-2 mb-4">
                  <Image
                    src={getOptimizedUrl(painting.imageUrl)}
                    alt={painting.title}
                    fill
                    sizes="(max-w-7xl) 33vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                    <WishlistHeartButton paintingId={painting.id} size={15} />
                    {painting.status === "SOLD" && (
                      <span className="px-2.5 py-1 text-[9px] font-bold rounded-sm bg-black/70 border border-hairline text-ink-subtle">
                        SOLD
                      </span>
                    )}
                  </div>
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
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-ink text-right">
                      ₹{painting.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-ink-tertiary mt-1 uppercase tracking-wide text-right">
                      {painting.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-3 text-ink-subtle">
              <span className="text-xs">No artworks match your selected filters.</span>
              <Link href="/gallery" className="text-xs text-primary hover:text-primary-focus font-semibold">
                Clear Filters
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
