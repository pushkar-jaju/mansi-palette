import React from "react";
import { getSession } from "@/lib/auth";
import { Navbar, Footer } from "@/components/navigation";
import { CommissionForm } from "@/components/commission-form";
import { Sparkles, HelpCircle, FileText, CheckCircle2, DollarSign, Image as ImageIcon } from "lucide-react";

export const revalidate = 0; // Dynamic rendering

export default async function CommissionsPage() {
  const session = await getSession();

  const steps = [
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: "1. Submission",
      description: "Submit dimensions, description, budget, and references through the form. It's completely free and non-binding.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      title: "2. Consultation",
      description: "Mansi will email you to discuss colors, frame details, and confirm the final artwork quote.",
    },
    {
      icon: <DollarSign className="w-5 h-5 text-primary" />,
      title: "3. 50% Booking Deposit",
      description: "Once we agree on specs, a 50% deposit secures your commission slot in the painting schedule.",
    },
    {
      icon: <ImageIcon className="w-5 h-5 text-primary" />,
      title: "4. Painting & Review",
      description: "Mansi works on your painting and sends high-res photos for your feedback during the creation process.",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
      title: "5. Delivery & Final Payment",
      description: "Upon approval, the remaining 50% is paid. The artwork is varnished, packed securely, and shipped insured to your door.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16">
        {/* Page Header */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-primary">Bespoke Fine Art</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-1.0px]">Custom Commissions</h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
            Have a specific dimensions or color palette in mind? Partner with Mansi to create a custom artwork crafted specifically for your home or office wall space.
          </p>
        </div>

        {/* Dynamic Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Process info */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-ink">The Commission Process</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Commissioning custom art is a collaborative journey. Here is what to expect from the moment you submit your request to the final delivery.
              </p>
            </div>

            {/* Process Steps */}
            <div className="flex flex-col gap-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 rounded-sm bg-surface-1 border border-hairline/60">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-canvas border border-hairline flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xs font-semibold text-ink">{step.title}</h4>
                    <p className="text-[11px] text-ink-subtle leading-normal">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
 
            {/* FAQs teaser */}
            <div className="p-4 rounded-md bg-surface-1/40 border border-hairline/50 flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                Frequently Asked Questions
              </h4>
              <p className="text-[10px] text-ink-subtle leading-normal">
                <strong>How long does it take?</strong> Typically 4 to 8 weeks depending on size and medium (oil paintings require longer curing times).<br /><br />
                <strong>Can I select a frame?</strong> Yes! Mansi offers custom wood float frames in Natural Oak, Matte Black, and White.
              </p>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <CommissionForm initialUser={session} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
