"use client";

import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Stethoscope,
  ShoppingBag,
  Building2,
  Scissors,
} from "lucide-react";

const verticals = [
  {
    icon: UtensilsCrossed,
    name: "Restaurants & Food",
    detail: "Menu inquiries, order taking, delivery updates — answered before your customer finishes typing.",
    color: "#D98E1F",
    bgColor: "rgba(217, 142, 31, 0.08)",
  },
  {
    icon: Stethoscope,
    name: "Clinics & Labs",
    detail: "Books appointments, sends test reports, reminds patients before their slots — no receptionist needed.",
    color: "#1B9E96",
    bgColor: "rgba(27, 158, 150, 0.08)",
  },
  {
    icon: ShoppingBag,
    name: "Fashion & eCommerce",
    detail: "Checks stock, quotes prices and sizes, takes orders, and confirms delivery — like your best salesperson.",
    color: "#C42B33",
    bgColor: "rgba(196, 43, 51, 0.08)",
  },
  {
    icon: Building2,
    name: "Real Estate",
    detail: "Qualifies leads, shares property listings, and schedules site visits while you focus on closings.",
    color: "#6366F1",
    bgColor: "rgba(99, 102, 241, 0.08)",
  },
  {
    icon: Scissors,
    name: "Salons & Studios",
    detail: "Manages bookings by stylist and time slot, handles cancellations, and fills last-minute openings.",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.08)",
  },
];

export default function Verticals() {
  return (
    <section id="verticals" className="relative landing-section">
      <div className="bg-mesh absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-maroon/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-maroon">
            Who It&apos;s For
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            One AI, trained for{" "}
            <span className="bg-gradient-to-r from-maroon to-teal bg-clip-text text-transparent">
              your industry
            </span>
          </h2>
          <p className="mt-4 text-balance text-ink/50 text-lg">
            Ittisalo isn&apos;t a generic chatbot. Each business gets a custom AI
            trained on its own products, prices, and services — so every answer
            sounds like it came from your best employee.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {verticals.map((v, i) => (
            <motion.div
              key={v.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-card group rounded-2xl p-7"
            >
              <div
                className="feature-icon-wrap mb-5"
                style={{ backgroundColor: v.bgColor }}
              >
                <v.icon
                  className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: v.color }}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="text-base font-semibold text-ink">
                {v.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/50">
                {v.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
