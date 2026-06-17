"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers";
import { Navbar, Footer } from "@/components/navigation";
import { getMyOrdersAction } from "@/app/actions";
import { parseAddressString } from "@/lib/address";
import { formatShortDate, formatShortDateTime } from "@/lib/utils";
import { 
  ShoppingBag, Calendar, MapPin, IndianRupee, Truck, 
  Clock, ChevronDown, ChevronUp, Loader2, Heart, ArrowLeft, ShieldAlert 
} from "lucide-react";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getMyOrdersAction();
      if (res.success && res.orders) {
        setOrders(res.orders);
        // Expand first order by default if exists
        if (res.orders.length > 0) {
          setExpandedOrderId(res.orders[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-canvas text-ink">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto gap-4">
          <ShoppingBag className="w-12 h-12 text-ink-tertiary animate-pulse" />
          <h1 className="text-xl font-semibold tracking-tight">Access Denied</h1>
          <p className="text-xs text-ink-subtle">
            You must be logged in to view your orders history.
          </p>
          <Link
            href="/auth/login?redirect=/user/orders"
            className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-sm border border-primary transition-all hover:bg-primary-hover"
          >
            Sign In to Account
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Helper to determine status color
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-950/20 border-emerald-900/40 text-emerald-400";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-950/20 border-red-900/40 text-red-400";
      case "SHIPPED":
        return "bg-teal-950/20 border-teal-900/40 text-teal-400";
      case "PENDING_APPROVAL":
        return "bg-amber-950/20 border-amber-900/40 text-amber-500";
      case "ACCEPTED":
        return "bg-cyan-950/20 border-cyan-900/40 text-cyan-400";
      case "PAYMENT_PENDING":
        return "bg-orange-950/20 border-orange-900/40 text-orange-400";
      case "PAYMENT_RECEIVED":
        return "bg-green-950/20 border-green-900/40 text-green-400";
      case "PROCESSING":
        return "bg-indigo-950/20 border-indigo-900/40 text-indigo-400";
      default:
        return "bg-neutral-950 border-hairline text-ink-muted";
    }
  };

  // Status milestones helper
  const statusMilestones = [
    { key: "PENDING_APPROVAL", label: "Pending Approval" },
    { key: "ACCEPTED", label: "Order Accepted" },
    { key: "PAYMENT_PENDING", label: "Payment Pending" },
    { key: "PAYMENT_RECEIVED", label: "Payment Received" },
    { key: "PROCESSING", label: "Processing" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        {/* Back Link & Header */}
        <div className="flex flex-col gap-2">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-xs text-ink-subtle hover:text-ink transition-colors font-medium self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
          <h1 className="text-3xl font-semibold tracking-[-0.8px] mt-2 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-primary" />
            My Orders ({orders.length})
          </h1>
          <p className="text-xs sm:text-sm text-ink-subtle">
            Track shipping details, timeline status updates, and download Certificate details for original canvases purchased.
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2 text-xs text-ink-subtle">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-4 text-ink-subtle max-w-2xl mx-auto w-full">
            <ShoppingBag className="w-10 h-10 text-ink-tertiary" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink">No orders recorded yet</span>
              <span className="text-xs text-ink-subtle">Your order history will appear here once you purchase fine art from our catalog.</span>
            </div>
            <Link
              href="/gallery"
              className="mt-2 px-5 py-2 bg-primary border border-primary text-primary-foreground text-xs font-semibold rounded-sm hover:bg-primary-hover transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const activeIndex = statusMilestones.findIndex(m => m.key === order.status);
              const isCancelled = order.status === "CANCELLED" || order.status === "REJECTED";

              return (
                <div
                  key={order.id}
                  className="bg-surface-1 border border-hairline rounded-md overflow-hidden transition-all duration-200"
                >
                  {/* Collapsed Header Bar */}
                  <div
                    onClick={() => toggleExpand(order.id)}
                    className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-surface-2/30 transition-colors"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-ink-muted">{order.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusStyle(order.status)}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-ink-subtle">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {formatShortDate(order.createdAt)}
                        </span>
                        <span>&bull;</span>
                        <span>{order.items.length} {order.items.length === 1 ? "Artwork" : "Artworks"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-sm font-semibold text-primary">
                        ₹{order.totalAmount.toLocaleString()}
                      </span>
                      <button className="p-1 rounded-sm text-ink-subtle hover:text-ink">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details container */}
                  {isExpanded && (
                    <div className="border-t border-hairline bg-canvas p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-200">
                      
                      {/* Products detail list */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Items in Order</span>
                        <div className="grid grid-cols-1 gap-3">
                          {order.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-surface-1 border border-hairline rounded-sm p-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-sm bg-surface-2 overflow-hidden flex-shrink-0">
                                  <Image
                                    src={item.painting.imageUrl}
                                    alt={item.painting.title}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-ink">{item.painting.title}</span>
                                  <span className="text-[10px] text-ink-subtle">
                                    {item.painting.width}&quot;x{item.painting.height}&quot; &bull; {item.painting.medium}
                                  </span>
                                </div>
                              </div>
                              <span className="font-semibold text-ink">₹{item.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline status milestones */}
                      <div className="flex flex-col gap-4 border-t border-hairline pt-5">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Delivery tracking tracker</span>
                        
                        {isCancelled ? (
                          <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {order.status === "REJECTED"
                                ? "This order has been Rejected. Please contact studio support for details."
                                : "This order has been Cancelled. If you have questions about refund parameters, please contact studio support."
                              }
                            </span>
                          </div>
                        ) : (
                          /* Visual Tracker Steps */
                          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-2 relative">
                            {/* Horizontal progress bar for desktop */}
                            <div className="absolute top-3.5 left-[10%] right-[10%] h-0.5 bg-hairline hidden md:block z-0" />
                            <div
                              className="absolute top-3.5 left-[10%] h-0.5 bg-primary hidden md:block z-0 transition-all duration-500"
                              style={{ width: `${(activeIndex / (statusMilestones.length - 1)) * 80}%` }}
                            />

                            {statusMilestones.map((milestone, idx) => {
                              const isMilestoneCompleted = idx <= activeIndex;
                              const isCurrent = idx === activeIndex;

                              return (
                                <div key={milestone.key} className="flex md:flex-col items-center gap-3 md:gap-1.5 z-10 w-full md:w-auto text-left md:text-center">
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                                    isMilestoneCompleted
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "bg-canvas border-hairline text-ink-tertiary"
                                  } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas" : ""}`}>
                                    {isMilestoneCompleted ? "✓" : idx + 1}
                                  </span>
                                  <div className="flex flex-col md:items-center">
                                    <span className={`text-[11px] font-semibold ${isMilestoneCompleted ? "text-ink" : "text-ink-subtle"}`}>
                                      {milestone.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Extra info metadata grids */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-hairline pt-5 text-xs">
                        
                        {/* Shipping and logistics details */}
                        {(() => {
                          const parsedAddr = parseAddressString(order.shippingAddress);
                          return (
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Delivery Destination</span>
                              <div className="bg-surface-1 border border-hairline rounded-sm p-3.5 text-ink-muted flex flex-col gap-1.5 min-h-[90px] text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-ink">{parsedAddr.name || order.customerName}</span>
                                  {parsedAddr.type && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-primary/20 text-primary uppercase border border-primary/20 font-sans">
                                      {parsedAddr.type}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-ink-subtle font-mono">
                                  Phone: {parsedAddr.phone || order.customerPhone || "N/A"}
                                </span>
                                <hr className="border-hairline/60 my-0.5" />
                                {parsedAddr.type || parsedAddr.name ? (
                                  <p className="leading-relaxed whitespace-pre-wrap text-ink-muted mt-0.5 font-mono">
                                    {parsedAddr.addressLine}
                                    {parsedAddr.cityState && `\n${parsedAddr.cityState}`}
                                    {parsedAddr.pincode && `\nPin: ${parsedAddr.pincode}`}
                                  </p>
                                ) : (
                                  <p className="leading-relaxed whitespace-pre-wrap text-ink-muted mt-0.5">
                                    {order.shippingAddress}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Payment / Tracking */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Logistic / Payment Information</span>
                          <div className="bg-surface-1 border border-hairline rounded-sm p-3.5 text-ink-muted flex flex-col gap-2 min-h-[90px]">
                            <div className="flex justify-between">
                              <span>Payment Status:</span>
                              <strong className={order.paymentStatus === "PAID" ? "text-green-400 font-bold" : "text-amber-500 font-bold"}>
                                {order.paymentStatus} {order.paymentStatus === "PAID" ? "(Confirmed)" : "(Pending)"}
                              </strong>
                            </div>

                            {order.courierName && (
                              <div className="flex justify-between border-t border-hairline/60 pt-1.5 mt-0.5">
                                <span>Shipping Carrier:</span>
                                <strong className="text-ink font-semibold flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5 text-primary" />
                                  {order.courierName}
                                </strong>
                              </div>
                            )}

                            {order.trackingNumber && (
                              <div className="flex justify-between">
                                <span>Tracking Code:</span>
                                <span className="font-mono text-ink font-semibold">{order.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Timeline updates history logs */}
                      {order.timeline && order.timeline.length > 0 && (
                        <div className="border-t border-hairline pt-5 flex flex-col gap-2">
                          <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Order History Logs</span>
                          <div className="flex flex-col gap-3 border-l border-hairline pl-3 mt-1.5">
                            {order.timeline.map((evt: any) => (
                              <div key={evt.id} className="relative flex flex-col gap-0.5 text-xs">
                                <span className="absolute left-[-16px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-ink uppercase text-[9px] tracking-wider">{evt.status.replace(/_/g, " ")}</span>
                                  <span className="text-ink-tertiary text-[10px] font-mono">
                                    {formatShortDateTime(evt.createdAt)}
                                  </span>
                                </div>
                                {evt.note && <p className="text-[11px] text-ink-subtle italic mt-0.5">&ldquo;{evt.note}&rdquo;</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
