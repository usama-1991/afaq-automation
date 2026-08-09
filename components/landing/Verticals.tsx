"use client";

import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Stethoscope,
  ShoppingBag,
  Building2,
  Scissors,
  Truck,
  GraduationCap,
  Dumbbell,
} from "lucide-react";

const verticals = [
  {
    icon: UtensilsCrossed,
    name: "Restaurants & Food",
    detail: "Menu inquiries, order taking, delivery updates — answered before your customer finishes typing.",
    color: "#F2A93B",
    gradient: "linear-gradient(135deg, rgba(242, 169, 59, 0.15), rgba(242, 169, 59, 0.05))",
  },
  {
    icon: Stethoscope,
    name: "Clinics & Healthcare",
    detail: "Books appointments, sends test reports, reminds patients before their slots — no receptionist needed.",
    color: "#1B9E96",
    gradient: "linear-gradient(135deg, rgba(27, 158, 150, 0.15), rgba(27, 158, 150, 0.05))",
  },
  {
    icon: ShoppingBag,
    name: "Fashion & eCommerce",
    detail: "Checks stock, quotes prices and sizes, takes orders, and confirms delivery — like your best salesperson.",
    color: "#C42B33",
    gradient: "linear-gradient(135deg, rgba(196, 43, 51, 0.15), rgba(196, 43, 51, 0.05))",
  },
  {
    icon: Building2,
    name: "Real Estate",
    detail: "Qualifies leads, shares property listings, and schedules site visits while you focus on closings.",
    color: "#6366F1",
    gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))",
  },
  {
    icon: Scissors,
    name: "Salons & Studios",
    detail: "Manages bookings by stylist and time slot, handles cancellations, and fills last-minute openings.",
    color: "#EC4899",
    gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05))",
  },
  {
    icon: Truck,
    name: "Logistics & Delivery",
    detail: "Real-time order tracking, delivery confirmations, and automated customer notifications on WhatsApp.",
    color: "#06B6D4",
    gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))",
  },
];

export default function Verticals() {
  return (
    <section className="landing-section-light" id="industries">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--teal">INDUSTRIES</span>
          <h2 className="landing-section-title">
            One AI, trained for{" "}
            <span className="landing-gradient-text-warm">your industry</span>
          </h2>
          <p className="landing-section-subtitle">
            Ittisalo isn&apos;t a generic chatbot. Each business gets a custom AI
            trained on its own products, prices, and services — so every answer
            sounds like it came from your best employee.
          </p>
        </motion.div>

        <div className="landing-verticals-grid">
          {verticals.map((v, i) => (
            <motion.div
              key={v.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="landing-vertical-card"
            >
              <div
                className="landing-vertical-icon"
                style={{ background: v.gradient }}
              >
                <v.icon
                  size={22}
                  style={{ color: v.color }}
                  strokeWidth={1.8}
                />
              </div>
              <h3 className="landing-vertical-name">{v.name}</h3>
              <p className="landing-vertical-detail">{v.detail}</p>
              <div className="landing-vertical-arrow" style={{ color: v.color }}>
                Learn more →
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
