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
import OtpInput from "@/components/ui/OtpInput";
import { toast } from "@/lib/toast";

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  confirmPassword: z.string().min(4, "Password confirmation is required"),
  village: z.string().min(2, "Village is required"),
  shopName: z.string().min(2, "Shop name is required"),
  email: z.string().email("Please enter a valid email"),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
  
  // Forgot password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Registration Email OTP verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      confirmPassword: "",
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

  const sendEmailVerificationOtp = async () => {
    const email = registerForm.getValues("email");
    if (!email) {
      toast.error("Please enter an email address first");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post("/admin/send-email-otp", { email });
      if (res.data?.success) {
        setOtpSent(true);
        toast.success("Verification code sent successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyEmailVerificationOtp = async () => {
    const email = registerForm.getValues("email");
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await api.post("/admin/verify-email-otp", { email, otp: otpCode });
      if (res.data?.success) {
        setEmailVerified(true);
        toast.success("Email verified successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onRegisterSubmit = async (values) => {
    if (!emailVerified) {
      toast.error("Please verify your email address using OTP first");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const registerData = { ...values };
      delete registerData.confirmPassword;
      const res = await api.post("/admin/register", registerData);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email");
    setForgotLoading(true);
    try {
      await api.post("/admin/forgot-password", { email: forgotEmail });
      toast.success("New password sent to your email!");
      setForgotModalOpen(false);
      setForgotEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setForgotLoading(false);
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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-6 sm:py-12 overflow-y-auto">
      <main className="w-full flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          <div className="hidden lg:block">
            <AuthArt />
          </div>

          <div className="flex justify-center lg:justify-start">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl relative overflow-visible">
              {/* Theme Toggle inside Card */}
              <div className="absolute top-5 right-5 z-30">
                <ThemeToggle />
              </div>

              {/* Mobile Brand Header */}
              <div className="block lg:hidden text-center pt-8 pb-2">
                <Brand className="scale-110" />
                <p className="text-xs text-slate-400 mt-2 font-medium">Smart Dairy Management Platform</p>
              </div>

              <div className="p-1 flex bg-slate-100 dark:bg-slate-800 m-6 mb-2 lg:mb-6 rounded-2xl mr-14">
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

                        <div className="flex justify-end">
                          <button type="button" onClick={() => setForgotModalOpen(true)} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                            Forgot Password?
                          </button>
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
                          <div className="flex gap-2">
                            <div className="relative flex-1 group">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                type="email"
                                disabled={emailVerified}
                                {...registerForm.register("email")}
                                placeholder="example@milkify.com"
                                className="w-full h-10 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>
                            {!emailVerified && (
                              <button
                                type="button"
                                disabled={sendingOtp}
                                onClick={sendEmailVerificationOtp}
                                className="h-10 px-4 text-xs font-extrabold bg-primary text-white rounded-xl hover:bg-primary/95 transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-primary/10"
                              >
                                {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                {otpSent ? "Resend" : "Send OTP"}
                              </button>
                            )}
                          </div>
                          {emailVerified && (
                            <p className="text-[11px] text-green-600 dark:text-green-400 font-extrabold flex items-center gap-1 mt-1 ml-1 animate-fade-in">
                              <span>✓</span> Email successfully verified!
                            </p>
                          )}
                        </div>

                        {otpSent && !emailVerified && (
                          <div className="p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/80 rounded-2xl space-y-3.5 animate-scale-up">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">Enter 6-Digit Code</label>
                              <span className="text-[11px] text-primary font-bold animate-pulse">OTP Sent</span>
                            </div>
                            
                            <OtpInput value={otpCode} onChange={setOtpCode} />
                            
                            <Button
                              type="button"
                              disabled={verifyingOtp || otpCode.length !== 6}
                              onClick={verifyEmailVerificationOtp}
                              className="w-full h-11 text-xs font-extrabold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-600/10"
                            >
                              {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Verify Activation Code
                            </Button>
                            <p className="text-[10px] text-slate-400 text-center leading-normal">
                              We sent a secure validation code to your email. Please check your inbox or spam folder.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Create Password</label>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                type={showPassword ? "text" : "password"}
                                {...registerForm.register("password")}
                                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-primary transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {registerForm.formState.errors.password && (
                              <p className="text-[10px] text-red-500 font-bold ml-1">{registerForm.formState.errors.password.message}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm Password</label>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                {...registerForm.register("confirmPassword")}
                                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-primary transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {registerForm.formState.errors.confirmPassword && (
                              <p className="text-[10px] text-red-500 font-bold ml-1">{registerForm.formState.errors.confirmPassword.message}</p>
                            )}
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold text-center">
                            {errorMsg}
                          </div>
                        )}

                        <div className="space-y-2 pt-2">
                          <Button 
                            type="submit" 
                            className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 group" 
                            disabled={loading || !emailVerified}
                          >
                            {loading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                Create Account <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </span>
                            )}
                          </Button>

                          {!emailVerified && (
                            <p className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center gap-1 py-1">
                              ⚠️ Email verification with OTP is required to unlock registration.
                            </p>
                          )}
                        </div>
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

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setForgotModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Reset Password</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your registered email address to receive a new temporary password.</p>
            <form onSubmit={handleForgotPassword}>
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="admin@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-70"
              >
                {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
                Send New Password
              </button>
            </form>
          </div>
        </div>
      )}
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
