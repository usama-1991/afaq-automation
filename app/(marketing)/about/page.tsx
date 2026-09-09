import Link from "next/link";
import { Globe2, Users, Rocket, Building2, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Ittisalo — ITTISALO (PRIVATE) LIMITED",
  description:
    "Learn about Ittisalo's mission to power business conversations for SMBs in Pakistan & globally. Incorporated SECP entity: ITTISALO (PRIVATE) LIMITED.",
  keywords: [
    "About Ittisalo",
    "ITTISALO (PRIVATE) LIMITED",
    "Karachi B2B SaaS Startup",
    "Omnichannel AI Infrastructure"
  ]
};

export default function AboutPage() {
  return (
    <div className="w-full bg-[#FDFCFB] min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-20 px-4 text-center bg-gradient-to-b from-[#FFF5F5]/60 to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <Sparkles size={14} className="text-[#E63946]" /> Our Mission
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] tracking-tight">
            Empowering SMBs with <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">Enterprise AI</span>
          </h1>
          <p className="text-lg text-[#5C5255] max-w-2xl mx-auto font-medium leading-relaxed">
            We build the conversational intelligence layer that turns every WhatsApp, Instagram, and Messenger message into an instant, delighted customer relationship.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 max-w-4xl mx-auto space-y-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#EFEBE4] shadow-sm space-y-6">
          <h2 className="text-3xl font-display font-bold text-[#1A1517]">Our Story</h2>
          <p className="text-[#5C5255] leading-relaxed">
            Small and medium businesses are the economic heartbeat of Karachi, Lahore, Islamabad, and markets around the world. But modern SMBs face an overwhelming operational challenge: customers expect 24/7 instant replies on messaging apps.
          </p>
          <p className="text-[#5C5255] leading-relaxed">
            A boutique salon owner shouldn't miss out on weekend bookings because staff were washing hair when an Instagram DM arrived. A local restaurant shouldn't lose food orders because staff couldn't answer 40 WhatsApp messages during Friday night rush.
          </p>
          <p className="text-[#5C5255] leading-relaxed">
            Ittisalo was born to fix this friction. We engineered a multi-tenant AI conversational platform that ingests menus, schedules, and catalogs to handle customer dialogs autonomously, while letting human teams step in seamlessly whenever high-value situations arise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-white p-6 rounded-2xl border border-[#EFEBE4] shadow-sm space-y-2">
            <Globe2 size={32} className="mx-auto text-[#C81E3A]" />
            <div className="text-3xl font-extrabold text-[#1A1517]">100%</div>
            <div className="text-xs font-bold text-[#8C8285] uppercase">Meta API Compliant</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#EFEBE4] shadow-sm space-y-2">
            <Users size={32} className="mx-auto text-[#C81E3A]" />
            <div className="text-3xl font-extrabold text-[#1A1517]">5+</div>
            <div className="text-xs font-bold text-[#8C8285] uppercase">Industry Verticals</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#EFEBE4] shadow-sm space-y-2">
            <Rocket size={32} className="mx-auto text-[#C81E3A]" />
            <div className="text-3xl font-extrabold text-[#1A1517]">&lt; 0.5s</div>
            <div className="text-xs font-bold text-[#8C8285] uppercase">Avg Response Speed</div>
          </div>
        </div>

        {/* Corporate Legal Entity Card */}
        <div className="bg-[#240710] text-white p-8 sm:p-10 rounded-3xl space-y-6 shadow-xl border border-[#3D0C1A]">
          <div className="flex items-center gap-3">
            <Building2 className="text-[#E63946]" size={28} />
            <h3 className="text-2xl font-bold text-white">
              Corporate & SECP Entity Registration
            </h3>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Ittisalo is registered and operated by <strong className="text-white">ITTISALO (PRIVATE) LIMITED</strong>, a legal entity incorporated under the Companies Act, 2017 with the Securities and Exchange Commission of Pakistan (SECP).
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-[#3D0C1A] p-4 rounded-xl border border-[#5C162A] space-y-1">
              <span className="text-gray-400 uppercase tracking-wider block">Official Registered Name</span>
              <span className="font-bold text-white text-sm">ITTISALO (PRIVATE) LIMITED</span>
            </div>
            <div className="bg-[#3D0C1A] p-4 rounded-xl border border-[#5C162A] space-y-1">
              <span className="text-gray-400 uppercase tracking-wider block">SECP Corporate Registration (CUIN)</span>
              <span className="font-mono font-bold text-white text-sm">0347762</span>
            </div>
            <div className="bg-[#3D0C1A] p-4 rounded-xl border border-[#5C162A] space-y-1">
              <span className="text-gray-400 uppercase tracking-wider block">National Tax Number (NTN)</span>
              <span className="font-mono font-bold text-white text-sm">J527787-0</span>
            </div>
            <div className="bg-[#3D0C1A] p-4 rounded-xl border border-[#5C162A] space-y-1">
              <span className="text-gray-400 uppercase tracking-wider block">Headquarters Address</span>
              <span className="font-medium text-white text-xs">P 45 1 22nd Lane, Phase 7 DHA, Karachi, Pakistan</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
