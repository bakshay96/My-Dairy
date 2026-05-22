"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Loader2, User, Lock, Mail, Shield, Eye, EyeOff, ArrowLeft, Terminal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthArt from "@/components/auth/AuthArt";
import { toast } from "@/lib/toast";
import { motion } from "framer-motion";
import Link from "next/link";

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
        toast.success("Master Control Authenticated");
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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-6 sm:py-12 overflow-y-auto font-sans relative">
      {/* Premium Radial Accent Light and Cyber Dot Matrix background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.22),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-[0.03] dark:opacity-[0.07] pointer-events-none" />

      <main className="w-full flex items-center justify-center p-4 md:p-6 z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Animated branding panel on the left (Desktop only) */}
          <div className="hidden lg:block">
            <AuthArt type="master" />
          </div>

          {/* Form container on the right */}
          <div className="flex flex-col justify-center lg:justify-start">
            
            {/* Top link back to Standard Login */}
            <div className="flex justify-center lg:justify-start mb-4 pl-1">
              <Link 
                href="/login" 
                className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 font-bold px-3 py-1.5 rounded-full bg-purple-100/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/30 transition-all shadow-sm"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Standard Login
              </Link>
            </div>

            {/* Glassmorphic Master Access Card */}
            <Card className="w-full max-w-md border border-slate-200/50 dark:border-slate-800/80 shadow-[0_0_50px_-12px_rgba(139,92,246,0.12)] dark:shadow-[0_0_50px_-12px_rgba(139,92,246,0.22)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] relative overflow-visible">
              
              {/* Theme Toggle Button inside the Card */}
              <div className="absolute top-5 right-5 z-30">
                <ThemeToggle />
              </div>

              {/* Mobile & Tablet Brand Header */}
              <div className="block lg:hidden text-center pt-8 pb-2">
                <Brand className="scale-110" />
                <p className="text-xs text-slate-400 mt-2 font-medium">Smart Dairy Management Platform</p>
              </div>

              <CardContent className="p-8">
                {/* Header Banner Section */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/30 text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-3">
                    <Terminal className="h-3 w-3 animate-pulse" /> SYSTEM_ORCHESTRATOR
                  </div>
                  
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 dark:from-purple-400 dark:via-fuchsia-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Master Access Control
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                    Execute superadmin authentication to command platform resources.
                  </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  
                  {/* Username field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1 font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" /> Username
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        {...form.register("username")}
                        placeholder="enter superadmin username"
                        className="w-full h-12 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono placeholder:text-slate-400 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1 font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" /> Access Key
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        {...form.register("password")}
                        placeholder="••••••••••••"
                        className="w-full h-12 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono placeholder:text-slate-400 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-purple-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot link */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500 hover:underline transition-colors font-mono tracking-wider"
                    >
                      [RECOVER_ACCESS]
                    </button>
                  </div>

                  {/* Error box */}
                  {errorMsg && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-mono text-center"
                    >
                      ⚠ ACCESS_DENIED: {errorMsg}
                    </motion.div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-xs font-black tracking-widest font-mono bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-600/10 group transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        EXECUTE_AUTHENTICATION <Shield className="h-4 w-4 text-purple-200 group-hover:scale-110 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Cyberpunk Recovery Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
          >
            <button onClick={() => setForgotModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-purple-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2 font-mono">
              <Shield className="h-5 w-5 text-purple-500" /> SECURE_RECOVERY
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mb-6 leading-relaxed">
              ENTER REGISTERED EMAIL ADDRESS TO GENERATE TEMPORARY ACCESS PRIVILEGES.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="master@milkify.app"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl pl-11 pr-4 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60 outline-none font-mono text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-70 font-mono text-xs shadow-md shadow-purple-600/20"
              >
                {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                TRANSMIT_SECURE_KEY
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
