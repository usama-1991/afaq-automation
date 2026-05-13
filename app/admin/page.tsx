"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Shield, Building, Users, Activity, MessageSquare } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tenants").select("*");
    if (!error && data) {
      setTenants(data);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-sm font-bold tracking-widest mb-1 uppercase">
            <Shield className="w-4 h-4" />
            Super Admin
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTenants} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <span className="text-lg leading-none">+</span> New Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
            <Building className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">Total Clients</div>
          <div className="text-2xl font-bold text-slate-900">{tenants.length || 1}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">Active Clients</div>
          <div className="text-2xl font-bold text-slate-900">{tenants.length || 1}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">Total Messages</div>
          <div className="text-2xl font-bold text-slate-900">1</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">Total Users</div>
          <div className="text-2xl font-bold text-slate-900">2</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 mb-6">
        <button className="pb-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Tenants</button>
        <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">Users</button>
        <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700">Audit</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading tenants...</div>
      ) : (
        <div className="w-full">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Niche</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="py-4">
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">demo-restaurant</div>
                  </td>
                  <td className="py-4 text-sm text-slate-600">Restaurant</td>
                  <td className="py-4">
                    <select className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-slate-50 text-slate-700 outline-none">
                      <option>starter</option>
                      <option>pro</option>
                    </select>
                  </td>
                  <td className="py-4 text-sm font-medium text-emerald-600">active</td>
                  <td className="py-4 text-sm text-slate-600">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <button className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No tenants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
