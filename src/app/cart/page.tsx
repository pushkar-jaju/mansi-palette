"use client";

import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, useAuth } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { createOrder } from "@/app/cart/actions";
import { useRouter } from "next/navigation";
import { resendVerificationAction } from "@/app/auth/actions";
import { Trash2, ShoppingBag, CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Truck } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login?redirect=/cart");
      return;
    }
    setError(null);

    const formData = new FormData(e.currentTarget);
    const customerName = formData.get("name") as string;
    const customerEmail = formData.get("email") as string;
    const customerPhone = formData.get("phone") as string;
    const shippingAddress = formData.get("address") as string;

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(customerPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const paintingIds = cart.map((item) => item.id);

    startTransition(async () => {
      const res = await createOrder({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        paintingIds,
        totalAmount: cartTotal,
      });

      if (res.success) {
        setOrderId(res.orderId || null);
        clearCart();
        setCheckoutSuccess(true);
      } else {
        setError(res.error || "An error occurred during checkout.");
      }
    });
  };

  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <span className="animate-pulse text-xs text-ink-subtle uppercase tracking-wider">Loading Cart…</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (checkoutSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-20 flex flex-col items-center text-center gap-6 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Order Placed Successfully!</h1>
            <p className="text-xs text-ink-subtle uppercase font-mono mt-1">Order ID: {orderId}</p>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-md">
            Your payment has been verified and processed. Mansi is currently preparing your original paintings for museum-grade packaging and shipping. We will email your tracking number within 48 hours.
          </p>

          <div className="w-full bg-surface-1 border border-hairline rounded-md p-5 text-left text-xs flex flex-col gap-3">
            <h4 className="font-semibold text-ink">Order Summary & Invoice</h4>
            <div className="flex justify-between text-ink-muted">
              <span>Payment Method:</span>
              <span className="font-medium text-ink">Razorpay (Simulated)</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Shipping Status:</span>
              <span className="font-medium text-primary uppercase text-[10px] tracking-wide">Processing</span>
            </div>
            <hr className="border-hairline" />
            <div className="flex justify-between text-sm font-semibold text-ink">
              <span>Total Paid:</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>
 
          <Link
            href="/gallery"
            className="mt-4 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2.5 rounded-sm border border-primary-focus transition-all"
          >
            Continue Exploring Art
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
        {/* Page Header */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-primary">Your Collection</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-1.0px]">Shopping Cart</h1>
        </div>

        {cartCount === 0 ? (
          <div className="py-24 border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-4 text-ink-subtle">
            <ShoppingBag className="w-12 h-12 text-hairline-strong" />
            <p className="text-xs">Your shopping cart is currently empty.</p>
            <Link
              href="/gallery"
              className="text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-sm border border-primary-focus transition-all"
            >
              Browse Gallery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex flex-col gap-3 bg-surface-1 border border-hairline rounded-md p-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-sm bg-canvas border border-hairline/80 items-center justify-between"
                  >
                    <div className="relative w-16 h-16 rounded-xs overflow-hidden bg-surface-2 flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-ink truncate">{item.title}</h4>
                      <p className="text-[10px] text-ink-subtle mt-0.5">
                        {item.width}&quot; &times; {item.height}&quot; &bull; {item.medium}
                      </p>
                    </div>
 
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-ink">
                        ₹{item.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 rounded-sm text-ink-subtle hover:text-red-400 hover:bg-surface-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
 
              {/* Guarantees Box */}
              <div className="bg-surface-1/40 border border-hairline/50 rounded-md p-4 flex flex-col gap-3 text-xs text-ink-subtle">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-ink">Insured Fine Art Shipping</h5>
                    <p className="text-[10px] text-ink-tertiary mt-0.5">All original paintings are packed in custom wood crates to ensure perfect delivery.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-ink">Secure Gateway Payments</h5>
                    <p className="text-[10px] text-ink-tertiary mt-0.5">Your credit details are processed securely and encrypted via standard TLS layers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout Form & Total */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Order summary */}
              <div className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Summary</h3>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Subtotal:</span>
                  <span className="font-medium text-ink">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Insured Shipping:</span>
                  <span className="text-primary uppercase text-[10px] font-semibold tracking-wider">Free (Promo)</span>
                </div>
                <hr className="border-hairline" />
                <div className="flex justify-between text-sm font-semibold text-ink">
                  <span>Grand Total:</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Form */}
              {!user ? (
                <div className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-5 items-center text-center justify-center min-h-[300px]">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Checkout Required</h4>
                    <p className="text-[11px] text-ink-subtle leading-normal">
                      Please sign in or create an account to proceed to checkout and place your order.
                    </p>
                  </div>
                  <Link
                    href="/auth/login?redirect=/cart"
                    className="w-full py-3.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Sign In to Place Order
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : !user.emailVerified ? (
                <div className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-5 items-center text-center justify-center min-h-[300px] animate-in fade-in duration-300">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">Email Verification Required</h4>
                    <p className="text-[11px] text-ink-subtle leading-normal">
                      Please verify your email address (<strong>{user.email}</strong>) to proceed to checkout and place your order.
                    </p>
                  </div>
                  <ResendCartButton />
                </div>
              ) : (
                <form
                  onSubmit={handleCheckout}
                  className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-4 relative"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Shipping & Checkout</h3>
                  
                  {error && (
                    <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label htmlFor="name" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      autoComplete="name"
                      defaultValue={user?.name || ""}
                      placeholder="e.g. John Doe…"
                      className="bg-canvas text-ink text-xs px-3 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="email" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      autoComplete="email"
                      spellCheck={false}
                      defaultValue={user?.email || ""}
                      placeholder="e.g. john@example.com…"
                      className="bg-canvas text-ink text-xs px-3 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="phone" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      autoComplete="tel"
                      placeholder="e.g. 9876543210"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
                      }}
                      title="Please enter a valid 10-digit Indian mobile number."
                      className="bg-canvas text-ink text-xs px-3 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="address" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Shipping Address *</label>
                    <textarea
                      id="address"
                      name="address"
                      required
                      rows={3}
                      placeholder="e.g. Street details, Apt number, City, State, ZIP code…"
                      className="bg-canvas text-ink text-xs px-3 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary resize-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 w-full py-3.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                        Processing Checkout…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Verify and Place Order (₹{cartTotal.toLocaleString()})
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ResendCartButton() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = () => {
    setError(null);
    startTransition(async () => {
      const res = await resendVerificationAction();
      if (res.success) {
        setSent(true);
        setTimeout(() => setSent(false), 5000);
      } else {
        setError(res.error || "Failed to resend.");
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full mt-2">
      <button
        onClick={handleResend}
        disabled={isPending || sent}
        className="w-full py-2.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? "Resending..." : sent ? "Verification Link Sent!" : "Resend Verification Email"}
      </button>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
