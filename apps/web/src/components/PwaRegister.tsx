"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration failure is non-fatal: the app simply stays online-only */
    });
  }, []);

  useEffect(() => {
    const goneOffline = () =>
      toast("You're offline. Cached syllabi and your journey still work.", {
        icon: "📴",
        id: "offline-status",
      });
    const backOnline = () =>
      toast.success("Back online.", { id: "offline-status" });
    window.addEventListener("offline", goneOffline);
    window.addEventListener("online", backOnline);
    return () => {
      window.removeEventListener("offline", goneOffline);
      window.removeEventListener("online", backOnline);
    };
  }, []);

  return null;
}
