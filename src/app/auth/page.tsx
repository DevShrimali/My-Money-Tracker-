"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Wallet, CheckCircle2, Mail, Lock, User, Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check URL query parameters for redirect errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const desc = params.get("error_description");
      if (err) {
        setErrorMsg(desc || err);
      }
    }
  }, []);

  // Handle Sign In and Sign Up form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (!fullName) {
          setErrorMsg("Please enter your name.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        // If email confirmation is required, data.session will be null
        if (data.user && !data.session) {
          setSuccessMsg("Verification email sent! Please check your inbox to confirm your account.");
        } else {
          setSuccessMsg("Account created successfully!");
          // Save session indicator
          localStorage.removeItem("prosper_guest_session");
          router.push("/");
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        localStorage.removeItem("prosper_guest_session");
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication process failed");
    } finally {
      setLoading(false);
    }
  };

  // Allow Guest Login bypass
  const handleGuestLogin = () => {
    localStorage.setItem("prosper_guest_session", "true");
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100/80 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prosper</h1>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Your personal EMI & Expense tracker</p>
        </div>

        {/* Feature Pill Card */}
        <div className="p-4 bg-slate-950 rounded-2xl text-white space-y-2 shadow-sm border border-slate-900/50">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md">Made for India</span>
          </div>
          <p className="text-[12px] text-slate-300 font-medium leading-relaxed">
            Keep track of monthly salary paychecks, EMI repayments, rent dues, and broadband bills formatted in Indian Rupees (₹).
          </p>
        </div>

        {/* Form Fields container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            {isSignUp ? "Create a new account" : "Sign in to your account"}
          </h2>

          {/* Validation Messages */}
          {errorMsg && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl font-medium">
              {successMsg}
            </div>
          )}

          {/* Name Field (Sign Up Only) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* View Toggle Links */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-xs text-emerald-600 hover:underline font-semibold"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
          </button>
        </div>

        {/* Guest fallback action */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer text-xs"
        >
          <span>Continue as Guest (Offline Mode)</span>
        </button>
      </div>
    </div>
  );
}
