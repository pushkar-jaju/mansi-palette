"use server";

import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/upload";
import { getSession } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/errors";

export async function submitCommissionRequest(formData: FormData) {
  try {
    const session = await getSession();
    
    if (!session) {
      return { success: false, error: "Authentication required to submit commission requests." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { emailVerified: true },
    });

    if (!dbUser || !dbUser.emailVerified) {
      return { success: false, error: "Please verify your email address to submit commission requests." };
    }

    const clientName = formData.get("clientName") as string;
    const clientEmail = formData.get("clientEmail") as string;
    const clientPhone = formData.get("clientPhone") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const widthStr = formData.get("width") as string;
    const heightStr = formData.get("height") as string;
    const budgetStr = formData.get("budget") as string;
    const referenceFile = formData.get("referenceFile") as File;

    if (clientPhone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(clientPhone)) {
        return { success: false, error: "Please enter a valid 10-digit Indian mobile number." };
      }
    }

    if (!clientName || !clientEmail || !title || !description || !widthStr || !heightStr || !budgetStr) {
      return { success: false, error: "Please fill out all required fields." };
    }

    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    const budget = parseFloat(budgetStr);

    if (isNaN(width) || isNaN(height) || isNaN(budget) || width <= 0 || height <= 0 || budget <= 0) {
      return { success: false, error: "Please enter valid numeric values for dimensions and budget." };
    }

    let referenceUrl = null;
    if (referenceFile && referenceFile.size > 0 && referenceFile.name !== "undefined") {
      try {
        referenceUrl = await uploadImage(referenceFile);
      } catch (uploadError) {
        console.warn("Reference file upload failed, proceeding without it:", uploadError);
      }
    }

    const commission = await prisma.commissionRequest.create({
      data: {
        userId: session?.id || null,
        clientName,
        clientEmail,
        clientPhone: clientPhone || "",
        title,
        description,
        width,
        height,
        budget,
        referenceUrl,
        status: "PENDING",
      },
    });

    return { success: true, commissionId: commission.id };
  } catch (e: any) {
    console.error("Commission submission failed:", e);
    return { success: false, error: getFriendlyErrorMessage(e, "An error occurred while submitting your request.") };
  }
}
