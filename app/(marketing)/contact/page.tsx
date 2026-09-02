import { Mail, MessageCircle, MapPin, Building2, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="w-full bg-[var(--color-mktg-bg)] py-20 lg:py-32 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
              Let's talk about your business.
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-md">
              Whether you want to see a live demo of the AI or have questions about our enterprise messaging platform, our team is here to help.
            </p>
            
            <div className="space-y-6">
              {/* Legal Entity Card */}
              <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-red-50 rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Building2 size={24} className="text-[var(--color-mktg-cta)]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--color-mktg-base)] mb-1">Registered Legal Entity</h4>
                  <p className="text-gray-900 font-semibold text-lg">ITTISALO (PRIVATE) LIMITED</p>
                  <p className="text-sm text-gray-500 mt-1">SECP Corporate Unique ID (CUIN): <span className="font-mono font-medium text-gray-700">0347762</span></p>
                  <p className="text-sm text-gray-500">National Tax Number (NTN): <span className="font-mono font-medium text-gray-700">J527787-0</span></p>
                </div>
              </div>

              {/* Registered Address */}
              <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-red-50 rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-[var(--color-mktg-cta)]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--color-mktg-base)] mb-1">Registered Office Address</h4>
                  <p className="text-gray-800 font-medium">p 45 1 22ND LANE PHASE 7 DHA KARACHI</p>
                  <p className="text-sm text-gray-500 mt-0.5">Karachi, Pakistan</p>
                </div>
              </div>

              {/* Contact Channels */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-[var(--color-mktg-cta)]" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-[var(--color-mktg-base)]">Email</h5>
                    <a href="mailto:Ittisaloai@gmail.com" className="text-xs text-[var(--color-mktg-cta)] font-medium hover:underline block truncate">
                      Ittisaloai@gmail.com
                    </a>
                    <a href="mailto:hello@ittisalo.com" className="text-xs text-gray-500 hover:underline block truncate">
                      hello@ittisalo.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-[var(--color-mktg-cta)]" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[var(--color-mktg-base)]">Phone</h5>
                    <a href="tel:+923103604110" className="text-xs text-gray-800 font-medium hover:underline block">
                      +92 310 3604110
                    </a>
                    <span className="text-[11px] text-gray-400">Verified business line</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <MessageCircle size={20} className="text-[var(--color-mktg-cta)]" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-[var(--color-mktg-base)]">Instant Messaging</h5>
                  <p className="text-xs text-gray-500">Live AI Assistant & Support available 24/7</p>
                </div>
                <a href="https://wa.me/923103604110" target="_blank" rel="noopener noreferrer" className="text-xs bg-[var(--color-mktg-cta)] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--color-mktg-cta-hover)] transition-colors">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          {/* Form */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
            <h3 className="text-2xl font-bold text-[var(--color-mktg-base)] mb-6">Book a Demo</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mktg-cta)] focus:border-transparent transition-shadow" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mktg-cta)] focus:border-transparent transition-shadow" placeholder="Doe" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mktg-cta)] focus:border-transparent transition-shadow" placeholder="john@company.com" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mktg-cta)] focus:border-transparent transition-shadow bg-white">
                  <option>Restaurant / Cafe</option>
                  <option>Medical / Dental Clinic</option>
                  <option>eCommerce / Retail</option>
                  <option>Real Estate</option>
                  <option>Salon / Spa</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How can we help?</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mktg-cta)] focus:border-transparent transition-shadow resize-none" placeholder="Tell us about your current communication challenges..."></textarea>
              </div>
              
              <button type="button" className="w-full py-4 bg-[var(--color-mktg-cta)] text-white font-bold rounded-xl hover:bg-[var(--color-mktg-cta-hover)] transition-colors shadow-lg shadow-red-500/20 mt-4">
                Submit Request
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
