import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export { cloudinary };

export function getCloudinaryCredentials() {
  return {
    cloudName,
    apiKey,
    apiSecret,
    isConfigured,
  };
}

/**
 * Uploads a standard File object to Cloudinary on the server side.
 */
export async function uploadToServer(
  file: File,
  folder: string = "mansis-palette"
): Promise<{ secure_url: string; public_id: string }> {
  if (!isConfigured) {
    throw new Error("Cloudinary credentials are not configured in environment variables.");
  }
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary upload stream."));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary using its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!isConfigured || !publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (e) {
    console.error("Cloudinary delete failed:", e);
    return false;
  }
}

export { extractPublicId, getOptimizedUrl } from "./cloudinary-utils";
