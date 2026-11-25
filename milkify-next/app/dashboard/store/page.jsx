/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Printer,
  Edit,
  Trash2,
  MapPin,
  Save,
  Loader2,
  Receipt,
  Store,
  ExternalLink,
  X,
  BarChart3,
  Percent,
  CheckCircle2,
  Calendar,
  Share2,
  FileText,
  TrendingUp,
  CreditCard,
  QrCode,
  Eye,
  User,
  Camera,
  Upload,
  ShieldCheck,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SessionTimer from "@/components/ui/SessionTimer";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/lib/store";
import { CopyIcon } from "lucide-react";
import { IndianRupee } from "lucide-react";

export default function DairyAdminStorePage() {
  const { user } = useAuthStore();
  // Navigation tabs: 'analytics' | 'pos' | 'inventory' | 'bills' | 'coupons' | 'settings' | 'profile'
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Store Admin User Profile State
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: "",
    email: "",
    mobile: "",
    shopName: "",
    village: "",
    gender: "Male",
    profilePhoto: "",
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Store Profile & Geofence Settings
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Inventory Products
  const [products, setProducts] = useState([]);
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [productForm, setProductForm] = useState({
    name: "",
    category: "dairy",
    subCategory: "Milk & Ghee",
    brand: "",
    sku: "",
    barcode: "",
    price: 60,
    mrp: 65,
    stockQuantity: 50,
    minStockAlert: 10,
    unit: "liter",
    packageSize: "1 Liter Pouch",
    description: "",
    images: "",
    isAvailable: true,
  });

  // Delete Warning Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'product' | 'coupon'
    item: null,
    loading: false,
  });

  // Image Preview Modal State
  const [imageModalUrl, setImageModalUrl] = useState(null);

  // Analytics & Day-wise Collections State
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [analyticsStartDate, setAnalyticsStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [analyticsEndDate, setAnalyticsEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [analyticsPreset, setAnalyticsPreset] = useState("today");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // All Bills & Records State
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const [billDateFilter, setBillDateFilter] = useState("");
  const [billChannelFilter, setBillChannelFilter] = useState("all");
  const [viewingBill, setViewingBill] = useState(null);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    title: "",
    discountType: "fixed",
    discountValue: 50,
    minOrderValue: 200,
    maxDiscountAmount: 100,
    validTill: "",
    usageLimit: 100,
  });

  // POS Walk-in Counter Cart State
  const [posCart, setPosCart] = useState([]);
  const [posCategory, setPosCategory] = useState("all");
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [posCustomerName, setPosCustomerName] = useState("Walk-in Customer");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState("cash_counter");
  const [posDiscount, setPosDiscount] = useState(0);
  const [posApplyTax, setPosApplyTax] = useState(false);
  const [posTaxRate, setPosTaxRate] = useState(5);
  const [posGstNumber, setPosGstNumber] = useState("");
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [posGeneratedBill, setPosGeneratedBill] = useState(null);

  // Initial Data Fetch
  const fetchAllStoreData = async () => {
    try {
      setLoading(true);
      const [profileRes, productsRes, adminRes] = await Promise.all([
        api.get("/store/admin/profile").catch(() => ({ data: { profile: null } })),
        api.get("/store/admin/products").catch(() => ({ data: { products: [] } })),
        api.get("/admin/me").catch(() => ({ data: { admin: null } })),
      ]);

      if (profileRes.data?.profile) {
        setProfile(profileRes.data.profile);
        if (profileRes.data.profile.gstNumber) {
          setPosGstNumber(profileRes.data.profile.gstNumber);
        }
      }
      if (productsRes.data?.products) {
        setProducts(productsRes.data.products);
      }

      const resolvedAdmin = adminRes.data?.data?.admin || adminRes.data?.admin || profileRes.data?.admin || user;
      if (resolvedAdmin) {
        setAdminUser(resolvedAdmin);
        setAdminProfileForm({
          name: resolvedAdmin.name || "",
          email: resolvedAdmin.email || "",
          mobile: resolvedAdmin.mobile || "",
          shopName: resolvedAdmin.shopName || "",
          village: resolvedAdmin.village || "",
          gender: resolvedAdmin.gender || "Male",
          profilePhoto: resolvedAdmin.profilePhoto || profileRes.data?.profile?.ownerPhoto || "",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load store information");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (customStart, customEnd) => {
    try {
      setAnalyticsLoading(true);
      const start = customStart !== undefined ? customStart : analyticsStartDate;
      const end = customEnd !== undefined ? customEnd : analyticsEndDate;
      const queryParam = start && end && start !== end
        ? `startDate=${start}&endDate=${end}`
        : `date=${start || selectedDate}`;
      const res = await api.get(`/store/admin/analytics?${queryParam}`);
      if (res.data?.success) {
        setAnalytics(res.data);
      }
    } catch {
      // Graceful error handle
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleApplyDatePreset = (preset) => {
    setAnalyticsPreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let startStr = todayStr;
    let endStr = todayStr;

    if (preset === "today") {
      startStr = todayStr;
      endStr = todayStr;
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      startStr = y.toISOString().slice(0, 10);
      endStr = startStr;
    } else if (preset === "last7days") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      startStr = past.toISOString().slice(0, 10);
      endStr = todayStr;
    } else if (preset === "thisMonth") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = startOfMonth.toISOString().slice(0, 10);
      endStr = todayStr;
    }

    setSelectedDate(startStr);
    setAnalyticsStartDate(startStr);
    setAnalyticsEndDate(endStr);
    fetchAnalytics(startStr, endStr);
  };

  const fetchBills = async () => {
    try {
      setBillsLoading(true);
      let url = "/store/admin/bills?limit=100";
      if (billDateFilter) url += `&date=${billDateFilter}`;
      if (billChannelFilter && billChannelFilter !== "all") url += `&channel=${billChannelFilter}`;
      if (billSearch) url += `&search=${encodeURIComponent(billSearch)}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setBills(res.data.bills || []);
      }
    } catch {
      // Ignore
    } finally {
      setBillsLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await api.get("/store/admin/coupons");
      if (res.data?.success) {
        setCoupons(res.data.coupons || []);
      }
    } catch {
      // Ignore
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStoreData();
    fetchAnalytics(selectedDate);
    fetchBills();
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time socket updates for incoming store orders & status updates
  useEffect(() => {
    if (!user?._id) return;
    if (!socket.connected) socket.connect();
    socket.emit("join_room", `admin:${user._id}`);

    const handleNewStoreOrder = (data) => {
      const ordNum = data.order?.orderNumber || "New Order";
      const totalAmt = data.order?.grandTotal || 0;
      toast.success(`🔔 New Store Order Received: #${ordNum} (₹${totalAmt})`);
      fetchAnalytics(selectedDate);
      fetchBills();
      fetchAllStoreData();
    };

    socket.on("store:new_order", handleNewStoreOrder);
    socket.on("store:order_status_updated", handleNewStoreOrder);

    return () => {
      socket.off("store:new_order", handleNewStoreOrder);
      socket.off("store:order_status_updated", handleNewStoreOrder);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  // POS Calculations
  const posSubtotal = useMemo(() => {
    return posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [posCart]);

  const posDiscountAmount = useMemo(() => {
    const d = Number(posDiscount) || 0;
    return Math.min(d, posSubtotal);
  }, [posDiscount, posSubtotal]);

  const posTaxDetails = useMemo(() => {
    if (!posApplyTax || !posTaxRate || posTaxRate <= 0) {
      return { taxAmount: 0, cgst: 0, sgst: 0 };
    }
    const taxable = Math.max(0, posSubtotal - posDiscountAmount);
    const taxAmount = parseFloat(((taxable * Number(posTaxRate)) / 100).toFixed(2));
    const cgst = parseFloat((taxAmount / 2).toFixed(2));
    const sgst = parseFloat((taxAmount / 2).toFixed(2));
    return { taxAmount, cgst, sgst };
  }, [posApplyTax, posTaxRate, posSubtotal, posDiscountAmount]);

  const posGrandTotal = useMemo(() => {
    return Math.round(Math.max(0, posSubtotal - posDiscountAmount + posTaxDetails.taxAmount));
  }, [posSubtotal, posDiscountAmount, posTaxDetails]);

  // Live Auto-suggest Search results for POS
  const posSearchResults = useMemo(() => {
    if (!posSearchTerm.trim()) return [];
    const q = posSearchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [products, posSearchTerm]);

  // Category products for POS cards
  const posDisplayedProducts = useMemo(() => {
    return products.filter((p) => {
      if (posCategory !== "all" && p.category !== posCategory) return false;
      return true;
    });
  }, [products, posCategory]);

  // Filtered Products for Inventory
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Add Item to POS Cart
  const handleAddToPosCart = (product) => {
    if (product.stockQuantity < 1) {
      toast.warning(`${product.name} is currently out of stock!`);
      return;
    }
    setPosCart((prev) => {
      const exists = prev.find((i) => i.productId === product._id);
      if (exists) {
        if (exists.quantity >= product.stockQuantity) {
          toast.warning(`Cannot add more. Only ${product.stockQuantity} in stock.`);
          return prev;
        }
        return prev.map((i) => (i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          unit: product.unit,
          packageSize: product.packageSize,
          image: product.images?.[0] || "",
          quantity: 1,
          stock: product.stockQuantity,
        },
      ];
    });
    setPosSearchTerm("");
  };

  const handleUpdatePosQuantity = (productId, delta) => {
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock) {
              toast.warning(`Max available stock is ${item.stock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Submit POS Counter Sale
  const handleCreatePosSale = async (e) => {
    e.preventDefault();
    if (posCart.length === 0) {
      return toast.warning("POS Cart is empty! Add products first.");
    }
    if (!posCustomerName.trim()) {
      return toast.warning("Please provide a customer name or leave as 'Walk-in Customer'");
    }

    setPosSubmitting(true);
    try {
      const payload = {
        customerName: posCustomerName.trim(),
        customerPhone: posCustomerPhone.trim(),
        items: posCart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
        })),
        paymentMethod: posPaymentMethod,
        discountAmount: posDiscountAmount,
        isTaxApplied: posApplyTax,
        taxRate: posTaxRate,
        gstNumber: posGstNumber.trim(),
      };

      const res = await api.post("/store/admin/pos-sale", payload);
      const resData = res.data;
      const createdBill = resData?.bill || resData?.order || resData?.data?.bill || resData?.data?.order || resData;

      if (createdBill && (createdBill.orderNumber || resData?.success)) {
        const orderNum = createdBill.orderNumber || "NEW";
        toast.success(`Bill #${orderNum} created successfully!`);
        setPosGeneratedBill(createdBill);
        setPosCart([]);
        setPosCustomerName("Walk-in Customer");
        setPosCustomerPhone("");
        setPosDiscount(0);
        fetchAllStoreData();
        fetchAnalytics(selectedDate);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete POS sale");
    } finally {
      setPosSubmitting(false);
    }
  };

  // Clean Server-side HTML Receipt Print & Direct PDF Download
  const handlePrintReceiptClean = (orderNumber, mode = "print") => {
    if (!orderNumber) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api";
    const param = mode === "download" ? "download=1" : "autoprint=1";
    const printUrl = `${baseUrl}/store/public/bill/${orderNumber}/print?${param}`;
    window.open(printUrl, "_blank", "width=460,height=680,menubar=no,toolbar=no,location=no,status=no");
  };

  // Add / Edit Product Submit
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductSubmitting(true);
    try {
      const payload = {
        ...productForm,
        images: productForm.images
          ? productForm.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingProductId) {
        const res = await api.put(`/store/admin/products/${editingProductId}`, payload);
        toast.success(res.data?.message || "Product updated successfully");
      } else {
        const res = await api.post("/store/admin/products", payload);
        toast.success(res.data?.message || "Product created successfully");
      }

      setIsProductModalOpen(false);
      setEditingProductId(null);
      fetchAllStoreData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setProductSubmitting(false);
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod._id);
    setProductForm({
      name: prod.name,
      category: prod.category,
      subCategory: prod.subCategory || "",
      brand: prod.brand || "",
      sku: prod.sku || "",
      barcode: prod.barcode || "",
      price: prod.price,
      mrp: prod.mrp,
      stockQuantity: prod.stockQuantity,
      minStockAlert: prod.minStockAlert,
      unit: prod.unit,
      packageSize: prod.packageSize || "",
      description: prod.description || "",
      images: prod.images ? prod.images.join(", ") : "",
      isAvailable: prod.isAvailable,
    });
    setPreviewImageUrl(prod.images?.[0] || "");
    setIsProductModalOpen(true);
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));

    try {
      if (deleteModal.type === "product") {
        await api.delete(`/store/admin/products/${deleteModal.item._id}`);
        toast.success(`Product '${deleteModal.item.name}' deleted successfully`);
        fetchAllStoreData();
      } else if (deleteModal.type === "coupon") {
        await api.delete(`/store/admin/coupons/${deleteModal.item._id}`);
        toast.success(`Coupon '${deleteModal.item.code}' deleted successfully`);
        fetchCoupons();
      }
      setDeleteModal({ isOpen: false, type: null, item: null, loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete item");
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Create Coupon Submission
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) {
      return toast.warning("Code and discount value are required");
    }

    setCouponSubmitting(true);
    try {
      await api.post("/store/admin/coupons", couponForm);
      toast.success(`Coupon '${couponForm.code.toUpperCase()}' created!`);
      setIsCouponModalOpen(false);
      setCouponForm({
        code: "",
        title: "",
        discountType: "fixed",
        discountValue: 50,
        minOrderValue: 200,
        maxDiscountAmount: 100,
        validTill: "",
        usageLimit: 100,
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setCouponSubmitting(false);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = async (coupon) => {
    try {
      await api.patch(`/store/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      toast.success(`Coupon '${coupon.code}' is now ${!coupon.isActive ? "Active" : "Inactive"}`);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update coupon status");
    }
  };

  // Save Store Profile & Geofence
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put("/store/admin/profile", profile);
      toast.success(res.data?.message || "Store profile & geofence updated successfully");
      setProfile(res.data.profile);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update store settings");
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Store Admin User Profile Details
  const handleSaveAdminProfile = async (e) => {
    if (e) e.preventDefault();
    setAdminSaving(true);
    try {
      const res = await api.put("/admin/profile", adminProfileForm);
      const updatedAdmin = res.data?.data?.admin || res.data?.admin;
      if (updatedAdmin) {
        setAdminUser(updatedAdmin);
        setAdminProfileForm((prev) => ({
          ...prev,
          ...updatedAdmin,
        }));
      }
      toast.success("Admin store user profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update admin profile");
    } finally {
      setAdminSaving(false);
    }
  };

  // Upload Profile Photo via API with FileReader Fallback
  const handleAdminPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Photo size must be less than 5MB");
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await api.post("/admin/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newPhoto = res.data?.profilePhoto;
      if (newPhoto) {
        setAdminUser((prev) => ({ ...prev, profilePhoto: newPhoto }));
        setAdminProfileForm((prev) => ({ ...prev, profilePhoto: newPhoto }));
        if (profile) {
          setProfile((prev) => ({ ...prev, ownerPhoto: newPhoto }));
        }
        toast.success("Admin profile photo updated successfully!");
      }
    } catch {
      // Fallback: convert to base64 Data URI and save directly
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result;
          setAdminProfileForm((prev) => ({ ...prev, profilePhoto: base64Data }));
          setAdminUser((prev) => ({ ...prev, profilePhoto: base64Data }));
          await api.put("/admin/profile", { profilePhoto: base64Data });
          toast.success("Profile photo saved successfully!");
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error("Failed to upload profile photo");
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  // Remove Admin Profile Photo
  const handleRemoveAdminPhoto = async () => {
    setPhotoUploading(true);
    try {
      await api.delete("/admin/photo").catch(async () => {
        await api.put("/admin/profile", { profilePhoto: "" });
      });
      setAdminUser((prev) => ({ ...prev, profilePhoto: "" }));
      setAdminProfileForm((prev) => ({ ...prev, profilePhoto: "" }));
      if (profile) setProfile((prev) => ({ ...prev, ownerPhoto: "" }));
      toast.success("Profile photo removed successfully");
    } catch {
      toast.error("Failed to remove profile photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const navItems = [
    { id: "analytics", label: "Analytics & Collections", icon: BarChart3, badge: "Daily" },
    { id: "pos", label: "Walk-in POS Billing", icon: Receipt, badge: "Instant" },
    { id: "inventory", label: "Inventory Products", icon: Package, badge: products.length },
    { id: "bills", label: "All Bills & History", icon: FileText, badge: null },
    { id: "coupons", label: "Coupons & Promos", icon: Percent, badge: coupons.length },
    { id: "settings", label: "Geofence & Settings", icon: MapPin, badge: null },
    { id: "profile", label: "Admin Profile", icon: UserCheck, badge: null },
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold">Loading Milkify Store &amp; Feed Hub...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Synchronizing omnichannel inventory and live POS records</p>
      </div>
    );
  }

  return (
    <div id="store-admin-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ─── PRINT SUPPRESSION & SIDEBAR ANIMATION STYLES ─── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          #store-admin-container, header, aside, .modal-backdrop, .no-print-modal {
            display: none !important;
          }
        }
        @keyframes customChevronWave {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.5;
          }
          50% {
            transform: translateX(4px);
            opacity: 1;
          }
        }
        .animate-chevron-wave-1 {
          animation: customChevronWave 1.4s ease-in-out infinite;
        }
        .animate-chevron-wave-2 {
          animation: customChevronWave 1.4s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        @keyframes radialGlowEmerald {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .animate-radial-glow {
          animation: radialGlowEmerald 2s infinite;
        }
      ` }} />

      {/* ─── TOP PORTAL HEADER ─── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shrink-0 flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {profile?.storeName || "Milkify Store Hub"}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Live Store
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Village: <strong className="text-slate-800 dark:text-slate-200">{profile?.village || "Main Village"}</strong> (Servicing {profile?.deliveryRadiusKm || 8} km radius)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <SessionTimer />
          <ThemeToggle />

          {/* Admin Profile Header Pill */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition ${activeTab === "profile"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
              }`}
            title="View & Edit Store Admin Profile"
          >
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-emerald-700 flex items-center justify-center shrink-0 border border-white/20">
              {adminProfileForm.profilePhoto || adminUser?.profilePhoto ? (
                <img
                  src={adminProfileForm.profilePhoto || adminUser?.profilePhoto}
                  alt={adminProfileForm.name || "Admin"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <span className="text-xs font-bold hidden sm:inline">
              {adminProfileForm.name || adminUser?.name || "Profile"}
            </span>
          </button>

          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-xs"
            title="Switch back to Milk Collection Dashboard"
          >
            <span>Dairy Dashboard</span>
          </Link>

          {profile?.slug && (
            <a
              href={`/store/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition shadow-xs"
              title="Open public customer storefront in new tab"
            >
              <span>Milki Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Navbar Toggle Button (Top Right of Admin Store UI) */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className={cn(
              "p-2 sm:px-2.5 sm:py-2 rounded-xl border transition shadow-xs flex items-center gap-1.5 shrink-0",
              isMobileMenuOpen || isCollapsed
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
            <span className="text-xs font-bold hidden xl:inline">
              {isMobileMenuOpen ? "Close" : isCollapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </header>

      {/* Animated Left-Edge Pull Tab (Mobile only, identical to Dairy Admin UI & Master UI) */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={cn(
          "fixed top-[45%] -translate-y-1/2 z-[60] flex flex-col items-center justify-center w-8 h-20 rounded-r-2xl transition-all duration-300 ease-in-out md:hidden shadow-[4px_0_20px_rgba(16,185,129,0.25)] border-y border-r border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
          isMobileMenuOpen
            ? "left-[288px] bg-slate-900/90 dark:bg-slate-800/90 text-white"
            : "left-0 bg-emerald-600 text-white animate-radial-glow"
        )}
        aria-label="Toggle Navigation Drawer"
      >
        {/* Subtle vertical accent line inside the tab handle */}
        <div className="absolute left-1 w-0.5 h-10 rounded-full bg-white/20" />

        {/* Sequential Double Chevron Arrows */}
        <div className="flex flex-col items-center gap-1">
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-all duration-300",
              isMobileMenuOpen
                ? "rotate-180 text-white/70"
                : "animate-chevron-wave-1 text-white"
            )}
          />
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-all duration-300 -mt-1",
              isMobileMenuOpen
                ? "rotate-180 text-white/40"
                : "animate-chevron-wave-2 text-white/80"
            )}
          />
        </div>
      </button>

      {/* Mobile Side Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Side Drawer Content */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden border-r border-slate-200/50 dark:border-slate-800/80",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Drawer Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">Store Menu</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="relative flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all duration-200"
            aria-label="Close Navigation Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isActive ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN PORTAL BODY WITH RESPONSIVE SIDEBAR ─── */}
      <div className="flex flex-col md:flex-row">
        {/* Desktop Sidebar (Identical to Dairy Admin UI & Master UI) */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/90 backdrop-blur-md transition-all duration-300 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]",
            isCollapsed ? "w-16" : "w-60"
          )}
        >
          {/* Sidebar Header with Brand + Collapse Toggle */}
          <div
            className={cn(
              "relative flex h-14 items-center border-b border-slate-200 dark:border-slate-800",
              isCollapsed ? "justify-center px-2" : "justify-between px-4"
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  Store Hub
                </span>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="absolute top-3 right-1.5 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Scrollable Navigation Area */}
          <nav className={cn("flex-1 overflow-y-auto py-3 space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : ""}
                  className={cn(
                    "w-full flex items-center rounded-xl font-medium text-xs sm:text-sm transition-all duration-200",
                    isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5",
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-1")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge !== null && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                        isActive
                          ? "bg-emerald-800 text-emerald-100"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {!isCollapsed && (
            <div className="p-3 m-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 shadow-xs">
              <p className="font-bold text-slate-800 dark:text-slate-300">Omnichannel Sync</p>
              <p className="text-[11px] mt-1 text-slate-500">
                POS Counter Sales &amp; Online Orders decrement from the same real-time stock pool.
              </p>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-x-hidden">
          {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: ANALYTICS & DAILY COLLECTIONS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Header with Date Span Selector & Presets */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Store Analytics &amp; Revenue Collections
                    {analyticsLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 inline ml-1" />}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time day-wise and date-range revenue, payment split (Cash/UPI/Credit), and bestsellers
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => handleApplyDatePreset("today")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        analyticsPreset === "today"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDatePreset("yesterday")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        analyticsPreset === "yesterday"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDatePreset("last7days")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        analyticsPreset === "last7days"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDatePreset("thisMonth")}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        analyticsPreset === "thisMonth"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      This Month
                    </button>
                  </div>

                  {/* Date Range Picker (From -> To) */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-xs text-xs">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px] font-medium">From:</span>
                      <input
                        type="date"
                        value={analyticsStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnalyticsStartDate(val);
                          setAnalyticsPreset("custom");
                          fetchAnalytics(val, analyticsEndDate);
                        }}
                        className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px] font-medium ml-1">To:</span>
                      <input
                        type="date"
                        value={analyticsEndDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnalyticsEndDate(val);
                          setAnalyticsPreset("custom");
                          fetchAnalytics(analyticsStartDate, val);
                        }}
                        className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Range Active Indicator Banner */}
              {analytics?.isRange && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 font-medium">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Displaying aggregated metrics for date span: <strong className="font-bold underline">{analyticsStartDate}</strong> to <strong className="font-bold underline">{analyticsEndDate}</strong> ({analytics?.summary?.rangeOrdersCount || 0} orders found)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyDatePreset("today")}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Reset to Today
                  </button>
                </div>
              )}

              {/* Day-Wise Collection Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {analytics?.isRange ? "Period Gross Sales" : "Selected Day Sales"}
                    </span>
                    <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    ₹{analytics?.summary?.todayGrossSales || 0}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                    {analytics?.summary?.rangeOrdersCount || 0} bills transacted ({analytics?.summary?.todayPosBills || 0} POS + {analytics?.summary?.todayOnlineBills || 0} Online)
                  </span>
                </Card>

                <Card className="bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cash Collection</span>
                    <span className="text-xs">💵</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                    ₹{analytics?.summary?.todayCashSales || 0}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Physical drawer cash</span>
                </Card>

                <Card className="bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">UPI / Online Pay</span>
                    <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                    ₹{analytics?.summary?.todayUpiSales || 0}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">QR &amp; Online Gateway</span>
                </Card>

                <Card className="bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Credit / Milk-Bill</span>
                    <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                    ₹{analytics?.summary?.todayCreditSales || 0}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Khata ledger deduction</span>
                </Card>
              </div>

              {/* Daily Trend / Selected Span Breakdown and Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Trend Table / History */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {analytics?.isRange ? "Selected Period Daily Revenue Breakdown" : "Recent Revenue History"}
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Avg Order: ₹{analytics?.summary?.avgOrderValue || 0}
                    </span>
                  </h3>
                  {((analytics?.isRange && analytics?.dailyTrend?.length > 0) ? analytics?.dailyTrend : analytics?.weeklyTrend)?.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                      No transactions recorded in the selected period
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {((analytics?.isRange && analytics?.dailyTrend?.length > 0) ? analytics?.dailyTrend : analytics?.weeklyTrend)?.map((day) => {
                        const dateLabel = day.date || day._id;
                        const billCount = day.ordersCount !== undefined ? day.ordersCount : day.billCount;
                        const revenue = day.revenue !== undefined ? day.revenue : day.totalRevenue;
                        return (
                          <div
                            key={dateLabel}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{dateLabel}</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {billCount} bills {day.posRevenue !== undefined && `(POS: ₹${day.posRevenue} | Online: ₹${day.onlineRevenue})`}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{revenue}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Category Sales Distribution */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Category Sales Revenue</h3>
                  <div className="space-y-3">
                    {analytics?.categoryBreakdown?.map((cat) => (
                      <div key={cat._id} className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 capitalize">
                          <span>{cat._id === "farming" ? "🌾 Cattle Feed" : cat._id === "dairy" ? "🥛 Dairy Products" : "🛒 Kirana"}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">₹{cat.totalAmount}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{cat.totalUnits} items transacted</span>
                      </div>
                    ))}
                  </div>

                  {/* Top Products */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2">Bestselling Items</h4>
                    <div className="space-y-1.5">
                      {analytics?.topProducts?.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300 truncate pr-2">{idx + 1}. {p._id}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{p.totalRevenue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: ENHANCED WALK-IN POS COUNTER BILLING
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "pos" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Catalog & Search Column (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search Bar with Auto-suggest */}
                <div className="space-y-2 relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type item name or scan barcode..."
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    />
                    {posSearchTerm && (
                      <button
                        onClick={() => setPosSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Auto-suggest Dropdown */}
                  {posSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {posSearchResults.map((prod) => (
                        <div
                          key={prod._id}
                          onClick={() => handleAddToPosCart(prod)}
                          className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                              {prod.images?.[0] ? (
                                <Image src={prod.images[0]} alt={prod.name} width={32} height={32} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{prod.name}</p>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                SKU: {prod.sku} • Stock: {prod.stockQuantity} {prod.unit}
                              </span>
                            </div>
                          </div>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹{prod.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "dairy", label: "🥛 Dairy" },
                    { id: "farming", label: "🌾 Feed" },
                    { id: "kirana", label: "🛒 Kirana" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPosCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${posCategory === tab.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Visual Product Grid with Images for 1-Click Addition */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-1">
                  {posDisplayedProducts.map((prod) => (
                    <div
                      key={prod._id}
                      onClick={() => handleAddToPosCart(prod)}
                      className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition shadow-xs hover:shadow-md active:scale-95 group"
                    >
                      <div className="relative aspect-square w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 overflow-hidden mb-2">
                        {prod.images?.[0] ? (
                          <Image src={prod.images[0]} alt={prod.name} width={150} height={150} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                          {prod.stockQuantity} left
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{prod.name}</h4>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹{prod.price}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{prod.packageSize || prod.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* POS Cart & Checkout Panel (1 col) */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Walk-in POS Cart ({posCart.length})
                    </h3>
                    {posCart.length > 0 && (
                      <button
                        onClick={() => setPosCart([])}
                        className="text-[11px] text-rose-500 hover:underline"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>

                  {/* Customer Info Form */}
                  <div className="space-y-2 mb-3 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="tel"
                      placeholder="Customer Phone (for WhatsApp bill)"
                      value={posCustomerPhone}
                      onChange={(e) => setPosCustomerPhone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {posCart.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Tap products or search to add items</p>
                    ) : (
                      posCart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleUpdatePosQuantity(item.productId, -1)}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdatePosQuantity(item.productId, 1)}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Payment Mode & Tax Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-slate-600 dark:text-slate-400">Payment Mode</label>
                      <select
                        value={posPaymentMethod}
                        onChange={(e) => setPosPaymentMethod(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="cash_counter">💵 Cash Counter</option>
                        <option value="upi_qr">⚡ UPI QR Code</option>
                        <option value="farmer_milk_bill">🥛 Farmer Milk Adjustment</option>
                        <option value="credit">📝 Credit (Khata)</option>
                      </select>
                    </div>

                    {/* GST / Tax Checkbox & Rate Selector */}
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={posApplyTax}
                          onChange={(e) => setPosApplyTax(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>Apply Tax / GST</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {posApplyTax && (
                          <select
                            value={posTaxRate}
                            onChange={(e) => setPosTaxRate(Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            <option value="5">5% GST</option>
                            <option value="12">12% GST</option>
                            <option value="18">18% GST</option>
                          </select>
                        )}
                        {posApplyTax && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">+₹{posTaxDetails.taxAmount}</span>
                        )}
                      </div>
                    </div>

                    {/* Discount Input */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Discount (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={posDiscount}
                        onChange={(e) => setPosDiscount(e.target.value)}
                        className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-xs text-right text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer with Grand Total & Generate Bill Button */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₹{posSubtotal}</span>
                    </div>
                    {posDiscountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold text-xs">
                        <span>Discount Applied:</span>
                        <span>-₹{posDiscountAmount}</span>
                      </div>
                    )}
                    {posApplyTax && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 text-xs">
                        <span>GST Tax ({posTaxRate}%):</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹{posTaxDetails.taxAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Total Payable:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">₹{posGrandTotal}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreatePosSale}
                    disabled={posSubmitting || posCart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    {posSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating Bill...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 mr-2" />
                        Generate &amp; Print Bill
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 3: INVENTORY MANAGEMENT WITH PRODUCT IMAGES & DELETE WARNING
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Inventory Management
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage Dairy, Cattle Feed, and Kirana items with images and real-time stock levels
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({
                      name: "",
                      category: "dairy",
                      subCategory: "",
                      brand: "",
                      sku: `SKU-${Date.now().toString().slice(-6)}`,
                      barcode: "",
                      price: 50,
                      mrp: 55,
                      stockQuantity: 20,
                      minStockAlert: 5,
                      unit: "piece",
                      packageSize: "1 unit",
                      description: "",
                      images: "",
                      isAvailable: true,
                    });
                    setPreviewImageUrl("");
                    setIsProductModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add New Product
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search inventory by title, SKU, brand..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {["all", "dairy", "farming", "kirana"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setProductCategoryFilter(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${productCategoryFilter === c
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
                        }`}
                    >
                      {c === "farming" ? "Cattle Feed" : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Table with Images */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Photo</th>
                        <th className="px-4 py-3">Product Name &amp; SKU</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price / MRP</th>
                        <th className="px-4 py-3">Stock Quantity</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                      {filteredProducts.map((p) => {
                        const isLowStock = p.stockQuantity <= p.minStockAlert;
                        return (
                          <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                            {/* Product Image Thumbnail */}
                            <td className="px-4 py-3">
                              <div
                                onClick={() => p.images?.[0] && setImageModalUrl(p.images[0])}
                                className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative cursor-pointer group/img border border-slate-200 dark:border-slate-700/60"
                                title="Click to view full image"
                              >
                                {p.images?.[0] ? (
                                  <Image src={p.images[0]} alt={p.name} width={48} height={48} className="w-full h-full object-cover group-hover/img:scale-110 transition duration-200" />
                                ) : (
                                  <Package className="w-6 h-6 text-slate-400 m-auto mt-3" />
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                SKU: {p.sku} {p.brand ? `• ${p.brand}` : ""}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="capitalize px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {p.category === "farming" ? "Cattle Feed" : p.category}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-semibold">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{p.price}</span>
                              {p.mrp > p.price && (
                                <span className="text-[10px] text-slate-400 line-through ml-1.5">₹{p.mrp}</span>
                              )}
                              <span className="text-[10px] text-slate-400 block font-normal">per {p.unit}</span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isLowStock
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  }`}
                              >
                                {p.stockQuantity} {p.unit}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                  title="Edit Product"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      isOpen: true,
                                      type: "product",
                                      item: p,
                                      loading: false,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 4: ALL BILLS & RECORDS HISTORY
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "bills" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    All Bills &amp; Receipts History
                    {billsLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 inline ml-1" />}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Audit trail of all in-store walk-in POS receipts and online orders
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search bill # or phone..."
                      value={billSearch}
                      onChange={(e) => setBillSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchBills()}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                    />
                  </div>

                  <select
                    value={billChannelFilter}
                    onChange={(e) => {
                      setBillChannelFilter(e.target.value);
                      setTimeout(fetchBills, 100);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="all">All Channels</option>
                    <option value="pos">Walk-in POS</option>
                    <option value="online">Online Delivery</option>
                  </select>

                  <input
                    type="date"
                    value={billDateFilter}
                    onChange={(e) => {
                      setBillDateFilter(e.target.value);
                      setTimeout(fetchBills, 100);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Bills Table */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Bill Number</th>
                        <th className="px-4 py-3">Date &amp; Time</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Channel &amp; Mode</th>
                        <th className="px-4 py-3">Grand Total</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                      {bills.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No bills found matching your filter criteria
                          </td>
                        </tr>
                      ) : (
                        bills.map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white text-xs">
                              {b.orderNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                              {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                {b.deliveryAddress?.recipientName || "Walk-in"}
                              </span>
                              {b.deliveryAddress?.recipientPhone && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {b.deliveryAddress.recipientPhone}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 capitalize">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {b.orderChannel.toUpperCase()} • {b.paymentMethod.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm">
                              ₹{b.grandTotal}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingBill(b)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                  title="View Bill Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePrintReceiptClean(b.orderNumber, "print")}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                                  title="Print Clean Thermal Slip"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePrintReceiptClean(b.orderNumber, "download")}
                                  className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition"
                                  title="Download PDF Slip"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 5: COUPONS & PROMOTIONAL DISCOUNTS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "coupons" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Coupons &amp; Promotional Codes
                    {couponsLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 inline ml-1" />}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Create promotional offers and discounts to boost retail sales in your dairy village
                  </p>
                </div>

                <Button
                  onClick={() => setIsCouponModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Coupon Code
                </Button>
              </div>

              {/* Coupons List Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c) => (
                  <div
                    key={c._id}
                    className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleToggleCoupon(c)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{c.title || "Special Store Discount"}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.discountType === "fixed" ? `Flat ₹${c.discountValue} OFF` : `${c.discountValue}% OFF`} on min order ₹{c.minOrderValue}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px] text-slate-400">
                      <span>Used {c.timesUsed || 0} times</span>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            type: "coupon",
                            item: c,
                            loading: false,
                          })
                        }
                        className="text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 6: GEOFENCE & OUTLET SETTINGS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="max-w-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Geofence &amp; Outlet Delivery Parameters
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Orders will strictly only be allowed for customers inside your village geofence radius
                </p>
              </div>

              {profile && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Store Name</label>
                    <input
                      type="text"
                      value={profile.storeName || ""}
                      onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Base Village Location</label>
                      <input
                        type="text"
                        value={profile.village || ""}
                        onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Delivery Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={profile.deliveryRadiusKm || 8}
                        onChange={(e) => setProfile({ ...profile, deliveryRadiusKm: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Serviced Villages / Hamlets (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={profile.serviceVillages ? profile.serviceVillages.join(", ") : ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          serviceVillages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Rampur, Shivnagar, Kalyanpur"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Base Delivery Fee (₹)</label>
                      <input
                        type="number"
                        value={profile.deliveryFee ?? 20}
                        onChange={(e) => setProfile({ ...profile, deliveryFee: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Free Delivery Above (₹)</label>
                      <input
                        type="number"
                        value={profile.freeDeliveryThreshold ?? 500}
                        onChange={(e) => setProfile({ ...profile, freeDeliveryThreshold: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Geofence &amp; Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 7: STORE ADMIN USER PROFILE & PHOTO
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="max-w-4xl space-y-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Store Admin User Profile
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage your dairy store administrator identity, profile photo, and registered merchant credentials
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Store Admin
                  </span>
                </div>

                <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {/* Left Column: Profile Photo & Fast Identity Badge */}
                  <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4">
                    <div className="relative group">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-4 ring-emerald-500/30 shadow-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center">
                        {adminProfileForm.profilePhoto || adminUser?.profilePhoto ? (
                          <img
                            src={adminProfileForm.profilePhoto || adminUser?.profilePhoto}
                            alt={adminProfileForm.name || "Admin"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-black text-white uppercase">
                            {adminProfileForm.name ? adminProfileForm.name.slice(0, 2) : "AD"}
                          </span>
                        )}
                      </div>

                      {/* Photo Upload Overlay / Trigger Button */}
                      <label
                        htmlFor="admin-photo-input"
                        className="absolute inset-0 bg-black/60 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-1 text-xs font-semibold backdrop-blur-xs"
                        title="Upload new profile photo"
                      >
                        <Camera className="w-6 h-6" />
                        <span>Change Photo</span>
                      </label>
                      <input
                        id="admin-photo-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAdminPhotoUpload}
                        disabled={photoUploading}
                      />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {adminProfileForm.name || adminUser?.name || "Store Administrator"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {adminProfileForm.shopName || profile?.storeName || "Milkify Partner Outlet"}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          {adminUser?.role || "Admin"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {adminUser?.Status || "Active"}
                        </span>
                      </div>
                    </div>

                    {/* Actions for Photo */}
                    <div className="w-full flex flex-col gap-2 pt-2">
                      <label
                        htmlFor="admin-photo-input"
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {photoUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                          </>
                        )}
                      </label>
                      {(adminProfileForm.profilePhoto || adminUser?.profilePhoto) && (
                        <button
                          type="button"
                          onClick={handleRemoveAdminPhoto}
                          disabled={photoUploading}
                          className="w-full py-1.5 px-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold rounded-xl transition"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="w-full pt-3 border-t border-slate-200 dark:border-slate-800/80 text-left space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Member ID:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {adminUser?.memberId || "ADMIN-01"}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Village:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {adminProfileForm.village || profile?.village || "—"}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Registered:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {adminUser?.createdAt ? new Date(adminUser.createdAt).toLocaleDateString() : "Active"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Editable Profile Information */}
                  <div className="md:col-span-2">
                    <form onSubmit={handleSaveAdminProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Full Legal Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={adminProfileForm.name}
                            onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            placeholder="e.g. Ramesh Patel"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Mobile Phone (10 digits) *
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={adminProfileForm.mobile}
                            onChange={(e) => setAdminProfileForm({ ...adminProfileForm, mobile: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            placeholder="9876543210"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={adminProfileForm.email}
                            onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            placeholder="admin@milkify.com"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Gender
                          </label>
                          <select
                            value={adminProfileForm.gender}
                            onChange={(e) => setAdminProfileForm({ ...adminProfileForm, gender: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Dairy / Shop Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={adminProfileForm.shopName}
                            onChange={(e) => setAdminProfileForm({ ...adminProfileForm, shopName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            placeholder="e.g. Patel Dairy Farm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Headquarters Village *
                          </label>
                          <input
                            type="text"
                            required
                            value={adminProfileForm.village}
                            onChange={(e) => setAdminProfileForm({ ...adminProfileForm, village: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            placeholder="e.g. Rampur"
                          />
                        </div>
                      </div>

                      {/* Photo URL Input fallback */}
                      <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Profile Photo Direct URL (Optional)</span>
                          <span className="text-[11px] text-slate-400 font-normal">Or use the upload button on the left</span>
                        </label>
                        <input
                          type="url"
                          value={adminProfileForm.profilePhoto}
                          onChange={(e) => setAdminProfileForm({ ...adminProfileForm, profilePhoto: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                          placeholder="https://images.unsplash.com/... or data:image/..."
                        />
                      </div>

                      <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Updates sync across your Milkify Admin account and Store Outlet.
                        </p>
                        <Button
                          type="submit"
                          disabled={adminSaving}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 px-6 py-2.5 h-auto flex items-center justify-center gap-2"
                        >
                          {adminSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Profile Information</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Connected Outlet & Quick Business Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Connected Public Outlet Info
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Storefront Outlet Handle:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        {profile?.slug || "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Store Name:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {profile?.storeName || adminProfileForm.shopName || "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Delivery Coverage:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {profile?.deliveryRadiusKm || 8} km ({(profile?.serviceVillages || []).length} villages)
                      </strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Status:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {profile?.isOpen !== false ? "🟢 Open for Orders" : "🔴 Closed"}
                      </span>
                    </div>
                  </div>
                  {profile?.slug && (
                    <div className="pt-2 flex gap-2">
                      <a
                        href={`/store/${profile.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 text-center transition flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visit Storefront</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/store/${profile.slug}`);
                          toast.success("Store link copied!");
                        }}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                        title="Copy store URL"
                      >
                        <CopyIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Account Overview &amp; Store Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Catalog Items</span>
                      <strong className="text-base text-slate-900 dark:text-white">{products.length}</strong>
                      <p className="text-[10px] text-slate-500">Active products</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Coupons</span>
                      <strong className="text-base text-slate-900 dark:text-white">{coupons.length}</strong>
                      <p className="text-[10px] text-slate-500">Live discount deals</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Bills Processed</span>
                      <strong className="text-base text-slate-900 dark:text-white">{bills.length}</strong>
                      <p className="text-[10px] text-slate-500">Walk-in &amp; Online</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">POS Billing</span>
                      <strong className="text-base text-emerald-600 dark:text-emerald-400">Active</strong>
                      <p className="text-[10px] text-slate-500">Thermal receipts</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Configure Store Operational Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE WARNING CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Confirm Permanent Deletion</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this {deleteModal.type}:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteModal.type === "product" ? deleteModal.item?.name : deleteModal.item?.code}
                </strong>
                ? This action cannot be reversed.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ isOpen: false, type: null, item: null, loading: false })}
                className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteModal.loading}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                {deleteModal.loading ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          IMAGE FULL PREVIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {imageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setImageModalUrl(null)}
        >
          <div className="relative max-w-lg w-full max-h-[80vh] flex flex-col items-center">
            <button
              onClick={() => setImageModalUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-slate-900">
              <Image
                src={imageModalUrl}
                alt="Product Preview"
                width={500}
                height={500}
                className="w-full h-auto object-contain max-h-[75vh]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT PRODUCT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingProductId ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Pure Buffalo Ghee (1 Kg)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  >
                    <option value="dairy">🥛 Dairy Product</option>
                    <option value="farming">🌾 Cattle Feed &amp; Farm</option>
                    <option value="kirana">🛒 Kirana &amp; Daily Grocery</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sub-Category</label>
                  <input
                    type="text"
                    value={productForm.subCategory}
                    onChange={(e) => setProductForm({ ...productForm, subCategory: e.target.value })}
                    placeholder="e.g. Milk &amp; Curd"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image URL with live preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Image URL(s) - Comma-separated</label>
                <input
                  type="text"
                  value={productForm.images}
                  onChange={(e) => {
                    setProductForm({ ...productForm, images: e.target.value });
                    setPreviewImageUrl(e.target.value.split(",")[0]?.trim() || "");
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                />
                {previewImageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Live Preview:</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Image src={previewImageUrl} alt="Preview" width={40} height={40} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductModalOpen(false)}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={productSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  {productSubmitting ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE COUPON MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Create New Coupon Code</h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MILK50, DIWALI10"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white uppercase font-mono mt-1 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Offer Title</label>
                <input
                  type="text"
                  placeholder="e.g. Village Special Discount"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  >
                    <option value="fixed">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={couponSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {couponSubmitting ? "Creating..." : "Save Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BILL DETAIL & WHATSAPP MODAL (WITH CLEAN PRINT ENGINE)
      ══════════════════════════════════════════════════════════════════════ */}
      {(posGeneratedBill || viewingBill) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Receipt #{posGeneratedBill?.orderNumber || viewingBill?.orderNumber}
              </h3>
              <button
                onClick={() => {
                  setPosGeneratedBill(null);
                  setViewingBill(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono">
              <div className="text-center font-bold text-sm text-slate-900 dark:text-white uppercase border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                {profile?.storeName || "MILKIFY DAIRY STORE"}
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Customer:</span>
                <span className="text-slate-800 dark:text-white font-semibold">
                  {posGeneratedBill?.deliveryAddress?.recipientName || viewingBill?.deliveryAddress?.recipientName}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Payment Mode:</span>
                <span className="text-emerald-600 dark:text-emerald-400 uppercase font-bold">
                  {posGeneratedBill?.paymentMethod || viewingBill?.paymentMethod}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 space-y-1">
                {(posGeneratedBill?.items || viewingBill?.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{it.name} x{it.quantity}</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{it.totalItemAmount}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{posGeneratedBill?.subtotal || viewingBill?.subtotal}</span>
                </div>
                {Number(posGeneratedBill?.discountAmount || viewingBill?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                    <span>Discount:</span>
                    <span>-₹{posGeneratedBill?.discountAmount || viewingBill?.discountAmount}</span>
                  </div>
                )}
                {(posGeneratedBill?.taxDetails?.isTaxApplied || viewingBill?.taxDetails?.isTaxApplied) && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <span>GST Tax ({posGeneratedBill?.taxDetails?.taxRate || viewingBill?.taxDetails?.taxRate || 5}%):</span>
                    <span>+₹{posGeneratedBill?.taxDetails?.taxAmount || viewingBill?.taxDetails?.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Paid:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{posGeneratedBill?.grandTotal || viewingBill?.grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Clean Print, Direct PDF Download & WhatsApp Share */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                onClick={() => handlePrintReceiptClean(posGeneratedBill?.orderNumber || viewingBill?.orderNumber, "print")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print 80mm Slip
              </Button>

              <Button
                onClick={() => handlePrintReceiptClean(posGeneratedBill?.orderNumber || viewingBill?.orderNumber, "download")}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Download PDF Slip
              </Button>

              {(posGeneratedBill?.whatsappUrl || (viewingBill && viewingBill.deliveryAddress?.recipientPhone)) && (
                <a
                  href={
                    posGeneratedBill?.whatsappUrl ||
                    `https://wa.me/91${viewingBill?.deliveryAddress?.recipientPhone?.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                      `*TAX INVOICE - ${profile?.storeName || "Milkify"}*\nBill No: ${viewingBill?.orderNumber}\nAmount: ₹${viewingBill?.grandTotal}\nStatus: ${viewingBill?.paymentStatus?.toUpperCase()}`
                    )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
                  title="Share digital invoice directly to customer on WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
