"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Wallet, CheckCircle2, Mail, Lock, User, Sparkles, Info, X, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Handle Sign In, Sign Up, and Forgot Password form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (isForgotPassword) {
      if (!email) {
        setErrorMsg("Please enter your email address.");
        setLoading(false);
        return;
      }
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        setSuccessMsg("Reset link sent! Please check your email to update your password.");
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to send reset link");
      } finally {
        setLoading(false);
      }
      return;
    }

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

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar",
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate Google sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-slate-50">
      <div className="flex min-h-full items-center justify-center p-4">
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
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Your personal EMI & Expense tracker</span>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 flex items-center justify-center"
                title="View application details"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Form Fields container */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {isForgotPassword
                ? "Reset your password"
                : isSignUp
                ? "Create a new account"
                : "Sign in to your account"}
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
            {isSignUp && !isForgotPassword && (
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
            {!isForgotPassword && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-20 py-2.5 text-sm focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {password && (
                      <button
                        type="button"
                        onClick={() => setPassword("")}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                        title="Clear password"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {!isSignUp && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-[11px] text-slate-500 hover:text-emerald-600 hover:underline font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

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
                  <span>
                    {isForgotPassword
                      ? "Send Reset Link"
                      : isSignUp
                      ? "Create Account"
                      : "Sign In"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* View Toggle Links */}
          <div className="text-center">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
              </button>
            )}
          </div>

          {/* OAuth login and Guest fallback actions */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/85 font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.742 1.054 15.014 0 12 0 7.354 0 3.373 2.682 1.442 6.578l3.824 3.187Z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.868-.077-1.705-.22-2.525H12v4.78h6.436c-.277 1.455-1.1 2.69-2.33 3.522l3.63 2.815c2.128-1.96 3.354-4.847 3.354-8.592Z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235l-3.824 3.187C3.373 21.318 7.354 24 12 24c3.014 0 5.836-1.009 7.936-2.818l-3.63-2.815c-1.127.755-2.564 1.205-4.306 1.205-3.882 0-7.155-2.618-8.324-6.137Z"
              />
              <path
                fill="#34A853"
                d="M12 19.582c-3.882 0-7.155-2.618-8.324-6.137l-3.824 3.187C3.373 20.627 7.354 24 12 24c1.927 0 3.736-.455 5.255-1.227l-3.63-2.815c-1.127.391-2.327.624-3.625.624Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-3 px-4 rounded-xl transition-all active:scale-98 cursor-pointer text-xs"
          >
            <span>Continue as Guest (Offline Mode)</span>
          </button>
        </div>
      </div>
      {showInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-4 modal-enter text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Made for India</span>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Keep track of monthly salary paychecks, EMI repayments, rent dues, and broadband bills formatted in Indian Rupees (₹).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
