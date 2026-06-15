"use client";

import React, { useActionState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/app/auth/actions";
import { useAuth } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { Sparkles, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />
      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      }>
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, user } = useAuth();
  
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const redirectTo = searchParams.get("redirect") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Sync user state on login success
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
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-[11px] text-ink-subtle">
            Sign in to manage requests, commissions, and purchases.
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
              placeholder="e.g. name@example.com…"
              className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" title="password" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">
                Password
              </label>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password…"
              className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full py-2.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" aria-hidden="true" />
                Signing In…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Redirect */}
        <div className="text-center text-xs text-ink-subtle">
          Don&apos;t have an account?{" "}
          <Link href={`/auth/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
