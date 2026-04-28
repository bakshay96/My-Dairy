"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthArt from "@/components/auth/AuthArt";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/lib/store";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  village: z.string().min(2, "Village is required"),
  shopName: z.string().min(2, "Shop name is required"),
  email: z.string().email("Please enter a valid email"),
  gender: z.enum(["Male", "Female", "Other"]).default("Male"),
});

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const form = useForm({
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

  const onSubmit = async (values) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post("/admin/register", values);
      if (res.data?.admin) {
        setAuth(res.data.admin, null, res.data.sessionExpiresAt || null);
      }
      setSuccessMsg("Registration successful. Redirecting to dashboard...");
      toast.success("Registration successful");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (error) {
      toast.error("Registration failed");
      setErrorMsg(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Registration failed. Please check your details and try again."
      );
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
        // no active session; stay on register
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router, setAuth]);

  if (checkingSession) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-transparent p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl items-center justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto mt-4 grid max-w-6xl gap-6 lg:grid-cols-2 items-stretch">
      <AuthArt />
      <Card className="w-full max-w-lg shadow-xl shadow-slate-900/10 border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Brand />
          </div>
          <CardTitle className="text-2xl font-bold">Create Admin Account</CardTitle>
          <CardDescription>Register your dairy and start managing collections</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  {...form.register("name")}
                  placeholder="Enter your name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile</label>
                <input
                  {...form.register("mobile")}
                  placeholder="10-digit mobile"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {form.formState.errors.mobile && (
                  <p className="text-xs text-red-500">{form.formState.errors.mobile.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Village</label>
                <input
                  {...form.register("village")}
                  placeholder="Village"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {form.formState.errors.village && (
                  <p className="text-xs text-red-500">{form.formState.errors.village.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Shop Name</label>
                <input
                  {...form.register("shopName")}
                  placeholder="Dairy shop name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {form.formState.errors.shopName && (
                  <p className="text-xs text-red-500">{form.formState.errors.shopName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  {...form.register("email")}
                  placeholder="you@example.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <select
                  {...form.register("gender")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                {...form.register("password")}
                placeholder="Create password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm text-center">
                {successMsg}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating account...
                </>
              ) : (
                "Register"
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
