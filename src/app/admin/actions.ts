"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { uploadToServer, deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";

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

    // Parse pre-uploaded images from client
    const cloudinaryUrlsJson = formData.get("cloudinaryUrls") as string;
    const cloudinaryPublicIdsJson = formData.get("cloudinaryPublicIds") as string;
    
    let imageUrls: string[] = [];
    let imagesPublicIds: string[] = [];
    
    if (cloudinaryUrlsJson) {
      imageUrls = JSON.parse(cloudinaryUrlsJson);
    }
    if (cloudinaryPublicIdsJson) {
      imagesPublicIds = JSON.parse(cloudinaryPublicIdsJson);
    }

    // Fallback: If raw files are uploaded directly to the server action
    // (Only run if client-side pre-upload did not already populate imageUrls)
    if (imageUrls.length === 0) {
      const files = formData.getAll("imageFiles") as File[];
      for (const f of files) {
        if (f && f.size > 0) {
          const result = await uploadToServer(f);
          imageUrls.push(result.secure_url);
          imagesPublicIds.push(result.public_id);
        }
      }

      const singleFile = formData.get("imageFile") as File;
      if (singleFile && singleFile.size > 0) {
        const result = await uploadToServer(singleFile);
        if (!imageUrls.includes(result.secure_url)) {
          imageUrls.unshift(result.secure_url);
          imagesPublicIds.unshift(result.public_id);
        }
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
    const imagePublicId = imagesPublicIds[0] || null;

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
        imagePublicId,
        images: imageUrls,
        imagesPublicIds,
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
    
    // Fetch the current painting to find deleted images later
    const currentPainting = await prisma.painting.findUnique({
      where: { id: paintingId },
      select: { images: true, imagesPublicIds: true, imageUrl: true, imagePublicId: true },
    });
    
    if (!currentPainting) {
      return { success: false, error: "Painting not found." };
    }

    // Parse pre-uploaded images from client
    const cloudinaryUrlsJson = formData.get("cloudinaryUrls") as string;
    const cloudinaryPublicIdsJson = formData.get("cloudinaryPublicIds") as string;
    
    let newImageUrls: string[] = [];
    let newImagePublicIds: string[] = [];
    
    if (cloudinaryUrlsJson) {
      newImageUrls = JSON.parse(cloudinaryUrlsJson);
    }
    if (cloudinaryPublicIdsJson) {
      newImagePublicIds = JSON.parse(cloudinaryPublicIdsJson);
    }

    // Parse existing images/publicIds that were retained
    const existingImagesJson = formData.get("existingImages") as string;
    let retainedImages: string[] = [];
    if (existingImagesJson) {
      try {
        retainedImages = JSON.parse(existingImagesJson);
      } catch {
        retainedImages = existingImagesJson.split(",").filter(Boolean);
      }
    }

    const existingPublicIdsJson = formData.get("existingImagesPublicIds") as string;
    let retainedPublicIds: string[] = [];
    if (existingPublicIdsJson) {
      try {
        retainedPublicIds = JSON.parse(existingPublicIdsJson);
      } catch {
        retainedPublicIds = existingPublicIdsJson.split(",").filter(Boolean);
      }
    }

    // Fallback: New files uploaded directly to server action
    // (Only run if client-side pre-upload did not already populate newImageUrls)
    if (newImageUrls.length === 0) {
      const files = formData.getAll("imageFiles") as File[];
      for (const f of files) {
        if (f && f.size > 0) {
          const result = await uploadToServer(f);
          newImageUrls.push(result.secure_url);
          newImagePublicIds.push(result.public_id);
        }
      }

      const singleFile = formData.get("imageFile") as File;
      if (singleFile && singleFile.size > 0) {
        const result = await uploadToServer(singleFile);
        newImageUrls.push(result.secure_url);
        newImagePublicIds.push(result.public_id);
      }
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

    const finalImages = [...retainedImages, ...newImageUrls];
    const finalPublicIds = [...retainedPublicIds, ...newImagePublicIds];

    const imageUrl = finalImages.length > 0 ? finalImages[0] : "/paintings/misty_forest.png";
    const imagePublicId = finalPublicIds.length > 0 ? finalPublicIds[0] : null;

    // Detect and delete removed images from Cloudinary
    const deletedPublicIds = currentPainting.imagesPublicIds.filter(
      (id) => !finalPublicIds.includes(id)
    );
    if (currentPainting.imagePublicId && !finalPublicIds.includes(currentPainting.imagePublicId)) {
      deletedPublicIds.push(currentPainting.imagePublicId);
    }

    for (const pubId of deletedPublicIds) {
      if (pubId) {
        await deleteFromCloudinary(pubId);
      }
    }

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
        imagePublicId,
        images: finalImages,
        imagesPublicIds: finalPublicIds,
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

    const painting = await prisma.painting.findUnique({
      where: { id: paintingId },
      select: { imagePublicId: true, imagesPublicIds: true },
    });

    if (painting) {
      const publicIdsToDelete = [...painting.imagesPublicIds];
      if (painting.imagePublicId && !publicIdsToDelete.includes(painting.imagePublicId)) {
        publicIdsToDelete.push(painting.imagePublicId);
      }

      for (const pubId of publicIdsToDelete) {
        if (pubId) {
          await deleteFromCloudinary(pubId);
        }
      }
    }

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
  note?: string,
  paymentStatus?: string
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
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

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
      // Fetch current settings to get old logo URL for clean deletion
      const currentSettings = await prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: { storeLogo: true },
      });

      // Upload new logo
      const result = await uploadToServer(logoFile);
      logoUrl = result.secure_url;

      // Clean up old logo from Cloudinary
      if (currentSettings?.storeLogo) {
        const oldPubId = extractPublicId(currentSettings.storeLogo);
        if (oldPubId) {
          await deleteFromCloudinary(oldPubId);
        }
      }
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
