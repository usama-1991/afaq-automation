"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Who It's For", href: "#verticals" },
  { label: "How It Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-paper/85 backdrop-blur-xl border-b border-ink/[0.06] shadow-[0_1px_20px_rgba(14,22,41,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill="#0E1629" />
                <path
                  d="M16 7L17.6 13.4L24 16L17.6 18.6L16 25L14.4 18.6L8 16L14.4 13.4L16 7Z"
                  fill="#C42B33"
                />
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal border-2 border-paper" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-ink">
              Ittisalo
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative px-4 py-2 text-[13.5px] font-medium text-ink/60 transition-colors duration-200 hover:text-ink rounded-lg hover:bg-ink/[0.03]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="https://app.ittisalo.com/login"
              className="px-4 py-2 text-[13.5px] font-medium text-ink/60 transition-colors hover:text-ink"
            >
              Login to Portal
            </a>
            <a
              href="https://app.ittisalo.com/onboarding"
              className="btn-primary rounded-full px-6 py-2.5 text-[13.5px] font-semibold"
            >
              <span className="relative z-10">Book a Demo</span>
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-[1000] flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-[2px] w-5 rounded-full bg-ink transition-colors"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              className="block h-[2px] w-5 rounded-full bg-ink"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-[2px] w-5 rounded-full bg-ink transition-colors"
            />
          </button>
        </div>
        <div className="jaan-border-thin" />
      </motion.header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu-panel ${mobileOpen ? "open" : ""}`}>
        <div className="flex flex-col px-8 pt-24 pb-10">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={false}
                animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: mobileOpen ? i * 0.05 : 0 }}
                className="py-3 text-lg font-medium text-ink/80 transition-colors hover:text-maroon border-b border-ink/[0.06]"
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          <div className="mt-10 flex flex-col gap-3">
            <a
              href="https://app.ittisalo.com/login"
              className="btn-secondary rounded-full px-6 py-3 text-center text-sm font-semibold"
            >
              Login to Portal
            </a>
            <a
              href="https://app.ittisalo.com/onboarding"
              className="btn-primary rounded-full px-6 py-3 text-center text-sm font-semibold"
            >
              <span className="relative z-10">Book a Demo</span>
            </a>
          </div>

          <div className="mt-auto pt-16">
            <p className="text-xs text-ink/40">
              © {new Date().getFullYear()} Ittisalo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
