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
} from "lucide-react";
import { toast } from "@/lib/toast";
import axios from "axios";
import ThemeToggle from "@/components/ui/ThemeToggle";

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
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Voucher
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Payment method ("cod" | "online")
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [isOnlinePayModalOpen, setIsOnlinePayModalOpen] = useState(false);
  const [activePayOrder, setActivePayOrder] = useState(null);
  const [confirmingOnlinePayment, setConfirmingOnlinePayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
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
        if (savedCurrent) setCurrentOrder(JSON.parse(savedCurrent));

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
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dairy outlet details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchStoreData();
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

  // Voucher operations
  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    if (code === "WELCOME50") {
      setAppliedVoucher({
        code: "WELCOME50",
        discount: 50,
        description: "Flat ₹50 OFF for village community members!",
      });
      toast.success("Promo code 'WELCOME50' applied!");
    } else {
      toast.error("Invalid promo code. Try WELCOME50");
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    toast.info("Voucher removed");
  };

  // Price calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (fulfillmentType === "counter_pickup") return 0;
    if (!store) return 20;
    if (subtotal >= (store.freeDeliveryThreshold || 500)) return 0;
    return store.deliveryFee || 20;
  }, [fulfillmentType, subtotal, store]);

  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    return Math.min(appliedVoucher.discount, subtotal);
  }, [appliedVoucher, subtotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee - discountAmount);
  }, [subtotal, deliveryFee, discountAmount]);

  const freeDeliveryProgress = useMemo(() => {
    if (!store?.freeDeliveryThreshold) return 100;
    const pct = (subtotal / store.freeDeliveryThreshold) * 100;
    return Math.min(100, Math.round(pct));
  }, [subtotal, store]);

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

  const handleCustomerLogout = () => {
    localStorage.removeItem("milkify_customer_token");
    localStorage.removeItem("milkify_customer_user");
    setCustomerToken(null);
    setCustomerUser(null);
    setIsProfileOpen(false);
    toast.info("Logged out from customer account");
  };

  const fetchCustomerOrders = async () => {
    try {
      setLoadingOrders(true);
      const phoneParam = recipientPhone ? `?mobile=${recipientPhone.replace(/\D/g, "").slice(-10)}` : "";
      const res = await axios.get(`${API_BASE}/store/public/customer/orders${phoneParam}`, {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      });
      if (res.data?.success) {
        setCustomerOrders(res.data.orders || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingOrders(false);
    }
  };

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
        } catch (e) {
          console.error("Local storage error:", e);
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
        paymentMethod: paymentMethod === "online" ? "online" : "cod",
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
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{customerUser.name?.split(" ")[0] || "Account"}</span>
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
              {currentOrder && (
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
      {currentOrder && (
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
                  Total: <strong className="text-white">₹{currentOrder.grandTotal}</strong> • {currentOrder.paymentMethod === "online" ? "⚡ Online (Paid)" : "💵 Cash on Delivery"} • {currentOrder.items?.length || 1} items
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

      {/* ─── PRODUCT GRID SECTION ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 p-8 shadow-sm">
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

              return (
                <div
                  key={product._id}
                  className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800/40 overflow-hidden flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        {product.category === "dairy" && <span className="text-4xl">🥛</span>}
                        {product.category === "farming" && <span className="text-4xl">🌾</span>}
                        {product.category === "kirana" && <span className="text-4xl">🛒</span>}
                        <span className="text-xs mt-2 text-slate-500">Pure Quality</span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-md">
                        {discountPercent}% OFF
                      </div>
                    )}

                    {/* Wishlist Heart button */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition ${
                        isWishlisted
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-rose-500"
                      }`}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {/* Category Pill */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 capitalize">
                        {product.category === "farming" ? "Cattle Feed" : product.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      {product.brand && (
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2 mt-0.5">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{product.packageSize || `1 ${product.unit}`}</span>
                        {product.rating > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-current" />
                              {product.rating}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-900 dark:text-white">₹{product.price}</span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">per {product.unit}</span>
                      </div>

                      {product.stockQuantity < 1 ? (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          Out of Stock
                        </span>
                      ) : inCart ? (
                        <div className="flex items-center bg-emerald-600 rounded-xl overflow-hidden shadow-sm">
                          <button
                            onClick={() => updateQuantity(product._id, -1)}
                            className="p-1.5 hover:bg-emerald-700 text-white transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold text-white">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(product._id, 1)}
                            className="p-1.5 hover:bg-emerald-700 text-white transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
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

                    {/* Voucher Input */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Promo code (e.g. WELCOME50)"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                          className="bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 flex-1 focus:outline-none uppercase"
                        />
                        {appliedVoucher ? (
                          <button
                            onClick={handleRemoveVoucher}
                            className="text-xs text-rose-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={handleApplyVoucher}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {appliedVoucher && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> {appliedVoucher.description}
                        </p>
                      )}
                    </div>

                    {/* Fulfillment Type Toggle */}
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
                      <div className="grid grid-cols-2 gap-2.5">
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
                      </div>

                      {paymentMethod === "online" && (
                        <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <CreditCard className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>Supports <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm UPI</strong>, Cards &amp; NetBanking via Razorpay secure gateway.</span>
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
                        <span>{paymentMethod === "online" ? "Proceed to Online Pay" : "Place Order (COD)"} • ₹{grandTotal}</span>
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

      {/* ─── INTERACTIVE ONLINE UPI & APP PAYMENT MODAL ─── */}
      {isOnlinePayModalOpen && activePayOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Online UPI Payment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Order #{activePayOrder.order?.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setIsOnlinePayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Banner */}
            <div className="text-center py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Payable Amount
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{activePayOrder.order?.grandTotal}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Pay to: <strong>{store?.storeName}</strong></p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white p-2">
                {activePayOrder.upiDetails?.upiQrUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activePayOrder.upiDetails.upiQrUrl}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-24 h-24 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Scan with any UPI App: <strong>Google Pay, PhonePe, Paytm, BHIM</strong>
              </p>
            </div>

            {/* Direct App Pay Buttons for Mobile */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block text-center">
                Or Tap to Pay Directly in UPI App:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={activePayOrder.upiDetails?.gpayUrl || "#"}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1"
                >
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Google Pay</span>
                </a>
                <a
                  href={activePayOrder.upiDetails?.phonepeUrl || "#"}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1"
                >
                  <Smartphone className="w-4 h-4 text-purple-500" />
                  <span>PhonePe</span>
                </a>
                <a
                  href={activePayOrder.upiDetails?.paytmUrl || "#"}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-center text-xs font-bold transition flex flex-col items-center justify-center gap-1"
                >
                  <Smartphone className="w-4 h-4 text-sky-500" />
                  <span>Paytm / UPI</span>
                </a>
              </div>
            </div>

            {/* UPI ID Copy bar */}
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 font-mono truncate mr-2">
                UPI ID: <strong>{activePayOrder.upiDetails?.upiId || "milkifydemo@upi"}</strong>
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activePayOrder.upiDetails?.upiId || "milkifydemo@upi");
                  toast.success("UPI ID copied to clipboard!");
                }}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-600 font-bold text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>

            {/* Confirm Payment Action */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={handleConfirmOnlinePayment}
                disabled={confirmingOnlinePayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {confirmingOnlinePayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verifying Online Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Paid • Complete Order</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsOnlinePayModalOpen(false)}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel / Pay later
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
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
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
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  authMode === "register"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password {authMode === "login" ? "*" : "(min 4 chars) *"}
                </label>
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
                {currentOrder && (
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
                  ) : guestOrderHistory.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                      <PackageCheck className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-slate-800 dark:text-white">No orders on this device</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use the search input above with your Order ID to track an existing order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {guestOrderHistory.map((ord) => (
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
                            <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recent"}</span>
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
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

              {/* Drawer Body with Past Orders */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                      <div
                        key={ord._id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
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
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {(ord.items || []).map((i) => `${i.name} x${i.quantity}`).join(", ")}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Paid / Amount</span>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">₹{ord.grandTotal}</span>
                          </div>
                          <Link
                            href={`/store/track/${ord.orderNumber}`}
                            onClick={() => setIsProfileOpen(false)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                          >
                            <span>Track Order</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
}
