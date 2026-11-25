/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  Search,
  MapPin,
  Clock,
  Phone,
  Truck,
  Store,
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  Star,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  PackageCheck,
  User,
  LogIn,
  LogOut,
  QrCode,
  CreditCard,
  Smartphone,
  Copy,
  History,
  Mail,
  Sparkles,
  Percent,
  Lock,
  Key,
  Camera,
} from "lucide-react";
import { toast } from "@/lib/toast";
import axios from "axios";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { socket } from "@/lib/socket";

const API_BASE = typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api");

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PublicStorePage({ params }) {
  const slug = params?.slug;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({ dairy: 0, farming: 0, kirana: 0 });
  const [products, setProducts] = useState([]);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Cart & Wishlist state (persisted in localStorage)
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Checkout form
  const [fulfillmentType, setFulfillmentType] = useState("village_delivery");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientVillage, setRecipientVillage] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [deliveryEligibility, setDeliveryEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Customer Account & Profile
  const [customerToken, setCustomerToken] = useState(null);
  const [customerUser, setCustomerUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authForm, setAuthForm] = useState({ name: "", mobile: "", email: "", password: "", village: "" });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [guestCreateAccount, setGuestCreateAccount] = useState(false);
  const [guestPassword, setGuestPassword] = useState("");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("details"); // "details" | "orders" | "password"
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    email: "",
    village: "",
    profilePhoto: "",
    fullAddress: "",
    landmark: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [resetForm, setResetForm] = useState({ mobile: "", newPassword: "", confirmPassword: "" });
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Offers & Coupons
  const [outletCoupons, setOutletCoupons] = useState([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Cancellation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Changed mind / Ordered by mistake");
  const [cancelOrderLoading, setCancelOrderLoading] = useState(false);

  // Payment method ("cod" | "online" | "farmer_milk_bill")
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [isOnlinePayModalOpen, setIsOnlinePayModalOpen] = useState(false);
  const [activePayOrder, setActivePayOrder] = useState(null);
  const [confirmingOnlinePayment, setConfirmingOnlinePayment] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState(600); // 10 minutes like Swiggy/Zomato
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const isOngoingOrder = Boolean(
    currentOrder &&
    currentOrder.orderNumber &&
    !["cancelled", "rejected", "delivered"].includes(currentOrder.orderStatus)
  );
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [trackOrderInput, setTrackOrderInput] = useState("");
  const [guestOrderHistory, setGuestOrderHistory] = useState([]);

  // Load customer session & active order from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedToken = localStorage.getItem("milkify_customer_token");
        const savedUser = localStorage.getItem("milkify_customer_user");
        const savedCurrent = localStorage.getItem("milkify_current_order");
        if (savedCurrent) {
          try {
            const parsed = JSON.parse(savedCurrent);
            const inactiveStatuses = ["cancelled", "rejected", "delivered"];
            if (parsed && parsed.orderNumber && !inactiveStatuses.includes(parsed.orderStatus)) {
              setCurrentOrder(parsed);
              // Asynchronously verify live order status from the server
              axios
                .get(`${API_BASE}/store/public/order/track/${parsed.orderNumber}`)
                .then((res) => {
                  if (res.data?.success && res.data.order) {
                    const liveOrder = res.data.order;
                    if (inactiveStatuses.includes(liveOrder.orderStatus)) {
                      setCurrentOrder(null);
                      try { localStorage.removeItem("milkify_current_order"); } catch {}
                    } else {
                      setCurrentOrder(liveOrder);
                      try { localStorage.setItem("milkify_current_order", JSON.stringify(liveOrder)); } catch {}
                    }
                  }
                })
                .catch(() => {});
            } else {
              localStorage.removeItem("milkify_current_order");
              setCurrentOrder(null);
            }
          } catch {
            localStorage.removeItem("milkify_current_order");
            setCurrentOrder(null);
          }
        }

        const savedGuestOrders = localStorage.getItem("milkify_guest_order_history");
        if (savedGuestOrders) setGuestOrderHistory(JSON.parse(savedGuestOrders));

        if (savedToken && savedUser) {
          const parsed = JSON.parse(savedUser);
          setCustomerToken(savedToken);
          setCustomerUser(parsed);
          if (parsed.name && !recipientName) setRecipientName(parsed.name);
          if (parsed.mobile && !recipientPhone) setRecipientPhone(parsed.mobile);
          if (parsed.email && !recipientEmail) setRecipientEmail(parsed.email);
          if (parsed.village && !recipientVillage) setRecipientVillage(parsed.village);
          const defAddr = parsed.savedAddresses?.find((a) => a.isDefault) || parsed.savedAddresses?.[0];
          if (defAddr && !fullAddress) {
            setFullAddress(defAddr.fullAddress || "");
            setLandmark(defAddr.landmark || "");
          }
        }
      } catch (e) {
        console.error("Failed to load customer session", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load cart & wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem(`cart_${slug}`);
        if (savedCart) setCart(JSON.parse(savedCart));
        const savedWishlist = localStorage.getItem(`wishlist_${slug}`);
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to load cart from storage", e);
      }
    }
  }, [slug]);

  // Persist cart
  useEffect(() => {
    if (typeof window !== "undefined" && slug) {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
    }
  }, [cart, slug]);

  // Persist wishlist
  useEffect(() => {
    if (typeof window !== "undefined" && slug) {
      localStorage.setItem(`wishlist_${slug}`, JSON.stringify(wishlist));
    }
  }, [wishlist, slug]);

  // Fetch store profile and products
  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/store/public/outlet/${slug}`);
      if (res.data?.success) {
        setStore(res.data.store);
        setCategoryCounts(res.data.categoryCounts || { dairy: 0, farming: 0, kirana: 0 });
        if (res.data.store?.village && !recipientVillage) {
          setRecipientVillage(res.data.store.village);
        }
      }

      const prodRes = await axios.get(`${API_BASE}/store/public/outlet/${slug}/products`);
      if (prodRes.data?.success) {
        setProducts(prodRes.data.products || []);
      }

      // Fetch active offers and coupons
      try {
        const couponRes = await axios.get(`${API_BASE}/store/public/outlet/${slug}/coupons`);
        if (couponRes.data?.success) {
          setOutletCoupons(couponRes.data.coupons || []);
        }
      } catch (cErr) {
        console.warn("Could not load outlet coupons", cErr.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dairy outlet details.");
    } finally {
      setLoading(false);
    }
  };

  // Sync profileForm when customerUser changes
  useEffect(() => {
    if (customerUser) {
      const defAddr = customerUser.savedAddresses?.find((a) => a.isDefault) || customerUser.savedAddresses?.[0];
      setProfileForm({
        name: customerUser.name || "",
        mobile: customerUser.mobile || "",
        email: customerUser.email || "",
        village: customerUser.village || "",
        profilePhoto: customerUser.profilePhoto || "",
        fullAddress: defAddr?.fullAddress || "",
        landmark: defAddr?.landmark || "",
      });
    }
  }, [customerUser]);

  // Refresh customer profile to fetch latest unsettled milk credit
  const refreshCustomerProfile = async (token = customerToken) => {
    const activeToken = token || localStorage.getItem("milkify_customer_token");
    if (!activeToken) return;
    try {
      const res = await axios.get(`${API_BASE}/store/public/customer/profile`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.data?.success && res.data.customer) {
        setCustomerUser(res.data.customer);
        localStorage.setItem("milkify_customer_user", JSON.stringify(res.data.customer));
      }
    } catch {}
  };

  useEffect(() => {
    if (!slug) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("milkify_last_store_slug", slug);
      } catch {}
    }
    fetchStoreData();

    try {
      if (!socket.connected) socket.connect();
      const outletRoom = `outlet:${slug.toLowerCase()}`;
      socket.emit("join_room", outletRoom);

      const onInventoryUpdated = () => {
        axios.get(`${API_BASE}/store/public/outlet/${slug}/products`).then((res) => {
          if (res.data?.success) {
            setProducts(res.data.products || []);
            toast.info("Store inventory updated in real-time!");
          }
        }).catch(() => {});
      };

      const onCouponsUpdated = () => {
        axios.get(`${API_BASE}/store/public/outlet/${slug}/coupons`).then((res) => {
          if (res.data?.success) {
            setOutletCoupons(res.data.coupons || []);
            toast.info("Special offers & coupons updated!");
          }
        }).catch(() => {});
      };

      const onProfileUpdated = () => {
        axios.get(`${API_BASE}/store/public/outlet/${slug}`).then((res) => {
          if (res.data?.success) {
            setStore(res.data.store);
            setCategoryCounts(res.data.categoryCounts || { dairy: 0, farming: 0, kirana: 0 });
            toast.info("Dairy store details updated live!");
          }
        }).catch(() => {});
      };

      const onOrderStatusUpdated = (data) => {
        if (!data?.orderNumber) return;
        setCurrentOrder((prev) => {
          if (prev && prev.orderNumber === data.orderNumber) {
            if (["cancelled", "rejected", "delivered"].includes(data.newStatus)) {
              try {
                localStorage.removeItem("milkify_current_order");
              } catch {}
              return null;
            }
            const updated = { ...prev, orderStatus: data.newStatus };
            try {
              localStorage.setItem("milkify_current_order", JSON.stringify(updated));
            } catch {}
            return updated;
          }
          return prev;
        });
        if (customerToken) fetchCustomerOrders();
      };

      socket.on("store:inventory_updated", onInventoryUpdated);
      socket.on("store:coupon_updated", onCouponsUpdated);
      socket.on("store:profile_updated", onProfileUpdated);
      socket.on("store:order_status_updated", onOrderStatusUpdated);

      return () => {
        socket.off("store:inventory_updated", onInventoryUpdated);
        socket.off("store:coupon_updated", onCouponsUpdated);
        socket.off("store:profile_updated", onProfileUpdated);
        socket.off("store:order_status_updated", onOrderStatusUpdated);
      };
    } catch (e) {
      console.warn("Public store socket subscription notice:", e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Geolocation detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserCoords(coords);
        setLocatingUser(false);
        toast.success("GPS Location detected!");
        validateDelivery(recipientVillage, coords);
      },
      (err) => {
        setLocatingUser(false);
        toast.error(`Unable to retrieve GPS: ${err.message}. You can manually enter your village.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Validate geofence delivery eligibility
  const validateDelivery = async (villageName, coords = userCoords) => {
    if (!slug) return;
    try {
      setCheckingEligibility(true);
      const res = await axios.post(`${API_BASE}/store/public/outlet/${slug}/validate-delivery`, {
        village: villageName || recipientVillage,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
      });

      if (res.data?.success) {
        setDeliveryEligibility(res.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Trigger validation when village changes
  useEffect(() => {
    if (recipientVillage && recipientVillage.trim().length >= 2) {
      const timer = setTimeout(() => {
        validateDelivery(recipientVillage);
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientVillage]);

  // Cart operations
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stockQuantity) {
          toast.warning(`Only ${product.stockQuantity} items in stock!`);
          return prev;
        }
        toast.success(`Updated ${product.name} quantity to ${newQty}`);
        return prev.map((item) => (item._id === product._id ? { ...item, quantity: newQty } : item));
      } else {
        if (product.stockQuantity < 1) {
          toast.error("Item is out of stock!");
          return prev;
        }
        toast.success(`Added ${product.name} to cart`);
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item._id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.stockQuantity) {
              toast.warning(`Max stock reached: ${item.stockQuantity}`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
    toast.info("Item removed from cart");
  };

  // Wishlist toggle
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === product._id);
      if (exists) {
        toast.info(`Removed ${product.name} from wishlist`);
        return prev.filter((item) => item._id !== product._id);
      } else {
        toast.success(`Saved ${product.name} to wishlist`);
        return [...prev, product];
      }
    });
  };

  // Voucher & Offer operations
  const handleApplyVoucher = async (codeToUse) => {
    const code = (typeof codeToUse === "string" ? codeToUse : voucherInput).trim().toUpperCase();
    if (!code) {
      toast.warning("Please enter a coupon code");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/store/public/coupon/validate`, {
        code,
        cartAmount: subtotal,
        outletSlug: slug,
      });

      if (res.data?.success && res.data.coupon) {
        setAppliedVoucher({
          code: res.data.coupon.code,
          discount: res.data.coupon.discountAmount,
          description: res.data.coupon.title || `Special offer on ${store?.storeName || "order"}`,
        });
        toast.success(res.data.message || `Coupon '${code}' applied!`);
        setVoucherInput("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Coupon '${code}' could not be applied`);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    toast.info("Coupon removed");
  };

  // Update Customer Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      return toast.warning("Full name is required");
    }
    setProfileSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/store/public/customer/profile`,
        profileForm,
        {
          headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
        }
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Profile updated successfully!");
        setCustomerUser(res.data.customer);
        localStorage.setItem("milkify_customer_user", JSON.stringify(res.data.customer));
        if (res.data.customer.name) setRecipientName(res.data.customer.name);
        if (res.data.customer.mobile) setRecipientPhone(res.data.customer.mobile);
        if (res.data.customer.email) setRecipientEmail(res.data.customer.email);
        if (res.data.customer.village) setRecipientVillage(res.data.customer.village);
        const def = res.data.customer.savedAddresses?.find((a) => a.isDefault) || res.data.customer.savedAddresses?.[0];
        if (def?.fullAddress) setFullAddress(def.fullAddress);
        if (def?.landmark) setLandmark(def.landmark);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Upload or update customer profile photo (auto-syncs with dairy admin portal if same user)
  const handleCustomerPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.warning("Please select a valid image file (PNG, JPG, WebP)");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.warning("Image size must be less than 5MB");
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await axios.post(`${API_BASE}/store/public/customer/photo`, formData, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        toast.success("Profile photo updated & synced!");
        const updated = res.data.customer || { ...customerUser, profilePhoto: res.data.profilePhoto };
        setCustomerUser(updated);
        localStorage.setItem("milkify_customer_user", JSON.stringify(updated));
        setProfileForm((prev) => ({ ...prev, profilePhoto: res.data.profilePhoto }));
      }
    } catch (err) {
      // Fallback: encode to base64 and send JSON
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result;
          const fallbackRes = await axios.post(
            `${API_BASE}/store/public/customer/photo`,
            { photo: base64 },
            { headers: { Authorization: `Bearer ${customerToken}` } }
          );
          if (fallbackRes.data?.success) {
            toast.success("Profile photo updated & synced!");
            const updated = fallbackRes.data.customer || { ...customerUser, profilePhoto: base64 };
            setCustomerUser(updated);
            localStorage.setItem("milkify_customer_user", JSON.stringify(updated));
            setProfileForm((prev) => ({ ...prev, profilePhoto: base64 }));
          }
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error(err.response?.data?.message || "Failed to upload profile photo");
      }
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  // Delete customer profile photo
  const handleCustomerPhotoDelete = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setPhotoUploading(true);
    try {
      const res = await axios.delete(`${API_BASE}/store/public/customer/photo`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.data?.success) {
        toast.success("Profile photo removed");
        const updated = res.data.customer || { ...customerUser, profilePhoto: "" };
        setCustomerUser(updated);
        localStorage.setItem("milkify_customer_user", JSON.stringify(updated));
        setProfileForm((prev) => ({ ...prev, profilePhoto: "" }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Customer Cancel Unpaid / Placed Order
  const handleCancelActiveOrder = async (orderNumber) => {
    if (!orderNumber) return;
    setCancelOrderLoading(true);
    try {
      const res = await axios.put(`${API_BASE}/store/public/order/${orderNumber}/cancel`, {
        reason: cancelReason,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Order has been cancelled successfully");
        const cancelledOrder = res.data.order;
        setCurrentOrder(null);
        try {
          localStorage.removeItem("milkify_current_order");
          const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
          const updated = existing.map((o) => (o.orderNumber === orderNumber ? cancelledOrder : o));
          localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
          setGuestOrderHistory(updated);
        } catch {}
        setIsCancelModalOpen(false);
        if (customerToken) fetchCustomerOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to cancel order");
    } finally {
      setCancelOrderLoading(false);
    }
  };

  // Price calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (!cart || cart.length === 0 || subtotal === 0) return 0;
    if (fulfillmentType === "counter_pickup") return 0;
    if (!store) return 20;
    if (subtotal >= (store.freeDeliveryThreshold || 500)) return 0;
    return store.deliveryFee || 20;
  }, [cart, fulfillmentType, subtotal, store]);

  const discountAmount = useMemo(() => {
    if (!appliedVoucher || !cart || cart.length === 0) return 0;
    return Math.min(appliedVoucher.discount, subtotal);
  }, [appliedVoucher, subtotal, cart]);

  const grandTotal = useMemo(() => {
    if (!cart || cart.length === 0 || subtotal === 0) return 0;
    return Math.max(0, subtotal + deliveryFee - discountAmount);
  }, [cart, subtotal, deliveryFee, discountAmount]);

  const freeDeliveryProgress = useMemo(() => {
    if (!store?.freeDeliveryThreshold || !cart || cart.length === 0) return 0;
    const pct = (subtotal / store.freeDeliveryThreshold) * 100;
    return Math.min(100, Math.round(pct));
  }, [cart, subtotal, store]);

  // Filtered & sorted products
  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q))
      );
    }

    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // ─── CUSTOMER AUTH & PROFILE OPERATIONS ────────────────────────────
  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    if (!authForm.mobile && !authForm.email) {
      return toast.warning("Please provide mobile number or email");
    }
    setAuthSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/store/public/customer/login`, {
        identifier: authForm.mobile || authForm.email,
        password: authForm.password,
        slug,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Signed in successfully!");
        setCustomerToken(res.data.token);
        setCustomerUser(res.data.customer);
        localStorage.setItem("milkify_customer_token", res.data.token);
        localStorage.setItem("milkify_customer_user", JSON.stringify(res.data.customer));

        if (res.data.customer.name) setRecipientName(res.data.customer.name);
        if (res.data.customer.mobile) setRecipientPhone(res.data.customer.mobile);
        if (res.data.customer.email) setRecipientEmail(res.data.customer.email);
        if (res.data.customer.village) setRecipientVillage(res.data.customer.village);
        const def = res.data.customer.savedAddresses?.find((a) => a.isDefault) || res.data.customer.savedAddresses?.[0];
        if (def) {
          if (def.fullAddress) setFullAddress(def.fullAddress);
          if (def.landmark) setLandmark(def.landmark);
        }

        setIsAuthModalOpen(false);
        setAuthForm({ name: "", mobile: "", email: "", password: "", village: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to sign in. Please check credentials.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    if (!authForm.name || !authForm.mobile) {
      return toast.warning("Name and Mobile are required to register");
    }
    const cleanMobile = authForm.mobile.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return toast.warning("Enter a valid 10-digit mobile number");
    }

    setAuthSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/store/public/customer/register`, {
        ...authForm,
        mobile: cleanMobile,
        slug,
      });

      if (res.data?.success) {
        toast.success("Account created successfully!");
        setCustomerToken(res.data.token);
        setCustomerUser(res.data.customer);
        localStorage.setItem("milkify_customer_token", res.data.token);
        localStorage.setItem("milkify_customer_user", JSON.stringify(res.data.customer));

        setRecipientName(res.data.customer.name);
        setRecipientPhone(res.data.customer.mobile);
        if (res.data.customer.email) setRecipientEmail(res.data.customer.email);
        if (res.data.customer.village) setRecipientVillage(res.data.customer.village);

        setIsAuthModalOpen(false);
        setAuthForm({ name: "", mobile: "", email: "", password: "", village: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Farmer / Customer Password Update (Authenticated)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 4) {
      return toast.warning("New password must be at least 4 characters");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }

    setPasswordSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/store/public/customer/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
        }
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Password updated successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setProfileTab("details");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Farmer / Customer Reset / Set Password (Unauthenticated via Mobile)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanMobile = resetForm.mobile.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return toast.warning("Please enter a valid 10-digit registered mobile number");
    }
    if (!resetForm.newPassword || resetForm.newPassword.length < 4) {
      return toast.warning("Password must be at least 4 characters long");
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setResetSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/store/public/customer/reset-password`, {
        mobile: cleanMobile,
        newPassword: resetForm.newPassword,
        slug,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Password updated successfully! Logged in.");
        setCustomerToken(res.data.token);
        setCustomerUser(res.data.customer);
        localStorage.setItem("milkify_customer_token", res.data.token);
        localStorage.setItem("milkify_customer_user", JSON.stringify(res.data.customer));

        setRecipientName(res.data.customer.name);
        setRecipientPhone(res.data.customer.mobile);
        if (res.data.customer.email) setRecipientEmail(res.data.customer.email);
        if (res.data.customer.village) setRecipientVillage(res.data.customer.village);

        setIsAuthModalOpen(false);
        setResetForm({ mobile: "", newPassword: "", confirmPassword: "" });
        setAuthMode("login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Safe Logout: Clears all customer session and order history for complete privacy
  const handleCustomerLogout = () => {
    localStorage.removeItem("milkify_customer_token");
    localStorage.removeItem("milkify_customer_user");
    localStorage.removeItem("milkify_current_order");
    localStorage.removeItem("milkify_guest_order_history");
    
    setCustomerToken(null);
    setCustomerUser(null);
    setCurrentOrder(null);
    setCustomerOrders([]);
    setGuestOrderHistory([]);
    setRecipientName("");
    setRecipientPhone("");
    setRecipientEmail("");
    setFullAddress("");
    setLandmark("");
    if (store?.village) setRecipientVillage(store.village);
    
    setIsProfileOpen(false);
    setIsOrderHistoryModalOpen(false);
    toast.info("Logged out successfully. All personal session orders cleared.");
  };

  // Fetch only authenticated customer's own past orders
  const fetchCustomerOrders = async () => {
    if (!customerToken) {
      setCustomerOrders([]);
      return;
    }
    try {
      setLoadingOrders(true);
      const res = await axios.get(`${API_BASE}/store/public/customer/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (res.data?.success) {
        const orders = res.data.orders || [];
        setCustomerOrders(orders);
        const activeOrder = orders.find(
          (o) => !["cancelled", "rejected", "delivered"].includes(o.orderStatus)
        );
        if (activeOrder) {
          setCurrentOrder(activeOrder);
          try {
            localStorage.setItem("milkify_current_order", JSON.stringify(activeOrder));
          } catch {}
        } else {
          setCurrentOrder(null);
          try {
            localStorage.removeItem("milkify_current_order");
          } catch {}
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoadingOrders(false);
    }
  };

  // Swiggy & Zomato style Countdown Timer (10 minutes) & Live Payment Polling
  useEffect(() => {
    let timer = null;
    let poller = null;

    if (isOnlinePayModalOpen && activePayOrder?.order?.orderNumber) {
      setPaymentCountdown(600); // 10 minutes (600s)
      setPaymentExpired(false);

      timer = setInterval(() => {
        setPaymentCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentExpired(true);
            // Notify backend that payment session timed out so inventory is released and order cancelled
            if (activePayOrder?.order?.orderNumber) {
              axios.put(`${API_BASE}/store/public/order/${activePayOrder.order.orderNumber}/timeout`).catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-poll payment status every 3.5 seconds
      poller = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE}/store/public/order/track/${activePayOrder.order.orderNumber}`);
          if (res.data?.success && res.data.order) {
            const ord = res.data.order;
            if (ord.paymentStatus === "paid" || ord.orderStatus === "confirmed") {
              clearInterval(poller);
              clearInterval(timer);
              toast.success("Payment confirmed successfully!");
              setCurrentOrder(ord);
              try {
                localStorage.setItem("milkify_current_order", JSON.stringify(ord));
                const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
                const updated = [ord, ...existing.filter((o) => o.orderNumber !== ord.orderNumber)].slice(0, 20);
                localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
                setGuestOrderHistory(updated);
              } catch {
                // ignore
              }
              setCart([]);
              setIsCartOpen(false);
              setIsOnlinePayModalOpen(false);
              router.push(`/store/track/${ord.orderNumber}`);
            } else if (ord.orderStatus === "cancelled") {
              clearInterval(poller);
              clearInterval(timer);
              toast.error(ord.cancellationReason || "Online payment timed out. Order cancelled.");
              setIsOnlinePayModalOpen(false);
              router.push(`/store/track/${ord.orderNumber}`);
            }
          }
        } catch {
          // ignore polling check errors
        }
      }, 3500);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (poller) clearInterval(poller);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnlinePayModalOpen, activePayOrder?.order?.orderNumber]);

  // Manual Confirmation Handler for UPI / Gateway
  const handleConfirmOnlinePayment = async () => {
    if (!activePayOrder?.order?.orderNumber) return;
    setConfirmingOnlinePayment(true);
    try {
      const verifyRes = await axios.post(`${API_BASE}/store/public/order/verify-payment`, {
        razorpay_order_id: activePayOrder.razorpay?.orderId || "upi_confirmed",
        razorpay_payment_id: `pay_upi_${Date.now()}`,
        razorpay_signature: "upi_confirmed_signature",
        orderNumber: activePayOrder.order.orderNumber,
      });

      if (verifyRes.data?.success) {
        toast.success("Online payment confirmed! Order placed successfully.");
        const paidOrder = verifyRes.data.order || {
          ...activePayOrder.order,
          paymentStatus: "paid",
          orderStatus: "confirmed",
        };
        setCurrentOrder(paidOrder);
        try {
          localStorage.setItem("milkify_current_order", JSON.stringify(paidOrder));
          const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
          const updated = [paidOrder, ...existing.filter((o) => o.orderNumber !== paidOrder.orderNumber)].slice(0, 20);
          localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
          setGuestOrderHistory(updated);
        } catch {
          // ignore
        }
        setCart([]);
        setIsCartOpen(false);
        setIsOnlinePayModalOpen(false);
        router.push(`/store/track/${paidOrder.orderNumber}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment verification failed. Please try again.");
    } finally {
      setConfirmingOnlinePayment(false);
    }
  };

  // Open Razorpay Checkout (Identical to Dairy Admin Subscription flow)
  const handleLaunchRazorpayCheckout = async () => {
    if (!activePayOrder?.razorpay) return;
    const rzpLoaded = await loadRazorpay();
    if (!rzpLoaded || !window.Razorpay) {
      return handleConfirmOnlinePayment();
    }
    const { order, razorpay } = activePayOrder;
    const options = {
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency || "INR",
      name: store?.storeName || "Milkify Dairy Store",
      description: `Order #${order.orderNumber}`,
      order_id: razorpay.orderId,
      prefill: {
        name: razorpay.customer?.name || recipientName.trim(),
        contact: razorpay.customer?.contact || recipientPhone.replace(/\D/g, "").slice(-10),
        email: razorpay.customer?.email || recipientEmail.trim(),
      },
      readonly: {
        contact: true,
        email: true,
        name: true,
      },
      modal: {
        confirm_close: true,
        ondismiss: function () {
          toast.info("Payment window minimized. Complete payment before countdown expires.");
        },
      },
      theme: { color: "#16a34a" },
      handler: async function (response) {
        try {
          const verifyRes = await axios.post(`${API_BASE}/store/public/order/verify-payment`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderNumber: order.orderNumber,
          });
          if (verifyRes.data?.success) {
            toast.success("Online payment verified! Order confirmed.");
            const paidOrder = verifyRes.data.order || { ...order, paymentStatus: "paid", orderStatus: "confirmed" };
            setCurrentOrder(paidOrder);
            try {
              localStorage.setItem("milkify_current_order", JSON.stringify(paidOrder));
              const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
              const updated = [paidOrder, ...existing.filter((o) => o.orderNumber !== paidOrder.orderNumber)].slice(0, 20);
              localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
              setGuestOrderHistory(updated);
            } catch {
              // ignore
            }
            setCart([]);
            setIsCartOpen(false);
            setIsOnlinePayModalOpen(false);
            router.push(`/store/track/${order.orderNumber}`);
          }
        } catch {
          toast.error("Payment verification failed. You can confirm via UPI or try again.");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (resp) {
      toast.error(resp?.error?.description || "Payment failed. Please retry or scan UPI QR.");
    });
    rzp.open();
  };

  // Switch to Cash on Delivery
  const handleSwitchToCod = async () => {
    if (!activePayOrder?.order?.orderNumber) return;
    try {
      await axios.post(`${API_BASE}/store/public/order/verify-payment`, {
        orderNumber: activePayOrder.order.orderNumber,
        razorpay_order_id: "cod_switch",
        paymentMethod: "cod",
      });
      toast.success("Order switched to Cash on Delivery! Order confirmed.");
      const codOrder = { ...activePayOrder.order, paymentMethod: "cod", paymentStatus: "pending" };
      setCurrentOrder(codOrder);
      try {
        localStorage.setItem("milkify_current_order", JSON.stringify(codOrder));
      } catch {
        // ignore
      }
      setCart([]);
      setIsCartOpen(false);
      setIsOnlinePayModalOpen(false);
      router.push(`/store/track/${codOrder.orderNumber}`);
    } catch {
      toast.error("Could not switch to COD.");
    }
  };

  // Checkout Order Submission
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      return toast.error("Your cart is empty!");
    }

    if (!recipientName.trim() || !recipientPhone.trim()) {
      return toast.warning("Please provide your name and mobile number.");
    }

    // Standardize 10 digit Indian mobile
    const cleanPhone = recipientPhone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return toast.warning("Please enter a valid 10-digit mobile number.");
    }

    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      return toast.warning("Please provide a valid email ID for invoice and tracking updates.");
    }

    if (fulfillmentType === "village_delivery") {
      if (!recipientVillage.trim()) {
        return toast.warning("Please provide your village name for delivery.");
      }
      if (deliveryEligibility && !deliveryEligibility.eligible) {
        return toast.error("Delivery is not available in your location. Please choose In-Store Counter Pickup.");
      }
    }

    if (paymentMethod === "farmer_milk_bill") {
      if (!customerUser?.farmerCredit?.isFarmer) {
        return toast.error("Dairy Milk Credit is only available for registered dairy farmers. Please sign in with your farmer account or choose Online/COD.");
      }
      const availCredit = customerUser.farmerCredit.creditBalance || 0;
      if (availCredit < grandTotal) {
        return toast.error(`Insufficient Dairy Milk Credit balance (Available: ₹${availCredit}, Required: ₹${grandTotal}). Please choose Online Payment or Cash on Delivery.`);
      }
    }

    setSubmittingOrder(true);
    try {
      // Optional guest auto-registration if requested
      if (!customerToken && guestCreateAccount && guestPassword.trim().length >= 4) {
        try {
          const regRes = await axios.post(`${API_BASE}/store/public/customer/register`, {
            name: recipientName.trim(),
            mobile: cleanPhone,
            email: recipientEmail.trim(),
            password: guestPassword.trim(),
            village: recipientVillage.trim(),
            fullAddress: fullAddress.trim(),
            landmark: landmark.trim(),
            slug,
          });
          if (regRes.data?.success && regRes.data?.token) {
            setCustomerToken(regRes.data.token);
            setCustomerUser(regRes.data.customer);
            localStorage.setItem("milkify_customer_token", regRes.data.token);
            localStorage.setItem("milkify_customer_user", JSON.stringify(regRes.data.customer));
          }
        } catch (e) {
          console.warn("Guest auto-registration note:", e.message);
        }
      }

      const payload = {
        customerDetails: {
          name: recipientName.trim(),
          mobile: cleanPhone,
          email: recipientEmail.trim(),
        },
        deliveryAddress: {
          recipientName: recipientName.trim(),
          recipientPhone: cleanPhone,
          village: recipientVillage.trim(),
          landmark: landmark.trim(),
          fullAddress: fullAddress.trim(),
          latitude: userCoords?.latitude || null,
          longitude: userCoords?.longitude || null,
        },
        fulfillmentType,
        items: cart.map((item) => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : "",
      };

      const orderRes = await axios.post(
        `${API_BASE}/store/public/outlet/${slug}/order`,
        payload,
        {
          headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
        }
      );

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || "Failed to create order");
      }

      const { order, razorpay, upiDetails } = orderRes.data;

      // Always save newly placed order to currentOrder state and local histories
      setCurrentOrder(order);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("milkify_current_order", JSON.stringify(order));
          const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
          const updated = [order, ...existing.filter((o) => o.orderNumber !== order.orderNumber)].slice(0, 20);
          localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
          setGuestOrderHistory(updated);
        } catch (e) {
          console.error("Storage error:", e);
        }
      }

      // Online Payment Flow (Razorpay Gateway)
      if (paymentMethod === "online") {
        if (razorpay && !razorpay.isMockSandbox) {
          const rzpLoaded = await loadRazorpay();
          if (rzpLoaded && window.Razorpay) {
            const options = {
              key: razorpay.keyId,
              amount: razorpay.amount,
              currency: razorpay.currency,
              name: store?.storeName || "Milkify Dairy Store",
              description: `Order #${order.orderNumber}`,
              order_id: razorpay.orderId,
              prefill: {
                name: recipientName.trim(),
                contact: cleanPhone,
                email: recipientEmail.trim(),
              },
              theme: { color: "#16a34a" },
              handler: async function (response) {
                try {
                  const verifyRes = await axios.post(`${API_BASE}/store/public/order/verify-payment`, {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderNumber: order.orderNumber,
                  });
                  if (verifyRes.data?.success) {
                    toast.success("Online payment verified! Order confirmed.");
                    const paidOrder = verifyRes.data.order || {
                      ...order,
                      paymentStatus: "paid",
                      orderStatus: "confirmed",
                    };
                    setCurrentOrder(paidOrder);
                    try {
                      localStorage.setItem("milkify_current_order", JSON.stringify(paidOrder));
                      const existing = JSON.parse(localStorage.getItem("milkify_guest_order_history") || "[]");
                      const updated = [paidOrder, ...existing.filter((o) => o.orderNumber !== paidOrder.orderNumber)].slice(0, 20);
                      localStorage.setItem("milkify_guest_order_history", JSON.stringify(updated));
                      setGuestOrderHistory(updated);
                    } catch {
                      // ignore
                    }
                    setCart([]);
                    setIsCartOpen(false);
                    router.push(`/store/track/${order.orderNumber}`);
                  }
                } catch {
                  toast.error("Payment verification failed. You can confirm via the payment assistant.");
                  setActivePayOrder({ order, razorpay, upiDetails });
                  setIsOnlinePayModalOpen(true);
                }
              },
              modal: {
                ondismiss: function () {
                  setSubmittingOrder(false);
                  toast.info("Payment window dismissed. You can complete payment below.");
                  setActivePayOrder({ order, razorpay, upiDetails });
                  setIsOnlinePayModalOpen(true);
                },
              },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
            setSubmittingOrder(false);
            return;
          }
        }

        // Open Interactive Online UPI / Sandbox Simulation Modal
        setActivePayOrder({ order, razorpay, upiDetails });
        setIsOnlinePayModalOpen(true);
        setSubmittingOrder(false);
        return;
      }

      // Farmer Milk Credit Settlement Flow
      if (paymentMethod === "farmer_milk_bill") {
        const remaining = orderRes.data?.remainingCredit !== undefined
          ? orderRes.data.remainingCredit
          : Math.max(0, (customerUser?.farmerCredit?.creditBalance || 0) - order.grandTotal);

        toast.success(`Order confirmed! ₹${order.grandTotal} paid via Dairy Cash. Remaining balance: ₹${remaining}.`);

        if (customerUser?.farmerCredit) {
          const updatedUser = {
            ...customerUser,
            farmerCredit: {
              ...customerUser.farmerCredit,
              creditBalance: remaining,
            },
          };
          setCustomerUser(updatedUser);
          try {
            localStorage.setItem("milkify_customer_user", JSON.stringify(updatedUser));
          } catch {}
        }

        setCart([]);
        setIsCartOpen(false);
        refreshCustomerProfile();
        router.push(`/store/track/${order.orderNumber}`);
        return;
      }

      // COD Flow
      toast.success("Order placed successfully! Cash on Delivery confirmed.");
      setCart([]);
      setIsCartOpen(false);
      router.push(`/store/track/${order.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to place order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 p-6">
        <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connecting to Dairy Outlet...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fetching fresh inventory and cattle feed availability</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 p-6 text-center">
        <Store className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">Dairy Outlet Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mt-2">
          The requested store link does not exist or has been disabled. Please contact the dairy admin.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition shadow-sm"
        >
          Return to Milkify Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors">
      {/* ─── TOP NOTIFICATION / GEOFENCE BANNER ─── */}
      <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/30 px-4 py-2 text-xs md:text-sm text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Hyper-Local Village Delivery active in <strong>{store.village}</strong> &amp; neighbouring clusters within{" "}
            <strong>{store.deliveryRadiusKm || 8} km</strong>.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {store.operatingHours?.openTime || "06:00 AM"} - {store.operatingHours?.closeTime || "09:00 PM"}
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Counter Pickup: {store.allowSelfPickup ? "Available" : "Closed"}
          </span>
        </div>
      </div>

      {/* ─── OUTLET HERO HEADER ─── */}
      <header className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/10 flex-shrink-0">
              <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {store.logoImage ? (
                  <Image src={store.logoImage} alt={store.storeName} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{store.storeName}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    store.isOpen
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  {store.isOpen ? "Open Now" : "Closed"}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">{store.tagline}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {store.village} Outlet
                </span>
                {store.phone && (
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {store.phone}
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-500">Free delivery on orders ₹{store.freeDeliveryThreshold || 500}+</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Customer Account, Track Order, Theme, Wishlist & Cart) */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {customerUser ? (
              <button
                onClick={() => {
                  setIsProfileOpen(true);
                  fetchCustomerOrders();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition shadow-xs"
                title="View Customer Profile & Past Orders"
              >
                {customerUser.profilePhoto ? (
                  <img
                    src={customerUser.profilePhoto}
                    alt={customerUser.name || "Customer"}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-500/40 shrink-0"
                  />
                ) : (
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="hidden sm:inline">{customerUser.name?.split(" ")[0] || "Account"}</span>
                {customerUser.farmerCredit?.isFarmer && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black shadow-xs" title="Available Dairy Milk Credit Balance">
                    🥛 ₹{customerUser.farmerCredit.creditBalance}
                  </span>
                )}
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">Profile</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
                title="Sign in or create account to save purchase info"
              >
                <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Track Orders & History Button */}
            <button
              onClick={() => {
                setIsOrderHistoryModalOpen(true);
                if (customerUser) fetchCustomerOrders();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
              title="Track Active Order & View Purchase History"
            >
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Track Orders</span>
              {isOngoingOrder && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <ThemeToggle />

            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-500 transition shadow-xs"
              title="View Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-bold">₹{grandTotal}</span>
              {cart.length > 0 && (
                <span className="bg-emerald-800 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── ACTIVE CURRENT ORDER LIVE STATUS BANNER ─── */}
      {isOngoingOrder && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg shadow-emerald-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                    Current Order
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black">#{currentOrder.orderNumber}</span>
                  <span className="text-[10px] uppercase font-bold bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full">
                    {currentOrder.orderStatus?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5">
                  Total: <strong className="text-white">₹{currentOrder.grandTotal}</strong> • {currentOrder.paymentMethod === "online" ? "⚡ Online (Paid)" : currentOrder.paymentMethod === "farmer_milk_bill" ? "🥛 Dairy Cash (Paid)" : "💵 Cash on Delivery"} • {currentOrder.items?.length || 1} items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Link
                href={`/store/track/${currentOrder.orderNumber}`}
                className="px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1.5"
              >
                <span>Track Live Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  setCurrentOrder(null);
                  try {
                    localStorage.removeItem("milkify_current_order");
                  } catch {
                    // ignore
                  }
                }}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Dismiss status banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STICKY SEARCH & CATEGORY FILTER ─── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Items", count: products.length },
              { id: "dairy", label: "🥛 Dairy Products", count: categoryCounts.dairy },
              { id: "farming", label: "🌾 Cattle Feed & Farm", count: categoryCounts.farming },
              { id: "kirana", label: "🛒 Kirana & Daily", count: categoryCounts.kirana },
              { id: "offers", label: "🎁 Offers & Deals", count: outletCoupons.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === tab.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === tab.id ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar & Sorting */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search milk, cattle feed, tea..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── PRODUCT & OFFERS SECTION ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCategory === "offers" ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  Store Deals &amp; Available Offers
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  1-Click apply at checkout or copy promo codes for instant savings on fresh dairy and cattle feed.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30 self-start sm:self-auto">
                {outletCoupons.length} Active Offers
              </span>
            </div>

            {outletCoupons.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/60 p-8 shadow-xs">
                <Tag className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-300">No active offers right now</h3>
                <p className="text-sm text-slate-500 mt-1">Check back soon for new festival deals and dairy discounts!</p>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-bold transition shadow-xs"
                >
                  Browse All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {outletCoupons.map((c) => (
                  <div
                    key={c._id || c.code}
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 border border-dashed border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-sm font-black tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          {c.code}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          {c.badgeText || (c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {c.title || (c.discountType === "percentage" ? `${c.discountValue}% Discount` : `Flat ₹${c.discountValue} Off`)}
                      </h4>
                      {c.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {c.minOrderValue > 0 ? `Min order: ₹${c.minOrderValue}` : "No min order limit"}
                        </span>
                        {c.validTill && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Valid till: {new Date(c.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(c.code);
                          }
                          toast.success(`Coupon code ${c.code} copied!`);
                        }}
                        className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition"
                        title="Copy coupon code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleApplyVoucher(c.code);
                          setIsCartOpen(true);
                        }}
                        className={`text-xs font-black px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
                          appliedVoucher?.code === c.code
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {appliedVoucher?.code === c.code ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <span>Apply &amp; Order →</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/60 p-8 shadow-xs">
            <PackageCheck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-300">No products found</h3>
            <p className="text-sm text-slate-500 mt-1">Try selecting another category or clear your search term.</p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-xl font-medium transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedProducts.map((product) => {
              const inCart = cart.find((item) => item._id === product._id);
              const isWishlisted = wishlist.some((item) => item._id === product._id);
              const hasDiscount = product.mrp > product.price;
              const discountPercent = hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
              const savingsAmount = hasDiscount ? Math.round(product.mrp - product.price) : 0;

              return (
                <div
                  key={product._id}
                  className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs"
                >
                  {/* Image & Floating Interactive Badges */}
                  <div className="relative aspect-square w-full bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900/70 dark:to-slate-950 overflow-hidden flex items-center justify-center p-3">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-108 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        {product.category === "dairy" && <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🥛</span>}
                        {product.category === "farming" && <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🌾</span>}
                        {product.category === "kirana" && <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🛒</span>}
                        <span className="text-[11px] font-semibold mt-2 text-slate-400">Pure Farm Quality</span>
                      </div>
                    )}

                    {/* Top Left: Discount & Savings Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      {hasDiscount && (
                        <div className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          <span>{discountPercent}% OFF</span>
                        </div>
                      )}
                      {hasDiscount && savingsAmount > 0 && (
                        <div className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                          Save ₹{savingsAmount}
                        </div>
                      )}
                    </div>

                    {/* Top Right: Wishlist Heart button */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition shadow-xs ${
                        isWishlisted
                          ? "bg-rose-500 text-white scale-105"
                          : "bg-white/85 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-rose-500 hover:scale-105"
                      }`}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {/* Bottom Left: Category & Quality Tag */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 capitalize flex items-center gap-1 shadow-xs">
                        {product.category === "dairy" && "🥛 Dairy"}
                        {product.category === "farming" && "🌾 Cattle Feed"}
                        {product.category === "kirana" && "🛒 Kirana"}
                        {product.category !== "dairy" && product.category !== "farming" && product.category !== "kirana" && product.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {product.brand && (
                        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2 mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {product.packageSize || `1 ${product.unit}`}
                        </span>
                        {product.rating > 0 ? (
                          <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {product.rating}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <Sparkles className="w-3 h-3" /> Fresh Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Action */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-slate-900 dark:text-white">₹{product.price}</span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">per {product.unit}</span>
                      </div>

                      {product.stockQuantity < 1 ? (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
                          Out of Stock
                        </span>
                      ) : inCart ? (
                        <div className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl overflow-hidden shadow-md shadow-emerald-600/20">
                          <button
                            onClick={() => updateQuantity(product._id, -1)}
                            className="p-2 hover:bg-emerald-700 text-white transition active:scale-95"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-black text-white">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(product._id, 1)}
                            className="p-2 hover:bg-emerald-700 text-white transition active:scale-95"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── SLIDE-OVER CART DRAWER ─── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Cart ({cart.length})</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Goal Bar */}
              {store?.freeDeliveryThreshold && (
                <div className="bg-slate-50 dark:bg-slate-950 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      {subtotal >= store.freeDeliveryThreshold
                        ? "🎉 Free Delivery Unlocked!"
                        : `Add ₹${store.freeDeliveryThreshold - subtotal} more for Free Delivery`}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{freeDeliveryProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${freeDeliveryProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Drawer Items & Checkout Form */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Your cart is empty</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-sm"
                    >
                      Browse Fresh Products
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Item list */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{item.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ₹{item.price} × {item.quantity} ={" "}
                              <strong className="text-slate-900 dark:text-white">₹{item.price * item.quantity}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item._id, -1)}
                                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id, 1)}
                                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fulfillment Type Toggle & Expected Delivery Time */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Fulfillment Option
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFulfillmentType("village_delivery")}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                            fulfillmentType === "village_delivery"
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-white"
                              : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold">Village Delivery</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            ₹{store?.deliveryFee || 20} fee (Free ₹{store?.freeDeliveryThreshold || 500}+)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFulfillmentType("counter_pickup")}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                            fulfillmentType === "counter_pickup"
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-white"
                              : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold">Counter Pickup</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Free instant pickup</span>
                        </button>
                      </div>

                      {/* Prominent Expected Delivery / Pickup Time Banner */}
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                        {fulfillmentType === "village_delivery" ? (
                          <>
                            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white block">
                                🛵 Estimated Delivery: Today in 45-60 mins
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Fresh dairy packed chilled &amp; delivered to your doorstep in {recipientVillage || "your village"}.
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white block">
                                🏪 Ready for Pickup in 15 mins
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Skip the line at {store?.storeName || "the dairy counter"}. Just show your order bill.
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Customer & Delivery Details Form */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Customer Details
                        </h4>
                        {!customerUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode("login");
                              setIsAuthModalOpen(true);
                            }}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            Have an account? Sign In
                          </button>
                        )}
                      </div>

                      {customerUser && (
                        <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Logged in as</span>
                            <p className="font-extrabold text-slate-900 dark:text-white">{customerUser.name} • {customerUser.mobile}</p>
                            <p className="text-[10px] text-slate-500">{customerUser.email || "No email stored"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(true);
                              fetchCustomerOrders();
                            }}
                            className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-xs"
                          >
                            My Orders
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Your Full Name *"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="tel"
                          placeholder="10-digit Mobile *"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Email Address * (For live tracking &amp; digital bill)
                        </label>
                        <input
                          type="email"
                          placeholder="your.email@gmail.com *"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {fulfillmentType === "village_delivery" && (
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] text-slate-600 dark:text-slate-400">Village / Town *</label>
                              <button
                                type="button"
                                onClick={handleDetectLocation}
                                disabled={locatingUser}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold hover:underline"
                              >
                                <LocateFixed className="w-3 h-3" />
                                {locatingUser ? "Locating..." : "Use GPS"}
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Rampur, Shivnagar"
                              value={recipientVillage}
                              onChange={(e) => setRecipientVillage(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Geofence Eligibility Message */}
                          {checkingEligibility && (
                            <p className="text-[11px] text-slate-500 italic">Checking village delivery radius...</p>
                          )}
                          {deliveryEligibility && (
                            <div
                              className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
                                deliveryEligibility.eligible
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {deliveryEligibility.eligible ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <span>{deliveryEligibility.message}</span>
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="Full Street Address / House / Farm location *"
                            value={fullAddress}
                            onChange={(e) => setFullAddress(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Landmark (e.g. Near Primary School / Mandir)"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </>
                      )}

                      {/* Guest Quick Account Creation */}
                      {!customerUser && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={guestCreateAccount}
                              onChange={(e) => setGuestCreateAccount(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span>Save details &amp; create account for 1-click checkout next time</span>
                          </label>
                          {guestCreateAccount && (
                            <input
                              type="password"
                              placeholder="Create account password (min 4 chars) *"
                              value={guestPassword}
                              onChange={(e) => setGuestPassword(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Available Offers & Coupons (Directly at Payment Time) */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Apply Offers &amp; Coupons
                        </label>
                        {appliedVoucher ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Coupon Applied
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold">{outletCoupons.length} Available</span>
                        )}
                      </div>

                      {/* Applied Voucher Active Banner */}
                      {appliedVoucher && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                              {appliedVoucher.code}
                            </span>
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 ml-2">
                              ₹{appliedVoucher.discount} Discount Applied!
                            </span>
                            {appliedVoucher.description && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {appliedVoucher.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {/* 1-Click Available Offers List */}
                      {outletCoupons.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {outletCoupons.map((c) => {
                            const isApplied = appliedVoucher?.code === c.code;
                            const isEligible = !c.minOrderValue || subtotal >= c.minOrderValue;
                            return (
                              <div
                                key={c._id || c.code}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                  isApplied
                                    ? "bg-emerald-500/10 border-emerald-500 dark:bg-emerald-950/40"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700">
                                      {c.code}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {c.title || (c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {c.minOrderValue > 0 ? `Min cart: ₹${c.minOrderValue}` : "No minimum order"} •{" "}
                                    {c.discountType === "percentage" ? `Get ${c.discountValue}% discount` : `Save flat ₹${c.discountValue}`}
                                    {!isEligible && (
                                      <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
                                        (Add ₹{c.minOrderValue - subtotal} more)
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {isApplied ? (
                                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2.5 py-1 bg-emerald-100/70 dark:bg-emerald-900/40 rounded-lg shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyVoucher(c.code)}
                                    disabled={!isEligible}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0"
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Manual Promo Code Input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Have another promo code?"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 flex-1 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyVoucher()}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Payment Choice */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Select Payment Option
                        </label>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Safe &amp; Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Cash on Delivery Option */}
                        {store?.isCodEnabled !== false && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cod")}
                            className={`p-3 rounded-2xl border text-left transition ${
                              paymentMethod === "cod"
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-white font-bold ring-2 ring-emerald-500/30"
                                : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-black block text-slate-900 dark:text-white">💵 Cash on Delivery</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Pay cash on delivery or pickup</span>
                          </button>
                        )}

                        {/* Online Razorpay / UPI Option */}
                        {store?.isOnlinePaymentEnabled !== false && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("online")}
                            className={`p-3 rounded-2xl border text-left transition ${
                              paymentMethod === "online"
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-white font-bold ring-2 ring-emerald-500/30"
                                : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-black block text-emerald-600 dark:text-emerald-400">⚡ Online Payment</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Razorpay • UPI / Cards / NetBanking</span>
                          </button>
                        )}

                        {/* Dairy Farmer Milk Settlement Balance Option */}
                        {customerUser?.farmerCredit?.isFarmer && store?.isFarmerCreditEnabled !== false && (
                          <button
                            type="button"
                            disabled={customerUser.farmerCredit.creditBalance < grandTotal}
                            onClick={() => setPaymentMethod("farmer_milk_bill")}
                            className={`p-3 rounded-2xl border text-left transition col-span-1 sm:col-span-2 ${
                              customerUser.farmerCredit.creditBalance < grandTotal
                                ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                : paymentMethod === "farmer_milk_bill"
                                ? "bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200 font-bold ring-2 ring-amber-500/30"
                                : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-slate-700 dark:text-slate-300 hover:border-amber-400"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                                <span>🥛 Pay with Dairy Cash (Milk Credit)</span>
                                <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold uppercase">
                                  Dairy Cash
                                </span>
                              </span>
                              <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-400">
                                ₹{customerUser.farmerCredit.creditBalance} available
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                              {customerUser.farmerCredit.creditBalance < grandTotal
                                ? `Insufficient credit balance (₹${customerUser.farmerCredit.creditBalance} avail, ₹${grandTotal} needed). Choose Online or COD.`
                                : `Instant deduction of ₹${grandTotal} from your unsettled dairy milk settlement balance.`}
                            </span>
                          </button>
                        )}
                      </div>

                      {paymentMethod === "online" && (
                        <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <CreditCard className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>Supports <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm UPI</strong>, Cards &amp; NetBanking via Razorpay secure gateway.</span>
                        </div>
                      )}

                      {paymentMethod === "farmer_milk_bill" && (
                        <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Farmer Member <strong>{customerUser?.farmerCredit?.memberId}</strong>: ₹{grandTotal} will be automatically adjusted in your upcoming milk bill slip.</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer with Price Summary and Checkout Button */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal}</span>
                    </div>
                    {fulfillmentType === "village_delivery" && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Village Delivery Fee</span>
                        <span>{deliveryFee === 0 ? <strong className="text-emerald-600 dark:text-emerald-400">FREE</strong> : `₹${deliveryFee}`}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Discount</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Total Amount</span>
                      <span className="text-emerald-600 dark:text-emerald-400">₹{grandTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={submittingOrder}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {submittingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {paymentMethod === "online"
                            ? "Proceed to Online Pay"
                            : paymentMethod === "farmer_milk_bill"
                            ? `Pay via Dairy Cash (₹${customerUser?.farmerCredit?.creditBalance || 0} Avail)`
                            : "Place Order (COD)"} • ₹{grandTotal}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER WISHLIST DRAWER ─── */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsWishlistOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Wishlist ({wishlist.length})</h2>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {wishlist.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No saved items</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap the heart on any product to save it for later.</p>
                  </div>
                ) : (
                  wishlist.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{item.name}</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            addToCart(item);
                            toggleWishlist(item);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                        >
                          Move to Cart
                        </button>
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition"
                >
                  Close Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SWIGGY & ZOMATO STYLE ONLINE PAYMENT MODAL WITH 10-MIN COUNTDOWN ─── */}
      {isOnlinePayModalOpen && activePayOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Header: Brand & Close */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    Milkify Secure Checkout
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Order #{activePayOrder.order?.orderNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOnlinePayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
                title="Minimize payment window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Swiggy / Zomato Style Countdown Timer Pill */}
            <div className={`p-3.5 rounded-2xl border text-center transition-all ${
              paymentExpired
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300"
                : paymentCountdown <= 120
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${paymentExpired ? "text-rose-600 animate-bounce" : "text-emerald-600 animate-spin"}`} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {paymentExpired ? "Payment Session Expired" : "Complete Payment Before Session Expires"}
                </span>
              </div>
              <div className="text-3xl font-black font-mono tracking-wider">
                {String(Math.floor(paymentCountdown / 60)).padStart(2, "0")}:{String(paymentCountdown % 60).padStart(2, "0")}
              </div>
              <p className="text-[10px] opacity-80 mt-1">
                {paymentExpired
                  ? "Your reservation time has elapsed. Please retry or switch to Cash on Delivery."
                  : "Approve the payment request in your UPI App or via Razorpay Gateway"}
              </p>
            </div>

            {/* Amount Banner */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Amount to Pay</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ₹{activePayOrder.order?.grandTotal}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                100% Secure Gateway
              </span>
            </div>

            {/* If Payment Not Expired: Display Razorpay Gateway & UPI Options */}
            {!paymentExpired ? (
              <div className="space-y-3">
                {/* 1. Official Razorpay Gateway Popup Trigger */}
                <button
                  type="button"
                  onClick={handleLaunchRazorpayCheckout}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Open Razorpay Gateway (Cards / NetBanking / UPI)</span>
                </button>

                {/* 2. Direct UPI Apps Quick Tap */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block text-center">
                    Or Tap to Pay Directly in UPI App:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={activePayOrder.upiDetails?.gpayUrl || "#"}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      <span>Google Pay</span>
                    </a>
                    <a
                      href={activePayOrder.upiDetails?.phonepeUrl || "#"}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <span>PhonePe</span>
                    </a>
                    <a
                      href={activePayOrder.upiDetails?.paytmUrl || "#"}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 text-sky-500" />
                      <span>Paytm / UPI</span>
                    </a>
                  </div>
                </div>

                {/* 3. QR Code Dropdown / Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center space-y-2">
                  <div className="w-40 h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white p-2">
                    {activePayOrder.upiDetails?.upiQrUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={activePayOrder.upiDetails.upiQrUrl}
                        alt="UPI QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-20 h-20 text-slate-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full max-w-xs px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate">
                      {activePayOrder.upiDetails?.upiId || "milkifydemo@upi"}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activePayOrder.upiDetails?.upiId || "milkifydemo@upi");
                        toast.success("UPI ID copied!");
                      }}
                      className="text-emerald-600 font-bold ml-2 hover:underline shrink-0 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>

                {/* 4. Live Automatic Polling Status Banner */}
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Awaiting confirmation from bank / UPI app (auto-syncing)...</span>
                </div>

                {/* 5. Manual Verification Button */}
                <button
                  type="button"
                  onClick={handleConfirmOnlinePayment}
                  disabled={confirmingOnlinePayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {confirmingOnlinePayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Verifying with Bank...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Completed Payment • Confirm Order</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Session Expired State */
              <div className="space-y-3 py-2 text-center">
                <p className="text-xs text-slate-500">
                  The payment window of 10 minutes has ended. You can restart the timer or switch to Cash on Delivery.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCountdown(600);
                    setPaymentExpired(false);
                    handleLaunchRazorpayCheckout();
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                >
                  🔄 Restart Payment Session (10 mins)
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToCod}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition"
                >
                  💵 Switch to Cash on Delivery (COD)
                </button>
              </div>
            )}

            {/* Footer Alternatives */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={handleSwitchToCod}
                className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold underline"
              >
                Switch to Cash on Delivery
              </button>
              <button
                type="button"
                onClick={() => setIsOnlinePayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Dismiss Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER SIGN IN & REGISTRATION MODAL ─── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {authMode === "login" ? "Customer Sign In" : "Create Customer Account"}
              </h3>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-1.5 font-bold rounded-lg transition ${
                  authMode === "login"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`py-1.5 font-bold rounded-lg transition ${
                  authMode === "register"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("reset")}
                className={`py-1.5 font-bold rounded-lg transition ${
                  authMode === "reset"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Set Password
              </button>
            </div>

            {authMode === "reset" ? (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Dairy Farmer &amp; Customer Password Reset
                  </p>
                  <p className="text-[10px] mt-0.5 text-slate-600 dark:text-slate-400">
                    Enter your registered 10-digit mobile number to set a new password. You will be logged in immediately.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    10-digit Registered Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={resetForm.mobile}
                    onChange={(e) => setResetForm({ ...resetForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Password (min 4 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create new password"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {resetSubmitting ? "Setting Password..." : "Update Password & Log In"}
                </button>
              </form>
            ) : (
              <form onSubmit={authMode === "login" ? handleCustomerLogin : handleCustomerRegister} className="space-y-3">
                {authMode === "register" && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {authMode === "login" ? "Mobile Number or Email *" : "10-digit Mobile Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={authMode === "login" ? "9876543210 or email" : "9876543210"}
                    value={authForm.mobile}
                    onChange={(e) => setAuthForm({ ...authForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {authMode === "register" && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="ramesh@gmail.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password {authMode === "login" ? "*" : "(min 4 chars) *"}
                    </label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetForm({ mobile: authForm.mobile || "", newPassword: "", confirmPassword: "" });
                          setAuthMode("reset");
                        }}
                        className="text-[10px] text-emerald-600 hover:underline font-bold"
                      >
                        Forgot / Set Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {authMode === "register" && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Village / Town</label>
                    <input
                      type="text"
                      placeholder="e.g. Bhandari"
                      value={authForm.village}
                      onChange={(e) => setAuthForm({ ...authForm, village: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {authSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <span>{authMode === "login" ? "Sign In to Account" : "Register & Continue"}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── TRACK ORDER & ORDER HISTORY MODAL ─── */}
      {isOrderHistoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOrderHistoryModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Track &amp; Order History
                    </h2>
                    <p className="text-xs text-slate-500">
                      {customerUser ? `${customerUser.name} (${customerUser.mobile})` : "Guest Shopper Tracking"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrderHistoryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* 1. Quick Order Number Search */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    🔍 Track Any Order by Order ID
                  </span>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!trackOrderInput.trim()) return toast.warning("Please enter an Order ID");
                      setIsOrderHistoryModalOpen(false);
                      router.push(`/store/track/${trackOrderInput.trim()}`);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="e.g. ORD-20261124-ABC12"
                      value={trackOrderInput}
                      onChange={(e) => setTrackOrderInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
                    >
                      Track
                    </button>
                  </form>
                </div>

                {/* 2. Current Order Snapshot (if available) */}
                {isOngoingOrder && (
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Current Active Order
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        #{currentOrder.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                        <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          {currentOrder.orderStatus?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Total Paid</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{currentOrder.grandTotal}</span>
                      </div>
                      <Link
                        href={`/store/track/${currentOrder.orderNumber}`}
                        onClick={() => setIsOrderHistoryModalOpen(false)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs"
                      >
                        <span>Live View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* 3. Orders History List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {customerUser ? `Past Orders (${customerOrders.length})` : `Recent Orders (${guestOrderHistory.length})`}
                    </h4>
                    {customerUser ? (
                      <button
                        onClick={fetchCustomerOrders}
                        className="text-[11px] text-emerald-600 hover:underline font-semibold"
                      >
                        Refresh
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsOrderHistoryModalOpen(false);
                          setAuthMode("login");
                          setIsAuthModalOpen(true);
                        }}
                        className="text-[11px] text-emerald-600 hover:underline font-semibold"
                      >
                        Sign in to sync
                      </button>
                    )}
                  </div>

                  {customerUser ? (
                    loadingOrders ? (
                      <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-2" />
                        <span className="text-xs">Loading orders...</span>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                        <PackageCheck className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-slate-800 dark:text-white">No orders placed yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {customerOrders.map((ord) => (
                          <div
                            key={ord._id || ord.orderNumber}
                            className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                #{ord.orderNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  ord.orderStatus === "delivered"
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                                    : ord.orderStatus === "cancelled"
                                    ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                                }`}
                              >
                                {ord.orderStatus?.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>{new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              <span className="font-bold text-slate-900 dark:text-white">₹{ord.grandTotal}</span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                              <Link
                                href={`/store/track/${ord.orderNumber}`}
                                onClick={() => setIsOrderHistoryModalOpen(false)}
                                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                              >
                                Track Order <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Sign In to View Past Orders</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                          For security and privacy, full order history is isolated to your logged-in account. You can also enter an Order ID in the search bar above to track any specific order.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOrderHistoryModalOpen(false);
                          setAuthMode("login");
                          setIsAuthModalOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        Sign In with Mobile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                {!customerUser && (
                  <button
                    onClick={() => {
                      setIsOrderHistoryModalOpen(false);
                      setAuthMode("register");
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    + Create Free Account
                  </button>
                )}
                <button
                  onClick={() => setIsOrderHistoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER PROFILE & ORDER HISTORY DRAWER ─── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsProfileOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold overflow-hidden border border-emerald-500/20 shrink-0">
                    {customerUser?.profilePhoto ? (
                      <img
                        src={customerUser.profilePhoto}
                        alt={customerUser.name || "Customer"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {customerUser?.name || "Customer Account"}
                    </h2>
                    <p className="text-xs text-slate-500">{customerUser?.mobile || recipientPhone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs: Details vs Orders vs Security */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1">
                <button
                  type="button"
                  onClick={() => setProfileTab("details")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    profileTab === "details"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Profile Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab("orders");
                    fetchCustomerOrders();
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    profileTab === "orders"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  My Orders ({customerOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab("password")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    profileTab === "password"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Security
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {profileTab === "details" ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Customer Profile Photo Upload & Sync Section */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3.5">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                        {customerUser?.profilePhoto || profileForm.profilePhoto ? (
                          <img
                            src={customerUser?.profilePhoto || profileForm.profilePhoto}
                            alt={customerUser?.name || "Customer"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {photoUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Synced with your Dairy Admin / Outlet account
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition shadow-xs">
                            <Camera className="w-3.5 h-3.5" />
                            {customerUser?.profilePhoto || profileForm.profilePhoto ? "Change Photo" : "Upload Photo"}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={photoUploading}
                              onChange={handleCustomerPhotoUpload}
                              className="hidden"
                            />
                          </label>
                          {(customerUser?.profilePhoto || profileForm.profilePhoto) && (
                            <button
                              type="button"
                              disabled={photoUploading}
                              onClick={handleCustomerPhotoDelete}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-bold rounded-lg transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dairy Farmer Settlement Credit Card */}
                    {customerUser?.farmerCredit?.isFarmer && (
                      <div className="p-3.5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            Verified Dairy Farmer
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                            Member: {customerUser.farmerCredit.memberId}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                              Unsettled Milk Credit Balance
                            </span>
                            <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                              ₹{customerUser.farmerCredit.creditBalance}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {customerUser.farmerCredit.totalLiters} L Supplied
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800 dark:text-amber-300">
                          ✨ You can pay directly from this milk balance during store checkout without cash or card.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={profileForm.mobile}
                            onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Village / Town
                          </label>
                          <input
                            type="text"
                            value={profileForm.village}
                            onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="your.email@example.com"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Default Delivery Address
                        </label>
                        <textarea
                          rows={2}
                          value={profileForm.fullAddress}
                          onChange={(e) => setProfileForm({ ...profileForm, fullAddress: e.target.value })}
                          placeholder="House/Farm number, road, area"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Nearby Landmark
                        </label>
                        <input
                          type="text"
                          value={profileForm.landmark}
                          onChange={(e) => setProfileForm({ ...profileForm, landmark: e.target.value })}
                          placeholder="e.g. Near Milk Collection Center"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      {profileSaving ? "Saving changes..." : "Save Profile Details"}
                    </button>
                  </form>
                ) : profileTab === "password" ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                      <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Account &amp; Dairy Farmer Password
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Updating your password here will synchronize your credentials for both the Milkify Store and your Dairy Farmer portal account.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Current Password (Optional if first time)
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          New Password (min 4 characters) *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Enter new secure password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Confirm New Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Re-enter new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      {passwordSaving ? "Updating password..." : "Update Password"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        My Purchase History ({customerOrders.length})
                      </h4>
                      <button
                        onClick={fetchCustomerOrders}
                        className="text-[11px] text-emerald-600 hover:underline font-semibold"
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingOrders ? (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-2" />
                        <span className="text-xs">Fetching past bills...</span>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="text-center py-16 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <PackageCheck className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold text-slate-800 dark:text-white">No past orders yet</p>
                        <p className="text-xs text-slate-500 mt-1">Orders you place with this account will appear here with live tracking.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerOrders.map((ord) => (
                          <Link
                            key={ord._id}
                            href={`/store/track/${ord.orderNumber}`}
                            onClick={() => setIsProfileOpen(false)}
                            className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs block hover:border-emerald-500/50 hover:shadow-xs transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                #{ord.orderNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  ord.orderStatus === "delivered"
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                                    : ord.orderStatus === "cancelled"
                                    ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                                }`}
                              >
                                {ord.orderStatus.replace(/_/g, " ")}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500">
                              Placed on {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>

                            {ord.orderStatus === "cancelled" && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-200 dark:border-rose-900/40">
                                ✕ {ord.cancellationReason || "Cancelled"}
                              </p>
                            )}

                            {ord.customerNotes && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-950/20 p-2 rounded-xl">
                                📝 &ldquo;{ord.customerNotes}&rdquo;
                              </p>
                            )}

                            <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                              {(ord.items || []).map((i) => `${i.name} x${i.quantity}`).join(", ")}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase">
                                  {ord.paymentMethod === "farmer_milk_bill"
                                    ? "🥛 Dairy Cash"
                                    : ord.paymentMethod === "online"
                                    ? "⚡ Online (Paid)"
                                    : "💵 Cash on Delivery"}
                                </span>
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">₹{ord.grandTotal}</span>
                              </div>
                              <span className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs">
                                <span>Track Order</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer with Logout */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={handleCustomerLogout}
                  className="px-3 py-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL ORDER CONFIRMATION MODAL ─── */}
      {isCancelModalOpen && isOngoingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Cancel Order #{currentOrder.orderNumber}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to cancel this order? Reserved stock items will be restored.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Changed mind / Ordered by mistake">Changed mind / Ordered by mistake</option>
                <option value="Need to change delivery location">Need to change delivery location</option>
                <option value="Want to change items in order">Want to change items in order</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelOrderLoading}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleCancelActiveOrder(currentOrder.orderNumber)}
                disabled={cancelOrderLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {cancelOrderLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
