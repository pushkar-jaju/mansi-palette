import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

// Check Cloudinary environment configuration
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a standard File object from form data and returns the accessible URL/path string.
 */
export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (isCloudinaryConfigured) {
    try {
      return await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "mansis-palette" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    } catch (e) {
      console.warn("Cloudinary upload failed, falling back to local storage:", e);
      // Fall through to local storage if Cloudinary fails
    }
  }

  // Fallback: Local File System Storage
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  
  // Create public/uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExtension = path.extname(file.name) || ".png";
  const sanitizedName = file.name
    .replace(fileExtension, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 30);
    
  const uniqueFilename = `${Date.now()}-${sanitizedName}${fileExtension}`;
  const filePath = path.join(uploadsDir, uniqueFilename);

  fs.writeFileSync(filePath, buffer);
  
  return `/uploads/${uniqueFilename}`;
}
