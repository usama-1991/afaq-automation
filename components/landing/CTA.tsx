"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section id="demo" className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-balance font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
        >
          Send it a message. See what
          <span className="italic text-maroon"> your customers</span> would
          see.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-balance font-body text-ink/60"
        >
          We&apos;ll set up a live sandbox on your own number in one call —
          no commitment, no card required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="https://app.ittisalo.com/onboarding"
            className="rounded-full bg-maroon px-8 py-4 font-body text-sm font-semibold text-white shadow-lg shadow-maroon/25 transition-transform hover:-translate-y-0.5"
          >
            Book your live demo
          </a>
          <a
            href="mailto:admin@ittisalo.io"
            className="rounded-full border border-ink/20 px-8 py-4 font-body text-sm font-semibold text-ink/80 transition hover:border-ink/40 hover:text-ink"
          >
            Talk to us via Email
          </a>
        </motion.div>
      </div>
    </section>
  );
}
