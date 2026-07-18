"use client";

import { motion } from "framer-motion";
import {
  Mic,
  ShieldCheck,
  Inbox,
  Search,
  BarChart3,
  Languages,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Understands voice notes",
    detail:
      "Customers who'd rather speak than type get answered just as fast — Ittisalo transcribes and replies in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Catches risky COD orders",
    detail:
      "Flags repeat order-and-cancel patterns across the network before they reach your delivery rider.",
  },
  {
    icon: Inbox,
    title: "Pause & takeover inbox",
    detail:
      "A shared inbox that senses when a chat needs a human tone and routes it to your team instantly.",
  },
  {
    icon: Search,
    title: "Answers from your own catalogue",
    detail:
      "No made-up prices or invented stock. Every reply is grounded in the menu or price list you gave it.",
  },
  {
    icon: BarChart3,
    title: "A dashboard that shows what sold",
    detail:
      "Orders, leads and appointments land in one place — see what customers actually asked for this week.",
  },
  {
    icon: Languages,
    title: "Comfortable in Roman Urdu",
    detail:
      "Built for how your customers actually type — Roman Urdu, English, or a mix of both in the same message.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-teal">
            What&apos;s under the hood
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Everything a busy front desk needs, none of the app-switching.
          </h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group bg-paper p-8 transition-colors hover:bg-white"
            >
              <f.icon
                className="mb-5 h-6 w-6 text-ink/70 transition-colors group-hover:text-maroon"
                strokeWidth={1.5}
              />
              <h3 className="font-display text-lg font-medium text-ink">
                {f.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/55">
                {f.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
