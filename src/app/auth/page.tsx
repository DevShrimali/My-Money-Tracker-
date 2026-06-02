"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Wallet, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Request access to read and write Google Calendar events
          scopes: "https://www.googleapis.com/auth/calendar.events",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate login");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to Prosper</h1>
          <p className="text-xs text-slate-400">Your smart mobile-first personal EMI & Expense tracker</p>
        </div>

        {/* Dynamic Gradient Feature Card */}
        <div className="p-4 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl text-white space-y-3 shadow-md">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Made for India</h2>
          <p className="text-sm font-medium">Keep track of your monthly paychecks, broadband bills, apartment rents, and auto EMIs in Rupees.</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Synced automatically with Google Calendar</span>
          </div>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="p-3.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.73 0 3.3.65 4.5 1.725l2.42-2.42C17.385 1.58 14.93 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.685-.06-1.35-.18-1.955H12.24z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem("prosper_guest_session", "true");
              window.location.href = "/";
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <span>Continue as Guest</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400">
          By continuing, you authorize Prosper to sync selected payment reminders directly into your Google Calendar account.
        </p>
      </div>
    </div>
  );
}
