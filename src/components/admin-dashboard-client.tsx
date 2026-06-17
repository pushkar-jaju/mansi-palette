"use client";

import React, { useState, useTransition, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { getOptimizedUrl } from "@/lib/cloudinary-utils";
import { 
  addPainting, 
  editPainting, 
  deletePainting, 
  updateOrderStatus, 
  updateCommissionStatus, 
  approveReview, 
  hideReviewSpam, 
  deleteReview, 
  updateStoreSettings 
} from "@/app/admin/actions";
import { parseAddressString } from "@/lib/address";
import { formatDate, formatDateTime, formatShortDateTime } from "@/lib/utils";
import { 
  IndianRupee, ShoppingBag, Layers, Paintbrush, 
  Trash2, Plus, Check, AlertCircle, FileImage, ShieldCheck,
  Users, MessageSquare, LineChart, Settings, Edit, Search, 
  Filter, Star, X, Truck, Calendar, Clock, ArrowRight, Upload, Copy
} from "lucide-react";

interface AdminDashboardClientProps {
  stats: {
    totalRevenue: number;
    totalPaintings: number;
    availablePaintings: number;
    soldPaintings: number;
    totalOrders: number;
    pendingOrders: number;
    totalCommissions: number;
    totalCustomers: number;
  };
  paintings: any[];
  orders: any[];
  commissions: any[];
  reviews: any[];
  customers: any[];
  settings: any;
}

export function AdminDashboardClient({ 
  stats, 
  paintings, 
  orders, 
  commissions,
  reviews,
  customers,
  settings
}: AdminDashboardClientProps) {
  const addFormRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "paintings" | "orders" | "commissions" | "customers" | "reviews" | "analytics" | "settings">("stats");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search & Filters state
  const [paintingSearch, setPaintingSearch] = useState("");
  const [paintingCategoryFilter, setPaintingCategoryFilter] = useState("All");
  const [paintingStatusFilter, setPaintingStatusFilter] = useState("All");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  const [customerSearch, setCustomerSearch] = useState("");

  const [reviewStatusFilter, setReviewStatusFilter] = useState("All");

  // Dialog / Modals state
  const [editingPainting, setEditingPainting] = useState<any | null>(null);
  const [editingPaintingImages, setEditingPaintingImages] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);

  // Form states
  const [addImagesNames, setAddImagesNames] = useState<string[]>([]);
  const [editImagesNames, setEditImagesNames] = useState<string[]>([]);
  const [commissionNotes, setCommissionNotes] = useState<{ [id: string]: string }>({});

  // Cloudinary Direct Client-Side Upload states
  const [isUploadingAdd, setIsUploadingAdd] = useState(false);
  const [addUploadProgress, setAddUploadProgress] = useState<{ [key: string]: number }>({});
  const [addUploadedUrls, setAddUploadedUrls] = useState<string[]>([]);
  const [addUploadedPublicIds, setAddUploadedPublicIds] = useState<string[]>([]);
  const [addUploadError, setAddUploadError] = useState<string | null>(null);

  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState<{ [key: string]: number }>({});
  const [editUploadedUrls, setEditUploadedUrls] = useState<string[]>([]);
  const [editUploadedPublicIds, setEditUploadedPublicIds] = useState<string[]>([]);
  const [editUploadError, setEditUploadError] = useState<string | null>(null);

  const [editingPaintingPublicIds, setEditingPaintingPublicIds] = useState<string[]>([]);
  
  // Settings Logo Name state
  const [settingsLogoName, setSettingsLogoName] = useState("");

  // Detailed Modal states
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [courierNameInput, setCourierNameInput] = useState("");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [timelineNote, setTimelineNote] = useState("");

  const [quoteAmounts, setQuoteAmounts] = useState<{ [id: string]: number }>({});
  const [progressValues, setProgressValues] = useState<{ [id: string]: number }>({});

  const [copiedAddressId, setCopiedAddressId] = useState<string | null>(null);

  const handleCopyAddress = (order: any) => {
    const parsed = parseAddressString(order.shippingAddress);
    const cleanName = parsed.name || order.customerName;
    const cleanPhone = parsed.phone || order.customerPhone || "N/A";
    const addressBlock = [
      cleanName,
      `Phone: ${cleanPhone}`,
      parsed.addressLine || order.shippingAddress,
      parsed.cityState,
      parsed.pincode ? `Pincode: ${parsed.pincode}` : ""
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(addressBlock).then(() => {
      setCopiedAddressId(order.id);
      setTimeout(() => setCopiedAddressId(null), 2000);
    });
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setError(null), 5000);
  };

  // Direct Cloudinary upload function using signed requests
  const uploadFiles = async (
    files: FileList,
    setProgress: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
    setUrls: React.Dispatch<React.SetStateAction<string[]>>,
    setPublicIds: React.Dispatch<React.SetStateAction<string[]>>,
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setIsUploading(true);
    setError(null);
    setProgress({});
    
    const urls: string[] = [];
    const publicIds: string[] = [];
    
    try {
      // 1. Validation (JPG, PNG, WEBP up to 5MB)
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Only JPG, PNG, and WEBP images are allowed.`);
        }
        if (file.size > maxSize) {
          throw new Error(`File size too large: ${file.name}. Maximum size limit is 5MB.`);
        }
      }
      
      // 2. Fetch signed signature parameters from secure route
      const signRes = await axios.post("/api/cloudinary/sign", {
        folder: "mansis-palette"
      });
      const { signature, timestamp, apiKey, cloudName } = signRes.data;
      
      // 3. Upload files to Cloudinary with progress tracking
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", signature);
        formData.append("timestamp", timestamp.toString());
        formData.append("api_key", apiKey);
        formData.append("folder", "mansis-palette");
        
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const res = await axios.post(uploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(prev => ({ ...prev, [file.name]: percent }));
            }
          }
        });
        
        return {
          secure_url: res.data.secure_url,
          public_id: res.data.public_id
        };
      });
      
      const results = await Promise.all(uploadPromises);
      results.forEach((r) => {
        urls.push(r.secure_url);
        publicIds.push(r.public_id);
      });
      
      setUrls(prev => [...prev, ...urls]);
      setPublicIds(prev => [...prev, ...publicIds]);
    } catch (e: any) {
      console.error("Direct upload error:", e);
      setError(e.response?.data?.error || e.message || "Upload failed. Please check setup.");
      setProgress({});
    } finally {
      setIsUploading(false);
    }
  };

  // Add painting form upload callback
  const handleAddFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAddImagesNames(Array.from(files).map(f => f.name));
    setAddUploadedUrls([]);
    setAddUploadedPublicIds([]);
    await uploadFiles(
      files,
      setAddUploadProgress,
      setAddUploadedUrls,
      setAddUploadedPublicIds,
      setIsUploadingAdd,
      setAddUploadError
    );
  };

  // Edit painting form upload callback
  const handleEditFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setEditImagesNames(Array.from(files).map(f => f.name));
    setEditUploadedUrls([]);
    setEditUploadedPublicIds([]);
    await uploadFiles(
      files,
      setEditUploadProgress,
      setEditUploadedUrls,
      setEditUploadedPublicIds,
      setIsUploadingEdit,
      setEditUploadError
    );
  };

  // Settings logo upload callback
  const handleSettingsLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSettingsLogoName(file ? file.name : "");
  };

  // Add painting action handler
  const handleAddPainting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUploadingAdd) {
      alert("Please wait until images complete uploading.");
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("cloudinaryUrls", JSON.stringify(addUploadedUrls));
    formData.append("cloudinaryPublicIds", JSON.stringify(addUploadedPublicIds));

    startTransition(async () => {
      const res = await addPainting(formData);
      if (res.success) {
        showSuccess("Painting added successfully to the catalog.");
        addFormRef.current?.reset();
        setAddImagesNames([]);
        setAddUploadedUrls([]);
        setAddUploadedPublicIds([]);
        setAddUploadProgress({});
      } else {
        showError(res.error || "Failed to add painting.");
      }
    });
  };

  // Edit painting action handler
  const handleEditPaintingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPainting) return;
    if (isUploadingEdit) {
      alert("Please wait until images complete uploading.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.append("existingImages", JSON.stringify(editingPaintingImages));
    formData.append("existingImagesPublicIds", JSON.stringify(editingPaintingPublicIds));
    formData.append("cloudinaryUrls", JSON.stringify(editUploadedUrls));
    formData.append("cloudinaryPublicIds", JSON.stringify(editUploadedPublicIds));
    
    startTransition(async () => {
      const res = await editPainting(editingPainting.id, formData);
      if (res.success) {
        showSuccess("Painting details updated successfully.");
        setEditingPainting(null);
        setEditImagesNames([]);
        setEditUploadedUrls([]);
        setEditUploadedPublicIds([]);
        setEditUploadProgress({});
      } else {
        showError(res.error || "Failed to update painting.");
      }
    });
  };

  // Delete painting action handler
  const handleDeletePainting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this painting from the catalog? This is a destructive action.")) return;
    startTransition(async () => {
      const res = await deletePainting(id);
      if (res.success) {
        showSuccess("Painting deleted successfully.");
      } else {
        showError(res.error || "Failed to delete painting.");
      }
    });
  };

  // Order Details / Status / Courier action handler
  const handleUpdateOrderDetails = async (orderId: string) => {
    startTransition(async () => {
      const targetStatus = newOrderStatus || viewingOrder.status;
      const res = await updateOrderStatus(
        orderId, 
        targetStatus, 
        courierNameInput, 
        trackingNumberInput, 
        timelineNote
      );
      if (res.success) {
        showSuccess("Order details updated successfully.");
        
        const localTimeline = viewingOrder.timeline ? [...viewingOrder.timeline] : [];
        localTimeline.push({
          id: `local_evt_${Date.now()}`,
          orderId,
          status: targetStatus,
          note: timelineNote || `Order status updated to ${targetStatus}.`,
          createdAt: new Date().toISOString()
        });

        setViewingOrder((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            status: targetStatus,
            courierName: courierNameInput,
            trackingNumber: trackingNumberInput,
            timeline: localTimeline
          };
        });
        setNewOrderStatus("");
        setTimelineNote("");
      } else {
        showError(res.error || "Failed to update order details.");
      }
    });
  };

  const handleQuickAction = async (orderId: string, updates: { status?: string; paymentStatus?: string; note?: string }) => {
    startTransition(async () => {
      const targetStatus = updates.status || viewingOrder.status;
      const targetPaymentStatus = updates.paymentStatus || viewingOrder.paymentStatus;
      
      const res = await updateOrderStatus(
        orderId,
        targetStatus,
        courierNameInput || viewingOrder.courierName || "",
        trackingNumberInput || viewingOrder.trackingNumber || "",
        updates.note || timelineNote,
        updates.paymentStatus
      );
      if (res.success) {
        showSuccess("Order quick action processed successfully.");
        
        const localTimeline = viewingOrder.timeline ? [...viewingOrder.timeline] : [];
        localTimeline.push({
          id: `local_evt_${Date.now()}`,
          orderId,
          status: targetStatus,
          note: updates.note || timelineNote || `Order status updated to ${targetStatus}.`,
          createdAt: new Date().toISOString()
        });

        setViewingOrder((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            status: targetStatus,
            paymentStatus: targetPaymentStatus,
            timeline: localTimeline
          };
        });

        setNewOrderStatus(targetStatus);
        setTimelineNote("");
      } else {
        showError(res.error || "Failed to process quick action.");
      }
    });
  };

  // Commission actions
  const handleSendQuote = async (commissionId: string) => {
    const amount = quoteAmounts[commissionId];
    if (!amount || isNaN(amount)) {
      alert("Please enter a valid quote amount.");
      return;
    }
    const notes = commissionNotes[commissionId] || "";
    startTransition(async () => {
      const res = await updateCommissionStatus(commissionId, "QUOTE_SENT", notes, amount);
      if (res.success) {
        showSuccess("Quote submitted successfully. Status updated to QUOTE_SENT.");
      } else {
        showError(res.error || "Failed to send quote.");
      }
    });
  };

  const handleUpdateCommissionState = async (commissionId: string, status: string) => {
    const notes = commissionNotes[commissionId] || "";
    const progress = progressValues[commissionId];
    startTransition(async () => {
      const res = await updateCommissionStatus(commissionId, status, notes, undefined, progress);
      if (res.success) {
        showSuccess(`Commission request updated to ${status}.`);
      } else {
        showError(res.error || "Failed to update commission request.");
      }
    });
  };

  // Review actions
  const handleApproveReview = async (id: string) => {
    startTransition(async () => {
      const res = await approveReview(id);
      if (res.success) {
        showSuccess("Review approved successfully.");
      } else {
        showError(res.error || "Failed to approve review.");
      }
    });
  };

  const handleHideReviewSpam = async (id: string) => {
    startTransition(async () => {
      const res = await hideReviewSpam(id);
      if (res.success) {
        showSuccess("Review marked as SPAM.");
      } else {
        showError(res.error || "Failed to flag review as spam.");
      }
    });
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    startTransition(async () => {
      const res = await deleteReview(id);
      if (res.success) {
        showSuccess("Review deleted successfully.");
      } else {
        showError(res.error || "Failed to delete review.");
      }
    });
  };

  // Settings action handler
  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateStoreSettings(formData);
      if (res.success) {
        showSuccess("Store settings updated successfully.");
        setSettingsLogoName("");
      } else {
        showError(res.error || "Failed to update settings.");
      }
    });
  };

  // Filtered lists
  const filteredPaintings = paintings.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(paintingSearch.toLowerCase()) ||
                          p.description.toLowerCase().includes(paintingSearch.toLowerCase()) ||
                          p.medium.toLowerCase().includes(paintingSearch.toLowerCase());
    const matchesCategory = paintingCategoryFilter === "All" || p.category === paintingCategoryFilter;
    const matchesStatus = paintingStatusFilter === "All" || p.status === paintingStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(c => {
    return c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
           c.email.toLowerCase().includes(customerSearch.toLowerCase());
  });

  const filteredReviews = reviews.filter(r => {
    return reviewStatusFilter === "All" || r.status === reviewStatusFilter;
  });

  // Analytics Helpers
  const getMonthlyAnalytics = () => {
    const monthlyData: { [key: string]: { revenue: number; ordersCount: number } } = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      monthlyData[key] = { revenue: 0, ordersCount: 0 };
    }

    orders.forEach((o) => {
      if (o.paymentStatus === "PAID") {
        const date = new Date(o.createdAt);
        const key = `${months[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
        if (monthlyData[key] !== undefined) {
          monthlyData[key].revenue += o.totalAmount;
          monthlyData[key].ordersCount += 1;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      ordersCount: data.ordersCount,
    }));
  };

  const monthlyAnalytics = getMonthlyAnalytics();
  const maxRevenue = Math.max(...monthlyAnalytics.map(m => m.revenue), 1000);

  // Categories list
  const categoryOptions = ["Landscape", "Abstract", "Floral", "Coastal", "Portrait"];

  const tabs = [
    { id: "stats", label: "Overview", icon: ShieldCheck },
    { id: "paintings", label: "Paintings Catalog", icon: Paintbrush },
    { id: "orders", label: "Customer Orders", icon: ShoppingBag },
    { id: "commissions", label: "Commission Requests", icon: Layers },
    { id: "customers", label: "Customers Log", icon: Users },
    { id: "reviews", label: "Product Reviews", icon: MessageSquare },
    { id: "analytics", label: "Analytics Reports", icon: LineChart },
    { id: "settings", label: "Store Settings", icon: Settings },
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
        <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-sm flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-950/30 border border-green-900/40 text-green-400 text-xs rounded-sm flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Nav */}
      <div className="flex border-b border-hairline gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-primary text-ink"
                  : "border-transparent text-ink-subtle hover:text-ink"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTAINER */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "stats" && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-ink-subtle uppercase tracking-wider">Total Sales</p>
                <h3 className="text-lg font-semibold text-ink mt-1">₹{stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-surface-1 border border-hairline rounded-md p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-ink-subtle uppercase tracking-wider">Total Orders</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col justify-between">
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Available Paintings</span>
              <h3 className="text-2xl font-bold text-green-400 mt-2">{stats.availablePaintings}</h3>
            </div>
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col justify-between">
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Sold Paintings</span>
              <h3 className="text-2xl font-bold text-ink-subtle mt-2">{stats.soldPaintings}</h3>
            </div>
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col justify-between">
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Pending Orders</span>
              <h3 className="text-2xl font-bold text-amber-500 mt-2">{stats.pendingOrders}</h3>
            </div>
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col justify-between">
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Registered Customers</span>
              <h3 className="text-2xl font-bold text-primary mt-2">{stats.totalCustomers}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Recent Orders</h3>
                <button onClick={() => setActiveTab("orders")} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-hairline text-ink-subtle">
                      <th className="py-2 font-medium">Customer</th>
                      <th className="py-2 font-medium text-right">Amount</th>
                      <th className="py-2 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="border-b border-hairline/40 hover:bg-surface-2/20">
                        <td className="py-2.5">
                          <span className="font-semibold text-ink">{o.customerName}</span>
                          <span className="block text-[10px] text-ink-subtle">{formatDate(o.createdAt)}</span>
                        </td>
                        <td className="py-2.5 text-right font-semibold">₹{o.totalAmount.toLocaleString()}</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            o.status === "DELIVERED" ? "bg-green-950/20 border-green-900/40 text-green-400" :
                            o.status === "CANCELLED" ? "bg-red-950/20 border-red-900/40 text-red-400" :
                            o.status === "SHIPPED" ? "bg-blue-950/20 border-blue-900/40 text-blue-400" :
                            o.status === "OUT_FOR_DELIVERY" ? "bg-purple-950/20 border-purple-900/40 text-purple-400" :
                            o.status === "PROCESSING" ? "bg-amber-950/20 border-amber-900/40 text-amber-500" :
                            "bg-neutral-950 border-hairline text-ink-muted"
                          }`}>
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Commissions */}
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Recent Custom inquiries</h3>
                <button onClick={() => setActiveTab("commissions")} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-hairline text-ink-subtle">
                      <th className="py-2 font-medium">Project</th>
                      <th className="py-2 font-medium">Client</th>
                      <th className="py-2 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.slice(0, 5).map((c) => (
                      <tr key={c.id} className="border-b border-hairline/40 hover:bg-surface-2/20">
                        <td className="py-2.5">
                          <span className="font-semibold text-ink truncate max-w-[120px] block">{c.title}</span>
                          <span className="block text-[10px] text-ink-subtle">{formatDate(c.createdAt)}</span>
                        </td>
                        <td className="py-2.5 text-ink-subtle">{c.clientName}</td>
                        <td className="py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary/30 text-primary bg-primary/5 uppercase">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAINTINGS CATALOG */}
      {activeTab === "paintings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Add Painting Form */}
          <form
            ref={addFormRef}
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
                <label htmlFor="price" className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Price (₹) *</label>
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
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
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

            {/* Multiple File Upload field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Upload Artwork Images (Multiple) *</label>
              <div className="relative flex items-center justify-center w-full h-[40px] bg-canvas border border-hairline rounded-sm hover:border-hairline-strong transition-colors cursor-pointer">
                <input
                  type="file"
                  name="imageFiles"
                  multiple
                  required={addUploadedUrls.length === 0}
                  accept="image/*"
                  onChange={handleAddFilesChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs text-ink-subtle px-2 truncate">
                  <Upload className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate">{addImagesNames.length > 0 ? `${addImagesNames.length} files selected` : "Choose art files…"}</span>
                </span>
              </div>
            </div>

            {/* Add progress indicators */}
            {isUploadingAdd && (
              <div className="flex flex-col gap-2 p-3 bg-surface-2/40 border border-hairline rounded-sm text-[11px]">
                <div className="font-semibold text-primary uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <span className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
                  Uploading to Cloudinary...
                </div>
                {Object.entries(addUploadProgress).map(([filename, percent]) => (
                  <div key={filename} className="flex flex-col gap-1">
                    <div className="flex justify-between text-ink-muted text-[10px]">
                      <span className="truncate max-w-[180px]">{filename}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full h-1 bg-hairline rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {addUploadError && (
              <div className="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] rounded-sm">
                {addUploadError}
              </div>
            )}
            {!isUploadingAdd && addUploadedUrls.length > 0 && (
              <div className="p-2 bg-green-950/20 border border-green-900/30 text-green-400 text-[10px] rounded-sm flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Uploaded {addUploadedUrls.length} image(s) successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || isUploadingAdd}
              className="mt-2 w-full py-2 bg-primary hover:bg-primary-hover border border-primary text-primary-foreground text-xs font-semibold rounded-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Adding Painting…" : isUploadingAdd ? "Uploading Images…" : "Add to Catalog"}
            </button>
          </form>

          {/* Right: Paintings List with Search and Filter */}
          <div className="lg:col-span-8 bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Artworks Catalog ({filteredPaintings.length})</h3>
              
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-2 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search catalog…"
                    value={paintingSearch}
                    onChange={(e) => setPaintingSearch(e.target.value)}
                    className="bg-canvas text-ink text-[11px] pl-7 pr-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary w-40"
                  />
                </div>

                <select
                  value={paintingCategoryFilter}
                  onChange={(e) => setPaintingCategoryFilter(e.target.value)}
                  className="bg-canvas text-ink text-[11px] px-2 py-1.5 rounded-sm border border-hairline focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={paintingStatusFilter}
                  onChange={(e) => setPaintingStatusFilter(e.target.value)}
                  className="bg-canvas text-ink text-[11px] px-2 py-1.5 rounded-sm border border-hairline focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="SOLD">Sold</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-hairline text-ink-subtle">
                    <th className="py-2.5 font-medium">Artwork</th>
                    <th className="py-2.5 font-medium">Category</th>
                    <th className="py-2.5 font-medium text-right">Price</th>
                    <th className="py-2.5 font-medium text-center">Status</th>
                    <th className="py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaintings.map((p) => (
                    <tr key={p.id} className="border-b border-hairline/60 hover:bg-surface-2/40 transition-colors align-top">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-sm bg-surface-2 overflow-hidden flex-shrink-0">
                            <Image src={getOptimizedUrl(p.imageUrl)} alt={p.title} fill className="object-cover" sizes="32px" />
                          </div>
                          <div>
                            <span className="font-semibold text-ink-muted truncate max-w-[150px] block">{p.title}</span>
                            <span className="text-[10px] text-ink-subtle font-mono">{p.width}x{p.height} in &bull; {p.medium}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-ink-subtle">{p.category}</td>
                      <td className="py-3 text-right text-ink">₹{p.price.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                          p.status === "AVAILABLE" ? "bg-green-950/20 border-green-900/40 text-green-400" :
                          p.status === "SOLD" ? "bg-neutral-950 border-hairline text-ink-tertiary" :
                          "bg-amber-950/20 border-amber-900/40 text-amber-500"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingPainting(p);
                              setEditingPaintingImages(p.images || [p.imageUrl]);
                              setEditingPaintingPublicIds(p.imagesPublicIds || [p.imagePublicId].filter(Boolean));
                              setEditImagesNames([]);
                              setEditUploadedUrls([]);
                              setEditUploadedPublicIds([]);
                              setEditUploadProgress({});
                              setEditUploadError(null);
                            }}
                            className="p-1 rounded-sm text-ink-subtle hover:text-primary transition-colors"
                            title="Edit details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePainting(p.id)}
                            disabled={isPending}
                            className="p-1 rounded-sm text-ink-subtle hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Delete painting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS */}
      {activeTab === "orders" && (
        <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Customer Orders ({filteredOrders.length})</h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-2 top-2.5" />
                <input
                  type="text"
                  placeholder="Search orders…"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-canvas text-ink text-[11px] pl-7 pr-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary w-48"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-canvas text-ink text-[11px] px-2 py-1.5 rounded-sm border border-hairline focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PAYMENT_PENDING">Payment Pending</option>
                <option value="PAYMENT_RECEIVED">Payment Received</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-xs text-ink-subtle py-8 text-center">No orders matching filters recorded yet.</p>
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
                    <th className="py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="border-b border-hairline/60 hover:bg-surface-2/20 transition-colors align-top animate-in fade-in duration-150">
                      <td className="py-4 font-mono text-[10px] text-ink-muted">{o.id}</td>
                      <td className="py-4 text-ink-subtle">
                        <div className="font-semibold text-ink">{o.customerName}</div>
                        <div>{o.customerEmail}</div>
                        <div className="text-[10px] text-ink-tertiary">{formatDate(o.createdAt)}</div>
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
                      <td className="py-4 text-right text-ink font-semibold">₹{o.totalAmount.toLocaleString()}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          o.status === "DELIVERED" ? "bg-green-950/20 border-green-900/40 text-green-400" :
                          o.status === "REJECTED" || o.status === "CANCELLED" ? "bg-red-950/20 border-red-900/40 text-red-400" :
                          o.status === "SHIPPED" ? "bg-blue-950/20 border-blue-900/40 text-blue-400" :
                          o.status === "PENDING_APPROVAL" ? "bg-amber-950/20 border-amber-900/40 text-amber-500" :
                          o.status === "ACCEPTED" ? "bg-cyan-950/20 border-cyan-900/40 text-cyan-400" :
                          o.status === "PAYMENT_PENDING" ? "bg-orange-950/20 border-orange-900/40 text-orange-400" :
                          o.status === "PAYMENT_RECEIVED" ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" :
                          o.status === "PROCESSING" ? "bg-purple-950/20 border-purple-900/40 text-purple-400" :
                          "bg-neutral-950 border-hairline text-ink-muted"
                        }`}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            setViewingOrder(o);
                            setCourierNameInput(o.courierName || "");
                            setTrackingNumberInput(o.trackingNumber || "");
                            setNewOrderStatus(o.status);
                            setTimelineNote("");
                          }}
                          className="px-3 py-1 bg-surface-2 hover:bg-surface-3 border border-hairline text-[10px] font-semibold rounded-sm transition-colors text-ink-muted"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
  
      {/* TAB 4: COMMISSION REQUESTS */}
      {activeTab === "commissions" && (
        <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Custom Commission Inquiries</h3>
          {commissions.length === 0 ? (
            <p className="text-xs text-ink-subtle py-8 text-center">No commission requests submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {commissions.map((c) => (
                <div key={c.id} className="p-5 rounded-md border border-hairline bg-canvas flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary/30 text-primary bg-primary/5 uppercase">
                        {c.status}
                      </span>
                      <h4 className="text-sm font-semibold text-ink mt-1.5">{c.title}</h4>
                      <p className="text-[10px] text-ink-subtle mt-0.5">
                        Client: <strong className="text-ink-muted">{c.clientName}</strong> &bull; {c.clientEmail} &bull; {c.clientPhone}
                      </p>
                    </div>
  
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={c.status}
                        disabled={isPending}
                        onChange={(e) => handleUpdateCommissionState(c.id, e.target.value)}
                        className="bg-surface-1 text-ink text-[11px] px-2 py-1 rounded-sm border border-hairline focus:outline-none"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="QUOTE_SENT">Quote Sent</option>
                        <option value="APPROVED">Approved</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="READY_FOR_SHIPPING">Ready for Shipping</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="REJECTED">Rejected</option>
                      </select>

                      <button
                        onClick={() => handleUpdateCommissionState(c.id, "APPROVED")}
                        className="px-2.5 py-1 bg-green-950/20 border border-green-900/40 text-green-400 hover:bg-green-950/40 text-[10px] font-semibold rounded-sm transition-colors"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleUpdateCommissionState(c.id, "REJECTED")}
                        className="px-2.5 py-1 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 text-[10px] font-semibold rounded-sm transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-t border-hairline pt-4">
                    <div className="md:col-span-8 flex flex-col gap-3">
                      <div className="text-xs text-ink-muted leading-relaxed">
                        <strong className="text-[10px] text-ink-subtle uppercase">Vision & Requirements:</strong><br />
                        {c.description}
                      </div>
  
                      <div className="grid grid-cols-4 gap-4 text-[10px] text-ink-subtle uppercase tracking-wider border-t border-hairline pt-3 mt-2">
                        <div>Dimensions: <span className="font-semibold text-ink-muted block text-xs mt-0.5">{c.width}&quot; &times; {c.height}&quot;</span></div>
                        <div>Client Budget: <span className="font-semibold text-ink-muted block text-xs mt-0.5">₹{c.budget.toLocaleString()}</span></div>
                        <div>Quote Amount: <span className="font-semibold text-primary block text-xs mt-0.5">{c.quoteAmount ? `₹${c.quoteAmount.toLocaleString()}` : "Not Sent"}</span></div>
                        <div>Received: <span className="font-semibold text-ink-muted block text-xs mt-0.5">{formatDate(c.createdAt)}</span></div>
                      </div>

                      {/* Progress update slider for Approved / In Progress */}
                      {(c.status === "APPROVED" || c.status === "IN_PROGRESS" || c.status === "READY_FOR_SHIPPING") && (
                        <div className="border-t border-hairline pt-3 mt-2 flex flex-col gap-2 bg-surface-2/20 p-3 rounded-sm">
                          <label className="text-[10px] text-ink-subtle uppercase tracking-wide font-semibold flex justify-between">
                            <span>Artwork Creation Progress</span>
                            <span className="text-primary font-bold">{progressValues[c.id] !== undefined ? progressValues[c.id] : (c.progress || 0)}%</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={progressValues[c.id] !== undefined ? progressValues[c.id] : (c.progress || 0)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setProgressValues(prev => ({ ...prev, [c.id]: val }));
                              }}
                              className="flex-1 accent-primary cursor-pointer"
                            />
                            <button
                              onClick={() => handleUpdateCommissionState(c.id, c.status)}
                              className="px-3 py-1 bg-primary border border-primary text-primary-foreground hover:bg-primary-hover rounded-sm text-[10px] font-semibold transition-colors"
                            >
                              Update Progress
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
  
                    <div className="md:col-span-4 flex flex-col gap-3">
                      {c.referenceUrl ? (
                        <div className="relative aspect-[4/3] w-full rounded-sm border border-hairline overflow-hidden bg-surface-1">
                          <Image src={c.referenceUrl} alt="Client reference" fill className="object-contain" sizes="200px" />
                        </div>
                      ) : (
                        <div className="py-6 border border-dashed border-hairline text-center text-[10px] text-ink-tertiary rounded-sm">
                          No reference files attached
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Send Quote Section */}
                  {c.status === "PENDING" && (
                    <div className="flex flex-col gap-2 bg-surface-2/30 border border-hairline p-4 rounded-sm">
                      <h5 className="text-[10px] text-primary uppercase font-bold tracking-wider">Send Final Quote & Response</h5>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[9px] text-ink-subtle uppercase">Quote Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="Quote Price in INR…"
                            value={quoteAmounts[c.id] || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setQuoteAmounts(prev => ({ ...prev, [c.id]: val }));
                            }}
                            className="bg-surface-1 text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex-2 flex flex-col gap-1">
                          <label className="text-[9px] text-ink-subtle uppercase">Response Notes to Client</label>
                          <input
                            type="text"
                            placeholder="Offer parameters or details..."
                            value={commissionNotes[c.id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCommissionNotes(prev => ({ ...prev, [c.id]: val }));
                            }}
                            className="bg-surface-1 text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary"
                          />
                        </div>
                        <button
                          onClick={() => handleSendQuote(c.id)}
                          className="self-end px-4 py-2 bg-primary border border-primary text-primary-foreground hover:bg-primary-hover rounded-sm text-xs font-semibold transition-colors"
                        >
                          Send Quote
                        </button>
                      </div>
                    </div>
                  )}
  
                  {/* Private admin notes */}
                  <div className="flex flex-col gap-1.5 border-t border-hairline pt-3">
                    <label htmlFor={`notes-${c.id}`} className="text-[10px] text-ink-subtle uppercase tracking-wide font-semibold">Admin Logs / Response Notes</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id={`notes-${c.id}`}
                        placeholder="Add private log notes…"
                        defaultValue={c.notes || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCommissionNotes((prev) => ({ ...prev, [c.id]: val }));
                        }}
                        className="flex-1 bg-surface-1 text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => handleUpdateCommissionState(c.id, c.status)}
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

      {/* TAB 5: CUSTOMERS LOG */}
      {activeTab === "customers" && (
        <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Registered Customers ({filteredCustomers.length})</h3>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-2 top-2.5" />
              <input
                type="text"
                placeholder="Search customers by name or email…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="bg-canvas text-ink text-[11px] pl-7 pr-3 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary w-64"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <p className="text-xs text-ink-subtle py-8 text-center">No customer records matching filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-hairline text-ink-subtle">
                    <th className="py-2.5 font-medium">Customer Name</th>
                    <th className="py-2.5 font-medium">Email Address</th>
                    <th className="py-2.5 font-medium text-center">Orders Count</th>
                    <th className="py-2.5 font-medium text-center">Commissions Count</th>
                    <th className="py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="border-b border-hairline/60 hover:bg-surface-2/20 transition-colors">
                      <td className="py-3 font-semibold text-ink">{cust.name}</td>
                      <td className="py-3 text-ink-subtle">{cust.email}</td>
                      <td className="py-3 text-center text-ink-muted">{cust.orders?.length || 0}</td>
                      <td className="py-3 text-center text-ink-muted">{cust.commissions?.length || 0}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setViewingCustomer(cust)}
                          className="px-3 py-1 bg-surface-2 hover:bg-surface-3 border border-hairline text-[10px] font-semibold rounded-sm transition-colors text-ink-muted"
                        >
                          Customer profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PRODUCT REVIEWS */}
      {activeTab === "reviews" && (
        <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Customer Reviews ({filteredReviews.length})</h3>

            <select
              value={reviewStatusFilter}
              onChange={(e) => setReviewStatusFilter(e.target.value)}
              className="bg-canvas text-ink text-[11px] px-2 py-1.5 rounded-sm border border-hairline focus:outline-none"
            >
              <option value="All">All Reviews</option>
              <option value="PENDING">Pending Moderation</option>
              <option value="APPROVED">Approved Reviews</option>
              <option value="SPAM">Flagged Spam</option>
            </select>
          </div>

          {filteredReviews.length === 0 ? (
            <p className="text-xs text-ink-subtle py-8 text-center">No reviews found matching filter.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((rev) => (
                <div key={rev.id} className="p-4 border border-hairline rounded-md bg-canvas flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink">{rev.authorName}</span>
                        <span className="text-[10px] text-ink-subtle">({rev.authorEmail})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                          rev.status === "APPROVED" ? "bg-green-950/20 border-green-900/40 text-green-400" :
                          rev.status === "SPAM" ? "bg-red-950/20 border-red-900/40 text-red-400" :
                          "bg-amber-950/20 border-amber-900/40 text-amber-500"
                        }`}>
                          {rev.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "text-primary fill-primary" : "text-ink-tertiary"}`} />
                        ))}
                        <span className="text-[10px] text-ink-tertiary ml-2">{formatDate(rev.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rev.status !== "APPROVED" && (
                        <button
                          onClick={() => handleApproveReview(rev.id)}
                          className="px-2 py-1 bg-green-950/20 border border-green-900/40 text-green-400 hover:bg-green-950/40 text-[10px] font-semibold rounded-sm transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {rev.status !== "SPAM" && (
                        <button
                          onClick={() => handleHideReviewSpam(rev.id)}
                          className="px-2 py-1 bg-amber-950/20 border border-amber-900/40 text-amber-500 hover:bg-amber-950/40 text-[10px] font-semibold rounded-sm transition-colors"
                        >
                          Mark Spam
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="px-2 py-1 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 text-[10px] font-semibold rounded-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed italic">&ldquo;{rev.comment}&rdquo;</p>
                  
                  {rev.painting && (
                    <div className="text-[10px] text-ink-subtle border-t border-hairline/60 pt-2 flex items-center gap-1.5">
                      <span className="font-semibold uppercase">Product Reviewed:</span>
                      <span className="text-primary font-medium">{rev.painting.title}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monthly Sales Revenue */}
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Revenue Trend (Last 6 Months)</h3>
              
              <div className="relative pt-6">
                <svg viewBox="0 0 500 200" className="w-full h-48">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                  {/* Bars */}
                  {monthlyAnalytics.map((item, idx) => {
                    const x = 60 + idx * 75;
                    const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 140 : 0;
                    const y = 170 - barHeight;
                    return (
                      <g key={item.month} className="group">
                        <rect x={x - 15} y="15" width="50" height="160" fill="transparent" className="hover:fill-white/5 transition-colors duration-150 cursor-pointer" />
                        <rect
                          x={x}
                          y={y}
                          width="20"
                          height={barHeight}
                          fill="url(#primaryGradient)"
                          rx="2"
                        />
                        <text
                          x={x + 10}
                          y={y - 8}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.9)"
                          fontSize="9"
                          className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-semibold"
                        >
                          ₹{Math.round(item.revenue).toLocaleString()}
                        </text>
                        <text
                          x={x + 10}
                          y={188}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.4)"
                          fontSize="10"
                        >
                          {item.month}
                        </text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b39b56" stopOpacity="1" />
                      <stop offset="100%" stopColor="#b39b56" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Monthly Volume */}
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Orders Volume Trend</h3>
              
              <div className="relative pt-6">
                <svg viewBox="0 0 500 200" className="w-full h-48">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                  {/* Volume curve */}
                  {(() => {
                    const maxCount = Math.max(...monthlyAnalytics.map(m => m.ordersCount), 5);
                    const points = monthlyAnalytics.map((item, idx) => {
                      const x = 70 + idx * 75;
                      const y = 170 - (item.ordersCount / maxCount) * 140;
                      return `${x},${y}`;
                    }).join(" ");
                    
                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          points={points}
                        />
                        {monthlyAnalytics.map((item, idx) => {
                          const x = 70 + idx * 75;
                          const y = 170 - (item.ordersCount / maxCount) * 140;
                          return (
                            <g key={item.month} className="group">
                              <circle
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#38bdf8"
                                className="hover:r-6 cursor-pointer transition-all"
                              />
                              <text
                                cx={x}
                                cy={y - 10}
                                x={x}
                                y={y - 10}
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.9)"
                                fontSize="9"
                                className="opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none"
                              >
                                {item.ordersCount} orders
                              </text>
                              <text
                                x={x}
                                y="188"
                                textAnchor="middle"
                                fill="rgba(255,255,255,0.4)"
                                fontSize="10"
                              >
                                {item.month}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Selling Categories / Paintings */}
            <div className="lg:col-span-2 bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Top Selling Catalog Paintings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-hairline text-ink-subtle">
                      <th className="py-2 font-medium">Artwork Title</th>
                      <th className="py-2 font-medium">Category</th>
                      <th className="py-2 font-medium text-right">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paintings.filter(p => p.status === "SOLD").slice(0, 5).map((p) => (
                      <tr key={p.id} className="border-b border-hairline/40 hover:bg-surface-2/20">
                        <td className="py-3 font-semibold text-ink flex items-center gap-2">
                          <div className="relative w-6 h-6 rounded-sm bg-surface-2 overflow-hidden flex-shrink-0">
                            <Image src={getOptimizedUrl(p.imageUrl)} alt={p.title} fill className="object-cover" sizes="24px" />
                          </div>
                          <span>{p.title}</span>
                        </td>
                        <td className="py-3 text-ink-subtle">{p.category}</td>
                        <td className="py-3 text-right font-semibold text-primary">₹{p.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent activity log */}
            <div className="bg-surface-1 border border-hairline rounded-md p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Recent Activity Log</h3>
              
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                {orders.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex gap-3 text-xs">
                    <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-ink">New Order Placed</span>
                      <p className="text-[10px] text-ink-subtle mt-0.5">₹{o.totalAmount} by {o.customerName}</p>
                      <span className="text-[9px] text-ink-tertiary block mt-0.5">{formatDateTime(o.createdAt)}</span>
                    </div>
                  </div>
                ))}

                {commissions.slice(0, 2).map((c) => (
                  <div key={c.id} className="flex gap-3 text-xs">
                    <Clock className="w-4 h-4 text-[#38bdf8] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-ink">Commission Request</span>
                      <p className="text-[10px] text-ink-subtle mt-0.5">&ldquo;{c.title}&rdquo; by {c.clientName}</p>
                      <span className="text-[9px] text-ink-tertiary block mt-0.5">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: STORE SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleUpdateSettings} className="bg-surface-1 border border-hairline rounded-md p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-hairline pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Settings className="w-4 h-4" />
              Manage Studio Configuration
            </h3>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary border border-primary text-primary-foreground hover:bg-primary-hover rounded-sm text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving configuration…" : "Save configuration"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Store Details & Contact Info */}
            <div className="flex flex-col gap-5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary">Store & Contact Settings</h4>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Store Brand Name *</label>
                <input
                  type="text"
                  name="storeName"
                  required
                  defaultValue={settings.storeName || "Mansi's Palette"}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold font-mono">Brand Logo File</label>
                {settings.storeLogo && (
                  <div className="relative w-16 h-10 border border-hairline rounded-sm mb-1 bg-surface-2 overflow-hidden flex items-center justify-center">
                    <Image src={getOptimizedUrl(settings.storeLogo)} alt="Store Logo" fill className="object-contain" />
                  </div>
                )}
                <div className="relative flex items-center justify-center w-full h-[36px] bg-canvas border border-hairline rounded-sm hover:border-hairline-strong transition-colors cursor-pointer">
                  <input
                    type="file"
                    name="storeLogoFile"
                    accept="image/*"
                    onChange={handleSettingsLogoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                    <FileImage className="w-4 h-4 text-primary" />
                    <span>{settingsLogoName || "Upload brand logo…"}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Contact Email Address *</label>
                <input
                  type="email"
                  name="contactEmail"
                  required
                  defaultValue={settings.contactEmail || "mansipalette@gmail.com"}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Contact Phone Number *</label>
                <input
                  type="text"
                  name="contactPhone"
                  required
                  defaultValue={settings.contactPhone || "+91 98765 43210"}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Contact Address *</label>
                <textarea
                  name="contactAddress"
                  required
                  rows={2}
                  defaultValue={settings.contactAddress || "Mumbai, India"}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none resize-none transition-colors"
                />
              </div>
            </div>

            {/* Right Column: Social Media, Shipping & Notification Settings */}
            <div className="flex flex-col gap-5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4px] text-primary">Social Media & Shipping Settings</h4>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Instagram Profile URL</label>
                <input
                  type="text"
                  name="instagramUrl"
                  defaultValue={settings.instagramUrl || ""}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Facebook Page URL</label>
                <input
                  type="text"
                  name="facebookUrl"
                  defaultValue={settings.facebookUrl || ""}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Pinterest Profile URL</label>
                <input
                  type="text"
                  name="pinterestUrl"
                  defaultValue={settings.pinterestUrl || ""}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Base Shipping Cost (₹)</label>
                  <input
                    type="number"
                    name="baseShippingCost"
                    defaultValue={settings.baseShippingCost || 150}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Free Ship Threshold (₹)</label>
                  <input
                    type="number"
                    name="freeShippingThreshold"
                    defaultValue={settings.freeShippingThreshold || 5000}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Estimated Delivery Time (Days)</label>
                <input
                  type="number"
                  name="estimatedDeliveryDays"
                  defaultValue={settings.estimatedDeliveryDays || 7}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-3 mt-1 bg-surface-2/20 p-3.5 border border-hairline rounded-sm">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Email Notifications Settings</span>
                
                <label className="flex items-center gap-2 text-xs text-ink-subtle cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="notifyOnNewOrder"
                    value="true"
                    defaultChecked={settings.notifyOnNewOrder}
                    className="accent-primary"
                  />
                  Send Email when New Order is placed
                </label>

                <label className="flex items-center gap-2 text-xs text-ink-subtle cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="notifyOnNewCommission"
                    value="true"
                    defaultChecked={settings.notifyOnNewCommission}
                    className="accent-primary"
                  />
                  Send Email when New Commission Inquiry is received
                </label>
              </div>
            </div>
          </div>
        </form>
      )}


      {/* MODALS SECTION */}

      {/* 1. EDIT PAINTING MODAL */}
      {editingPainting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-surface-1 border border-hairline rounded-md overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-primary" />
                Edit Catalog Artwork: {editingPainting.title}
              </h3>
              <button
                onClick={() => setEditingPainting(null)}
                className="p-1 rounded-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPaintingSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingPainting.title}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Description *</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  defaultValue={editingPainting.description}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={0}
                    defaultValue={editingPainting.price}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Width (in) *</label>
                  <input
                    type="number"
                    name="width"
                    required
                    min={1}
                    defaultValue={editingPainting.width}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Height (in) *</label>
                  <input
                    type="number"
                    name="height"
                    required
                    min={1}
                    defaultValue={editingPainting.height}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Status *</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingPainting.status}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="SOLD">Sold</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Category *</label>
                  <select
                    name="category"
                    required
                    defaultValue={editingPainting.category}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Medium *</label>
                  <input
                    type="text"
                    name="medium"
                    required
                    defaultValue={editingPainting.medium}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Canvas Type *</label>
                  <input
                    type="text"
                    name="canvasType"
                    required
                    defaultValue={editingPainting.canvasType}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Frame Option</label>
                  <input
                    type="text"
                    name="frameOption"
                    defaultValue={editingPainting.frameOption || ""}
                    className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Featured showcase</label>
                <select
                  name="isFeatured"
                  defaultValue={editingPainting.isFeatured ? "true" : "false"}
                  className="bg-canvas text-ink text-xs px-2.5 py-2 rounded-sm border border-hairline focus:border-primary"
                >
                  <option value="false">Regular Listing</option>
                  <option value="true">Home Showcase</option>
                </select>
              </div>

              {/* Manage existing files list */}
              <div className="flex flex-col gap-2 border border-hairline p-3.5 rounded-sm bg-canvas">
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Manage Current Artwork Images</span>
                <div className="flex gap-3 flex-wrap">
                  {editingPaintingImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-14 h-14 border border-hairline rounded-sm overflow-hidden bg-surface-2 flex-shrink-0 group">
                      <Image src={imgUrl} alt="Artwork img" fill className="object-cover" sizes="50px" />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPaintingImages(prev => prev.filter((_, i) => i !== idx));
                          setEditingPaintingPublicIds(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-xs font-semibold transition-opacity"
                        title="Delete image"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload New Files */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold">Upload Additional Images</label>
                <div className="relative flex items-center justify-center w-full h-[36px] bg-canvas border border-hairline rounded-sm hover:border-hairline-strong transition-colors cursor-pointer">
                  <input
                    type="file"
                    name="imageFiles"
                    multiple
                    accept="image/*"
                    onChange={handleEditFilesChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 text-xs text-ink-subtle px-2 truncate">
                    <Upload className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">{editImagesNames.length > 0 ? `${editImagesNames.length} new files selected` : "Choose new files to append…"}</span>
                  </span>
                </div>
              </div>

              {/* Edit progress indicators */}
              {isUploadingEdit && (
                <div className="flex flex-col gap-2 p-3 bg-surface-2/40 border border-hairline rounded-sm text-[11px]">
                  <div className="font-semibold text-primary uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <span className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
                    Uploading to Cloudinary...
                  </div>
                  {Object.entries(editUploadProgress).map(([filename, percent]) => (
                    <div key={filename} className="flex flex-col gap-1">
                      <div className="flex justify-between text-ink-muted text-[10px]">
                        <span className="truncate max-w-[180px]">{filename}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full h-1 bg-hairline rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editUploadError && (
                <div className="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] rounded-sm">
                  {editUploadError}
                </div>
              )}
              {!isUploadingEdit && editUploadedUrls.length > 0 && (
                <div className="p-2 bg-green-950/20 border border-green-900/30 text-green-400 text-[10px] rounded-sm flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Uploaded {editUploadedUrls.length} new image(s) successfully!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-hairline pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingPainting(null)}
                  className="px-4 py-2 border border-hairline hover:bg-surface-2 text-ink text-xs font-semibold rounded-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploadingEdit}
                  className="px-4 py-2 bg-primary border border-primary text-primary-foreground hover:bg-primary-hover text-xs font-semibold rounded-sm transition-all disabled:opacity-50"
                >
                  {isPending ? "Saving changes…" : isUploadingEdit ? "Uploading Images…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. VIEW ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-surface-1 border border-hairline rounded-md overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Customer Order Details: <span className="font-mono text-xs">{viewingOrder.id}</span>
              </h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1 rounded-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Side: Info details */}
              <div className="md:col-span-7 flex flex-col gap-6">
                
                {/* Customer Details */}
                {(() => {
                  const parsedAddr = parseAddressString(viewingOrder.shippingAddress);
                  const isCopied = copiedAddressId === viewingOrder.id;
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Customer Details</span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(viewingOrder)}
                          className="px-2 py-1 bg-surface-2 hover:bg-surface-3 border border-hairline hover:border-hairline-strong rounded-sm text-[10px] text-ink font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy shipping address to clipboard"
                        >
                          <Copy className="w-3 h-3 text-primary" />
                          {isCopied ? "Copied!" : "Copy Shipping Address"}
                        </button>
                      </div>
                      
                      <div className="bg-canvas border border-hairline p-3.5 rounded-sm text-xs flex flex-col gap-1.5 leading-relaxed">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-ink-subtle font-medium">Recipient Name:</span>
                          <strong className="text-ink">{parsedAddr.name || viewingOrder.customerName}</strong>
                          {parsedAddr.type && (
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-primary/20 text-primary uppercase border border-primary/20 font-sans">
                              {parsedAddr.type}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-ink-subtle font-medium">Customer Email:</span>
                          <span className="text-ink font-mono">{viewingOrder.customerEmail}</span>
                        </div>
                        <div>
                          <span className="text-ink-subtle font-medium">Phone Number:</span>
                          <span className="text-ink font-mono">{parsedAddr.phone || viewingOrder.customerPhone || "N/A"}</span>
                        </div>
                        <hr className="border-hairline/60 my-1" />
                        <div>
                          <span className="text-ink-subtle font-medium block mb-1">Full Shipping Address:</span>
                          {parsedAddr.type || parsedAddr.name ? (
                            <div className="bg-surface-2/20 border border-hairline/40 p-2.5 rounded-sm whitespace-pre-wrap leading-relaxed text-ink-muted text-[11px] font-mono">
                              {parsedAddr.addressLine}
                              {parsedAddr.cityState && `\n${parsedAddr.cityState}`}
                              {parsedAddr.pincode && `\nPin: ${parsedAddr.pincode}`}
                            </div>
                          ) : (
                            <div className="bg-surface-2/20 border border-hairline/40 p-2.5 rounded-sm whitespace-pre-wrap leading-relaxed text-ink-muted text-[11px]">
                              {viewingOrder.shippingAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Order Items */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Order Items</span>
                  <div className="flex flex-col gap-2">
                    {viewingOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-canvas border border-hairline p-2.5 rounded-sm text-xs">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-sm bg-surface-2 overflow-hidden flex-shrink-0">
                            <Image src={item.painting.imageUrl} alt={item.painting.title} fill className="object-cover" sizes="32px" />
                          </div>
                          <div>
                            <span className="font-semibold text-ink">{item.painting.title}</span>
                            <span className="block text-[10px] text-ink-subtle">{item.painting.category} &bull; {item.painting.medium}</span>
                          </div>
                        </div>
                        <span className="font-semibold text-ink">₹{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Quick Action Controls */}
                <div className="flex flex-col gap-2 bg-surface-2/20 p-4 border border-hairline rounded-sm">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Order Management Controls</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {viewingOrder.status === "PENDING_APPROVAL" && (
                      <>
                        <button
                          onClick={() => handleQuickAction(viewingOrder.id, { status: "ACCEPTED", note: "Order accepted by admin." })}
                          disabled={isPending}
                          className="px-3 py-2 bg-green-950/40 border border-green-900/60 text-green-400 hover:bg-green-900/20 text-xs font-semibold rounded-sm transition-all"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleQuickAction(viewingOrder.id, { status: "REJECTED", note: "Order rejected by admin." })}
                          disabled={isPending}
                          className="px-3 py-2 bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/20 text-xs font-semibold rounded-sm transition-all"
                        >
                          Reject Order
                        </button>
                      </>
                    )}
                    {viewingOrder.paymentStatus !== "PAID" ? (
                      <button
                        onClick={() => handleQuickAction(viewingOrder.id, { status: "PAYMENT_RECEIVED", paymentStatus: "PAID", note: "Payment marked as RECEIVED by admin." })}
                        disabled={isPending}
                        className="col-span-2 px-3 py-2 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 hover:bg-emerald-900/20 text-xs font-semibold rounded-sm transition-all"
                      >
                        Mark Payment Received
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickAction(viewingOrder.id, { status: "PAYMENT_PENDING", paymentStatus: "PENDING", note: "Payment marked as PENDING by admin." })}
                        disabled={isPending}
                        className="col-span-2 px-3 py-2 bg-orange-950/40 border border-orange-900/60 text-orange-400 hover:bg-orange-900/20 text-xs font-semibold rounded-sm transition-all"
                      >
                        Mark Payment Pending
                      </button>
                    )}
                  </div>
                </div>

                {/* Shipping Details and Courier inputs */}
                <div className="flex flex-col gap-2 bg-surface-2/30 p-4 border border-hairline rounded-sm">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Shipping Courier details</span>
                  
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-ink-subtle uppercase">Courier Name</label>
                      <input
                        type="text"
                        placeholder="e.g. DHL, BlueDart…"
                        value={courierNameInput}
                        onChange={(e) => setCourierNameInput(e.target.value)}
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-ink-subtle uppercase">Tracking Number</label>
                      <input
                        type="text"
                        placeholder="e.g. TRK183920..."
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[9px] text-ink-subtle uppercase">Timeline Log / Status Update Comment</label>
                    <input
                      type="text"
                      placeholder="Comment to log in order timeline (optional)..."
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      className="bg-canvas text-ink text-xs px-2.5 py-1.5 rounded-sm border border-hairline focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4 border-t border-hairline/80 pt-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-ink-subtle uppercase font-semibold">Change Status:</label>
                      <select
                        value={newOrderStatus}
                        onChange={(e) => setNewOrderStatus(e.target.value)}
                        className="bg-canvas text-ink text-xs px-2 py-1 rounded-sm border border-hairline focus:outline-none"
                      >
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="PAYMENT_PENDING">Payment Pending</option>
                        <option value="PAYMENT_RECEIVED">Payment Received</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleUpdateOrderDetails(viewingOrder.id)}
                      disabled={isPending}
                      className="px-4 py-1.5 bg-primary border border-primary text-primary-foreground hover:bg-primary-hover text-[10px] font-semibold rounded-sm transition-colors"
                    >
                      Save Order Details
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Side: Payment summary & Order timeline */}
              <div className="md:col-span-5 flex flex-col gap-6">
                
                {/* Financial overview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Payment Details</span>
                  <div className="bg-canvas border border-hairline p-3.5 rounded-sm text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-ink-subtle">Payment status:</span>
                      <strong className={viewingOrder.paymentStatus === "PAID" ? "text-green-400 font-bold" : "text-amber-500 font-bold"}>
                        {viewingOrder.paymentStatus}
                      </strong>
                    </div>
                    {viewingOrder.paymentId && (
                      <div className="flex justify-between">
                        <span className="text-ink-subtle">Payment reference ID:</span>
                        <span className="font-mono text-[10px] text-ink">{viewingOrder.paymentId}</span>
                      </div>
                    )}
                    <hr className="border-hairline my-1" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-ink">Total Paid:</span>
                      <span className="text-primary font-bold">₹{viewingOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Order Status Timeline</span>
                  <div className="flex flex-col gap-3 pl-3 border-l border-hairline mt-1">
                    {viewingOrder.timeline && viewingOrder.timeline.length > 0 ? (
                      viewingOrder.timeline.map((evt: any) => (
                        <div key={evt.id} className="relative flex flex-col gap-0.5">
                          <span className="absolute left-[-17px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface-1" />
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-ink uppercase tracking-wide">{evt.status}</span>
                            <span className="text-ink-tertiary font-mono">{formatShortDateTime(evt.createdAt)}</span>
                          </div>
                          {evt.note && <p className="text-[11px] text-ink-subtle italic mt-0.5 leading-normal">&ldquo;{evt.note}&rdquo;</p>}
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-ink-tertiary py-3">No status events logged yet. Change status to add timeline events.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. VIEW CUSTOMER PROFILE MODAL */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-surface-1 border border-hairline rounded-md overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-hairline flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Customer Profile: {viewingCustomer.name}
              </h3>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-1 rounded-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Profile Details header */}
              <div className="grid grid-cols-3 gap-4 bg-canvas border border-hairline p-4 rounded-md text-xs">
                <div>
                  <span className="text-[10px] text-ink-subtle uppercase block">Full Name</span>
                  <strong className="text-sm text-ink block mt-0.5">{viewingCustomer.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-ink-subtle uppercase block">Email Address</span>
                  <span className="text-sm text-ink block mt-0.5">{viewingCustomer.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-subtle uppercase block">Customer Since</span>
                  <span className="text-sm text-ink block mt-0.5">{formatDate(viewingCustomer.createdAt)}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Purchase History ({viewingCustomer.orders?.length || 0} orders)</span>
                {(!viewingCustomer.orders || viewingCustomer.orders.length === 0) ? (
                  <p className="text-xs text-ink-tertiary italic p-3 border border-dashed border-hairline rounded-sm text-center">No purchases recorded yet.</p>
                ) : (
                  <div className="border border-hairline rounded-md overflow-hidden bg-canvas">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-surface-2/40 border-b border-hairline text-ink-subtle">
                          <th className="p-2.5 font-medium">Order ID</th>
                          <th className="p-2.5 font-medium">Date</th>
                          <th className="p-2.5 font-medium text-right">Amount</th>
                          <th className="p-2.5 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingCustomer.orders.map((o: any) => (
                          <tr key={o.id} className="border-b border-hairline/60 hover:bg-surface-2/10">
                            <td className="p-2.5 font-mono text-[10px] text-ink-muted">{o.id}</td>
                            <td className="p-2.5 text-ink-subtle">{formatDate(o.createdAt)}</td>
                            <td className="p-2.5 text-right font-semibold text-ink">₹{o.totalAmount.toLocaleString()}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                o.status === "DELIVERED" ? "bg-green-950/20 border-green-900/40 text-green-400" :
                                o.status === "CANCELLED" ? "bg-red-950/20 border-red-900/40 text-red-400" :
                                "bg-amber-950/20 border-amber-900/40 text-amber-500"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Commission Requests History */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Custom Commissions Inquiries ({viewingCustomer.commissions?.length || 0} commissions)</span>
                {(!viewingCustomer.commissions || viewingCustomer.commissions.length === 0) ? (
                  <p className="text-xs text-ink-tertiary italic p-3 border border-dashed border-hairline rounded-sm text-center">No commission inquiries submitted yet.</p>
                ) : (
                  <div className="border border-hairline rounded-md overflow-hidden bg-canvas">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-surface-2/40 border-b border-hairline text-ink-subtle">
                          <th className="p-2.5 font-medium">Project Name</th>
                          <th className="p-2.5 font-medium">Date</th>
                          <th className="p-2.5 font-medium text-right">Budget</th>
                          <th className="p-2.5 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingCustomer.commissions.map((c: any) => (
                          <tr key={c.id} className="border-b border-hairline/60 hover:bg-surface-2/10">
                            <td className="p-2.5 font-semibold text-ink">{c.title}</td>
                            <td className="p-2.5 text-ink-subtle">{formatDate(c.createdAt)}</td>
                            <td className="p-2.5 text-right text-ink">₹{c.budget.toLocaleString()}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary/30 text-primary bg-primary/5 uppercase">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
