"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Connect Your WhatsApp",
    detail: "Link your existing business number through Meta's official WhatsApp Business API. No new number, no app switching — customers won't notice a thing.",
    accent: "#C42B33",
    accentBg: "rgba(196, 43, 51, 0.12)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Train Your AI Agent",
    detail: "Upload your menu, price list, service hours, or product catalogue. Ittisalo learns your business once and starts answering in your voice.",
    accent: "#F2A93B",
    accentBg: "rgba(242, 169, 59, 0.12)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "AI Handles Every Message",
    detail: "Every incoming message gets an instant, accurate answer. Orders placed, appointments booked, questions resolved — day or night.",
    accent: "#1B9E96",
    accentBg: "rgba(27, 158, 150, 0.12)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "You Step In When Needed",
    detail: "If a conversation needs a human touch, Ittisalo pauses and notifies your team. You take over seamlessly in the same chat thread.",
    accent: "#6366F1",
    accentBg: "rgba(99, 102, 241, 0.12)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="landing-section-dark">
      {/* Background effects */}
      <div className="landing-dark-grid" />
      <div className="landing-dark-orb landing-dark-orb--1" />
      <div className="landing-dark-orb landing-dark-orb--2" />

      <div className="landing-container" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--amber">HOW IT WORKS</span>
          <h2 className="landing-section-title" style={{ color: "white" }}>
            Live in an afternoon,{" "}
            <span className="landing-gradient-text-cool">not a quarter.</span>
          </h2>
          <p className="landing-section-subtitle" style={{ color: "rgba(255,255,255,0.5)" }}>
            Four simple steps to transform your WhatsApp into an AI-powered business assistant.
          </p>
        </motion.div>

        <div className="landing-steps-grid">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="landing-step-card"
            >
              <div className="landing-step-header">
                <div
                  className="landing-step-icon"
                  style={{ backgroundColor: s.accentBg, color: s.accent }}
                >
                  {s.icon}
                </div>
                <span className="landing-step-number">{s.n}</span>
              </div>
              <h3 className="landing-step-title">{s.title}</h3>
              <p className="landing-step-detail">{s.detail}</p>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="landing-step-connector" style={{ borderColor: `${s.accent}30` }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA in How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="landing-steps-cta"
        >
          <a
            href="https://wa.me/923360479649"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn-primary-large"
          >
            <span>Get Started Now</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
