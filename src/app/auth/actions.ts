"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, setSession } from "@/lib/auth";

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
    });

    return { success: true, user: { name: user.name, email: user.email, role: user.role } };
  } catch (e: any) {
    console.error("Login action error:", e);
    return { success: false, error: e.message || "An unexpected error occurred." };
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
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER", // Default role
      },
    });

    // Set secure HTTP-only session cookie
    await setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { success: true, user: { name: user.name, email: user.email, role: user.role } };
  } catch (e: any) {
    console.error("Registration action error:", e);
    return { success: false, error: e.message || "An unexpected error occurred." };
  }
}
