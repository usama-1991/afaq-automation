"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section id="demo" className="relative overflow-hidden landing-section">
      {/* Background */}
      <div className="bg-hero-gradient absolute inset-0" />
      <div className="bg-grid-pattern absolute inset-0 opacity-30" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-maroon/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/[0.08] bg-white/60 px-4 py-2 backdrop-blur-sm">
            <span className="status-badge status-online text-[11px]">Ready to go</span>
          </div>

          <h2 className="text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            Send it a message.{" "}
            <span className="bg-gradient-to-r from-maroon to-teal bg-clip-text text-transparent">
              See what your customers
            </span>{" "}
            would see.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-balance text-ink/50 text-lg leading-relaxed">
            We&apos;ll set up a live sandbox on your own number in one call — no
            commitment, no card required. See Ittisalo handle real conversations
            on your WhatsApp.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://app.ittisalo.com/onboarding"
              className="btn-primary rounded-full px-10 py-4.5 text-sm font-semibold shadow-lg shadow-maroon/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                Book Your Live Demo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </a>
            <a
              href="mailto:admin@ittisalo.io"
              className="btn-secondary rounded-full px-8 py-4.5 text-sm font-semibold"
            >
              Talk to Us via Email
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-ink/35">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              14-day free trial
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Setup in under 30 minutes
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
