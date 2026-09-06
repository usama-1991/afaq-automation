"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  MessageSquare,
  Bot,
  BarChart2,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  X
} from "lucide-react";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "invalid_reset_link"
      ? "Your reset link was invalid or expired. Please enter your email and click Reset Password again."
      : searchParams.get("error") === "auth_failed"
      ? "Authentication failed or was cancelled. Please try again."
      : null
  );
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Google OAuth Login / Sign-up
  const handleGoogleAuth = async () => {
    setError(null);
    setInfoMessage(null);
    setGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initialize Google authentication.");
      setGoogleLoading(false);
    }
  };

  // Password / Manual Login or Signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (
          data.user?.email === "usamahabib1991@gmail.com" ||
          data.user?.email === "admin@ittisalo.io"
        ) {
          window.location.href = "/admin";
        } else {
          // Let AppShell route appropriately
          window.location.href = "/dashboard";
        }
      } else {
        // Sign up mode
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split("@")[0],
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        // If session is already created (e.g. email confirmation disabled), go straight to onboarding
        if (data.session) {
          window.location.href = "/onboarding";
        } else {
          setInfoMessage(
            "Account created! Please check your email inbox to confirm your email and activate your workspace."
          );
          setFullName("");
          setEmail("");
          setPassword("");
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please provide your registered email address.");
      return;
    }
    setResetLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSuccess(true);
    }
    setResetLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* ── LEFT SIDE - WORKSPACE VISUAL WITH BRAND OVERLAY ────────────── */}
      <div className="hidden lg:relative lg:flex lg:w-[48%] xl:w-[50%] bg-[#1a1415] text-white flex-col justify-between p-12 overflow-hidden select-none">
        {/* Background Image */}
        <img
          src="/auth_workspace.jpg"
          alt="Collaborative Workspace"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45 mix-blend-luminosity scale-105 transform duration-1000"
        />
        
        {/* Gradient Tint Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#140508]/95 via-[#7E1C30]/40 to-[#140508]/80 pointer-events-none"
        />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img
              src="/my_logo.png"
              alt="Ittisalo Logo"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold uppercase tracking-wider text-rose-200 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            AI-Powered Omnichannel CRM
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] mb-6 font-heading">
            Connect. Automate. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-100 to-amber-100">
              Close 10x More Deals.
            </span>
          </h1>

          <p className="text-rose-100/80 text-base xl:text-lg leading-relaxed max-w-lg mb-10">
            Unify WhatsApp, Instagram, Facebook, and Web chats into one AI-driven workspace. Automate customer support, capture orders, and boost revenue 24/7.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 flex-shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Unified Omnichannel Inbox</h4>
                <p className="text-xs text-rose-100/70 mt-0.5">Manage WhatsApp, IG & FB conversations in one place.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Autonomous AI Sales Copilot</h4>
                <p className="text-xs text-rose-100/70 mt-0.5">Answers queries, recommends products, and books appointments 24/7.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">14-Day Full-Access Free Trial</h4>
                <p className="text-xs text-rose-100/70 mt-0.5">Instant setup with your Meta WhatsApp Cloud API credentials.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE - LOGIN / SIGNUP CARD ───────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-heading">
              {mode === "login" ? "Login with your account" : "Create your account"}
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              {mode === "login"
                ? "Sign in to manage your AI omnichannel workspace"
                : "Get started with your free 14-day trial — no card required"}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 text-sm text-red-700 bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-start gap-2.5 animate-fade-in">
              <div className="w-4 h-4 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                !
              </div>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-6 text-sm text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{infoMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8253F]/20 transition-all duration-150 disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#A8253F]" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
            </span>
          </button>

          {/* OR Divider */}
          <div className="relative my-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Usama Habib"
                    className="w-full rounded-xl bg-white border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8253F]/20 focus:border-[#A8253F] transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl bg-white border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8253F]/20 focus:border-[#A8253F] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                      setResetSuccess(false);
                    }}
                    className="text-xs font-medium text-[#A8253F] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white border border-gray-300 pl-10 pr-10 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8253F]/20 focus:border-[#A8253F] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 rounded-xl bg-[#A8253F] hover:bg-[#8e1f35] py-3 px-4 font-semibold text-sm text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#A8253F] focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Login" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Sign Up */}
          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === "login" ? (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setPassword("");
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="font-semibold text-[#A8253F] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setPassword("");
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="font-semibold text-[#A8253F] hover:underline cursor-pointer"
                >
                  Login
                </button>
              </p>
            )}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
            <a href="/legal/terms" className="underline hover:text-gray-600">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/legal/privacy" className="underline hover:text-gray-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ──────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#A8253F] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-heading">Reset Password</h3>
                <p className="text-xs text-gray-500">We'll send you a secure link to reset your password.</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Check your inbox</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We've sent password reset instructions to <strong className="text-gray-900">{resetEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-4 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl bg-white border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8253F]/20 focus:border-[#A8253F]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-xl bg-[#A8253F] hover:bg-[#8e1f35] py-2.5 text-sm font-semibold text-white shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-[#A8253F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
