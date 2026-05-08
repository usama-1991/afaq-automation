"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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
    // Note: To list all tenants, you need super_admin role, or use a service key on backend.
    // For prototype, we're assuming the logged-in admin can read from public.tenants
    const { data, error } = await supabase.from("tenants").select("*");
    if (!error && data) {
      setTenants(data);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900">Admin Dashboard</h1>
      <p className="mb-6 text-zinc-600">Manage clients, subscriptions, and permissions.</p>

      {loading ? (
        <p>Loading tenants...</p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="p-4 font-medium text-zinc-500">ID</th>
                <th className="p-4 font-medium text-zinc-500">Tenant Name</th>
                <th className="p-4 font-medium text-zinc-500">Created At</th>
                <th className="p-4 font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="p-4 text-sm text-zinc-600 font-mono">{t.id.split('-')[0]}...</td>
                  <td className="p-4 font-medium text-zinc-900">{t.name}</td>
                  <td className="p-4 text-sm text-zinc-600">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 transition">
                      Manage Plans
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-zinc-500">No tenants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
