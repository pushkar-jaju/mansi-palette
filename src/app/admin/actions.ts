"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import { revalidatePath } from "next/cache";

// Helper to verify admin role
async function verifyAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Access denied. Admin authorization required.");
  }
  return session;
}

export async function addPainting(formData: FormData) {
  try {
    await verifyAdmin();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const widthStr = formData.get("width") as string;
    const heightStr = formData.get("height") as string;
    const medium = formData.get("medium") as string;
    const canvasType = formData.get("canvasType") as string;
    const frameOption = formData.get("frameOption") as string;
    const category = formData.get("category") as string;
    const isFeaturedStr = formData.get("isFeatured") as string;
    const file = formData.get("imageFile") as File;

    if (!title || !description || !priceStr || !widthStr || !heightStr || !medium || !canvasType || !category || !file) {
      return { success: false, error: "Please fill out all required fields and choose an image file." };
    }

    const price = parseFloat(priceStr);
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    const isFeatured = isFeaturedStr === "true";

    if (isNaN(price) || isNaN(width) || isNaN(height)) {
      return { success: false, error: "Invalid pricing or dimension numbers." };
    }

    let imageUrl = "/paintings/misty_forest.png"; // Default fallback
    if (file && file.size > 0) {
      imageUrl = await uploadImage(file);
    }

    await prisma.painting.create({
      data: {
        title,
        description,
        price,
        width,
        height,
        medium,
        canvasType,
        frameOption: frameOption || "Unframed",
        category,
        imageUrl,
        isFeatured,
        status: "AVAILABLE",
      },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (e: any) {
    console.error("Admin add painting error:", e);
    return { success: false, error: e.message || "Failed to add painting." };
  }
}

export async function deletePainting(paintingId: string) {
  try {
    await verifyAdmin();

    await prisma.painting.delete({
      where: { id: paintingId },
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (e: any) {
    console.error("Admin delete painting error:", e);
    return { success: false, error: e.message || "Failed to delete painting." };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await verifyAdmin();

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Admin update order status error:", e);
    return { success: false, error: e.message || "Failed to update order status." };
  }
}

export async function updateCommissionStatus(commissionId: string, status: any, notes: string) {
  try {
    await verifyAdmin();

    await prisma.commissionRequest.update({
      where: { id: commissionId },
      data: { status, notes },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Admin update commission error:", e);
    return { success: false, error: e.message || "Failed to update commission request." };
  }
}
