"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import MilkifyLoader from "@/components/ui/Loader";

export default function Home() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

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
        // no session
      }
      router.push("/login");
    };
    checkSession();
  }, [router, setAuth]);

  return <MilkifyLoader />;
}
