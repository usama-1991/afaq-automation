"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Bot,
  MessageSquare,
  Users,
  ShoppingCart,
  CalendarCheck,
  BarChart3,
  Headphones,
  Globe,
  Building2,
  Stethoscope,
  UtensilsCrossed,
  ShoppingBag,
  Scissors,
  Menu,
  X,
} from "lucide-react";

const productLinks = [
  { icon: Bot, label: "AI Chatbot", desc: "24/7 intelligent customer conversations", href: "/features/ai-chatbot" },
  { icon: MessageSquare, label: "Shared Inbox", desc: "Human + AI collaboration in one inbox", href: "/features/shared-inbox" },
  { icon: ShoppingCart, label: "Order Management", desc: "Take orders directly via WhatsApp", href: "/features/order-management" },
  { icon: CalendarCheck, label: "Appointment Booking", desc: "Smart scheduling with reminders", href: "/features/appointment-booking" },
  { icon: BarChart3, label: "Analytics Dashboard", desc: "Track performance and insights", href: "/features/analytics" },
  { icon: Headphones, label: "Campaign Manager", desc: "Broadcast to thousands instantly", href: "/features/campaigns" },
];

const industryLinks = [
  { icon: UtensilsCrossed, label: "Restaurants & Food", href: "/industries/restaurants" },
  { icon: Stethoscope, label: "Clinics & Healthcare", href: "/industries/clinics" },
  { icon: ShoppingBag, label: "Fashion & eCommerce", href: "/industries/ecommerce" },
  { icon: Building2, label: "Real Estate", href: "/industries/real-estate" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const router = useRouter();

  const handlePrefetch = useCallback((href: string) => {
    if (href && href.startsWith('/')) {
      router.prefetch(href);
    }
  }, [router]);

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
      {/* Announcement Bar */}
      <div className="landing-announcement-bar">
        <div className="landing-announcement-inner">
          <span className="landing-announcement-sparkle">✦</span>
          <span>Ittisalo now supports <strong>multi-language AI</strong> — English, Urdu, and Roman Urdu.</span>
          <a href="/features" className="landing-announcement-link">
            Explore Features <span>→</span>
          </a>
        </div>
      </div>

      {/* Main Nav */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`}
      >
        <div className="landing-nav-inner">
          {/* Logo */}
          <Link href="/landing" className="landing-nav-logo">
            <div className="landing-nav-logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill="white" />
                <path
                  d="M16 7L17.6 13.4L24 16L17.6 18.6L16 25L14.4 18.6L8 16L14.4 13.4L16 7Z"
                  fill="#C42B33"
                />
              </svg>
            </div>
            <span className="landing-nav-logo-text">Ittisalo</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="landing-nav-links">
            {/* Products Dropdown */}
            <div
              className="landing-nav-dropdown"
              onMouseEnter={() => setActiveDropdown("products")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="landing-nav-link">
                Products <ChevronDown size={14} className={`landing-nav-chevron ${activeDropdown === "products" ? "rotated" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "products" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="landing-dropdown-panel"
                  >
                    <div className="landing-dropdown-grid">
                      {productLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="landing-dropdown-item"
                          onMouseEnter={() => handlePrefetch(item.href)}
                          onFocus={() => handlePrefetch(item.href)}
                        >
                          <div className="landing-dropdown-icon">
                            <item.icon size={18} />
                          </div>
                          <div>
                            <div className="landing-dropdown-label">{item.label}</div>
                            <div className="landing-dropdown-desc">{item.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Industries Dropdown */}
            <div
              className="landing-nav-dropdown"
              onMouseEnter={() => setActiveDropdown("industries")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="landing-nav-link">
                Industries <ChevronDown size={14} className={`landing-nav-chevron ${activeDropdown === "industries" ? "rotated" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "industries" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="landing-dropdown-panel landing-dropdown-panel--narrow"
                  >
                    <div className="landing-dropdown-list">
                      {industryLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="landing-dropdown-item"
                          onMouseEnter={() => handlePrefetch(item.href)}
                          onFocus={() => handlePrefetch(item.href)}
                        >
                          <div className="landing-dropdown-icon">
                            <item.icon size={18} />
                          </div>
                          <div className="landing-dropdown-label">{item.label}</div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/features" className="landing-nav-link" onMouseEnter={() => handlePrefetch("/features")} onFocus={() => handlePrefetch("/features")}>Features</Link>
            <Link href="/how-it-works" className="landing-nav-link" onMouseEnter={() => handlePrefetch("/how-it-works")} onFocus={() => handlePrefetch("/how-it-works")}>How It Works</Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="landing-nav-ctas">
            <a
              href="https://app.ittisalo.com/login"
              className="landing-nav-link"
            >
              Login
            </a>
            <Link
              href="/book-demo"
              className="landing-btn-ghost"
              onMouseEnter={() => handlePrefetch("/book-demo")}
              onFocus={() => handlePrefetch("/book-demo")}
            >
              Book a Demo
            </Link>
            <a
              href="https://wa.me/923360479649"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn-primary-nav"
            >
              <span>Contact Us</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="landing-nav-hamburger"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu-panel landing-mobile-panel ${mobileOpen ? "open" : ""}`}>
        <div className="flex flex-col px-8 pt-24 pb-10">
          <nav className="flex flex-col gap-1">
            {[
              { label: "Features", href: "/features" },
              { label: "Industries", href: "/industries" },
              { label: "How It Works", href: "/how-it-works" },
            ].map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={false}
                animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: mobileOpen ? i * 0.05 : 0 }}
                className="py-3 text-lg font-medium text-white/80 transition-colors hover:text-white border-b border-white/[0.08]"
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          <div className="mt-10 flex flex-col gap-3">
            <a
              href="https://app.ittisalo.com/login"
              className="landing-btn-ghost rounded-full px-6 py-3 text-center text-sm font-semibold"
            >
              Login to Portal
            </a>
            <Link
              href="/book-demo"
              className="landing-btn-ghost rounded-full px-6 py-3 text-center text-sm font-semibold"
            >
              Book a Demo
            </Link>
            <a
              href="https://wa.me/923360479649"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn-primary-nav rounded-full px-6 py-3 text-center text-sm font-semibold"
            >
              <span>Contact Us</span>
            </a>
          </div>

          <div className="mt-auto pt-16">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Ittisalo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(Nav);
