'use client';

import { usePlan } from '@/context/PlanContext';
import { ShieldAlert, ArrowRight, MessageCircle, Mail, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TrialExpiredPaywall() {
  const { tenantInfo } = usePlan();
  const router = useRouter();

  const businessName = tenantInfo?.business_name || 'Your Workspace';

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `Hello! My 14-day trial for ${businessName} on Ittisalo has ended. I would like to pay and activate my subscription.`
    );
    window.open(`https://wa.me/923214567890?text=${text}`, '_blank');
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Subscription Activation Request - ${businessName}`);
    const body = encodeURIComponent(
      `Hi Ittisalo Support,\n\nOur 14-day trial has concluded for workspace "${businessName}". We would like to pay and activate our subscription plan.\n\nTenant ID: ${tenantInfo?.id || 'N/A'}\n\nPlease share payment details.`
    );
    window.location.href = `mailto:admin@ittisalo.io?subject=${subject}&body=${body}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#7E1C30] via-[#A8253F] to-[#C42B33] text-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-rose-200">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              Service Locked · 14-Day Trial Expired
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
            Activate Your Ittisalo Plan to Continue
          </h2>
          <p className="text-rose-100/90 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Your 14-day free trial for <strong>{businessName}</strong> has concluded. Your settings, agents, and conversation history are safely preserved. Upgrade now to restore full omnichannel AI automation.
          </p>
        </div>

        {/* Body Content & Features */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="flex items-center gap-2 text-[#A8253F] font-bold text-sm mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                WhatsApp & Socials
              </div>
              <p className="text-xs text-gray-600">
                Restore live automated replies on WhatsApp Cloud API, Instagram DM & Messenger.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="flex items-center gap-2 text-[#A8253F] font-bold text-sm mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Autonomous AI Agent
              </div>
              <p className="text-xs text-gray-600">
                24/7 intelligent sales copilot with product catalog and custom knowledge base.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="flex items-center gap-2 text-[#A8253F] font-bold text-sm mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Zero Data Loss
              </div>
              <p className="text-xs text-gray-600">
                All your customer chats, contacts, and custom prompts will resume instantly upon activation.
              </p>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              How to Pay & Unlock Your Workspace
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
              Subscriptions are currently processed securely via direct invoice/payment. Once you reach out, our team will instantly activate your plan in the Super Admin dashboard.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleEmailContact}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A8253F] hover:bg-[#8e1f35] text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                Email Support to Pay (admin@ittisalo.io)
              </button>

              <button
                type="button"
                onClick={() => router.push('/pricing')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm border border-gray-300 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                View Pricing Plans
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            Tenant Reference ID: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{tenantInfo?.id || 'N/A'}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
