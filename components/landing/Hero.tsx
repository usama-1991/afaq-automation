"use client";

import { motion } from "framer-motion";
import PhoneMock from "./PhoneMock";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 lg:pb-32 lg:pt-20">
      {/* Background Effects */}
      <div className="bg-hero-gradient absolute inset-0" />
      <div className="bg-grid-pattern absolute inset-0 opacity-40" />
      <div className="grain-overlay" />

      {/* Floating background orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-teal/[0.04] blur-3xl animate-float-slow" />
      <div className="absolute bottom-20 right-[5%] w-96 h-96 rounded-full bg-maroon/[0.03] blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />
      <div className="absolute top-40 right-[30%] w-64 h-64 rounded-full bg-saffron/[0.03] blur-3xl animate-float-slow" style={{ animationDelay: "5s" }} />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-10">
        {/* Left Content */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-ink/[0.08] bg-white/70 px-4 py-2 backdrop-blur-sm"
          >
            <span className="status-badge status-online text-[11px]">AI Active</span>
            <span className="text-xs font-medium text-ink/50">Built for Pakistani SMBs</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-[2.75rem] font-bold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]"
          >
            Your AI-powered{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-maroon to-maroon-light bg-clip-text text-transparent">
                WhatsApp assistant
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-maroon to-maroon-light origin-left"
              />
            </span>{" "}
            that never sleeps.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-7 max-w-lg text-balance text-lg leading-relaxed text-ink/55"
          >
            Ittisalo responds instantly to every customer message, handles
            product questions, takes orders, books appointments, and hands
            conversations to your team when needed — all on the WhatsApp number
            you already use.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="https://app.ittisalo.com/onboarding"
              className="btn-primary rounded-full px-8 py-4 text-sm font-semibold shadow-lg shadow-maroon/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                See Ittisalo in Action
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </a>
            <a
              href="#demo"
              className="btn-secondary rounded-full px-7 py-4 text-sm font-semibold"
            >
              Book a Demo
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-14 flex flex-wrap gap-x-10 gap-y-5 border-t border-ink/[0.06] pt-8"
          >
            {[
              ["< 3 sec", "Average first reply"],
              ["24/7", "Always online"],
              ["5+", "Industries served"],
            ].map(([stat, label]) => (
              <div key={label} className="group">
                <p className="text-2xl font-bold text-ink tracking-tight">
                  {stat}
                </p>
                <p className="text-xs font-medium text-ink/40 uppercase tracking-wide mt-1">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right - Phone Mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  );
}
