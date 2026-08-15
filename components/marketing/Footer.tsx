import Link from "next/link";
import { MessageCircle } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/product" },
    { label: "WhatsApp Inbox", href: "/channels/whatsapp" },
    { label: "Instagram Inbox", href: "/channels/instagram" },
    { label: "Messenger Inbox", href: "/channels/messenger" },
    { label: "Pricing", href: "/pricing" },
  ],
  Solutions: [
    { label: "Restaurants", href: "/solutions/restaurants" },
    { label: "Clinics", href: "/solutions/clinics" },
    { label: "eCommerce", href: "/solutions/ecommerce-fashion" },
    { label: "Real Estate", href: "/solutions/real-estate" },
    { label: "Salons", href: "/solutions/salons" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="Ittisalo Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-display font-bold text-xl tracking-tight text-[var(--color-mktg-base)]">
                Ittisalo
              </span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              One AI inbox for every DM your business gets. Automate responses, take orders, and book appointments across WhatsApp, Instagram, and Messenger.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-mktg-surface)] mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.Product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-[var(--color-mktg-cta)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-mktg-surface)] mb-4 text-sm uppercase tracking-wider">Solutions</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.Solutions.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-[var(--color-mktg-cta)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-mktg-surface)] mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.Company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-[var(--color-mktg-cta)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--color-mktg-surface)] mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.Legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-[var(--color-mktg-cta)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Ittisalo. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-mktg-surface)] bg-gray-50 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
            <MessageCircle size={16} className="text-[var(--color-mktg-cta)]" /> Chat with us
          </div>
        </div>
      </div>
    </footer>
  );
}
