import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar, Footer } from "@/components/navigation";
import { PaintingDetailClient } from "@/components/painting-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Dynamic rendering

export default async function PaintingPage({ params }: PageProps) {
  const { id } = await params;

  let painting = null;
  try {
    painting = await prisma.painting.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching painting:", error);
  }

  if (!painting) {
    return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PaintingDetailClient painting={painting} />
      </main>

      <Footer />
    </div>
  );
}
