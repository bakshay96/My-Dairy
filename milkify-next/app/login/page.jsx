"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Brand from "@/components/ui/Brand";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthArt from "@/components/auth/AuthArt";
import { toast } from "sonner";

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/admin/login", values);
      // api.js interceptor now correctly unwraps the backend payload into res.data
      if (res.data && res.data.admin) {
        const payload = res.data;
        setAuth(payload.admin, null, payload.sessionExpiresAt || null);
        toast.success("Login successful");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
      setErrorMsg(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Invalid credentials. Please try again."
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
        // no active session; stay on login
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
    <div className="min-h-screen w-full bg-gray-50/60 dark:bg-slate-950 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl items-center justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto mt-4 grid max-w-6xl gap-6 lg:grid-cols-2 items-stretch">
        <AuthArt />
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Brand />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Milkify</CardTitle>
          <CardDescription>Sign in to your admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Mobile Number</label>
              <input
                {...form.register("mobile")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your mobile number"
              />
              {form.formState.errors.mobile && (
                <p className="text-xs text-red-500">{form.formState.errors.mobile.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">Password</label>
              </div>
              <input
                type="password"
                {...form.register("password")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your password"
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

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
