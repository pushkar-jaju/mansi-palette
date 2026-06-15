"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/errors";

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

    const files = formData.getAll("imageFiles") as File[];
    const imageUrls: string[] = [];

    for (const f of files) {
      if (f && f.size > 0) {
        const url = await uploadImage(f);
        imageUrls.push(url);
      }
    }

    const singleFile = formData.get("imageFile") as File;
    if (singleFile && singleFile.size > 0) {
      const url = await uploadImage(singleFile);
      if (!imageUrls.includes(url)) {
        imageUrls.unshift(url);
      }
    }

    if (!title || !description || !priceStr || !widthStr || !heightStr || !medium || !canvasType || !category || imageUrls.length === 0) {
      return { success: false, error: "Please fill out all required fields and upload at least one image." };
    }

    const price = parseFloat(priceStr);
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    const isFeatured = isFeaturedStr === "true";

    if (isNaN(price) || isNaN(width) || isNaN(height)) {
      return { success: false, error: "Invalid pricing or dimension numbers." };
    }

    const imageUrl = imageUrls[0];

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
        images: imageUrls,
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
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to add painting.") };
  }
}

export async function editPainting(paintingId: string, formData: FormData) {
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
    const status = formData.get("status") as any; // PaintingStatus enum
    
    // Parse existing images
    const existingImagesJson = formData.get("existingImages") as string;
    let images: string[] = [];
    if (existingImagesJson) {
      try {
        images = JSON.parse(existingImagesJson);
      } catch {
        images = existingImagesJson.split(",").filter(Boolean);
      }
    }

    // New uploaded files
    const files = formData.getAll("imageFiles") as File[];
    for (const f of files) {
      if (f && f.size > 0) {
        const url = await uploadImage(f);
        images.push(url);
      }
    }

    // Single upload file input fallback
    const singleFile = formData.get("imageFile") as File;
    if (singleFile && singleFile.size > 0) {
      const url = await uploadImage(singleFile);
      images.push(url);
    }

    if (!title || !description || !priceStr || !widthStr || !heightStr || !medium || !canvasType || !category) {
      return { success: false, error: "Please fill out all required fields." };
    }

    const price = parseFloat(priceStr);
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    const isFeatured = isFeaturedStr === "true";

    if (isNaN(price) || isNaN(width) || isNaN(height)) {
      return { success: false, error: "Invalid pricing or dimension numbers." };
    }

    const imageUrl = images.length > 0 ? images[0] : "/paintings/misty_forest.png";

    await prisma.painting.update({
      where: { id: paintingId },
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
        status,
        isFeatured,
        imageUrl,
        images,
      },
    });

    revalidatePath("/gallery");
    revalidatePath(`/gallery/${paintingId}`);
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (e: any) {
    console.error("Admin edit painting error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to edit painting.") };
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
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to delete painting.") };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  courierName?: string,
  trackingNumber?: string,
  note?: string
) {
  try {
    await verifyAdmin();

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!currentOrder) {
      return { success: false, error: "Order not found." };
    }

    const updateData: any = { status };
    if (courierName !== undefined) updateData.courierName = courierName;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Create a timeline event
    let eventNote = note || `Order status updated to ${status}.`;
    if (status === "SHIPPED" && courierName) {
      eventNote = `Order shipped via ${courierName} (Tracking #: ${trackingNumber || "N/A"}).`;
    }

    await prisma.orderTimelineEvent.create({
      data: {
        orderId,
        status,
        note: eventNote,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Admin update order status error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to update order status.") };
  }
}

export async function addOrderTimelineEvent(orderId: string, status: string, note?: string) {
  try {
    await verifyAdmin();

    await prisma.orderTimelineEvent.create({
      data: {
        orderId,
        status,
        note: note || `Manual log: ${status}`,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Admin add timeline event error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to add timeline event.") };
  }
}

export async function updateCommissionStatus(
  commissionId: string,
  status: any,
  notes?: string,
  quoteAmount?: number,
  progress?: number
) {
  try {
    await verifyAdmin();

    const data: any = { status };
    if (notes !== undefined) data.notes = notes;
    if (quoteAmount !== undefined) data.quoteAmount = quoteAmount;
    if (progress !== undefined) data.progress = progress;

    await prisma.commissionRequest.update({
      where: { id: commissionId },
      data,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Admin update commission error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to update commission request.") };
  }
}

export async function createReview(data: {
  paintingId?: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  comment: string;
}) {
  try {
    if (!data.authorName || !data.authorEmail || !data.comment || !data.rating) {
      return { success: false, error: "Please fill out all fields." };
    }

    const review = await prisma.review.create({
      data: {
        paintingId: data.paintingId || null,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        rating: data.rating,
        comment: data.comment,
        status: "PENDING",
      },
    });

    revalidatePath("/admin");
    if (data.paintingId) {
      revalidatePath(`/gallery/${data.paintingId}`);
    }
    return { success: true, reviewId: review.id };
  } catch (e: any) {
    console.error("Create review error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to submit review.") };
  }
}

export async function approveReview(reviewId: string) {
  try {
    await verifyAdmin();

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Approve review error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to approve review.") };
  }
}

export async function hideReviewSpam(reviewId: string) {
  try {
    await verifyAdmin();

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "SPAM" },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Hide spam review error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to hide review.") };
  }
}

export async function deleteReview(reviewId: string) {
  try {
    await verifyAdmin();

    await prisma.review.delete({
      where: { id: reviewId },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Delete review error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to delete review.") };
  }
}

export async function getStoreSettings() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: "default",
        },
      });
    }

    return settings;
  } catch (e) {
    console.error("Failed to get store settings:", e);
    return {
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
  }
}

export async function updateStoreSettings(formData: FormData) {
  try {
    await verifyAdmin();

    const storeName = formData.get("storeName") as string;
    const contactEmail = formData.get("contactEmail") as string;
    const contactPhone = formData.get("contactPhone") as string;
    const contactAddress = formData.get("contactAddress") as string;
    const instagramUrl = formData.get("instagramUrl") as string;
    const facebookUrl = formData.get("facebookUrl") as string;
    const pinterestUrl = formData.get("pinterestUrl") as string;
    const baseShippingCostStr = formData.get("baseShippingCost") as string;
    const freeShippingThresholdStr = formData.get("freeShippingThreshold") as string;
    const estimatedDeliveryDaysStr = formData.get("estimatedDeliveryDays") as string;
    const notifyOnNewOrder = formData.get("notifyOnNewOrder") === "true";
    const notifyOnNewCommission = formData.get("notifyOnNewCommission") === "true";

    const baseShippingCost = parseFloat(baseShippingCostStr || "0");
    const freeShippingThreshold = parseFloat(freeShippingThresholdStr || "0");
    const estimatedDeliveryDays = parseInt(estimatedDeliveryDaysStr || "0");

    let logoUrl: string | undefined = undefined;
    const logoFile = formData.get("storeLogoFile") as File;
    if (logoFile && logoFile.size > 0) {
      logoUrl = await uploadImage(logoFile);
    }

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        storeName,
        contactEmail,
        contactPhone,
        contactAddress,
        instagramUrl,
        facebookUrl,
        pinterestUrl,
        baseShippingCost,
        freeShippingThreshold,
        estimatedDeliveryDays,
        notifyOnNewOrder,
        notifyOnNewCommission,
        ...(logoUrl ? { storeLogo: logoUrl } : {}),
      },
      update: {
        storeName,
        contactEmail,
        contactPhone,
        contactAddress,
        instagramUrl,
        facebookUrl,
        pinterestUrl,
        baseShippingCost,
        freeShippingThreshold,
        estimatedDeliveryDays,
        notifyOnNewOrder,
        notifyOnNewCommission,
        ...(logoUrl ? { storeLogo: logoUrl } : {}),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Admin update store settings error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to update store settings.") };
  }
}
