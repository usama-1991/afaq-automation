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

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/IttisaloAI",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/ittisalo/",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/ittisalo/",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#240710] text-[#FFF5F5] pt-20 pb-12 relative overflow-hidden border-t border-[#3D0C1A]">
      {/* Decorative Brand Radial Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E63946]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C81E3A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
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

            {/* Meta Business Partner Badge & Social Icons */}
            <div className="pt-3 space-y-3">
              <div className="inline-flex items-center gap-2 bg-[#3D0C1A] border border-[#5C162A] px-3.5 py-2 rounded-xl text-xs text-gray-300">
                <ShieldCheck size={14} className="text-[#10B981]" />
                <span>Registered Entity: <strong>ITTISALO (PRIVATE) LIMITED</strong> (CUIN: 0347762)</span>
              </div>

              {/* Official Meta Business Partner Badge */}
              <div className="flex items-center gap-3 pt-1">
                <div className="bg-[#1A050B] p-2 rounded-xl border border-[#3D0C1A] inline-block shadow-sm">
                  <img
                    src="/meta-business-partner-badge.png"
                    alt="Official Meta Business Partner Badge"
                    className="h-9 w-auto object-contain"
                  />
                </div>
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
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#E63946] mb-4">Legal & Connect</h3>
            <ul className="space-y-2.5 mb-6">
              {FOOTER_LINKS.Legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Follow Us</h4>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-9 h-9 rounded-xl bg-[#3D0C1A] border border-[#5C162A] flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#E63946] hover:border-[#E63946] transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright & Meta Partner row */}
        <div className="border-t border-[#3D0C1A] pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-400">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src="/meta-business-partner-badge.png"
              alt="Meta Business Partner"
              className="h-7 w-auto object-contain"
            />
            <p className="text-center sm:text-left">
              &copy; {new Date().getFullYear()} ITTISALO (PRIVATE) LIMITED. All rights reserved. SECP CUIN: 0347762 • NTN: J527787-0
            </p>
          </div>
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


