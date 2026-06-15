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

  // Double check that database state confirms email is verified
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { emailVerified: true },
  });

  if (!dbUser || !dbUser.emailVerified) {
    redirect("/");
  }

  // 2. Fetch admin stats and lists in parallel
  const [
    revenueAgg,
    totalPaintings,
    availablePaintings,
    soldPaintings,
    totalOrders,
    pendingOrders,
    totalCommissions,
    totalCustomers,
    paintings,
    orders,
    commissions,
    reviews,
    customers,
    settings
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.painting.count(),
    prisma.painting.count({
      where: { status: "AVAILABLE" },
    }),
    prisma.painting.count({
      where: { status: "SOLD" },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: "PENDING" },
    }),
    prisma.commissionRequest.count(),
    prisma.user.count({
      where: { role: "USER" },
    }),
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
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commissionRequest.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      include: {
        painting: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
        },
        commissions: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
    }),
  ]);

  const stats = {
    totalRevenue: revenueAgg._sum.totalAmount || 0,
    totalPaintings,
    availablePaintings,
    soldPaintings,
    totalOrders,
    pendingOrders,
    totalCommissions,
    totalCustomers,
  };

  const storeSettings = settings || {
    id: "default",
    storeName: "Mansi's Palette",
    storeLogo: null,
    contactEmail: "mansipalette@gmail.com",
    contactPhone: "+91 98765 43210",
    contactAddress: "Mumbai, India",
    instagramUrl: "https://instagram.com/mansispalette",
    facebookUrl: "https://facebook.com/mansispalette",
    pinterestUrl: "https://pinterest.com/mansispalette",
    baseShippingCost: 150.0,
    freeShippingThreshold: 5000.0,
    estimatedDeliveryDays: 7,
    notifyOnNewOrder: true,
    notifyOnNewCommission: true,
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
          reviews={reviews}
          customers={customers}
          settings={storeSettings}
        />
      </main>

      <Footer />
    </div>
  );
}
