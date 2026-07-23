"use client";

import { motion } from "framer-motion";
import { Store, Utensils, Scissors, Building, Stethoscope } from "lucide-react";

const industries = [
  { icon: Store, label: "Retail Stores" },
  { icon: Utensils, label: "Restaurants" },
  { icon: Scissors, label: "Salons" },
  { icon: Building, label: "Real Estate" },
  { icon: Stethoscope, label: "Clinics" },
];

export default function Trust() {
  return (
    <section className="relative bg-ink overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-maroon/[0.04] blur-[150px]" />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight text-paper sm:text-4xl lg:text-[2.75rem]">
            Built for the businesses that{" "}
            <span className="bg-gradient-to-r from-saffron to-maroon-light bg-clip-text text-transparent">
              run Pakistan
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-paper/45 text-lg leading-relaxed">
            From clothing stores to restaurants, clinics, salons, and service
            businesses — Ittisalo helps teams respond faster and never miss a
            customer conversation.
          </p>
        </motion.div>

        {/* Industry Icons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-6"
        >
          {industries.map((ind, i) => (
            <motion.div
              key={ind.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <ind.icon className="h-6 w-6 text-paper/40" strokeWidth={1.5} />
              <span className="text-xs font-medium text-paper/50">{ind.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Future testimonials placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex -space-x-3">
              {["#C42B33", "#1B9E96", "#D98E1F", "#6366F1", "#EC4899"].map((color, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {["R", "K", "L", "I", "F"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-paper/30 italic">
              Customer stories coming soon — we&apos;re currently onboarding our first cohort of businesses.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
