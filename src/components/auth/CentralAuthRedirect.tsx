import { useLayoutEffect } from "react";
import IEOSUIAInvoicesLogo from "@/components/branding/IEOSUIAInvoicesLogo";

export default function CentralAuthRedirect({ mode = "login", callback = false }: { mode?: "login" | "signup" | "admin"; callback?: boolean }) {
  useLayoutEffect(() => {
    const signedOut = localStorage.getItem("ieosuia_explicit_logout");
    const token = new URLSearchParams(window.location.hash.slice(1)).get("ieosuia_token");
    if (token) { if (signedOut) { window.location.replace("/?signed_out=1"); return; } localStorage.setItem("ieosuia_auth_token", token); window.location.replace("/dashboard"); return; }
    const adminToken = new URLSearchParams(window.location.hash.slice(1)).get("ieosuia_admin_token");
    if (adminToken) { if (signedOut) { window.location.replace("/?signed_out=1"); return; } localStorage.setItem("ieosuia_admin_token", adminToken); window.location.replace("/guymhan/dashboard"); return; }
    if (callback) { window.location.replace("/?sso=invalid_response"); return; }
    const fresh = signedOut ? "prompt=login" : "";
    localStorage.removeItem("ieosuia_explicit_logout");
    const query = mode === "signup" ? "?screen_hint=signup" : mode === "admin" ? `?account_type=admin${fresh ? `&${fresh}` : ""}` : fresh ? `?${fresh}` : "";
    window.location.replace(`/api/auth/ieosuia/start${query}`);
  }, [mode, callback]);
  return <main className="min-h-screen grid place-items-center bg-slate-950" aria-live="polite"><div className="w-full max-w-sm space-y-6 px-6"><IEOSUIAInvoicesLogo variant="light" size="auth" className="mx-auto" /><div className="mx-auto h-1.5 w-32 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-400" /></div><p className="text-center text-sm text-slate-400">Connecting securely to IEOSUIA Auth…</p></div></main>;
}
