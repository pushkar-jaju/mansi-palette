"use client";

import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, useAuth } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { createOrder } from "@/app/cart/actions";
import { useRouter } from "next/navigation";
import { resendVerificationAction } from "@/app/auth/actions";
import { getUserProfileAction, saveAddressAction } from "@/app/actions";
import { parseAddressString, formatAddress, validatePhone, validatePincode } from "@/lib/address";
import { 
  Trash2, ShoppingBag, CreditCard, CheckCircle2, ArrowRight, 
  ShieldCheck, Truck, Clock, MapPin, Plus, Check, X, Loader2, User, Phone 
} from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [adminWhatsAppPhone, setAdminWhatsAppPhone] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Address states
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // Form input states
  const [nameValue, setNameValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");

  // New address form states
  const [newType, setNewType] = useState("Home");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLine, setNewLine] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newError, setNewError] = useState<string | null>(null);

  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadProfile = async () => {
    if (!user) {
      setLoadingAddress(false);
      return;
    }
    setLoadingAddress(true);
    try {
      const res = await getUserProfileAction();
      if (res) {
        setProfileData(res);
        setNewName(res.name || "");
        setNewPhone(res.phone || "");

        const saved = res.savedAddresses || [];
        if (saved.length === 0) {
          // If no addresses, redirect to profile to add one
          router.push("/user/profile?redirect=/cart&addAddress=true");
          return;
        }

        // Auto-select first address by default (handles single address & default)
        setSelectedAddressIndex(0);
        const parsed = parseAddressString(saved[0]);
        setNameValue(parsed.name || res.name || "");
        setPhoneValue(parsed.phone || res.phone || "");
        
        let addrText = parsed.addressLine;
        if (parsed.cityState) addrText += "\n" + parsed.cityState;
        if (parsed.pincode) addrText += "\nPin: " + parsed.pincode;
        setAddressValue(addrText);
      }
    } catch (err) {
      console.error("Failed to load user profile in checkout:", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (isClient && user) {
      loadProfile();
    }
  }, [isClient, user]);

  const handleSelectAddress = (idx: number) => {
    setSelectedAddressIndex(idx);
    const saved = profileData.savedAddresses[idx];
    const parsed = parseAddressString(saved);
    setNameValue(parsed.name || profileData.name || "");
    setPhoneValue(parsed.phone || profileData.phone || "");
    
    let addrText = parsed.addressLine;
    if (parsed.cityState) addrText += "\n" + parsed.cityState;
    if (parsed.pincode) addrText += "\nPin: " + parsed.pincode;
    setAddressValue(addrText);

    setShowChangeModal(false);
  };

  const handleAddNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError(null);

    if (!newName.trim() || !newPhone.trim() || !newLine.trim() || !newCity.trim() || !newState.trim() || !newPincode.trim()) {
      setNewError("All fields are required to save address.");
      return;
    }

    if (!validatePhone(newPhone)) {
      setNewError("Please enter a valid 10-digit Indian phone number starting with 6/7/8/9.");
      return;
    }

    if (!validatePincode(newPincode)) {
      setNewError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    startTransition(async () => {
      const formatted = formatAddress({
        type: newType,
        name: newName.trim(),
        phone: newPhone.trim(),
        addressLine: newLine.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        pincode: newPincode.trim(),
      });

      const res = await saveAddressAction(formatted);
      if (res.success) {
        // Refresh local details
        const updated = await getUserProfileAction();
        if (updated) {
          setProfileData(updated);
          const saved = updated.savedAddresses || [];
          const newIdx = saved.length - 1;
          setSelectedAddressIndex(newIdx);
          setNameValue(newName.trim());
          setPhoneValue(newPhone.trim());
          setAddressValue(`${newLine.trim()}\n${newCity.trim()}, ${newState.trim()}\nPin: ${newPincode.trim()}`);
        }
        
        // Reset inline form inputs
        setNewLine("");
        setNewCity("");
        setNewState("");
        setNewPincode("");
        setShowChangeModal(false);
        setShowAddNewForm(false);
      } else {
        setNewError(res.error || "Failed to save new address.");
      }
    });
  };

  const getWhatsAppUrl = (orderObj: any, phoneNum: string) => {
    if (!orderObj) return "";
    const message = `*New Order Placed - Mansi's Palette*\n\n` +
      `*Order ID:* ${orderObj.id}\n` +
      `*Customer Name:* ${orderObj.customerName}\n` +
      `*Customer Email:* ${orderObj.customerEmail}\n` +
      `*Customer Phone:* ${orderObj.customerPhone}\n\n` +
      `*Shipping Address:*\n${orderObj.shippingAddress}\n\n` +
      `*Items:*\n` +
      orderObj.items.map((item: any) => `- ${item.painting.title} (₹${item.price.toLocaleString()})`).join("\n") +
      `\n\n*Total Amount:* ₹${orderObj.totalAmount.toLocaleString()}\n\n` +
      `Please review and approve this order. Thank you!`;

    let cleanPhone = (phoneNum || "+91 98765 43210").replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login?redirect=/cart");
      return;
    }
    setError(null);

    const customerName = nameValue;
    const customerPhone = phoneValue;
    const shippingAddress = addressValue;

    if (!customerName || !customerPhone || !shippingAddress) {
      setError("Please fill out all shipping details.");
      return;
    }

    if (!validatePhone(customerPhone)) {
      setError("Please enter a valid 10-digit Indian phone number starting with 6/7/8/9.");
      return;
    }

    const parsed = parseAddressString(shippingAddress);
    if (!parsed.pincode || !validatePincode(parsed.pincode)) {
      setError("Please enter a valid 6-digit Indian PIN code in your shipping address.");
      return;
    }

    // Determine type label to snapshot
    const activeType = selectedAddressIndex >= 0 && profileData?.savedAddresses?.[selectedAddressIndex]
      ? parseAddressString(profileData.savedAddresses[selectedAddressIndex]).type || "Home"
      : "Home";

    const finalAddressSnapshot = formatAddress({
      type: activeType,
      name: customerName,
      phone: customerPhone,
      addressLine: parsed.addressLine || shippingAddress,
      city: parsed.cityState.split(",")[0]?.trim() || "",
      state: parsed.cityState.split(",")[1]?.trim() || "",
      pincode: parsed.pincode,
    });

    const paintingIds = cart.map((item) => item.id);

    startTransition(async () => {
      const res = await createOrder({
        customerName,
        customerEmail: user.email,
        customerPhone,
        shippingAddress: finalAddressSnapshot,
        paintingIds,
        totalAmount: cartTotal,
      });

      if (res.success && res.order) {
        setPlacedOrder(res.order);
        setAdminWhatsAppPhone(res.adminPhone || "");
        clearCart();
        setCheckoutSuccess(true);
        
        // Auto-redirect to WhatsApp
        const waUrl = getWhatsAppUrl(res.order, res.adminPhone || "");
        if (waUrl && typeof window !== "undefined") {
          window.open(waUrl, "_blank");
        }
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

  if (checkoutSuccess && placedOrder) {
    const waUrl = getWhatsAppUrl(placedOrder, adminWhatsAppPhone);
    return (
      <div className="flex flex-col min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-20 flex flex-col items-center text-center gap-6 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-7 h-7" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Order Placed - Pending Approval</h1>
            <p className="text-xs text-ink-subtle uppercase font-mono mt-1">Order ID: {placedOrder.id}</p>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-md">
            Your order has been created. A WhatsApp message with your order summary has been automatically opened. If it didn't open, please click the button below to message Mansi to finalize your manual payment and get your order accepted.
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-wide"
          >
            <span>Proceed to WhatsApp to Complete Order</span>
          </a>

          {/* Confirmation summary containing Name, Phone, Address, and Total */}
          <div className="w-full bg-surface-1 border border-hairline rounded-md p-5 text-left text-xs flex flex-col gap-3 mt-2 animate-in fade-in duration-300">
            <h4 className="font-semibold text-ink border-b border-hairline pb-2 mb-1 uppercase tracking-wider text-[10px] text-primary">Order Confirmation Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-ink-muted">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-ink-subtle uppercase">Customer Details</span>
                <span className="font-medium text-ink">{placedOrder.customerName}</span>
                <span className="text-ink-subtle">{placedOrder.customerPhone}</span>
                <span className="text-ink-tertiary">{placedOrder.customerEmail}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-ink-subtle uppercase">Shipping Destination</span>
                <div className="whitespace-pre-wrap leading-relaxed text-ink-muted bg-canvas/30 p-2.5 rounded-sm border border-hairline/40 text-[11px] font-mono">
                  {placedOrder.shippingAddress}
                </div>
              </div>
            </div>
            
            <hr className="border-hairline" />
            
            <div className="flex justify-between text-ink-muted items-center">
              <span>Payment Method:</span>
              <span className="font-medium text-ink">WhatsApp Assisted (Manual)</span>
            </div>
            <div className="flex justify-between text-ink-muted items-center">
              <span>Order Status:</span>
              <span className="font-bold text-amber-500 uppercase text-[10px] tracking-wide">Pending Approval</span>
            </div>
            
            <hr className="border-hairline" />
            
            <div className="flex justify-between text-sm font-semibold text-ink items-center">
              <span>Order Total Amount:</span>
              <span className="text-primary font-bold text-base">₹{placedOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>
 
          <Link
            href="/user/orders"
            className="mt-2 text-xs font-semibold hover:underline text-ink-subtle"
          >
            Go to My Order History
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
                        className="p-1.5 rounded-sm text-ink-subtle hover:text-red-400 hover:bg-surface-1 transition-colors cursor-pointer"
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
              ) : loadingAddress ? (
                <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center justify-center gap-2 text-xs text-ink-subtle min-h-[200px]">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading shipping parameters…</span>
                </div>
              ) : (
                <form
                  onSubmit={handleCheckout}
                  className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-4 relative"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-hairline pb-3 flex justify-between items-center">
                    <span>Shipping & Checkout</span>
                    {profileData?.savedAddresses && profileData.savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewError(null);
                          setShowChangeModal(true);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider bg-surface-2 border border-hairline px-2.5 py-1 rounded-sm cursor-pointer"
                      >
                        Change Address
                      </button>
                    )}
                  </h3>
                  
                  {error && (
                    <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm">
                      {error}
                    </div>
                  )}

                  {/* Selected Address Indicator / Banner */}
                  {selectedAddressIndex >= 0 && profileData?.savedAddresses?.[selectedAddressIndex] && (
                    <div className="p-3 bg-surface-2 border border-hairline/80 rounded-sm text-xs flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-ink">Saved Address Selected</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-primary text-primary-foreground uppercase">
                            {parseAddressString(profileData.savedAddresses[selectedAddressIndex]).type || "Home"}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-subtle mt-1 line-clamp-2 leading-relaxed">
                          {parseAddressString(profileData.savedAddresses[selectedAddressIndex]).addressLine}, {parseAddressString(profileData.savedAddresses[selectedAddressIndex]).cityState} - {parseAddressString(profileData.savedAddresses[selectedAddressIndex]).pincode}
                        </p>
                      </div>
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
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      placeholder="e.g. John Doe…"
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
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      title="Please enter a valid 10-digit Indian mobile number."
                      className="bg-canvas text-ink text-xs px-3 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
                    />
                  </div>

                  <input type="hidden" id="address" name="address" value={addressValue} />

                  {/* Formatted address preview summary before order placement */}
                  {nameValue.trim() && phoneValue.trim() && addressValue.trim() && (
                    <div className="bg-surface-2/40 border border-hairline p-4 rounded-md flex flex-col gap-3 mt-2 animate-in fade-in duration-200">
                      <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Checkout Order Summary Preview</span>
                      <div className="text-[11px] flex flex-col gap-2 text-ink-muted">
                        <div>
                          <span className="text-ink-subtle">Recipient:</span>{" "}
                          <strong className="text-ink">{nameValue}</strong>
                        </div>
                        <div>
                          <span className="text-ink-subtle">Phone:</span>{" "}
                          <span className="text-ink font-mono">{phoneValue}</span>
                        </div>
                        <div>
                          <span className="text-ink-subtle block">Full Shipping Address:</span>
                          <div className="mt-1 bg-canvas/30 p-2.5 rounded-sm whitespace-pre-wrap text-[11px] text-ink-muted border border-hairline/40 leading-relaxed font-mono">
                            {addressValue}
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-hairline pt-2 mt-1 font-semibold text-ink text-xs items-center">
                          <span>Order Total:</span>
                          <span className="text-primary font-bold text-sm">₹{cartTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 w-full py-3.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

      {/* CHANGE ADDRESS / ADD ADDRESS MODAL */}
      {showChangeModal && profileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-surface-1 border border-hairline rounded-md overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Select Shipping Address
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowChangeModal(false);
                  setShowAddNewForm(false);
                }}
                className="p-1 rounded-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {newError && (
                <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm">
                  {newError}
                </div>
              )}

              {!showAddNewForm ? (
                <>
                  <div className="flex flex-col gap-3">
                    {profileData.savedAddresses?.map((addr: string, idx: number) => {
                      const parsed = parseAddressString(addr);
                      const isSelected = selectedAddressIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectAddress(idx)}
                          className={`p-4 rounded-md border text-left cursor-pointer transition-all flex justify-between items-start gap-3 hover:bg-surface-2/40 ${
                            isSelected
                              ? "bg-surface-2 border-primary"
                              : "bg-canvas border-hairline"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-ink">
                                {parsed.name || profileData.name}
                              </span>
                              {parsed.type && (
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-primary/20 text-primary uppercase border border-primary/20">
                                  {parsed.type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-subtle block mt-0.5 font-mono">
                              Phone: {parsed.phone || profileData.phone || "N/A"}
                            </span>
                            <p className="text-[11px] text-ink-muted leading-relaxed mt-2 whitespace-pre-wrap">
                              {parsed.addressLine}
                              {parsed.cityState && `\n${parsed.cityState}`}
                              {parsed.pincode && `\nPin: ${parsed.pincode}`}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewError(null);
                      setShowAddNewForm(true);
                    }}
                    className="w-full py-3 border border-dashed border-hairline hover:border-hairline-strong text-xs font-semibold text-ink-subtle hover:text-ink rounded-sm flex items-center justify-center gap-1.5 bg-canvas/30 hover:bg-canvas/60 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    Add New Address
                  </button>
                </>
              ) : (
                <form onSubmit={handleAddNewAddressSubmit} className="flex flex-col gap-3.5">
                  <div className="flex justify-between items-center border-b border-hairline/60 pb-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Add New Destination</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewError(null);
                        setShowAddNewForm(false);
                      }}
                      className="text-[10px] font-bold text-ink-subtle hover:text-ink uppercase tracking-wider cursor-pointer"
                    >
                      Back to Saved
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Address Type *</label>
                    <div className="flex gap-2">
                      {["Home", "Office", "Other"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewType(t)}
                          className={`flex-1 py-1.5 border text-xs font-semibold rounded-sm transition-all cursor-pointer ${
                            newType === t
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-canvas border-hairline text-ink-subtle hover:bg-surface-2"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Name of recipient"
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Street Address / Apartment *</label>
                    <textarea
                      required
                      rows={2}
                      value={newLine}
                      onChange={(e) => setNewLine(e.target.value)}
                      placeholder="e.g. Flat 303, Rosewood Apts, Linking Road"
                      className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1 col-span-1">
                      <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">City *</label>
                      <input
                        type="text"
                        required
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary"
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-1">
                      <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">State *</label>
                      <input
                        type="text"
                        required
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary"
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-1">
                      <label className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">PIN Code *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 400050"
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 w-full py-3 bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save and Select Address
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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
