"use server";

import { prisma } from "@/lib/prisma";
import { getSession, setSession, hashPassword, verifyPassword } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { getFriendlyErrorMessage } from "@/lib/errors";

export async function getWishlistAction() {
  try {
    const session = await getSession();
    if (!session) {
      return { success: true, items: [] };
    }
    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: session.id },
      include: {
        painting: true,
      },
    });
    return { success: true, items: wishlistItems.map((wi) => wi.painting) };
  } catch (e: any) {
    console.error("Get wishlist error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to fetch wishlist.") };
  }
}

export async function toggleWishlistAction(paintingId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Authentication required to modify wishlist." };
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_paintingId: {
          userId: session.id,
          paintingId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: {
          userId_paintingId: {
            userId: session.id,
            paintingId,
          },
        },
      });
      revalidatePath("/gallery");
      revalidatePath(`/gallery/${paintingId}`);
      revalidatePath("/gallery/wishlist");
      return { success: true, liked: false };
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: session.id,
          paintingId,
        },
      });
      revalidatePath("/gallery");
      revalidatePath(`/gallery/${paintingId}`);
      revalidatePath("/gallery/wishlist");
      return { success: true, liked: true };
    }
  } catch (e: any) {
    console.error("Toggle wishlist error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to update wishlist.") };
  }
}

export async function getUserProfileAction() {
  try {
    const session = await getSession();
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        _count: {
          select: {
            orders: true,
            wishlist: true,
          },
        },
      },
    });
    return user;
  } catch (e) {
    console.error("Get user profile error:", e);
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Authentication required." };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const profilePictureFile = formData.get("profilePictureFile") as File;

    if (!name) {
      return { success: false, error: "Name is required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const updateData: any = { name, phone };

    // Handle avatar upload
    if (profilePictureFile && profilePictureFile.size > 0) {
      const imgUrl = await uploadImage(profilePictureFile);
      updateData.profilePicture = imgUrl;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return { success: false, error: "Current password is required to change password." };
      }
      const isMatch = verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return { success: false, error: "Incorrect current password." };
      }
      updateData.passwordHash = hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    // Update current session cookie values
    await setSession({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      emailVerified: updatedUser.emailVerified,
    });

    revalidatePath("/");
    revalidatePath("/user/profile");

    return { success: true };
  } catch (e: any) {
    console.error("Update profile error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to update profile.") };
  }
}

export async function saveAddressAction(address: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Authentication required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { savedAddresses: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const savedAddresses = [...user.savedAddresses, address];

    await prisma.user.update({
      where: { id: session.id },
      data: { savedAddresses },
    });

    revalidatePath("/user/profile");
    return { success: true };
  } catch (e: any) {
    console.error("Save address error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to save address.") };
  }
}

export async function deleteAddressAction(index: number) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Authentication required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { savedAddresses: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const savedAddresses = user.savedAddresses.filter((_, i) => i !== index);

    await prisma.user.update({
      where: { id: session.id },
      data: { savedAddresses },
    });

    revalidatePath("/user/profile");
    return { success: true };
  } catch (e: any) {
    console.error("Delete address error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to delete address.") };
  }
}

export async function getMyOrdersAction() {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Authentication required." };
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.id },
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
    });

    return { success: true, orders };
  } catch (e: any) {
    console.error("Get my orders error:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "Failed to fetch orders.") };
  }
}
