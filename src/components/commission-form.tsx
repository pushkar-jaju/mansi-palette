"use client";

import React, { useState, useTransition } from "react";
import { submitCommissionRequest } from "@/app/commissions/actions";
import { resendVerificationAction } from "@/app/auth/actions";
import { Sparkles, Layers, Send, FileImage, CheckCircle2 } from "lucide-react";
import { useAuth } from "./providers";
import { useRouter } from "next/navigation";

interface CommissionFormProps {
  initialUser: {
    name: string;
    email: string;
  } | null;
}

export function CommissionForm({ initialUser }: CommissionFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/auth/login?redirect=/commissions");
      return;
    }

    setError(null);

    const formData = new FormData(e.currentTarget);
    const clientPhone = formData.get("clientPhone") as string;
    if (clientPhone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(clientPhone)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
    }
    
    startTransition(async () => {
      const res = await submitCommissionRequest(formData);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Something went wrong.");
      }
    });
  };

  if (success) {
    return (
      <div className="bg-surface-1 border border-hairline rounded-md p-8 text-center flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-ink">Commission Request Received!</h3>
        <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
          Thank you for submitting your custom painting request. Mansi will review your specifications (size, budget, description) and email you within 2-3 business days to discuss details.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs font-semibold text-primary hover:text-primary-focus transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="bg-surface-1 border border-hairline rounded-md p-8 flex flex-col gap-5 items-center text-center justify-center min-h-[300px] animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <Layers className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h3 className="text-sm font-semibold text-ink">Email Verification Required</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Please verify your email address (<strong>{user.email}</strong>) to submit custom commission requests. A verification link has been sent to your inbox.
          </p>
        </div>
        <ResendCommissionButton />
      </div>
    );
  }
 
  return (
    <form onSubmit={handleSubmit} key={user?.id || "guest"} className="bg-surface-1 border border-hairline rounded-md p-6 sm:p-8 flex flex-col gap-6 relative">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-ink">Commission Request Form</h3>
        <p className="text-[11px] text-ink-subtle leading-normal">
          Fill out your requirements below. All fields marked with * are required.
        </p>
      </div>
 
      {error && (
        <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm">
          {error}
        </div>
      )}
 
      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientName" className="text-xs text-ink-muted font-medium">Your Name *</label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            required
            autoComplete="name"
            defaultValue={user?.name || ""}
            placeholder="e.g. John Doe…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientEmail" className="text-xs text-ink-muted font-medium">Your Email *</label>
          <input
            type="email"
            id="clientEmail"
            name="clientEmail"
            required
            autoComplete="email"
            spellCheck={false}
            defaultValue={user?.email || ""}
            placeholder="e.g. john@example.com…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientPhone" className="text-xs text-ink-muted font-medium">Your Phone (Optional)</label>
          <input
            type="tel"
            id="clientPhone"
            name="clientPhone"
            autoComplete="tel"
            placeholder="e.g. 9876543210"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
            }}
            title="Please enter a valid 10-digit Indian mobile number."
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        {/* Project details */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-xs text-ink-muted font-medium">Project Title / Theme *</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="e.g. Mountain Lake Sunset Painting…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="description" className="text-xs text-ink-muted font-medium">Description of Vision *</label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="e.g. Share details on the color scheme, subject matter, composition, or lighting you want. Tell Mansi what this painting represents to you…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary resize-none transition-colors"
          />
        </div>
 
        {/* Dimensions */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="width" className="text-xs text-ink-muted font-medium">Desired Width (inches) *</label>
          <input
            type="number"
            id="width"
            name="width"
            required
            min={1}
            step="0.5"
            placeholder="e.g. 24…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        <div className="flex flex-col gap-1.5">
          <label htmlFor="height" className="text-xs text-ink-muted font-medium">Desired Height (inches) *</label>
          <input
            type="number"
            id="height"
            name="height"
            required
            min={1}
            step="0.5"
            placeholder="e.g. 36…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        {/* Budget */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="budget" className="text-xs text-ink-muted font-medium">Estimated Budget (INR) *</label>
          <input
            type="number"
            id="budget"
            name="budget"
            required
            min={100}
            step="10"
            placeholder="e.g. 800…"
            className="bg-canvas text-ink text-xs px-3 py-2.5 rounded-sm border border-hairline focus:border-primary focus:outline-none placeholder:text-ink-tertiary transition-colors"
          />
        </div>
 
        {/* Reference Image */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-ink-muted font-medium">Reference Image (Optional)</label>
          <div className="relative flex items-center justify-center w-full h-[38px] bg-canvas border border-hairline rounded-sm hover:border-hairline-strong transition-colors cursor-pointer">
            <input
              type="file"
              id="referenceFile"
              name="referenceFile"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
              <FileImage className="w-4 h-4 text-primary" />
              <span className="truncate max-w-[200px]">{fileName || "Choose reference file…"}</span>
            </span>
          </div>
        </div>
      </div>
 
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full py-3.5 rounded-sm bg-primary hover:bg-primary-hover border border-primary text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
            Submitting Request…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Commission Request
          </>
        )}
      </button>
    </form>
  );
}

function ResendCommissionButton() {
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
