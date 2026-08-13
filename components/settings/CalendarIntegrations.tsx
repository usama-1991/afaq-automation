'use client';

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

export function CalendarIntegrationsSettings() {
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [calendlyConnected, setCalendlyConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  
  useEffect(() => {
    async function loadIntegrations() {
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
      if (!userData?.tenant_id) return;
      
      const { data: integrations } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('tenant_id', userData.tenant_id);
        
      if (integrations) {
        const google = integrations.find((i: any) => i.provider === 'google');
        if (google) {
          setGoogleConnected(true);
          setGoogleEmail(google.external_user_id || 'Connected');
        }
        
        const calendly = integrations.find((i: any) => i.provider === 'calendly');
        if (calendly) {
          setCalendlyConnected(true);
        }
      }
    }
    loadIntegrations();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Calendar & Scheduling Sync
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Connect your external calendars for real-time 2-way appointment synchronization and double-booking protection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Calendar Box */}
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Google Calendar</h3>
                <p className="text-xs text-zinc-500">
                  {googleConnected ? googleEmail : 'Not connected'}
                </p>
              </div>
            </div>
            {googleConnected ? (
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            ) : (
              <span className="flex items-center text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                Disconnected
              </span>
            )}
          </div>

          <a
            href="/api/integrations/google/connect"
            onClick={() => setLoading(true)}
            className="w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors"
          >
            {googleConnected ? 'Reconnect Google Account' : 'Connect Google Calendar'}
          </a>
        </div>

        {/* Calendly Box */}
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Calendly</h3>
                <p className="text-xs text-zinc-500">
                  {calendlyConnected ? 'Webhook Active' : 'Not connected'}
                </p>
              </div>
            </div>
            {calendlyConnected ? (
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            ) : (
              <span className="flex items-center text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                Disconnected
              </span>
            )}
          </div>

          <a
            href="/api/integrations/calendly/connect"
            onClick={() => setLoading(true)}
            className="w-full text-center py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg transition-colors"
          >
            {calendlyConnected ? 'Reconnect Calendly' : 'Connect Calendly Account'}
          </a>
        </div>
      </div>
    </div>
  );
}
