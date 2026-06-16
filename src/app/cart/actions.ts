"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { parseAddressString, validatePincode, validatePhone } from "@/lib/address";

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

    if (!validatePhone(data.customerPhone)) {
      return { success: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }

    const parsedAddr = parseAddressString(data.shippingAddress);
    if (!parsedAddr.pincode || !validatePincode(parsedAddr.pincode)) {
      return { success: false, error: "A valid 6-digit Indian PIN code is required in the shipping address." };
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
          paymentStatus: "PENDING",
          paymentId: null,
          status: "PENDING_APPROVAL",
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

      // Fetch the full order with items and paintings to return
      const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              painting: true,
            },
          },
        },
      });

      return fullOrder;
    });

    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });
    const adminPhone = settings?.contactPhone || "+91 98765 43210";

    return { success: true, order: result, adminPhone };
  } catch (error: any) {
    console.error("Order creation failed:", error);
    return { success: false, error: getFriendlyErrorMessage(error, "An error occurred during checkout.") };
  }
}
