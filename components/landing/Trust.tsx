"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { Store, Utensils, Scissors, Building, Stethoscope, MessageSquare, Star, TrendingUp, Shield } from "lucide-react";

const stats = [
  { icon: MessageSquare, value: "10M+", label: "Messages Processed", color: "#C42B33" },
  { icon: TrendingUp, value: "85%", label: "Faster Response Time", color: "#1B9E96" },
  { icon: Star, value: "4.9/5", label: "Customer Satisfaction", color: "#F2A93B" },
  { icon: Shield, value: "99.9%", label: "Uptime Guarantee", color: "#6366F1" },
];

const industries = [
  { icon: Store, label: "Retail Stores" },
  { icon: Utensils, label: "Restaurants" },
  { icon: Scissors, label: "Salons" },
  { icon: Building, label: "Real Estate" },
  { icon: Stethoscope, label: "Clinics" },
];

function Trust() {
  return (
    <section className="landing-section-dark" id="trust">
      <div className="landing-dark-grid" />
      <div className="landing-dark-orb landing-dark-orb--1" />
      
      <div className="landing-container" style={{ position: "relative" }}>
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--teal">TRUSTED BY BUSINESSES</span>
          <h2 className="landing-section-title" style={{ color: "white" }}>
            Built for the businesses that{" "}
            <span className="landing-gradient-text-warm">run Pakistan</span>
          </h2>
          <p className="landing-section-subtitle" style={{ color: "rgba(255,255,255,0.5)" }}>
            From clothing stores to restaurants, clinics, salons, and service
            businesses — Ittisalo helps teams respond faster and never miss a
            customer conversation.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="landing-trust-stats">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="landing-trust-stat"
            >
              <div className="landing-trust-stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <div className="landing-trust-stat-value">{stat.value}</div>
              <div className="landing-trust-stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Industry Icons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="landing-trust-industries"
        >
          {industries.map((ind, i) => (
            <motion.div
              key={ind.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="landing-trust-industry"
            >
              <ind.icon size={24} strokeWidth={1.5} />
              <span>{ind.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="landing-trust-testimonial"
        >
          <div className="landing-trust-avatars">
            {["#C42B33", "#1B9E96", "#F2A93B", "#6366F1", "#EC4899"].map((color, i) => (
              <div
                key={i}
                className="landing-trust-avatar"
                style={{ backgroundColor: color }}
              >
                {["R", "K", "L", "I", "F"][i]}
              </div>
            ))}
          </div>
          <p className="landing-trust-quote">
            &ldquo;Ittisalo transformed how we handle customer inquiries. Our response time
            went from hours to seconds, and our customers love the instant service.&rdquo;
          </p>
          <p className="landing-trust-author">— Early access businesses across Pakistan</p>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(Trust);
