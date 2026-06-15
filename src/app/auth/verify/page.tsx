import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar, Footer } from "@/components/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export const revalidate = 0; // Dynamic rendering

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;
  
  let success = false;
  let message = "";

  if (!token) {
    message = "No email verification token was provided. Please check the link in your email inbox or console logs.";
  } else {
    try {
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
        },
      });

      if (!user) {
        message = "Invalid verification token. The verification link may be incorrect, broken, or already used.";
      } else if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        message = "This verification token has expired. Please sign in and click the resend button in the header banner to receive a new verification link.";
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpires: null,
          },
        });
        success = true;
        message = "Your email address has been successfully verified! You are now authorized to place orders, add items to the cart, submit commission requests, and access all account features.";
      }
    } catch (error) {
      console.error("Verification failed:", error);
      message = "A system database error occurred during verification. Please try again later.";
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-24 flex flex-col items-center justify-center text-center gap-6 animate-in fade-in duration-300">
        {success ? (
          <div className="w-14 h-14 rounded-full bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success animate-bounce">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertTriangle className="w-7 h-7" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {success ? "Verification Successful!" : "Verification Failed"}
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mt-2">
            {message}
          </p>
        </div>

        <Link
          href={success ? "/gallery" : "/auth/login"}
          className="mt-4 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2.5 rounded-sm border border-primary-focus transition-all active:scale-[0.98]"
        >
          {success ? "Explore the Gallery" : "Back to Sign In"}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
