import { cookies } from "next/headers";
import * as crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "mansis-palette-secure-session-key-2026!";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(SESSION_SECRET).digest(); // 32 bytes
const IV_LENGTH = 12; // GCM standard IV length is 12 bytes
const COOKIE_NAME = "mp_session";

// Password Hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, originalHash] = hashedPassword.split(":");
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch {
    return false;
  }
}

// Session Encryption (AES-256-GCM)
export function encryptSession(payload: any): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv_hex:auth_tag_hex:encrypted_hex
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptSession(token: string): any | null {
  try {
    const [ivHex, authTagHex, encryptedHex] = token.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) return null;
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// Server Side Helpers for Next.js 15+
export async function getSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  const payload = decryptSession(cookie.value);
  if (!payload) return null;

  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true, emailVerified: true },
    });
    if (!user) return null;
    return user;
  } catch (error) {
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      emailVerified: payload.emailVerified || false,
    };
  }
}

export async function setSession(payload: any) {
  const token = encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // delete cookie
  });
}
