"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useWishlist } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { 
  getUserProfileAction, 
  updateProfile, 
  saveAddressAction, 
  deleteAddressAction 
} from "@/app/actions";
import { 
  User, Phone, Shield, MapPin, 
  Plus, Trash2, Camera, ShoppingBag, Heart, Loader2, Check, AlertCircle 
} from "lucide-react";
import { parseAddressString, formatAddress, validatePhone, validatePincode } from "@/lib/address";
import { formatDate } from "@/lib/utils";

function ProfilePageContent() {
  const { user, setUser } = useAuth();
  const { wishlistCount } = useWishlist();
  const [profileData, setProfileData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [addressPending, startAddressTransition] = useTransition();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const isFromCheckout = searchParams.get("addAddress") === "true";

  // Feedback alerts
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLine, setNewLine] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newType, setNewType] = useState("Home");
  const [formError, setFormError] = useState<string | null>(null);

  // pre-fill name and phone when profileData is available
  useEffect(() => {
    if (profileData) {
      setNewName((prev) => prev || profileData.name || "");
      setNewPhone((prev) => prev || profileData.phone || "");
    }
  }, [profileData]);

  const loadProfile = async () => {
    if (!user) return;
    const res = await getUserProfileAction();
    if (res) {
      setProfileData(res);
      if (res.profilePicture) {
        setAvatarPreview(res.profilePicture);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.success) {
        setSuccess("Profile details updated successfully.");
        
        // Refresh local details and header user context
        await loadProfile();
        if (profileData) {
          setUser({
            ...user!,
            name: formData.get("name") as string,
          });
        }
      } else {
        setError(res.error || "Failed to update profile.");
      }
    });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    setError(null);

    if (!newName.trim() || !newPhone.trim() || !newLine.trim() || !newCity.trim() || !newState.trim() || !newPincode.trim()) {
      setFormError("All fields are required to save address.");
      return;
    }

    if (!validatePhone(newPhone)) {
      setFormError("Please enter a valid 10-digit Indian phone number starting with 6/7/8/9.");
      return;
    }

    if (!validatePincode(newPincode)) {
      setFormError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    startAddressTransition(async () => {
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
        // Reset form inputs (except name/phone which can persist or reload from profileData)
        setNewLine("");
        setNewCity("");
        setNewState("");
        setNewPincode("");
        setNewType("Home");

        setSuccess(redirectUrl ? "Address saved! Redirecting to checkout..." : "Address saved to address book.");
        await loadProfile();
        
        // Automatically redirect back to checkout if redirected from checkout
        if (redirectUrl) {
          setTimeout(() => {
            router.push(redirectUrl);
          }, 1500);
        }
      } else {
        setError(res.error || "Failed to save address.");
      }
    });
  };

  const handleDeleteAddress = async (index: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    setSuccess(null);
    setError(null);
    startAddressTransition(async () => {
      const res = await deleteAddressAction(index);
      if (res.success) {
        setSuccess("Address removed.");
        await loadProfile();
      } else {
        setError(res.error || "Failed to delete address.");
      }
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-4">
          <User className="w-12 h-12 text-ink-tertiary animate-pulse" />
          <h1 className="text-xl font-semibold tracking-tight">Access Denied</h1>
          <p className="text-xs text-ink-subtle">
            You must be logged in to view and manage your profile settings.
          </p>
          <Link
            href="/auth/login?redirect=/user/profile"
            className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-sm border border-primary transition-all hover:bg-primary-hover"
          >
            Sign In to Account
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary flex items-center gap-1">
            <User className="w-4 h-4" />
            Account Area
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.8px] mt-1">My Profile</h1>
          <p className="text-xs sm:text-sm text-ink-subtle mt-0.5">
            Manage your credentials, brand preferences, saved shipping destinations, and review stats.
          </p>
        </div>

        {/* Checkout Redirect Notice Banner */}
        {isFromCheckout && (
          <div className="p-4 bg-primary/10 border border-primary/20 text-ink text-xs rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
              <span>You need to add a shipping address before completing your order. Please add your address details below.</span>
            </div>
            <Link
              href="/cart"
              className="text-[10px] uppercase font-bold text-primary hover:underline bg-surface-2 border border-hairline px-3 py-1.5 rounded-sm self-start sm:self-auto text-center font-semibold transition-all hover:bg-surface-3 hover:border-hairline-strong whitespace-nowrap"
            >
              Return to Checkout
            </Link>
          </div>
        )}

        {/* Global Feedback */}
        {success && (
          <div className="p-3.5 bg-green-950/20 border border-green-900/40 text-green-400 text-xs rounded-sm flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-sm flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!profileData ? (
          <div className="py-24 flex items-center justify-center gap-2 text-xs text-ink-subtle">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Retrieving profile logs…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Info Cards & Form */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Profile details Form */}
              <form onSubmit={handleProfileUpdate} className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-6">
                <div className="border-b border-hairline pb-4 flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Personal Details
                  </h3>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-primary border border-primary text-primary-foreground hover:bg-primary-hover text-xs font-semibold rounded-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Save Profile
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                  
                  {/* Avatar Picker */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-24 h-24 rounded-full border border-hairline-strong bg-surface-2 overflow-hidden flex items-center justify-center group">
                      {avatarPreview ? (
                        <Image src={avatarPreview} alt="User Avatar" fill className="object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-ink-tertiary" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity pointer-events-none">
                        <Camera className="w-4 h-4 mr-1" /> Change
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="avatar-file"
                        name="profilePictureFile"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-file"
                        className="px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-hairline rounded-sm text-[10px] text-ink font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        Choose File
                      </label>
                    </div>
                    {avatarFileName && <span className="text-[9px] text-ink-tertiary max-w-[100px] truncate">{avatarFileName}</span>}
                  </div>

                  {/* Fields */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Email Address (Read-only)</label>
                      <input
                        type="email"
                        disabled
                        value={profileData.email}
                        className="bg-canvas border border-hairline/60 text-ink-tertiary text-xs px-2.5 py-2 rounded-sm cursor-not-allowed"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={profileData.name}
                        className="bg-canvas border border-hairline text-ink text-xs px-2.5 py-2 rounded-sm focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Phone Number</label>
                      <div className="relative flex items-center">
                        <Phone className="w-3.5 h-3.5 text-ink-subtle absolute left-2.5" />
                        <input
                          type="text"
                          name="phone"
                          placeholder="e.g. 9876543210…"
                          defaultValue={profileData.phone || ""}
                          className="bg-canvas border border-hairline text-ink text-xs pl-8 pr-2.5 py-2 rounded-sm focus:border-primary focus:outline-none transition-colors w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </form>

              {/* Address Book Manager */}
              <div id="address-book" className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-hairline pb-4">
                  <MapPin className="w-4 h-4" />
                  Address Book ({profileData.savedAddresses?.length || 0})
                </h3>

                {/* Address List */}
                {profileData.savedAddresses && profileData.savedAddresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profileData.savedAddresses.map((addr: string, idx: number) => {
                      const parsed = parseAddressString(addr);
                      return (
                        <div key={idx} className="flex justify-between items-start bg-canvas border border-hairline rounded-md p-4 text-xs animate-in fade-in duration-150 gap-4 hover:border-hairline-strong transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-ink text-xs">
                                {parsed.name || profileData.name}
                              </span>
                              {parsed.type && (
                                <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">
                                  {parsed.type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-subtle block font-mono">
                              Phone: {parsed.phone || profileData.phone || "N/A"}
                            </span>
                            <p className="text-[11px] text-ink-muted leading-relaxed mt-2 whitespace-pre-wrap font-sans">
                              {parsed.addressLine}
                              {parsed.cityState && `\n${parsed.cityState}`}
                              {parsed.pincode && `\nPin Code: ${parsed.pincode}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAddress(idx)}
                            disabled={addressPending}
                            className="p-1.5 rounded-sm text-ink-subtle hover:text-red-400 hover:bg-surface-2 transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ink-tertiary italic py-2">No addresses saved to book yet.</p>
                )}

                {/* Add new address */}
                <form onSubmit={handleAddAddress} className="flex flex-col gap-4 border-t border-hairline pt-6 mt-4">
                  <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Add New Shipping Address</span>
                  
                  {formError && (
                    <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Address Type */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Address Type *</span>
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

                  {/* Recipient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="addr-name" className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Recipient Name *</label>
                      <input
                        type="text"
                        id="addr-name"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Recipient's full name"
                        className="bg-canvas text-ink text-xs px-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="addr-phone" className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Phone Number *</label>
                      <input
                        type="tel"
                        id="addr-phone"
                        required
                        maxLength={10}
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                        className="bg-canvas text-ink text-xs px-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="addr-line" className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">Street Address / Apartment / House No. *</label>
                    <textarea
                      id="addr-line"
                      required
                      rows={2}
                      value={newLine}
                      onChange={(e) => setNewLine(e.target.value)}
                      placeholder="e.g. Flat 303, Rosewood Apts, Linking Road"
                      className="bg-canvas text-ink text-xs px-3 py-2 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary resize-none transition-colors"
                      autoFocus={isFromCheckout}
                    />
                  </div>

                  {/* City, State, PIN Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="addr-city" className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">City *</label>
                      <input
                        type="text"
                        id="addr-city"
                        required
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="bg-canvas text-ink text-xs px-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="addr-state" className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">State *</label>
                      <input
                        type="text"
                        id="addr-state"
                        required
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="bg-canvas text-ink text-xs px-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="addr-pincode" className="text-[9px] text-ink-subtle uppercase tracking-wider font-semibold">PIN Code *</label>
                      <input
                        type="text"
                        id="addr-pincode"
                        required
                        maxLength={6}
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 400050"
                        className="bg-canvas text-ink text-xs px-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary placeholder:text-ink-tertiary transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addressPending}
                    className="mt-2 w-full py-3 bg-primary hover:bg-primary-hover border border-primary-focus text-primary-foreground text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {addressPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Save Address Details
                  </button>
                </form>
              </div>

            </div>

            {/* Right Side: Account summaries stats */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Account Overview</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-canvas border border-hairline rounded-sm p-4 text-center flex flex-col items-center gap-1">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span className="text-[9px] text-ink-subtle uppercase font-semibold">Total Orders</span>
                    <strong className="text-lg text-ink font-bold mt-1">{profileData._count?.orders || 0}</strong>
                  </div>

                  <div className="bg-canvas border border-hairline rounded-sm p-4 text-center flex flex-col items-center gap-1">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500/10" />
                    <span className="text-[9px] text-ink-subtle uppercase font-semibold">Wishlist Size</span>
                    <strong className="text-lg text-ink font-bold mt-1">{wishlistCount}</strong>
                  </div>
                </div>

                <hr className="border-hairline" />

                {/* Profile quick metadata */}
                <div className="text-[10px] text-ink-subtle flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span>Role Permissions:</span>
                    <strong className="text-ink font-mono uppercase">{profileData.role}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Email:</span>
                    <strong className={profileData.emailVerified ? "text-green-400" : "text-amber-500"}>
                      {profileData.emailVerified ? "Verified" : "Verification Required"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Joined Studio:</span>
                    <span className="text-ink-muted">{formatDate(profileData.createdAt)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-canvas text-ink animate-pulse">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-4 text-xs text-ink-subtle uppercase">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Retrieving profile logs…</span>
        </main>
        <Footer />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
