"use client";

import { motion } from "framer-motion";
import {
  Clock,
  ShieldCheck,
  Inbox,
  Search,
  BarChart3,
  Languages,
  ShoppingCart,
  CalendarCheck,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "24/7 AI Customer Support",
    detail: "Every message gets an instant, accurate response — even at 3 AM. Your customers never wait.",
    color: "#1B9E96",
    bgColor: "rgba(27, 158, 150, 0.08)",
  },
  {
    icon: Search,
    title: "Product & Service Questions",
    detail: "Answers from your own catalogue. No made-up prices or invented stock — every reply is grounded in your data.",
    color: "#C42B33",
    bgColor: "rgba(196, 43, 51, 0.08)",
  },
  {
    icon: ShoppingCart,
    title: "Automated Order Taking",
    detail: "Takes orders, confirms quantities, calculates totals, and processes COD or online payment preferences.",
    color: "#D98E1F",
    bgColor: "rgba(217, 142, 31, 0.08)",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booking",
    detail: "Books appointments by time slot, sends confirmations, and reminds customers before their visit.",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.08)",
  },
  {
    icon: ShieldCheck,
    title: "Lead Qualification",
    detail: "Identifies serious buyers, captures their requirements, and routes hot leads to your sales team instantly.",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.08)",
  },
  {
    icon: Inbox,
    title: "Human Handoff",
    detail: "A shared inbox that senses when a chat needs a human touch and routes it to your team seamlessly.",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.08)",
  },
  {
    icon: BarChart3,
    title: "Business Dashboard",
    detail: "Orders, leads, and appointments in one place. See what customers asked for and track your AI's performance.",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.08)",
  },
  {
    icon: Languages,
    title: "English & Urdu Support",
    detail: "Built for how your customers actually communicate — English, Urdu, Roman Urdu, or a mix of all three.",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.08)",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative landing-section">
      <div className="bg-dot-pattern absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-teal/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal">
            What Ittisalo Can Do
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            Everything a busy business needs,{" "}
            <span className="text-ink/40">none of the app-switching.</span>
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass-card group rounded-2xl p-7"
            >
              <div
                className="feature-icon-wrap mb-5"
                style={{ backgroundColor: f.bgColor }}
              >
                <f.icon
                  className="h-5 w-5 transition-all duration-300 group-hover:scale-110"
                  style={{ color: f.color }}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-[15px] font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/45">
                {f.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
