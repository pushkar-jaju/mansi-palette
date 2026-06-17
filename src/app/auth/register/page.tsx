"use client";

import React, { useActionState, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { registerAction } from "@/app/auth/actions";
import { useAuth } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { Sparkles, ShieldAlert, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      }>
        <RegisterForm />
      </Suspense>
      <Footer />
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, user } = useAuth();
  
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [showPassword, setShowPassword] = useState(false);
  
  let redirectTo = searchParams.get("redirect") || "/";
  if (redirectTo.includes("/auth/login") || redirectTo.includes("/auth/register")) {
    redirectTo = "/";
  }

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Sync user state on sign up success
  useEffect(() => {
    if (state?.success && state.user) {
      setUser(state.user as any);
      router.push(redirectTo);
      router.refresh();
    }
  }, [state, setUser, router, redirectTo]);

  return (
    <main className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        {/* Logo Head */}
        <div className="flex flex-col items-center text-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-primary border border-hairline animate-none">
            <Sparkles className="w-4.5 h-4.5 text-primary-foreground" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-[11px] text-ink-subtle">
            Explore gallery pieces, check custom commissions, and buy art.
          </p>
        </div>

        {/* Form Card */}
        <form
          action={formAction}
          className="bg-surface-1 border border-hairline rounded-md p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden"
        >
          {state?.error && (
            <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm flex items-start gap-2 animate-in slide-in-from-top duration-200">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Enter your full name here"
              className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              spellCheck={false}
              placeholder="Enter your email here"
              className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                autoComplete="new-password"
                placeholder="Must be at least 6 characters…"
                className="w-full bg-canvas text-ink text-xs pl-3 pr-10 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-subtle hover:text-ink transition-colors focus:outline-none cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full py-2.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" aria-hidden="true" />
                Creating Account…
              </>
            ) : (
              <>
                Sign Up
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Redirect */}
        <div className="text-center text-xs text-ink-subtle">
          Already have an account?{" "}
          <Link href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

