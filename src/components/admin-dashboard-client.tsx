"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { addPainting, deletePainting, updateOrderStatus, updateCommissionStatus } from "@/app/admin/actions";
import { 
  DollarSign, ShoppingBag, Layers, Paintbrush, 
  Trash2, Plus, RefreshCw, Check, AlertCircle, FileImage, ShieldCheck 
} from "lucide-react";

interface AdminDashboardClientProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalPaintings: number;
    totalCommissions: number;
  };
  paintings: any[];
  orders: any[];
  commissions: any[];
}

export function AdminDashboardClient({ stats, paintings, orders, commissions }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "paintings" | "orders" | "commissions">("stats");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Add painting form states
  const [imageFileName, setImageFileName] = useState("");
  const [commissionNotes, setCommissionNotes] = useState<{ [id: string]: string }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageFileName(file ? file.name : "");
  };

  const handleAddPainting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addPainting(formData);
      if (res.success) {
        setSuccessMsg("Painting added successfully!");
        e.currentTarget.reset();
        setImageFileName("");
      } else {
        setError(res.error || "Failed to add painting.");
      }
    });
  };

  const handleDeletePainting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this painting from the catalog?")) return;
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await deletePainting(id);
      if (res.success) {
        setSuccessMsg("Painting deleted successfully.");
      } else {
        setError(res.error || "Failed to delete painting.");
      }
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status);
      if (res.success) {
        setSuccessMsg("Order status updated successfully.");
      } else {
        setError(res.error || "Failed to update order status.");
      }
    });
  };

  const handleUpdateCommission = async (id: string, status: string) => {
    setError(null);
    setSuccessMsg(null);
    const notes = commissionNotes[id] || "";
    startTransition(async () => {
      const res = await updateCommissionStatus(id, status, notes);
      if (res.success) {
        setSuccessMsg("Commission status updated successfully.");
      } else {
        setError(res.error || "Failed to update commission request.");
      }
    });
  };

  const tabs = [
    { id: "stats", label: "Overview" },
    { id: "paintings", label: "Paintings Catalog" },
    { id: "orders", label: "Customer Orders" },
    { id: "commissions", label: "Commission Requests" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-hairline pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Studio Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.8px] mt-1 text-ink">Admin Dashboard</h1>
        </div>
      </div>

      {/* Alert notifications */}
      {error && (
        <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-950/30 border border-green-900/40 text-green-400 text-xs rounded-sm flex items-center gap-2">
          <Check className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs list (Linear Pricing tab toggles style) */}
      <div className="flex border-b border-hairline gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-ink"
                : "border-transparent text-ink-subtle hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-ink-subtle uppercase tracking-wider">Total Sales</p>
              <h3 className="text-lg font-semibold text-ink mt-1">${stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-ink-subtle uppercase tracking-wider">Paid Orders</p>
              <h3 className="text-lg font-semibold text-ink mt-1">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-ink-subtle uppercase tracking-wider">Catalog Artworks</p>
              <h3 className="text-lg font-semibold text-ink mt-1">{stats.totalPaintings}</h3>
            </div>
          </div>

          <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-ink-subtle uppercase tracking-wider">Commissions Log</p>
              <h3 className="text-lg font-semibold text-ink mt-1">{stats.totalCommissions}</h3>
            </div>
          </div>
        </div>
      )}

      {activeTab === "paintings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Add Painting Form */}
          <form
            onSubmit={handleAddPainting}
            className="lg:col-span-4 bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Add New Painting
            </h3>

            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="Painting title…"
                className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Description *</label>
              <textarea
                id="description"
                name="description"
                required
                rows={2}
                placeholder="Description…"
                className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="price" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min={0}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="width" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Width (in) *</label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  required
                  min={1}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="height" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Height (in) *</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  required
                  min={1}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="category" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Category *</label>
                <select
                  id="category"
                  name="category"
                  required
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="Landscape">Landscape</option>
                  <option value="Abstract">Abstract</option>
                  <option value="Floral">Floral</option>
                  <option value="Coastal">Coastal</option>
                  <option value="Portrait">Portrait</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="medium" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Medium *</label>
                <input
                  type="text"
                  id="medium"
                  name="medium"
                  required
                  placeholder="e.g. Oil on Canvas…"
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="canvasType" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Canvas Type *</label>
                <input
                  type="text"
                  id="canvasType"
                  name="canvasType"
                  required
                  placeholder="Stretched Canvas…"
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="frameOption" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Frame Option</label>
                <input
                  type="text"
                  id="frameOption"
                  name="frameOption"
                  placeholder="e.g. Framed…"
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="isFeatured" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Featured Status</label>
              <select
                id="isFeatured"
                name="isFeatured"
                className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
              >
                <option value="false">Regular Listing</option>
                <option value="true">Home Showcase</option>
              </select>
            </div>

            {/* File Upload field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Artwork File *</label>
              <div className="relative flex items-center justify-center w-full h-[36px] bg-canvas border border-hairline rounded-sm hover:border-hairline-strong transition-colors cursor-pointer">
                <input
                  type="file"
                  name="imageFile"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                  <FileImage className="w-4 h-4 text-primary" />
                  <span className="truncate max-w-[150px]">{imageFileName || "Choose art file…"}</span>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full py-2 bg-primary hover:bg-primary-hover border border-primary text-primary-foreground text-xs font-semibold rounded-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Adding Painting…" : "Add to Catalog"}
            </button>
          </form>

          {/* Right: Paintings List */}
          <div className="lg:col-span-8 bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Artworks Catalog</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-hairline text-ink-subtle">
                    <th className="py-2.5 font-medium">Artwork</th>
                    <th className="py-2.5 font-medium">Category</th>
                    <th className="py-2.5 font-medium text-right">Price</th>
                    <th className="py-2.5 font-medium">Status</th>
                    <th className="py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paintings.map((p) => (
                    <tr key={p.id} className="border-b border-hairline/60 hover:bg-surface-2/40 transition-colors align-top">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-sm bg-surface-2 overflow-hidden flex-shrink-0">
                            <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="32px" />
                          </div>
                          <span className="font-semibold text-ink-muted truncate max-w-[150px]">{p.title}</span>
                        </div>
                      </td>
                      <td className="py-3 text-ink-subtle">{p.category}</td>
                      <td className="py-3 text-right text-ink">${p.price}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                          p.status === "AVAILABLE"
                            ? "bg-green-950/20 border-green-900/40 text-green-400"
                            : "bg-neutral-950 border-hairline text-ink-tertiary"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeletePainting(p.id)}
                          disabled={isPending}
                          className="p-1 rounded-sm text-ink-subtle hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete painting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Customer Orders</h3>
          {orders.length === 0 ? (
            <p className="text-xs text-ink-subtle py-8 text-center">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-hairline text-ink-subtle">
                    <th className="py-2.5 font-medium">Order ID</th>
                    <th className="py-2.5 font-medium">Customer Details</th>
                    <th className="py-2.5 font-medium">Paintings</th>
                    <th className="py-2.5 font-medium text-right">Amount</th>
                    <th className="py-2.5 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-hairline/60 hover:bg-surface-2/20 transition-colors align-top">
                      <td className="py-4 font-mono text-[10px] text-ink-muted">{o.id}</td>
                      <td className="py-4 text-ink-subtle">
                        <div className="font-semibold text-ink">{o.customerName}</div>
                        <div>{o.customerEmail}</div>
                        <div>{o.customerPhone}</div>
                        <div className="max-w-[150px] truncate" title={o.shippingAddress}>{o.shippingAddress}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1.5 max-w-[180px]">
                          {o.items.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span className="truncate text-ink-muted">{item.painting.title}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-right text-ink font-semibold">${o.totalAmount}</td>
                      <td className="py-4 text-center">
                        <select
                          value={o.status}
                          disabled={isPending}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-canvas text-ink text-[11px] px-2 py-1.5 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
 
      {activeTab === "commissions" && (
        <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Custom Commission Inquiries</h3>
          {commissions.length === 0 ? (
            <p className="text-xs text-ink-subtle py-8 text-center">No commission requests submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {commissions.map((c) => (
                <div key={c.id} className="p-5 rounded-md border border-hairline bg-canvas flex flex-col gap-4">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-ink">{c.title}</h4>
                      <p className="text-[10px] text-ink-subtle mt-0.5">
                        Submitted by: <strong className="text-ink-muted">{c.clientName}</strong> &bull; {c.clientEmail} &bull; {c.clientPhone}
                      </p>
                    </div>
 
                    <div className="flex items-center gap-2">
                      <select
                        value={c.status}
                        disabled={isPending}
                        onChange={(e) => handleUpdateCommission(c.id, e.target.value)}
                        className="bg-surface-1 text-ink text-[11px] px-2.5 py-1.5 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-8 flex flex-col gap-3">
                      <div className="text-xs text-ink-muted leading-relaxed">
                        <strong>Vision Description:</strong><br />
                        {c.description}
                      </div>
 
                      <div className="grid grid-cols-3 gap-4 text-[10px] text-ink-subtle uppercase tracking-wider border-t border-hairline pt-3">
                        <div>Size: <span className="font-semibold text-ink-muted">{c.width}&quot; &times; {c.height}&quot; in</span></div>
                        <div>Budget: <span className="font-semibold text-ink-muted">${c.budget}</span></div>
                        <div>Date: <span className="font-semibold text-ink-muted">{new Date(c.createdAt).toLocaleDateString()}</span></div>
                      </div>
                    </div>
 
                    <div className="md:col-span-4 flex flex-col gap-3">
                      {c.referenceUrl ? (
                        <div className="relative aspect-[4/3] w-full rounded-sm border border-hairline overflow-hidden bg-surface-1">
                          <Image src={c.referenceUrl} alt="Client reference" fill className="object-contain" sizes="150px" />
                        </div>
                      ) : (
                        <div className="py-6 border border-dashed border-hairline text-center text-[10px] text-ink-tertiary rounded-sm">
                          No reference file attached
                        </div>
                      )}
                    </div>
                  </div>
 
                  {/* Private admin notes */}
                  <div className="flex flex-col gap-1.5 border-t border-hairline pt-3">
                    <label htmlFor={`notes-${c.id}`} className="text-[10px] text-ink-subtle uppercase tracking-wide font-semibold">Admin Response / Notes</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id={`notes-${c.id}`}
                        placeholder="Add private log or response notes…"
                        defaultValue={c.notes || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCommissionNotes((prev) => ({ ...prev, [c.id]: val }));
                        }}
                        className="flex-1 bg-surface-1 text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => handleUpdateCommission(c.id, c.status)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-surface-1 border border-hairline hover:bg-surface-2 rounded-sm text-[10px] font-semibold text-ink transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
