"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  ShoppingBag,
  Package,
  Plus,
  Search,
  Truck,
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DairyAdminStorePage() {
  const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' | 'orders' | 'pos' | 'settings'
  const [loading, setLoading] = useState(true);

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

  // Orders
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);

  // POS Walk-in Counter Cart State
  const [posCart, setPosCart] = useState([]);
  const [posCustomerName, setPosCustomerName] = useState("Walk-in Customer");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState("cash_counter");
  const [posDiscount, setPosDiscount] = useState(0);
  const [posSubmitting, setPosSubmitting] = useState(false);

  // Load Store Profile, Products, and Orders
  const fetchAllStoreData = async () => {
    try {
      setLoading(true);
      const [profileRes, productsRes, ordersRes] = await Promise.all([
        api.get("/store/admin/profile"),
        api.get("/store/admin/products"),
        api.get("/store/admin/orders"),
      ]);

      setProfile(profileRes.data?.profile || null);
      setProducts(productsRes.data?.products || []);
      setOrders(ordersRes.data?.orders || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load store data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStoreData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
      const matchSearch =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Inventory Stats
  const inventoryStats = useMemo(() => {
    const dairy = products.filter((p) => p.category === "dairy").length;
    const farming = products.filter((p) => p.category === "farming").length;
    const kirana = products.filter((p) => p.category === "kirana").length;
    const lowStock = products.filter((p) => p.stockQuantity <= (p.minStockAlert || 5)).length;
    return { dairy, farming, kirana, lowStock, total: products.length };
  }, [products]);

  // Save Store Profile & Geofence
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const res = await api.put("/store/admin/profile", profile);
      setProfile(res.data?.profile);
      toast.success("Outlet profile & village geofence settings updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Open Product Modal
  const openProductModal = (product = null) => {
    if (product) {
      setEditingProductId(product._id);
      setProductForm({
        name: product.name,
        category: product.category,
        subCategory: product.subCategory || "General",
        brand: product.brand || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        price: product.price,
        mrp: product.mrp || product.price,
        stockQuantity: product.stockQuantity,
        minStockAlert: product.minStockAlert || 5,
        unit: product.unit || "piece",
        packageSize: product.packageSize || "",
        description: product.description || "",
        images: product.images?.join(", ") || "",
        isAvailable: product.isAvailable !== false,
      });
    } else {
      setEditingProductId(null);
      setProductForm({
        name: "",
        category: "dairy",
        subCategory: "Milk & Ghee",
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
    }
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setProductSubmitting(true);
      const payload = {
        ...productForm,
        images: productForm.images
          .split(",")
          .map((img) => img.trim())
          .filter(Boolean),
      };

      if (editingProductId) {
        await api.put(`/store/admin/products/${editingProductId}`, payload);
        toast.success(`Product '${productForm.name}' updated!`);
      } else {
        await api.post("/store/admin/products", payload);
        toast.success(`Product '${productForm.name}' added to inventory!`);
      }

      setIsProductModalOpen(false);
      const res = await api.get("/store/admin/products");
      setProducts(res.data?.products || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setProductSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Permanently remove '${name}' from store catalog?`)) return;
    try {
      await api.delete(`/store/admin/products/${productId}`);
      toast.success(`'${name}' deleted from store`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/store/admin/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? { ...ord, orderStatus: newStatus } : ord))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update order");
    }
  };

  // POS Add to Cart
  const handlePosAddToCart = (product) => {
    if (product.stockQuantity <= 0) {
      return toast.warning(`'${product.name}' is out of stock!`);
    }

    setPosCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.warning(`Cannot exceed available stock (${product.stockQuantity})`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          category: product.category,
          unit: product.unit,
          packageSize: product.packageSize,
          price: product.price,
          quantity: 1,
          total: product.price,
        },
      ];
    });
  };

  const handlePosUpdateQty = (productId, delta) => {
    setPosCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p._id === productId);
            const nextQty = item.quantity + delta;
            if (product && nextQty > product.stockQuantity) {
              toast.warning(`Maximum available stock reached (${product.stockQuantity})`);
              return item;
            }
            return { ...item, quantity: nextQty, total: nextQty * item.price };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // POS Total Calculations
  const posSubtotal = useMemo(() => {
    return posCart.reduce((acc, curr) => acc + curr.total, 0);
  }, [posCart]);

  const posGrandTotal = Math.max(0, posSubtotal - Number(posDiscount || 0));

  // POS Checkout & Generate Bill
  const handlePosCheckout = async () => {
    if (posCart.length === 0) return toast.error("Counter sale cart is empty!");

    try {
      setPosSubmitting(true);
      const res = await api.post("/store/admin/pos-sale", {
        customerName: posCustomerName || "Counter Walk-in",
        customerPhone: posCustomerPhone || "",
        items: posCart,
        paymentMethod: posPaymentMethod,
        discountAmount: Number(posDiscount) || 0,
      });

      toast.success("Walk-in sale recorded & inventory updated!");
      setActiveReceiptOrder(res.data?.order);
      setPosCart([]);
      setPosCustomerName("Walk-in Customer");
      setPosCustomerPhone("");
      setPosDiscount(0);

      // Refresh inventory
      const [prodRes, ordRes] = await Promise.all([
        api.get("/store/admin/products"),
        api.get("/store/admin/orders"),
      ]);
      setProducts(prodRes.data?.products || []);
      setOrders(ordRes.data?.orders || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete POS sale");
    } finally {
      setPosSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-xs font-semibold tracking-wide animate-pulse">
          Loading Dairy E-Commerce Desk...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner & Online Storefront Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              {profile?.isOpen ? "Store Open" : "Store Closed"}
            </span>
            <span className="text-xs text-indigo-200 font-semibold">
              Serving: <strong>{profile?.village || "Main Village"}</strong> ({profile?.deliveryRadiusKm || 8} km radius)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-amber-400" /> {profile?.storeName || "Dairy Store & Cattle Feed"}
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            Unified Omnichannel Engine: Physical Dairy Counter POS + Hyper-Local Online Delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile?.slug && (
            <a
              href={`/store/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-md transition-all shrink-0"
            >
              <ExternalLink className="h-4 w-4 text-indigo-600" />
              Visit Customer Storefront
            </a>
          )}
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "inventory"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Package className="h-4 w-4" />
          Store Inventory ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "orders"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Truck className="h-4 w-4" />
          Online & Counter Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab("pos")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "pos"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Receipt className="h-4 w-4" />
          Walk-in POS Counter Billing
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "settings"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Village Geofence & Delivery Settings
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: INVENTORY MANAGEMENT                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Dairy Products</span>
              <div className="text-2xl font-black mt-1">{inventoryStats.dairy} Items</div>
              <p className="text-[11px] text-slate-400">Milk, Ghee, Paneer, Curd</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Cattle Feed & Farm</span>
              <div className="text-2xl font-black mt-1">{inventoryStats.farming} Items</div>
              <p className="text-[11px] text-slate-400">Sudha, Kapila, Khal, Chuni</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Kirana & Daily</span>
              <div className="text-2xl font-black mt-1">{inventoryStats.kirana} Items</div>
              <p className="text-[11px] text-slate-400">Groceries, Spices & Staples</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Low Stock Alerts</span>
              <div className="text-2xl font-black mt-1 text-rose-600">{inventoryStats.lowStock} Items</div>
              <p className="text-[11px] text-slate-400">Below minimum threshold</p>
            </Card>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "dairy", "farming", "kirana"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    productCategoryFilter === cat
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat === "farming" ? "Cattle Feed / Farm" : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item, brand, SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button
                onClick={() => openProductModal()}
                className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const isLowStock = p.stockQuantity <= (p.minStockAlert || 5);
              return (
                <Card
                  key={p._id}
                  className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                        p.category === "farming"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : p.category === "dairy"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}>
                        {p.category === "farming" ? "Cattle Feed" : p.category}
                      </span>

                      {isLowStock ? (
                        <span className="text-[9px] font-extrabold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">
                          {p.stockQuantity} {p.unit} in stock
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{p.name}</h3>
                      {p.brand && <p className="text-[11px] text-indigo-500 font-semibold">{p.brand}</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.packageSize || p.subCategory}</p>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xl font-black text-slate-900 dark:text-white">₹{p.price}</span>
                      {p.mrp > p.price && (
                        <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto">per {p.unit}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProductModal(p)}
                      className="rounded-xl text-xs font-bold gap-1 border-slate-200 dark:border-slate-700"
                    >
                      <Edit className="h-3.5 w-3.5 text-indigo-500" /> Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(p._id, p.name)}
                      className="rounded-xl text-xs text-rose-500 hover:bg-rose-50 p-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: ORDERS MANAGEMENT                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "orders" && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-500" /> Omnichannel Store Orders
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track customer online deliveries and physical POS walk-in counter sales.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["all", "placed", "confirmed", "packed", "out_for_delivery", "delivered"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    orderStatusFilter === st
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders
                .filter((o) => orderStatusFilter === "all" || o.orderStatus === orderStatusFilter)
                .map((ord) => (
                  <div key={ord._id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{ord.orderNumber}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ord.orderChannel === "pos_counter"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}>
                          {ord.orderChannel === "pos_counter" ? "POS Walk-in Counter" : "Online Delivery"}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ord.orderStatus === "delivered"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : ord.orderStatus === "placed"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                        }`}>
                          {ord.orderStatus.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        Recipient: <strong>{ord.deliveryAddress?.recipientName || "Walk-in"}</strong> ({ord.deliveryAddress?.recipientPhone || "N/A"}) •{" "}
                        Village: <strong>{ord.deliveryAddress?.village || profile?.village}</strong>
                      </p>

                      <div className="text-[11px] text-slate-400">
                        Items: {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900 dark:text-white">₹{ord.grandTotal}</div>
                        <span className={`text-[10px] font-bold uppercase ${ord.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          {ord.paymentStatus} ({ord.paymentMethod})
                        </span>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {ord.orderStatus === "placed" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord._id, "confirmed")}
                            className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Confirm Order
                          </Button>
                        )}
                        {ord.orderStatus === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord._id, "packed")}
                            className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Mark Packed
                          </Button>
                        )}
                        {ord.orderStatus === "packed" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord._id, "out_for_delivery")}
                            className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Dispatch Delivery
                          </Button>
                        )}
                        {ord.orderStatus === "out_for_delivery" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord._id, "delivered")}
                            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Delivered
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveReceiptOrder(ord)}
                          className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800"
                        >
                          <Printer className="h-3.5 w-3.5 text-indigo-500" /> Print Bill
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: POS WALK-IN COUNTER BILLING                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Picker Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-500" /> Walk-in Counter Item Selector
              </h2>
              <span className="text-xs text-slate-400">Click item to add to counter bill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {products
                .filter((p) => p.isAvailable)
                .map((p) => (
                  <div
                    key={p._id}
                    onClick={() => handlePosAddToCart(p)}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
                  >
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 mt-0.5">{p.name}</h4>
                      <p className="text-[10px] text-slate-400">{p.packageSize || p.unit}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-black text-sm text-slate-900 dark:text-white">₹{p.price}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {p.stockQuantity} {p.unit}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* POS Bill Drawer */}
          <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-indigo-500" /> POS Counter Sale Slip
                </h3>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg">
                  {posCart.length} Items
                </span>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={posCustomerName}
                  onChange={(e) => setPosCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Mobile (For SMS slip)"
                  value={posCustomerPhone}
                  onChange={(e) => setPosCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Cart Table */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {posCart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">₹{item.price} x {item.quantity}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePosUpdateQty(item.productId, -1)}
                        className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold px-1">{item.quantity}</span>
                      <button
                        onClick={() => handlePosUpdateQty(item.productId, 1)}
                        className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                      <span className="font-black w-14 text-right">₹{item.total}</span>
                    </div>
                  </div>
                ))}

                {posCart.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">Cart is empty. Click items on the left to add.</div>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Settlement Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "cash_counter", label: "Cash" },
                    { id: "upi_qr", label: "UPI QR" },
                    { id: "farmer_milk_bill", label: "Milk Bill" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPosPaymentMethod(m.id)}
                      className={`py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                        posPaymentMethod === m.id
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{posSubtotal}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={posDiscount}
                    onChange={(e) => setPosDiscount(e.target.value)}
                    className="w-16 px-1.5 py-0.5 text-right bg-slate-50 dark:bg-slate-800 border rounded text-xs font-bold"
                  />
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1">
                  <span>Grand Total</span>
                  <span className="text-emerald-600">₹{posGrandTotal}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePosCheckout}
              disabled={posSubmitting || posCart.length === 0}
              className="w-full h-11 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md transition-all"
            >
              {posSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Generate Bill & Print Receipt
            </Button>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: VILLAGE GEOFENCE & DELIVERY SETTINGS                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "settings" && profile && (
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-500" /> Village Geofence & Storefront Setup
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Restrict deliveries strictly to your dairy village cluster so freshness and delivery logistics remain profitable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Dairy Store Name</label>
                <input
                  type="text"
                  required
                  value={profile.storeName || ""}
                  onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Storefront Slug</label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-l-xl border-y border-l">/store/</span>
                  <input
                    type="text"
                    required
                    value={profile.slug || ""}
                    onChange={(e) => setProfile({ ...profile, slug: e.target.value.toLowerCase().trim() })}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-r-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Village *</label>
                <input
                  type="text"
                  required
                  value={profile.village || ""}
                  onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Max Delivery Radius (Km) *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={profile.deliveryRadiusKm || 8}
                  onChange={(e) => setProfile({ ...profile, deliveryRadiusKm: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Standard Delivery Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={profile.deliveryFee ?? 20}
                  onChange={(e) => setProfile({ ...profile, deliveryFee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Serviced Neighboring Villages (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Village A, Village B, Village C"
                value={profile.serviceVillages?.join(", ") || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    serviceVillages: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Customers selecting any of these villages will be permitted to place delivery orders.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isOpen !== false}
                  onChange={(e) => setProfile({ ...profile, isOpen: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Store Open for Orders
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.allowSelfPickup !== false}
                  onChange={(e) => setProfile({ ...profile, allowSelfPickup: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Allow In-Store Counter Pickups
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                disabled={profileSaving}
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Geofence Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PRODUCT CREATE / EDIT MODAL                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/80">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingProductId ? `Edit Item: ${productForm.name}` : "Add Item to Store Inventory"}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded-xl text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Store Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="dairy">Dairy Products (Milk, Ghee, Paneer)</option>
                    <option value="farming">Farming Products (Cattle Feed, Minerals)</option>
                    <option value="kirana">Kirana Store (Grocery & Staples)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Type</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="liter">Liter</option>
                    <option value="kg">Kg</option>
                    <option value="bag">Bag (50kg Feed)</option>
                    <option value="packet">Packet</option>
                    <option value="bottle">Bottle</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Package Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 500ml Pouch / 50Kg Bag"
                    value={productForm.packageSize}
                    onChange={(e) => setProductForm({ ...productForm, packageSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Image URLs (Comma separated)</label>
                <input
                  type="text"
                  placeholder="https://...s3.amazonaws.com/image.jpg"
                  value={productForm.images}
                  onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={productSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {productSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* THERMAL BILL RECEIPT PRINT MODAL                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-xs uppercase tracking-wider">Thermal Bill Receipt</h3>
              <button onClick={() => setActiveReceiptOrder(null)} className="p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Slip Body */}
            <div className="font-mono text-xs space-y-3 p-2 bg-slate-50 rounded-xl">
              <div className="text-center space-y-0.5">
                <p className="font-black text-sm uppercase">{profile?.storeName || "MILKIFY DAIRY STORE"}</p>
                <p className="text-[10px] text-slate-500">{profile?.village} • Ph: {profile?.phone || "N/A"}</p>
                <p className="text-[10px] font-bold">Bill: {activeReceiptOrder.orderNumber}</p>
                <p className="text-[9px] text-slate-400">{new Date(activeReceiptOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1">
                {activeReceiptOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{i.name} x{i.quantity}</span>
                    <span className="font-bold">₹{i.totalItemAmount}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{activeReceiptOrder.subtotal}</span>
                </div>
                {activeReceiptOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>₹{activeReceiptOrder.deliveryFee}</span>
                  </div>
                )}
                {activeReceiptOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{activeReceiptOrder.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t">
                  <span>Total Paid:</span>
                  <span>₹{activeReceiptOrder.grandTotal}</span>
                </div>
                <div className="text-center text-[10px] text-slate-500 pt-2">
                  Payment: {activeReceiptOrder.paymentMethod.toUpperCase()} • Status: {activeReceiptOrder.paymentStatus.toUpperCase()}
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.print()}
              className="w-full font-bold bg-slate-900 text-white rounded-xl gap-2"
            >
              <Printer className="h-4 w-4" /> Print Thermal Slip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
