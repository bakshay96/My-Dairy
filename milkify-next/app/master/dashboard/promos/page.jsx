"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, Tag, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 10,
      description: "",
      maxUses: "",
    }
  });

  const fetchPromos = async () => {
    try {
      const res = await api.get("/master/promo-codes");
      setPromos(res.data.promos);
    } catch {
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = { ...values, maxUses: values.maxUses ? Number(values.maxUses) : null };
      await api.post("/master/promo-codes", payload);
      toast.success("Promo code created!");
      setShowForm(false);
      form.reset();
      fetchPromos();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create promo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      await api.delete(`/master/promo-codes/${id}`);
      toast.success("Promo code deleted");
      fetchPromos();
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/master/promo-codes/${id}`, { isActive: !currentStatus });
      toast.success("Status updated");
      fetchPromos();
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="h-8 w-8 text-purple-500" /> Promo Codes
          </h1>
          <p className="text-slate-500 mt-1">Create and manage discount codes for subscriptions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          {showForm ? "Cancel" : <><Plus className="h-4 w-4" /> New Code</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-none shadow-xl bg-purple-50 dark:bg-purple-900/10 mb-8">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Code</label>
                  <input {...form.register("code")} required placeholder="e.g. SUMMER20" className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</label>
                  <select {...form.register("discountType")} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Value</label>
                  <input type="number" {...form.register("discountValue")} required min="1" className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Uses (optional)</label>
                  <input type="number" {...form.register("maxUses")} placeholder="Unlimited" className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <input {...form.register("description")} placeholder="Marketing description to show users" className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3" />
              </div>
              <Button type="submit" disabled={submitting} className="bg-purple-600 text-white w-full sm:w-auto">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Promo
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((promo) => (
          <Card key={promo._id} className={`border-none shadow-md bg-white dark:bg-slate-950 ${!promo.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-5 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => toggleStatus(promo._id, promo.isActive)} className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
                  {promo.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(promo._id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2">
                <span className="bg-purple-100 text-purple-800 text-xs font-black px-2 py-1 rounded tracking-widest">{promo.code}</span>
              </div>
              <h3 className="text-2xl font-black mb-1">
                {promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{promo.description || "No description provided."}</p>
              
              <div className="flex justify-between text-xs text-slate-400 font-bold uppercase border-t pt-3">
                <span>Uses: {promo.usedCount} / {promo.maxUses || '∞'}</span>
                <span className={promo.isActive ? "text-green-500" : "text-red-500"}>{promo.isActive ? "Active" : "Inactive"}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {promos.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed rounded-xl">
            <Tag className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No promo codes created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// simple inline icon component for Save since I didn't import it at the top
function Save(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
}
