import { Mail, MessageCircle, MapPin } from "lucide-react";

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
              Whether you want to see a live demo of the AI or have questions about pricing, our team is here to help.
            </p>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Mail size={24} className="text-[var(--color-mktg-cta)]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-mktg-base)] mb-1">Email Us</h4>
                  <p className="text-gray-500 mb-2">We typically reply within 2 hours.</p>
                  <a href="mailto:hello@ittisalo.com" className="text-[var(--color-mktg-cta)] font-medium hover:underline">hello@ittisalo.com</a>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <MessageCircle size={24} className="text-[var(--color-mktg-cta)]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-mktg-base)] mb-1">Chat Support</h4>
                  <p className="text-gray-500 mb-2">Experience our own AI copilot in action.</p>
                  <button className="text-[var(--color-mktg-cta)] font-medium hover:underline">Open Chat</button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-[var(--color-mktg-cta)]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-mktg-base)] mb-1">Global HQ</h4>
                  <p className="text-gray-500">Fully remote team, serving customers worldwide.</p>
                </div>
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
              
              <button type="button" className="w-full py-4 bg-[var(--color-mktg-cta)] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 mt-4">
                Submit Request
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
