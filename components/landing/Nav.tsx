"use client";

import { motion } from "framer-motion";

export default function Nav() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#" className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="8" fill="#0E1629" />
            <path
              d="M15 6L16.8 13.2L24 15L16.8 16.8L15 24L13.2 16.8L6 15L13.2 13.2L15 6Z"
              fill="#B8262F"
            />
          </svg>
          <span className="font-display text-xl font-semibold tracking-tight">
            Ittisalo
          </span>
        </a>

        <nav className="hidden items-center gap-8 font-body text-sm font-medium text-ink/70 md:flex">
          <a href="#verticals" className="transition hover:text-ink">
            Who it&apos;s for
          </a>
          <a href="#how" className="transition hover:text-ink">
            How it works
          </a>
          <a href="#features" className="transition hover:text-ink">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-ink">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://app.ittisalo.com/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:text-ink sm:block"
          >
            Login to Portal
          </a>
          <a
            href="https://app.ittisalo.com/onboarding"
            className="group relative overflow-hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition"
          >
            <span className="relative z-10">Book a demo</span>
            <span className="absolute inset-0 -translate-x-full bg-maroon transition-transform duration-300 group-hover:translate-x-0" />
          </a>
        </div>
      </div>
      <div className="jaan-border-thin" />
    </motion.header>
  );
}
