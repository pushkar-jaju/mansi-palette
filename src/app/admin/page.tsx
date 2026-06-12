import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar, Footer } from "@/components/navigation";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export const revalidate = 0; // Dynamic rendering

export default async function AdminPage() {
  const session = await getSession();

  // 1. Session authorization check
  if (!session || session.role !== "ADMIN") {
    redirect("/auth/login");
  }

  // 2. Fetch admin stats and lists in parallel
  const [
    revenueAgg,
    totalOrders,
    totalPaintings,
    totalCommissions,
    paintings,
    orders,
    commissions
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.count({
      where: { paymentStatus: "PAID" },
    }),
    prisma.painting.count(),
    prisma.commissionRequest.count(),
    prisma.painting.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      include: {
        items: {
          include: {
            painting: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commissionRequest.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = {
    totalRevenue: revenueAgg._sum.totalAmount || 0,
    totalOrders,
    totalPaintings,
    totalCommissions,
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AdminDashboardClient
          stats={stats}
          paintings={paintings}
          orders={orders}
          commissions={commissions}
        />
      </main>

      <Footer />
    </div>
  );
}
