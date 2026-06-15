"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";

export async function createOrder(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paintingIds: string[];
  totalAmount: number;
}) {
  try {
    const session = await getSession();

    if (!session) {
      return { success: false, error: "Authentication required to place orders." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { emailVerified: true },
    });

    if (!dbUser || !dbUser.emailVerified) {
      return { success: false, error: "Please verify your email address to place orders." };
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(data.customerPhone)) {
      return { success: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }

    if (!data.customerName || !data.customerEmail || !data.shippingAddress || data.paintingIds.length === 0) {
      return { success: false, error: "Please fill out all required details." };
    }

    // 1. Verify that all paintings are still available!
    const paintings = await prisma.painting.findMany({
      where: {
        id: { in: data.paintingIds },
        status: "AVAILABLE",
      },
    });

    if (paintings.length !== data.paintingIds.length) {
      return {
        success: false,
        error: "One or more paintings in your cart have already been sold. Please review your cart.",
      };
    }

    // 2. Perform checkout in a transaction to guarantee exclusivity of original art purchase
    const result = await prisma.$transaction(async (tx) => {
      // Create the Order
      const order = await tx.order.create({
        data: {
          userId: session?.id || null,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || "",
          shippingAddress: data.shippingAddress,
          totalAmount: data.totalAmount,
          paymentStatus: "PAID", // Simulated payment success
          paymentId: `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          status: "PROCESSING",
        },
      });

      // Create Order Items
      const orderItems = paintings.map((painting) => ({
        orderId: order.id,
        paintingId: painting.id,
        price: painting.price,
      }));

      await tx.orderItem.createMany({
        data: orderItems,
      });

      // Mark the paintings as SOLD
      await tx.painting.updateMany({
        where: { id: { in: data.paintingIds } },
        data: { status: "SOLD" },
      });

      return order;
    });

    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("Order creation failed:", error);
    return { success: false, error: getFriendlyErrorMessage(error, "An error occurred during checkout.") };
  }
}
