import { uploadToServer } from "./cloudinary";

/**
 * Uploads a standard File object from form data and returns the secure URL.
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const res = await uploadToServer(file);
    return res.secure_url;
  } catch (error) {
    console.error("Cloudinary server-side upload failed:", error);
    throw new Error("Image upload failed. Please verify configuration.");
  }
}
