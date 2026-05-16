"use client";

import { useEffect, useState} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Phone, Lock, User, MapPin, Building, Mail, 
  ChevronRight, Eye, EyeOff 
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthArt from "@/components/auth/AuthArt";
import { toast } from "@/lib/toast";

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  village: z.string().min(2, "Village is required"),
  shopName: z.string().min(2, "Shop name is required"),
  email: z.string().email("Please enter a valid email"),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
});

import { Suspense } from "react";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "register" ? "register" : "login");
  const [showPassword, setShowPassword] = useState(false);

  // Login Form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "", password: "" },
  });

  // Register Form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      mobile: "",
      password: "",
      village: "",
      shopName: "",
      email: "",
      gender: "Male",
    },
  });

  const onLoginSubmit = async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/admin/login", values);
      if (res.data && res.data.admin) {
        setAuth(res.data.admin, null, res.data.sessionExpiresAt || null);
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Login failed");
      setErrorMsg(error.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/admin/register", values);
      if (res.data?.admin) {
        setAuth(res.data.admin, null, res.data.sessionExpiresAt || null);
      }
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Registration failed");
      setErrorMsg(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const me = await api.get("/admin/me");
        if (me.data?.admin) {
          setAuth(me.data.admin, null, me.data.sessionExpiresAt || null);
          router.push("/dashboard");
          return;
        }
      } catch {
        // no active session
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router, setAuth]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Checking secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col">
      <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Brand />
        <ThemeToggle />
      </nav>

      <main className="flex-1 flex items-center justify-center p-4 md:p-6 -mt-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Visuals (Hidden on mobile) */}
          <div className="hidden lg:block">
            <AuthArt />
          </div>

          {/* Right Side: Auth Form */}
          <div className="flex justify-center lg:justify-start">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <div className="p-1 flex bg-slate-100 dark:bg-slate-800 m-6 rounded-2xl">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === "login"
                      ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === "register"
                      ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Register
                </button>
              </div>

              <CardContent className="px-8 pb-8 pt-2">
                <AnimatePresence mode="wait">
                  {activeTab === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6 text-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome Back</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your dairy collections with ease</p>
                      </div>

                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Mobile Number</label>
                          <div className="relative group">
                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                              {...loginForm.register("mobile")}
                              placeholder="9876543210"
                              className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                          {loginForm.formState.errors.mobile && (
                            <p className="text-[10px] text-red-500 font-bold ml-1">{loginForm.formState.errors.mobile.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                              type={showPassword ? "text" : "password"}
                              {...loginForm.register("password")}
                              placeholder="••••••••"
                              className="w-full h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3.5 p-0.5 text-slate-400 hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {loginForm.formState.errors.password && (
                            <p className="text-[10px] text-red-500 font-bold ml-1">{loginForm.formState.errors.password.message}</p>
                          )}
                        </div>

                        {errorMsg && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold text-center">
                            {errorMsg}
                          </div>
                        )}

                        <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 group" disabled={loading}>
                          {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Sign In <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6 text-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create Account</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join the future of dairy management</p>
                      </div>

                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                            <div className="relative group">
                              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                {...registerForm.register("name")}
                                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Mobile</label>
                            <div className="relative group">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                {...registerForm.register("mobile")}
                                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Village</label>
                            <div className="relative group">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                {...registerForm.register("village")}
                                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Dairy Name</label>
                            <div className="relative group">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                {...registerForm.register("shopName")}
                                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                              type="email"
                              {...registerForm.register("email")}
                              placeholder="example@milkify.com"
                              className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Create Password</label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                              type={showPassword ? "text" : "password"}
                              {...registerForm.register("password")}
                              className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold text-center">
                            {errorMsg}
                          </div>
                        )}

                        <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 group" disabled={loading}>
                          {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Create Account <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
        <span>&copy; {new Date().getFullYear()} Milkify Dairy Systems. All rights reserved.</span>
        <Link href="/master/login" className="text-slate-300 hover:text-primary transition-colors">Master Access</Link>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
