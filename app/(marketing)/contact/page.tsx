import { Mail, MessageSquare, MapPin, Building2, Phone, Sparkles, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Sales & Book a Demo — Ittisalo",
  description:
    "Schedule a 1-on-1 demo with Ittisalo AI specialists. Contact ITTISALO (PRIVATE) LIMITED in DHA Karachi, Pakistan for personalized onboarding.",
  keywords: [
    "Contact Ittisalo",
    "Book WhatsApp AI Demo",
    "Karachi AI SaaS Contact",
    "ITTISALO (PRIVATE) LIMITED Contact"
  ]
};

export default function ContactPage() {
  return (
    <div className="w-full bg-[#FDFCFB] min-h-screen">
      {/* Header */}
      <section className="pt-16 pb-20 px-4 text-center bg-gradient-to-b from-[#FFF5F5]/60 to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <Sparkles size={14} className="text-[#E63946]" /> 1-on-1 Product Consultation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] tracking-tight">
            Let's Scale Your <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">Business Messaging</span>
          </h1>
          <p className="text-lg text-[#5C5255] max-w-xl mx-auto font-medium">
            Whether you want a live demo or have questions about Meta Business API setup, our Karachi team is here to assist.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Corporate Entity Details */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
              Get in Touch Directly
            </h2>
            <p className="text-sm text-[#5C5255] leading-relaxed">
              We respond to all business inquiries within 2 hours during Pakistani business hours (9 AM - 7 PM PKT).
            </p>

            <div className="space-y-4">
              {/* Corporate Legal Card */}
              <div className="p-6 bg-white rounded-3xl border border-[#EFEBE4] shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF5F5] border border-[#FFE8EA] flex items-center justify-center text-[#C81E3A] font-bold">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#8C8285] uppercase tracking-wider">Registered Entity</div>
                    <div className="text-base font-extrabold text-[#1A1517]">ITTISALO (PRIVATE) LIMITED</div>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-[#5C5255] pt-1">
                  <div>SECP CUIN: <span className="font-mono font-bold text-[#1A1517]">0347762</span></div>
                  <div>National Tax Number (NTN): <span className="font-mono font-bold text-[#1A1517]">J527787-0</span></div>
                </div>
              </div>

              {/* Address Card */}
              <div className="p-6 bg-white rounded-3xl border border-[#EFEBE4] shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F5] border border-[#FFE8EA] flex items-center justify-center text-[#C81E3A] font-bold shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#8C8285] uppercase tracking-wider">Headquarters</div>
                  <div className="text-sm font-bold text-[#1A1517] mt-0.5">P 45 1 22nd Lane, Phase 7 DHA, Karachi, Pakistan</div>
                  <div className="text-xs text-[#5C5255] mt-1">Serving clients in Karachi, Lahore, Islamabad & Globally</div>
                </div>
              </div>

              {/* Contact Direct */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-[#EFEBE4] shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8B1531]">
                    <Mail size={16} className="text-[#C81E3A]" /> Email Support
                  </div>
                  <a href="mailto:Ittisaloai@gmail.com" className="text-xs font-bold text-[#1A1517] hover:text-[#C81E3A] block truncate">
                    Ittisaloai@gmail.com
                  </a>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-[#EFEBE4] shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8B1531]">
                    <Phone size={16} className="text-[#C81E3A]" /> Direct Phone
                  </div>
                  <a href="tel:+923103604110" className="text-xs font-bold text-[#1A1517] hover:text-[#C81E3A] block">
                    +92 310 360 4110
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-10 border border-[#EFEBE4] shadow-xl">
            <h3 className="text-2xl font-bold text-[#1A1517] mb-6">Schedule a Personalized Demo</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1517] mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                    placeholder="Usama"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A1517] mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                    placeholder="Ahmed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1517] mb-1">Business Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                  placeholder="usama@business.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1517] mb-1">Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                  placeholder="+92 300 1234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1517] mb-1">Industry Vertical</label>
                <select className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm font-semibold text-[#1A1517]">
                  <option value="restaurants">Restaurant / Cafe / Cloud Kitchen</option>
                  <option value="clinics">Dental & Medical Clinic</option>
                  <option value="salons">Salon & Beauty Spa</option>
                  <option value="ecommerce">eCommerce & Fashion Retail</option>
                  <option value="realestate">Real Estate Agency</option>
                  <option value="other">Other Business</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1517] mb-1">Message / Requirements</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm resize-none"
                  placeholder="Describe your daily message volume or specific channels you want to connect..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-md transition-all hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
              >
                Submit Demo Request
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
