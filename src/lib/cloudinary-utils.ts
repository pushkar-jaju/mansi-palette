/**
 * Enhances a Cloudinary URL with quality (q_auto) and format (f_auto) parameters.
 * Safe to import on both client and server.
 */
export function getOptimizedUrl(url: string): string {
  if (!url) return url;
  if (url.includes("cloudinary.com")) {
    if (url.includes("/image/upload/")) {
      // Avoid duplicate optimization tokens
      if (!url.includes("/f_auto") && !url.includes("/q_auto")) {
        return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
      }
    }
  }
  return url;
}

/**
 * Helper to extract the public ID of an image from its Cloudinary URL.
 * Safe to import on both client and server.
 */
export function extractPublicId(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/image/upload/");
    if (parts.length < 2) return null;
    let pathAndName = parts[1];
    
    // Remove version segment (e.g. v1718612345/) if present
    pathAndName = pathAndName.replace(/^v\d+\//, "");
    
    // Remove file extension
    const lastDotIndex = pathAndName.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      pathAndName = pathAndName.substring(0, lastDotIndex);
    }
    
    return pathAndName;
  } catch (e) {
    console.error("Failed to extract Cloudinary public ID:", e);
    return null;
  }
}
