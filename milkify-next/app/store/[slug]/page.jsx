"use client";

import React, { useState, useEffect, useMemo, use } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
  // In Next.js 15+ params is a Promise
  const resolvedParams = typeof params?.then === "function" ? use(params) : params;
  const slug = resolvedParams?.slug;
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
  const [recipientVillage, setRecipientVillage] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [deliveryEligibility, setDeliveryEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Voucher
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submittingOrder, setSubmittingOrder] = useState(false);

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
        toast.success(`Added ${product.name} to wishlist`);
        return [...prev, product];
      }
    });
  };

  // Voucher apply
  const handleApplyVoucher = () => {
    if (!voucherInput.trim()) return;
    if (voucherInput.trim().toUpperCase() === "WELCOME50") {
      setAppliedVoucher({
        code: "WELCOME50",
        discount: 50,
        description: "₹50 Instant Welcome Discount",
      });
      toast.success("Voucher WELCOME50 applied! ₹50 off.");
    } else {
      toast.error("Invalid voucher code. Try WELCOME50.");
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    toast.info("Voucher removed");
  };

  // Cart financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (fulfillmentType === "counter_pickup") return 0;
    if (!store) return 0;
    if (subtotal >= (store.freeDeliveryThreshold || 500)) return 0;
    return store.deliveryFee || 20;
  }, [fulfillmentType, store, subtotal]);

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
      const payload = {
        customerDetails: {
          name: recipientName.trim(),
          mobile: cleanPhone,
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
        paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : "",
      };

      const orderRes = await axios.post(`${API_BASE}/store/public/outlet/${slug}/order`, payload);

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || "Failed to create order");
      }

      const { order, razorpay } = orderRes.data;

      // Razorpay Online Flow
      if (paymentMethod === "razorpay" && razorpay) {
        const rzpLoaded = await loadRazorpay();
        if (!rzpLoaded) {
          toast.error("Razorpay SDK failed to load. Please try COD or try again.");
          setSubmittingOrder(false);
          return;
        }

        const options = {
          key: razorpay.keyId,
          amount: razorpay.amount,
          currency: razorpay.currency,
          name: store?.storeName || "Milkify Dairy Store",
          description: `Order #${order.orderNumber}`,
          order_id: razorpay.orderId,
          prefill: {
            name: recipientName.trim(),
            contact: cleanPhone, // Strictly 10 digits without +91 so Razorpay will not show contact modal
          },
          readonly: {
            contact: true,
            name: true,
          },
          theme: {
            color: "#16a34a",
          },
          handler: async function (response) {
            try {
              const verifyRes = await axios.post(`${API_BASE}/store/public/order/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber: order.orderNumber,
              });

              if (verifyRes.data?.success) {
                toast.success("Payment verified! Order placed successfully.");
                setCart([]);
                setIsCartOpen(false);
                router.push(`/store/track/${order.orderNumber}`);
              }
            } catch (err) {
              toast.error(err.response?.data?.message || "Payment verification failed.");
            }
          },
          modal: {
            ondismiss: function () {
              setSubmittingOrder(false);
              toast.info("Payment cancelled. You can retry anytime.");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setSubmittingOrder(false);
        return;
      }

      // COD Flow
      toast.success("Order placed successfully!");
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connecting to Dairy Outlet...</h2>
        <p className="text-sm text-slate-400 mt-1">Fetching fresh inventory and cattle feed availability</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 text-center">
        <Store className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">Dairy Outlet Not Found</h1>
        <p className="text-slate-400 max-w-md mt-2">
          The requested store link does not exist or has been disabled. Please contact the dairy admin.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition"
        >
          Return to Milkify Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* ─── TOP NOTIFICATION / GEOFENCE BANNER ─── */}
      <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-emerald-950 border-b border-emerald-800/30 px-4 py-2 text-xs md:text-sm text-emerald-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Hyper-Local Village Delivery active in <strong>{store.village}</strong> &amp; neighbouring clusters within{" "}
            <strong>{store.deliveryRadiusKm || 8} km</strong>.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            {store.operatingHours?.openTime || "06:00 AM"} - {store.operatingHours?.closeTime || "09:00 PM"}
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            Counter Pickup: {store.allowSelfPickup ? "Available" : "Closed"}
          </span>
        </div>
      </div>

      {/* ─── OUTLET HERO HEADER ─── */}
      <header className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-xl shadow-emerald-500/10 flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {store.logoImage ? (
                  <Image src={store.logoImage} alt={store.storeName} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-emerald-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{store.storeName}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    store.isOpen
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                  {store.isOpen ? "Open Now" : "Closed"}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">{store.tagline}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {store.village} Outlet
                </span>
                {store.phone && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {store.phone}
                  </span>
                )}
                <span className="text-slate-500">Free delivery on orders ₹{store.freeDeliveryThreshold || 500}+</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Wishlist & Cart) */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-rose-400 transition"
              title="View Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-bold">₹{grandTotal}</span>
              {cart.length > 0 && (
                <span className="bg-emerald-800 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── STICKY SEARCH & CATEGORY FILTER ─── */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
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
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === tab.id ? "bg-emerald-800 text-emerald-200" : "bg-slate-800 text-slate-400"
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
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
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
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-8">
            <PackageCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No products found</h3>
            <p className="text-sm text-slate-500 mt-1">Try selecting another category or clear your search term.</p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm rounded-xl font-medium"
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
                  className="group relative bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg shadow-black/20"
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-square w-full bg-slate-800/40 overflow-hidden flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
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
                          ? "bg-rose-500/90 text-white"
                          : "bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-rose-400"
                      }`}
                      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {/* Category Pill */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/70 backdrop-blur-md border border-slate-700/50 text-slate-300 capitalize">
                        {product.category === "farming" ? "Cattle Feed" : product.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      {product.brand && (
                        <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="font-bold text-slate-100 text-base leading-snug line-clamp-2 mt-0.5">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{product.packageSize || `1 ${product.unit}`}</span>
                        {product.rating > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-current" />
                              {product.rating}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Action */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-white">₹{product.price}</span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-500 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">per {product.unit}</span>
                      </div>

                      {product.stockQuantity < 1 ? (
                        <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          Out of Stock
                        </span>
                      ) : inCart ? (
                        <div className="flex items-center bg-emerald-600 rounded-xl overflow-hidden shadow-md">
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
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-emerald-600/10"
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
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 flex flex-col justify-between shadow-2xl">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Your Cart ({cart.length})</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Goal Bar */}
              {store?.freeDeliveryThreshold && (
                <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-800 text-xs">
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-400">
                      {subtotal >= store.freeDeliveryThreshold
                        ? "🎉 Free Delivery Unlocked!"
                        : `Add ₹${store.freeDeliveryThreshold - subtotal} more for Free Delivery`}
                    </span>
                    <span className="text-emerald-400 font-bold">{freeDeliveryProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
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
                    <ShoppingCart className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">Your cart is empty</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
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
                          className="flex items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-200 truncate">{item.name}</h4>
                            <p className="text-xs text-slate-400">
                              ₹{item.price} × {item.quantity} ={" "}
                              <strong className="text-white">₹{item.price * item.quantity}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-800 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item._id, -1)}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id, 1)}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Voucher Input */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Promo code (e.g. WELCOME50)"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                          className="bg-transparent text-xs text-white placeholder-slate-500 flex-1 focus:outline-none uppercase"
                        />
                        {appliedVoucher ? (
                          <button
                            onClick={handleRemoveVoucher}
                            className="text-xs text-rose-400 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={handleApplyVoucher}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {appliedVoucher && (
                        <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {appliedVoucher.description}
                        </p>
                      )}
                    </div>

                    {/* Fulfillment Type Toggle */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Fulfillment Option
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFulfillmentType("village_delivery")}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                            fulfillmentType === "village_delivery"
                              ? "bg-emerald-500/10 border-emerald-500 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold">Village Delivery</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">
                            ₹{store?.deliveryFee || 20} fee (Free ₹{store?.freeDeliveryThreshold || 500}+)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFulfillmentType("counter_pickup")}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                            fulfillmentType === "counter_pickup"
                              ? "bg-emerald-500/10 border-emerald-500 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold">Counter Pickup</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 mt-1">Free instant pickup</span>
                        </button>
                      </div>
                    </div>

                    {/* Delivery & Customer Details Form */}
                    <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Customer Details</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Your Name *"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="tel"
                          placeholder="10-digit Mobile *"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {fulfillmentType === "village_delivery" && (
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] text-slate-400">Village / Town *</label>
                              <button
                                type="button"
                                onClick={handleDetectLocation}
                                disabled={locatingUser}
                                className="text-[10px] text-emerald-400 flex items-center gap-1 hover:underline"
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
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Geofence Eligibility Message */}
                          {checkingEligibility && (
                            <p className="text-[11px] text-slate-400 italic">Checking village delivery radius...</p>
                          )}
                          {deliveryEligibility && (
                            <div
                              className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
                                deliveryEligibility.eligible
                                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {deliveryEligibility.eligible ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <span>{deliveryEligibility.message}</span>
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="Full Address / Farm location (Optional)"
                            value={fullAddress}
                            onChange={(e) => setFullAddress(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Landmark (e.g. Near Primary School / Mandir)"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </>
                      )}
                    </div>

                    {/* Payment Choice */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cod")}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            paymentMethod === "cod"
                              ? "bg-emerald-500/10 border-emerald-500 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400"
                          }`}
                        >
                          <span className="text-xs font-bold block">💵 Cash on Delivery</span>
                          <span className="text-[10px] text-slate-400">Pay when receiving</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("razorpay")}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            paymentMethod === "razorpay"
                              ? "bg-emerald-500/10 border-emerald-500 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400"
                          }`}
                        >
                          <span className="text-xs font-bold block">⚡ UPI &amp; Online</span>
                          <span className="text-[10px] text-emerald-400">Razorpay Secure</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer with Price Summary and Checkout Button */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    {fulfillmentType === "village_delivery" && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Village Delivery Fee</span>
                        <span>{deliveryFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${deliveryFee}`}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Discount</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                      <span>Total Amount</span>
                      <span className="text-emerald-400">₹{grandTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={submittingOrder}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {submittingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order • ₹{grandTotal}</span>
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
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 flex flex-col justify-between shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" />
                  <h2 className="text-lg font-bold text-white">Your Wishlist ({wishlist.length})</h2>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {wishlist.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No saved items</p>
                    <p className="text-xs text-slate-500 mt-1">Tap the heart on any product to save it for later.</p>
                  </div>
                ) : (
                  wishlist.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-200 truncate">{item.name}</h4>
                        <p className="text-xs text-emerald-400 font-bold mt-0.5">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            addToCart(item);
                            toggleWishlist(item);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                        >
                          Move to Cart
                        </button>
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >
                  Close Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
