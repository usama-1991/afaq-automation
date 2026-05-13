"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { MessageSquare, Bot, BarChart2, Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"super" | "business">("super");

  const setDemoCredentials = (type: "super" | "business") => {
    setActiveTab(type);
    if (type === "super") {
      setEmail("admin@autoflow.ai");
      setPassword("admin123");
    } else {
      setEmail("demo@business.com");
      setPassword("demo123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.user?.email === "admin@autoflow.ai") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex w-full max-w-md xl:max-w-lg bg-red-800 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl font-bold">
              A
            </div>
            <span className="text-xl font-bold tracking-tight">AutoFlow AI</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-6 leading-tight">
            AI-Powered<br />Omnichannel CRM
          </h1>
          <p className="text-white/80 text-lg mb-12 leading-relaxed">
            Manage WhatsApp, Instagram, and Facebook conversations with AI automation — all in one dashboard.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MessageSquare className="w-6 h-6 mt-1 opacity-90" />
              <span className="text-[15px] opacity-90 leading-snug">WhatsApp + Instagram + Facebook unified inbox</span>
            </div>
            <div className="flex items-start gap-4">
              <Bot className="w-6 h-6 mt-1 opacity-90" />
              <span className="text-[15px] opacity-90 leading-snug">AI agent handles queries automatically 24/7</span>
            </div>
            <div className="flex items-start gap-4">
              <BarChart2 className="w-6 h-6 mt-1 opacity-90" />
              <span className="text-[15px] opacity-90 leading-snug">Real-time analytics and conversation insights</span>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 mt-1 opacity-90" />
              <span className="text-[15px] opacity-90 leading-snug">Multi-tenant with role-based access control</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500">Sign in to your AutoFlow dashboard</p>
          </div>

          {/* Demo Credentials Picker */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">@</span>
              </span>
              <span className="text-sm font-semibold text-red-900">Demo Credentials</span>
            </div>
            <div className="flex bg-white/50 p-1 rounded-lg border border-red-200/50">
              <button
                type="button"
                onClick={() => setDemoCredentials("super")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "super" ? "bg-red-600 text-white shadow-sm" : "text-red-700 hover:bg-red-50"
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("business")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "business" ? "bg-red-600 text-white shadow-sm" : "text-red-700 hover:bg-red-50"
                }`}
              >
                Business Owner
              </button>
            </div>
          </div>

          {error && <div className="mb-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="w-full rounded-lg bg-white border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-white border border-gray-300 px-4 py-2.5 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-700 py-2.5 font-medium text-white shadow-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            New client? Contact <a href="mailto:admin@autoflow.ai" className="text-red-600 font-medium hover:underline">admin@autoflow.ai</a> for access.
          </p>
        </div>
      </div>
    </div>
  );
}
