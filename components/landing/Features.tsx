"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import {
  Clock,
  ShieldCheck,
  Inbox,
  Search,
  BarChart3,
  Languages,
  ShoppingCart,
  CalendarCheck,
  Zap,
  Send,
  Eye,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "24/7 AI Customer Support",
    detail: "Every message gets an instant, accurate response — even at 3 AM. Your customers never wait.",
    color: "#1B9E96",
  },
  {
    icon: Search,
    title: "Product & Service Questions",
    detail: "Answers from your own catalogue. No made-up prices or invented stock — every reply is grounded in your data.",
    color: "#C42B33",
  },
  {
    icon: ShoppingCart,
    title: "Automated Order Taking",
    detail: "Takes orders, confirms quantities, calculates totals, and processes COD or online payment preferences.",
    color: "#F2A93B",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booking",
    detail: "Books appointments by time slot, sends confirmations, and reminds customers before their visit.",
    color: "#6366F1",
  },
  {
    icon: ShieldCheck,
    title: "Lead Qualification",
    detail: "Identifies serious buyers, captures their requirements, and routes hot leads to your sales team instantly.",
    color: "#EC4899",
  },
  {
    icon: Inbox,
    title: "Shared Team Inbox",
    detail: "A shared inbox that senses when a chat needs a human touch and routes it to your team seamlessly.",
    color: "#10B981",
  },
  {
    icon: Send,
    title: "Broadcast Campaigns",
    detail: "Send promotional messages, offers, and updates to thousands of customers at once via WhatsApp templates.",
    color: "#06B6D4",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    detail: "Orders, leads, and appointments in one place. See what customers ask for and track AI performance.",
    color: "#3B82F6",
  },
  {
    icon: Languages,
    title: "Multi-Language AI",
    detail: "Built for how your customers actually communicate — English, Urdu, Roman Urdu, or a mix of all three.",
    color: "#8B5CF6",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    detail: "Go live in under 30 minutes. Connect your WhatsApp number, upload your data, and let AI handle the rest.",
    color: "#F59E0B",
  },
  {
    icon: Eye,
    title: "Real-time Monitoring",
    detail: "Watch conversations as they happen. Jump in at any time. See what your AI is saying to customers.",
    color: "#EF4444",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    detail: "End-to-end encryption, GDPR compliant, and built on Meta's official WhatsApp Business API.",
    color: "#64748B",
  },
];

function Features() {
  return (
    <section id="features" className="landing-section-light">
      <div className="landing-dot-pattern" />
      <div className="landing-container" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--maroon">FEATURES</span>
          <h2 className="landing-section-title">
            Everything a busy business needs,{" "}
            <span style={{ color: "rgba(14, 22, 41, 0.35)" }}>none of the app-switching.</span>
          </h2>
          <p className="landing-section-subtitle">
            From AI conversations to order management, every tool is built into one
            powerful platform that runs on WhatsApp.
          </p>
        </motion.div>

        <div className="landing-features-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="landing-feature-card"
            >
              <div
                className="landing-feature-icon"
                style={{ 
                  backgroundColor: `${f.color}12`,
                  color: f.color,
                }}
              >
                <f.icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="landing-feature-name">{f.title}</h3>
              <p className="landing-feature-detail">{f.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(Features);
