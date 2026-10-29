"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, ShieldCheck, X } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace("/admin");
        }
      })
      .catch(() => {});
  }, [router]);

  const closePage = () => router.push("/");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.replace("/admin");
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={closePage}
      className="relative min-h-screen bg-forest-950 flex flex-col items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          closePage();
        }}
        aria-label="Close and return to site"
        className="absolute right-4 top-4 z-20 rounded-full border border-forest-700 bg-forest-900/80 p-2.5 text-forest-200 transition-colors hover:border-gold-400 hover:text-gold-300 sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-forest-900/40 via-forest-950 to-forest-950" />

      <div onClick={(e) => e.stopPropagation()} className="relative z-10 w-full max-w-md bg-forest-900/80 backdrop-blur-xl border border-forest-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="relative h-14 w-52 mx-auto">
            <Image
              src="/images/logo.png"
              alt="Marrigold Events"
              fill
              priority
              sizes="208px"
              quality={85}
              className="object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-950 border border-gold-500/30 text-gold-400 text-xs uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Studio CMS Portal</span>
          </div>
          <p className="text-xs text-forest-200">
            Sign in to manage gallery albums, content, and enquiries
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-forest-200 mb-2">
              Studio Access Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-forest-950 border border-forest-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-forest-400 focus:outline-none focus:border-gold-400 transition-colors pl-11"
              />
              <Lock className="w-4 h-4 text-gold-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 hover:from-gold-500 hover:to-gold-400 text-forest-950 font-bold text-sm tracking-wider uppercase py-3.5 rounded-xl shadow-lg shadow-gold-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Sign In to CMS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-forest-300">
            Marrigold Events Private Management Console
          </p>
        </div>
      </div>
    </div>
  );
}

