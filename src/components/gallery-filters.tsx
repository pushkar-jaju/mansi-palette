"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Check } from "lucide-react";

interface GalleryFiltersProps {
  currentQuery: string;
  currentCategory: string;
  currentMedium: string;
  currentStatus: string;
  currentSort: string;
}

export function GalleryFilters({
  currentQuery,
  currentCategory,
  currentMedium,
  currentStatus,
  currentSort,
}: GalleryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const categories = ["All", "Landscape", "Abstract", "Floral", "Coastal", "Portrait"];
  const mediums = ["All", "Oil", "Acrylic", "Watercolor", "Mixed Media"];
  const statuses = ["All", "AVAILABLE", "SOLD"];
  const sorts = [
    { value: "newest", label: "Newest Arrivals" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "All" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="w-full bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-6 relative z-10">
      {/* Top Row: Search and Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-subtle">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            name="search"
            placeholder="Search paintings by title or description…"
            defaultValue={currentQuery}
            onChange={(e) => {
              // Simple debounce or handle update on change
              const val = e.target.value;
              const timer = setTimeout(() => {
                updateSearchParam("query", val);
              }, 500);
              return () => clearTimeout(timer);
            }}
            className="w-full bg-canvas text-ink text-xs pl-9 pr-4 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>

        {/* Sort Select */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <label htmlFor="gallery-sort" className="text-xs text-ink-subtle whitespace-nowrap">Sort by:</label>
          <select
            id="gallery-sort"
            value={currentSort}
            onChange={(e) => updateSearchParam("sort", e.target.value)}
            className="w-full md:w-auto bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
          >
            {sorts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-hairline" />

      {/* Bottom Row: Filter Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Categories */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary">Category</h4>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = currentCategory === cat || (cat === "All" && !currentCategory);
              return (
                <button
                  key={cat}
                  onClick={() => updateSearchParam("category", cat)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-all ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-canvas border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mediums */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary">Medium</h4>
          <div className="flex flex-wrap gap-1.5">
            {mediums.map((med) => {
              const isSelected = currentMedium === med || (med === "All" && !currentMedium);
              return (
                <button
                  key={med}
                  onClick={() => updateSearchParam("medium", med)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-all ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-canvas border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink"
                  }`}
                >
                  {med}
                </button>
              );
            })}
          </div>
        </div>

        {/* Statuses */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary">Availability</h4>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((stat) => {
              const isSelected = currentStatus === stat || (stat === "All" && !currentStatus);
              const label = stat === "AVAILABLE" ? "Available" : stat === "SOLD" ? "Sold" : "All";
              return (
                <button
                  key={stat}
                  onClick={() => updateSearchParam("status", stat)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-all ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-canvas border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isPending && (
        <div className="absolute inset-0 bg-canvas/30 backdrop-blur-[1px] rounded-md flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold tracking-wider text-primary uppercase animate-pulse">Filtering…</span>
        </div>
      )}
    </div>
  );
}
