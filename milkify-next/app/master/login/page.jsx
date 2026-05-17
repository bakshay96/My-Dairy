"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Loader2, KeyRound, User, Lock, Mail, Shield, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { toast } from "@/lib/toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function MasterLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/master/login", values);
      if (res.data?.token) {
        localStorage.setItem("master_token", res.data.token);
        toast.success("Master Login Successful");
        router.push("/master/dashboard");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid credentials. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email");
    setForgotLoading(true);
    try {
      await api.post("/master/forgot-password", { email: forgotEmail });
      toast.success("Master Admin password sent to your email!");
      setForgotModalOpen(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to recover password");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Brand />
        </div>

        <Card className="border-none shadow-2xl bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-center">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Master Control</h2>
            <p className="text-white/80 text-sm mt-1">Superadmin Access Only</p>
          </div>

          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Username</label>
                <div className="relative group">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    {...form.register("username")}
                    className="w-full h-12 bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setForgotModalOpen(true)} className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
                  Lost Access?
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-xs font-bold text-center">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authenticate"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setForgotModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2"><Shield className="h-6 w-6 text-purple-500" /> Recovery</h2>
            <p className="text-slate-400 text-sm mb-6">Enter your master admin email to receive your secure credentials.</p>
            <form onSubmit={handleForgotPassword}>
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="master@milkify.app"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-70"
              >
                {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
                Send Secure Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
