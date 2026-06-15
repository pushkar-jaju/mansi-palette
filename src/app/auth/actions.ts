"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, setSession, getSession } from "@/lib/auth";
import * as crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { getFriendlyErrorMessage } from "@/lib/errors";

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    // Set secure HTTP-only session cookie
    await setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });

    return { success: true, user: { name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } };
  } catch (e: any) {
    console.error("Login action error:", e);
    return { success: false, error: getFriendlyErrorMessage(e) };
  }
}

export async function registerAction(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      return { success: false, error: "Please fill out all required fields." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const passwordHash = hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER", // Default role
        emailVerified: false,
        verificationToken,
        verificationTokenExpires,
      },
    });

    // Send simulation email
    await sendVerificationEmail(user.email, verificationToken);

    // Set secure HTTP-only session cookie
    await setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: false,
    });

    return { success: true, user: { name: user.name, email: user.email, role: user.role, emailVerified: false } };
  } catch (e: any) {
    console.error("Registration action error:", e);
    return { success: false, error: getFriendlyErrorMessage(e) };
  }
}

export async function resendVerificationAction() {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "You must be signed in to request a verification email." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.emailVerified) {
      return { success: false, error: "Your email address is already verified." };
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires,
      },
    });

    // Send simulation email
    await sendVerificationEmail(user.email, verificationToken);

    return { success: true };
  } catch (e: any) {
    console.error("Resend verification error:", e);
    return { success: false, error: getFriendlyErrorMessage(e) };
  }
}
