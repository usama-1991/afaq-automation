"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Connect your WhatsApp number",
    detail:
      "Link your existing business number through Meta's official WhatsApp Business API — no green-badge app switching, no new number to give customers.",
  },
  {
    n: "02",
    title: "Teach it your business",
    detail:
      "Upload your menu, price list, service hours, or catalogue. Ittisalo reads it once and starts answering in your voice, in Urdu or English.",
  },
  {
    n: "03",
    title: "Let it handle the first reply",
    detail:
      "Every incoming message gets an instant, accurate answer — orders placed, appointments booked, questions resolved, day or night.",
  },
  {
    n: "04",
    title: "Step in exactly when it matters",
    detail:
      "If a conversation turns tricky or a customer asks for a person, Ittisalo pauses and pings you — you take over in the same chat thread.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative bg-ink py-24 text-paper lg:py-32">
      <div className="jaan-border-thin" />
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-xl"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-saffron">
            How it works
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Live in an afternoon, not a quarter.
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <span className="font-display text-5xl font-semibold text-paper/15">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-xl font-medium text-paper">
                {s.title}
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-paper/55">
                {s.detail}
              </p>
              {i < steps.length - 1 && (
                <span className="absolute -right-4 top-6 hidden h-px w-8 bg-paper/20 lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
