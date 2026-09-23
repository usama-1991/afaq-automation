"use client";

import { useState } from "react";
import { Mail, MapPin, Building2, Phone, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/IttisaloAI",
    label: "Follow on Facebook",
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/ittisalo/",
    label: "Follow on Instagram",
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/ittisalo/",
    label: "Connect on LinkedIn",
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    industry: "Restaurant / Cafe / Cloud Kitchen",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to submit request. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setErrorMessage("Network error. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Meta Partner Badge in Header */}
          <div className="pt-2 flex justify-center">
            <div className="bg-[#1A050B] px-4 py-2 rounded-2xl border border-[#3D0C1A] inline-flex items-center gap-3 shadow-md">
              <img
                src="/meta-business-partner-badge.png"
                alt="Official Meta Tech Partner Badge"
                className="h-9 w-auto object-contain"
              />
              <span className="text-xs text-gray-300 font-bold hidden sm:inline">
                Official Meta Tech Partner Platform
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Corporate Entity Details & Meta Badge */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
              Get in Touch Directly
            </h2>
            <p className="text-sm text-[#5C5255] leading-relaxed">
              We respond to all business inquiries within 2 hours during Pakistani business hours (9 AM - 7 PM PKT).
            </p>

            <div className="space-y-4">
              {/* Meta Tech Partner Card */}
              <div className="p-6 bg-[#240710] text-white rounded-3xl border border-[#3D0C1A] shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#E63946] uppercase tracking-wider">Meta Tech Partner</div>
                    <div className="text-base font-extrabold text-white mt-0.5">Official Meta Business Partner</div>
                    <p className="text-xs text-gray-300 mt-1 max-w-xs">
                      Certified Meta Business API integration provider for WhatsApp, Instagram, and Messenger.
                    </p>
                  </div>
                  <img
                    src="/meta-business-partner-badge.png"
                    alt="Official Meta Business Partner Badge"
                    className="h-12 w-auto object-contain shrink-0"
                  />
                </div>
              </div>

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

              {/* Official Social Media Links */}
              <div className="p-6 bg-white rounded-3xl border border-[#EFEBE4] shadow-sm space-y-3">
                <div className="text-xs font-bold text-[#8C8285] uppercase tracking-wider">Official Social Media</div>
                <div className="flex flex-wrap items-center gap-3">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#FFE8EA] text-xs font-bold text-[#8B1531] hover:bg-[#E63946] hover:text-white hover:border-[#E63946] transition-all shadow-2xs"
                    >
                      {social.icon}
                      <span>{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-10 border border-[#EFEBE4] shadow-xl">
            <h3 className="text-2xl font-bold text-[#1A1517] mb-6">Schedule a Personalized Demo</h3>

            {submitted ? (
              <div className="p-8 bg-[#FFF5F5] border border-[#FFE8EA] rounded-2xl text-center space-y-4">
                <div className="w-14 h-14 bg-[#10B981]/10 border border-[#10B981]/30 rounded-full flex items-center justify-center text-[#10B981] mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-extrabold text-[#1A1517]">Demo Request Submitted!</h4>
                <p className="text-sm text-[#5C5255] leading-relaxed">
                  Thank you, <strong>{formData.firstName}</strong>. Your request has been recorded successfully. Our team will contact you at <strong>{formData.phone}</strong> or <strong>{formData.email}</strong> within 2 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      industry: "Restaurant / Cafe / Cloud Kitchen",
                      message: "",
                    });
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#240710] text-white text-xs font-bold hover:bg-[#3D0C1A] transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1517] mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                      placeholder="Usama"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A1517] mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                      placeholder="Ahmed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1517] mb-1">Business Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                    placeholder="usama@business.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1517] mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm"
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1517] mb-1">Industry Vertical</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm font-semibold text-[#1A1517]"
                  >
                    <option value="Restaurant / Cafe / Cloud Kitchen">Restaurant / Cafe / Cloud Kitchen</option>
                    <option value="Dental & Medical Clinic">Dental & Medical Clinic</option>
                    <option value="Salon & Beauty Spa">Salon & Beauty Spa</option>
                    <option value="eCommerce & Fashion Retail">eCommerce & Fashion Retail</option>
                    <option value="Real Estate Agency">Real Estate Agency</option>
                    <option value="Other Business">Other Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1517] mb-1">Message / Requirements</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#EFEBE4] bg-[#FDFCFB] focus:outline-none focus:border-[#C81E3A] text-sm resize-none"
                    placeholder="Describe your daily message volume or specific channels you want to connect..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Submit Demo Request</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
