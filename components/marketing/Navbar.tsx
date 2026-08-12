"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHANNELS = [
  { name: "WhatsApp", path: "/channels/whatsapp", color: "var(--color-mktg-wa)" },
  { name: "Instagram", path: "/channels/instagram", color: "var(--color-mktg-ig)" },
  { name: "Messenger", path: "/channels/messenger", color: "var(--color-mktg-ms)" },
];

const SOLUTIONS = [
  { name: "Restaurants", path: "/solutions/restaurants" },
  { name: "Clinics", path: "/solutions/clinics" },
  { name: "eCommerce & Fashion", path: "/solutions/ecommerce-fashion" },
  { name: "Real Estate", path: "/solutions/real-estate" },
  { name: "Salons", path: "/solutions/salons" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-mktg-bg)]/80 backdrop-blur-md border-b border-[var(--color-mktg-surface)]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-mktg-cta)] flex items-center justify-center text-white font-bold text-xl">
              I
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-[var(--color-mktg-base)]">
              Ittisalo
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/product" className="px-4 py-2 text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors">
              Product
            </Link>

            {/* Channels Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors">
                Channels <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[200px] flex flex-col gap-1">
                  {CHANNELS.map((channel) => (
                    <Link
                      key={channel.name}
                      href={channel.path}
                      className="px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color }} />
                      <span className="font-medium text-sm text-[var(--color-mktg-surface)]">{channel.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors">
                Solutions <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[240px] flex flex-col gap-1">
                  {SOLUTIONS.map((sol) => (
                    <Link
                      key={sol.name}
                      href={sol.path}
                      className="px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center transition-colors font-medium text-sm text-[var(--color-mktg-surface)]"
                    >
                      {sol.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/pricing" className="px-4 py-2 text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors">
              Pricing
            </Link>
            <Link href="/case-studies" className="px-4 py-2 text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors">
              Case Studies
            </Link>
            <Link href="/blog" className="px-4 py-2 text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors">
              Blog
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="https://app.ittisalo.com/login"
              className="text-sm font-medium hover:text-[var(--color-mktg-cta)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/contact"
              className="bg-[var(--color-mktg-cta)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              Book a Demo
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-[var(--color-mktg-base)]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--color-mktg-surface)]/10 bg-white"
          >
            <div className="px-4 py-4 space-y-4">
              <Link href="/product" className="block px-4 py-2 font-medium" onClick={() => setIsOpen(false)}>Product</Link>
              
              <div>
                <button onClick={() => toggleDropdown('channels')} className="flex items-center justify-between w-full px-4 py-2 font-medium">
                  Channels <ChevronDown size={16} className={`transition-transform ${openDropdown === 'channels' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'channels' && (
                  <div className="pl-8 py-2 space-y-2 border-l-2 border-gray-100 ml-4">
                    {CHANNELS.map(c => (
                      <Link key={c.name} href={c.path} className="block py-2 text-sm text-gray-600" onClick={() => setIsOpen(false)}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => toggleDropdown('solutions')} className="flex items-center justify-between w-full px-4 py-2 font-medium">
                  Solutions <ChevronDown size={16} className={`transition-transform ${openDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'solutions' && (
                  <div className="pl-8 py-2 space-y-2 border-l-2 border-gray-100 ml-4">
                    {SOLUTIONS.map(s => (
                      <Link key={s.name} href={s.path} className="block py-2 text-sm text-gray-600" onClick={() => setIsOpen(false)}>
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/pricing" className="block px-4 py-2 font-medium" onClick={() => setIsOpen(false)}>Pricing</Link>
              <Link href="/case-studies" className="block px-4 py-2 font-medium" onClick={() => setIsOpen(false)}>Case Studies</Link>
              <Link href="/blog" className="block px-4 py-2 font-medium" onClick={() => setIsOpen(false)}>Blog</Link>
              
              <div className="pt-4 border-t border-gray-100 grid gap-4">
                <a href="https://app.ittisalo.com/login" className="block text-center px-4 py-3 font-medium bg-gray-50 rounded-lg" onClick={() => setIsOpen(false)}>Log in</a>
                <Link href="/contact" className="block text-center px-4 py-3 font-medium bg-[var(--color-mktg-cta)] text-white rounded-lg" onClick={() => setIsOpen(false)}>Book a Demo</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
