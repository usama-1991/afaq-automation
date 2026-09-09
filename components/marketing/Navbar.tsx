"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X, Sparkles, MessageSquare, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHANNELS = [
  { name: "WhatsApp Business API", path: "/channels/whatsapp", color: "#25D366", desc: "Catalog sharing, click-to-WhatsApp ads & official green tick setup" },
  { name: "Instagram DMs & Stories", path: "/channels/instagram", color: "#E1306C", desc: "Story replies, comment auto-DM & catalog link dispatch" },
  { name: "Facebook Messenger", path: "/channels/messenger", color: "#0084FF", desc: "Lead ads instant conversion & customer service routing" },
];

const SOLUTIONS = [
  { name: "Restaurants & Cafes", path: "/solutions/restaurants", badge: "Order Bot", desc: "Digital menu, order confirmation & WhatsApp delivery tracking" },
  { name: "Dental & Health Clinics", path: "/solutions/clinics", badge: "Booking AI", desc: "24/7 appointment scheduling, reminders & patient intake" },
  { name: "Salons & Spas", path: "/solutions/salons", badge: "No-Show Shield", desc: "Automated booking, deposit collection & appointment alerts" },
  { name: "eCommerce & Apparel", path: "/solutions/ecommerce-fashion", badge: "Cart Recovery", desc: "Product catalog browsing, abandoned cart recovery & COD confirmation" },
  { name: "Real Estate Agencies", path: "/solutions/real-estate", badge: "Lead Capture", desc: "Property brochure dispatch, site visit booking & lead scoring" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-[#EFEBE4]"
          : "bg-[#FDFCFB]/80 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Ittisalo Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
            />
            <span className="font-display font-extrabold text-2xl tracking-tight text-[#1A1517]">
              Ittisalo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/product"
              className="px-4 py-2 text-sm font-semibold text-[#5C5255] hover:text-[#C81E3A] transition-colors rounded-lg hover:bg-[#FFF5F5]"
            >
              Product
            </Link>

            {/* Channels Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#5C5255] group-hover:text-[#C81E3A] transition-colors rounded-lg group-hover:bg-[#FFF5F5]">
                Channels
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-[360px]">
                <div className="bg-white rounded-2xl shadow-xl border border-[#EFEBE4] p-3 flex flex-col gap-1.5">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#8C8285] uppercase tracking-wider">
                    Supported Messaging Platforms
                  </div>
                  {CHANNELS.map((channel) => (
                    <Link
                      key={channel.name}
                      href={channel.path}
                      className="p-3 rounded-xl hover:bg-[#FFF5F5] flex items-start gap-3.5 transition-colors group/item"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5"
                        style={{ backgroundColor: channel.color }}
                      >
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1A1517] group-hover/item:text-[#C81E3A] transition-colors flex items-center justify-between">
                          {channel.name}
                        </div>
                        <p className="text-xs text-[#5C5255] mt-0.5 leading-snug">{channel.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#5C5255] group-hover:text-[#C81E3A] transition-colors rounded-lg group-hover:bg-[#FFF5F5]">
                Solutions
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-[420px]">
                <div className="bg-white rounded-2xl shadow-xl border border-[#EFEBE4] p-3 flex flex-col gap-1.5">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#8C8285] uppercase tracking-wider flex items-center justify-between">
                    <span>Industry Vertical Workflows</span>
                    <span className="text-[#C81E3A] font-bold">Pre-Trained AI</span>
                  </div>
                  {SOLUTIONS.map((solution) => (
                    <Link
                      key={solution.name}
                      href={solution.path}
                      className="p-3 rounded-xl hover:bg-[#FFF5F5] flex items-start gap-3 transition-colors group/item"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#E63946] mt-2 shrink-0 group-hover/item:scale-125 transition-transform" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#1A1517] group-hover/item:text-[#C81E3A] transition-colors flex items-center justify-between">
                          <span>{solution.name}</span>
                          <span className="text-[10px] font-bold bg-[#FFE8EA] text-[#8B1531] px-2 py-0.5 rounded-full">
                            {solution.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5255] mt-0.5">{solution.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-semibold text-[#5C5255] hover:text-[#C81E3A] transition-colors rounded-lg hover:bg-[#FFF5F5]"
            >
              Pricing
            </Link>
            <Link
              href="/case-studies"
              className="px-4 py-2 text-sm font-semibold text-[#5C5255] hover:text-[#C81E3A] transition-colors rounded-lg hover:bg-[#FFF5F5]"
            >
              Case Studies
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2 text-sm font-semibold text-[#5C5255] hover:text-[#C81E3A] transition-colors rounded-lg hover:bg-[#FFF5F5]"
            >
              Blog
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://app.ittisalo.com/login"
              className="px-4 py-2 text-sm font-bold text-[#1A1517] hover:text-[#C81E3A] transition-colors"
            >
              Log In
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md shadow-[#E63946]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
            >
              Book a Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2.5 rounded-xl text-[#1A1517] hover:bg-[#FFF5F5] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[#EFEBE4] bg-white overflow-hidden shadow-xl"
          >
            <div className="px-5 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <Link
                href="/product"
                className="block px-3 py-2 rounded-lg font-bold text-[#1A1517] hover:bg-[#FFF5F5]"
                onClick={() => setIsOpen(false)}
              >
                Product Features
              </Link>

              <div>
                <button
                  onClick={() => toggleDropdown("channels")}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg font-bold text-[#1A1517] hover:bg-[#FFF5F5]"
                >
                  Channels
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${openDropdown === "channels" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "channels" && (
                  <div className="pl-4 py-2 space-y-2 border-l-2 border-[#FFE8EA] ml-3 mt-1">
                    {CHANNELS.map((c) => (
                      <Link
                        key={c.name}
                        href={c.path}
                        className="block py-2 px-3 text-sm font-semibold text-[#5C5255] hover:text-[#C81E3A]"
                        onClick={() => setIsOpen(false)}
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => toggleDropdown("solutions")}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg font-bold text-[#1A1517] hover:bg-[#FFF5F5]"
                >
                  Solutions
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${openDropdown === "solutions" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "solutions" && (
                  <div className="pl-4 py-2 space-y-2 border-l-2 border-[#FFE8EA] ml-3 mt-1">
                    {SOLUTIONS.map((s) => (
                      <Link
                        key={s.name}
                        href={s.path}
                        className="flex items-center justify-between py-2 px-3 text-sm font-semibold text-[#5C5255] hover:text-[#C81E3A]"
                        onClick={() => setIsOpen(false)}
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] font-bold bg-[#FFE8EA] text-[#8B1531] px-2 py-0.5 rounded-full">
                          {s.badge}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/pricing"
                className="block px-3 py-2 rounded-lg font-bold text-[#1A1517] hover:bg-[#FFF5F5]"
                onClick={() => setIsOpen(false)}
              >
                Pricing Plans
              </Link>
              <Link
                href="/case-studies"
                className="block px-3 py-2 rounded-lg font-bold text-[#1A1517] hover:bg-[#FFF5F5]"
                onClick={() => setIsOpen(false)}
              >
                Customer Case Studies
              </Link>
              <Link
                href="/blog"
                className="block px-3 py-2 rounded-lg font-bold text-[#1A1517] hover:bg-[#FFF5F5]"
                onClick={() => setIsOpen(false)}
              >
                Blog & Insights
              </Link>

              <div className="pt-4 border-t border-[#EFEBE4] space-y-3">
                <a
                  href="https://app.ittisalo.com/login"
                  className="block text-center px-4 py-3 font-bold text-[#1A1517] bg-[#FDFCFB] border border-[#EFEBE4] rounded-xl"
                  onClick={() => setIsOpen(false)}
                >
                  Log In
                </a>
                <Link
                  href="/contact"
                  className="block text-center px-4 py-3 font-bold text-white rounded-xl shadow-md shadow-[#E63946]/20"
                  style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
                  onClick={() => setIsOpen(false)}
                >
                  Book a Demo & Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

