import Link from "next/link";
import { Sparkles, MessageSquare, ShieldCheck, Mail, MapPin, Phone } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "AI Unified Inbox", href: "/product" },
    { label: "WhatsApp Business API", href: "/channels/whatsapp" },
    { label: "Instagram DMs & Stories", href: "/channels/instagram" },
    { label: "Facebook Messenger", href: "/channels/messenger" },
    { label: "Pricing & Plans", href: "/pricing" },
  ],
  Solutions: [
    { label: "Restaurants & Cafes", href: "/solutions/restaurants" },
    { label: "Dental & Health Clinics", href: "/solutions/clinics" },
    { label: "eCommerce & Fashion", href: "/solutions/ecommerce-fashion" },
    { label: "Real Estate Agencies", href: "/solutions/real-estate" },
    { label: "Salons & Beauty Spas", href: "/solutions/salons" },
  ],
  Resources: [
    { label: "Customer Case Studies", href: "/case-studies" },
    { label: "Blog & Insights", href: "/blog" },
    { label: "About Ittisalo", href: "/about" },
    { label: "Contact Sales", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#240710] text-[#FFF5F5] pt-20 pb-12 relative overflow-hidden border-t border-[#3D0C1A]">
      {/* Decorative Brand Radial Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E63946]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C81E3A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Ittisalo Logo"
                className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                Ittisalo
              </span>
            </Link>
            <p className="text-sm text-gray-300 max-w-sm leading-relaxed">
              The multi-tenant AI conversational platform for modern SMBs. Turn WhatsApp, Instagram, and Messenger into revenue drivers with zero missed leads.
            </p>

            <div className="pt-2 space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#E63946] shrink-0" />
                <span>P 45 1 22nd Lane, Phase 7 DHA, Karachi, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#E63946] shrink-0" />
                <span>+92 310 360 4110</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#E63946] shrink-0" />
                <span>Ittisaloai@gmail.com</span>
              </div>
            </div>

            <div className="pt-3">
              <div className="inline-flex items-center gap-2 bg-[#3D0C1A] border border-[#5C162A] px-3.5 py-2 rounded-xl text-xs text-gray-300">
                <ShieldCheck size={14} className="text-[#10B981]" />
                <span>Registered Entity: <strong>ITTISALO (PRIVATE) LIMITED</strong> (CUIN: 0347762)</span>
              </div>
            </div>
          </div>

          {/* Links Cols */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#E63946] mb-4">Product</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.Product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#E63946] mb-4">Solutions</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.Solutions.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#E63946] mb-4">Company</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.Resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#E63946] mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.Legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="border-t border-[#3D0C1A] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} ITTISALO (PRIVATE) LIMITED. All rights reserved. SECP CUIN: 0347762 • NTN: J527787-0
          </p>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="https://app.ittisalo.com/login" className="hover:text-white transition-colors">App Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

