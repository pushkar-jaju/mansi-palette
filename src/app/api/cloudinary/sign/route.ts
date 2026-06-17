import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryCredentials } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    // 1. Verify admin session
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin authorization required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const folder = body.folder || "mansis-palette";

    // 2. Fetch credentials
    const { apiKey, apiSecret, cloudName, isConfigured } = getCloudinaryCredentials();
    if (!isConfigured || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary credentials are not configured on the server." },
        { status: 500 }
      );
    }

    // 3. Generate timestamp and sign the upload request
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
    });
  } catch (error: any) {
    console.error("Cloudinary signature generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature." },
      { status: 500 }
    );
  }
}
