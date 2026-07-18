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
    name: "Restaurants & Dhabas",
    detail: "Menu questions, orders, delivery status — answered before the tandoor cools.",
  },
  {
    icon: Stethoscope,
    name: "Clinics & Labs",
    detail: "Books appointments, sends reports, reminds patients an hour before their slot.",
  },
  {
    icon: ShoppingBag,
    name: "Fashion & eCommerce",
    detail: "Checks stock, quotes price and size, and reserves the piece your customer wants.",
  },
  {
    icon: Building2,
    name: "Real Estate",
    detail: "Qualifies leads, shares listings, and lines up site visits while you're on-site.",
  },
  {
    icon: Scissors,
    name: "Salons & Studios",
    detail: "Manages bookings by stylist and time, and fills last-minute cancellations.",
  },
];

export default function Verticals() {
  return (
    <section id="verticals" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-maroon">
            Who it&apos;s for
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            One AI, taught the language of five different shopfronts.
          </h2>
          <p className="mt-4 text-balance font-body text-ink/60">
            Ittisalo isn&apos;t a generic chatbot. Each business gets a
            knowledge base trained on its own menu, price list, or service
            catalogue — so the answers sound like they came from someone who
            actually works there.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {verticals.map((v, i) => (
            <motion.div
              key={v.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white/50 p-6 transition-colors hover:border-maroon/30 hover:bg-white lg:[&:nth-child(5)]:col-span-2 lg:[&:nth-child(5)]:sm:col-span-1"
            >
              <v.icon
                className="mb-5 h-7 w-7 text-maroon transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                strokeWidth={1.5}
              />
              <h3 className="font-display text-lg font-medium text-ink">
                {v.name}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/55">
                {v.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
