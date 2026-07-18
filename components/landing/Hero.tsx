"use client";

import { motion } from "framer-motion";
import PhoneMock from "./PhoneMock";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-16 lg:pb-32 lg:pt-24">
      <div className="grain-overlay" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-10">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink/60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Built for Pakistani SMBs
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[4rem]"
          >
            Your shop&apos;s best
            <br />
            <span className="italic text-maroon">WhatsApp reply</span>
            <br />
            never sleeps.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-7 max-w-lg text-balance font-body text-lg leading-relaxed text-ink/65"
          >
            Ittisalo answers every customer message in Urdu or English, takes
            the order or books the appointment, and quietly hands you the
            chat the moment a human touch is needed. No app to learn — it
            lives on the number you already use.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="https://app.ittisalo.com/onboarding"
              className="group relative overflow-hidden rounded-full bg-maroon px-7 py-3.5 font-body text-sm font-semibold text-white shadow-lg shadow-maroon/25 transition-transform hover:-translate-y-0.5"
            >
              See it on your number
            </a>
            <a
              href="#how"
              className="rounded-full border border-ink/20 px-7 py-3.5 font-body text-sm font-semibold text-ink/80 transition hover:border-ink/40 hover:text-ink"
            >
              How it works ↓
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-ink/10 pt-8"
          >
            {[
              ["< 3 sec", "typical first reply"],
              ["5", "verticals supported"],
              ["24/7", "always answering"],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className="font-display text-2xl font-semibold text-ink">
                  {stat}
                </p>
                <p className="font-mono text-xs uppercase tracking-wide text-ink/45">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <PhoneMock />
        </motion.div>
      </div>
    </section>
  );
}
