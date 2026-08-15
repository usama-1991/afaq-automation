"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

import { memo } from "react";

const floatingWords = [
  "WhatsApp", "AI", "Chatbot", "Orders", "Support", "24/7", "Conversations", "Growth",
];

function Hero() {
  return (
    <section className="landing-hero">
      {/* Gradient Background */}
      <div className="landing-hero-bg" />
      
      {/* Subtle grid pattern */}
      <div className="landing-hero-grid" />
      
      {/* Floating gradient orbs */}
      <div className="landing-hero-orb landing-hero-orb--1" />
      <div className="landing-hero-orb landing-hero-orb--2" />
      <div className="landing-hero-orb landing-hero-orb--3" />

      <div className="landing-hero-content">
        <div className="landing-hero-text">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="landing-hero-badge"
          >
            <span className="landing-hero-badge-dot" />
            <span>AI-POWERED WHATSAPP AUTOMATION</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="landing-hero-title"
          >
            Intelligent customer{" "}
            <span className="landing-hero-gradient-text">
              conversations
            </span>{" "}
            on WhatsApp, powered by AI.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="landing-hero-desc"
          >
            Automate responses, take orders, book appointments, and manage
            every customer conversation with AI that works 24/7 — all on your
            existing WhatsApp number.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="landing-hero-ctas"
          >
            <Link href="/book-demo" className="landing-btn-primary-large">
              <span>Book a Demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="https://wa.me/923360479649"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-btn-secondary-large"
            >
              Contact Us
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="landing-hero-stats"
          >
            {[
              ["< 3 sec", "Avg. First Reply"],
              ["24/7", "AI Always Online"],
              ["5+", "Industries Served"],
              ["99.9%", "Uptime SLA"],
            ].map(([stat, label]) => (
              <div key={label} className="landing-hero-stat">
                <p className="landing-hero-stat-value">{stat}</p>
                <p className="landing-hero-stat-label">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Chat widget mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="landing-hero-visual"
        >
          <div className="landing-chat-widget">
            {/* Chat header */}
            <div className="landing-chat-header">
              <div className="landing-chat-avatar overflow-hidden">
                <img src="/logo.png" alt="Ittisalo AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="landing-chat-name">Ittisalo AI</div>
                <div className="landing-chat-status">
                  <span className="landing-chat-status-dot" />
                  Online now
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="landing-chat-messages">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="landing-chat-msg landing-chat-msg--user"
              >
                Hi, can I get an update on my order?
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                className="landing-chat-msg landing-chat-msg--bot"
              >
                <div className="landing-chat-bot-icon overflow-hidden">
                  <img src="/logo.png" alt="Ittisalo AI" className="w-full h-full object-contain" />
                </div>
                Of course! Your order #1847 was shipped yesterday. Expected delivery is tomorrow by 6 PM. Would you like the tracking link? 📦
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.6, duration: 0.5 }}
                className="landing-chat-msg landing-chat-msg--user"
              >
                Yes please!
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.4, duration: 0.5 }}
                className="landing-chat-msg landing-chat-msg--bot"
              >
                <div className="landing-chat-bot-icon overflow-hidden">
                  <img src="/logo.png" alt="Ittisalo AI" className="w-full h-full object-contain" />
                </div>
                Here you go: track.ittisalo.com/1847 🔗<br />
                Is there anything else I can help you with?
              </motion.div>
            </div>

            {/* Chat sparkle indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.0, duration: 0.5 }}
              className="landing-chat-sparkle"
            >
              <span>✦</span> AI-powered response
            </motion.div>
          </div>

          {/* Floating badges around the widget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="landing-floating-badge landing-floating-badge--1"
          >
            <span className="landing-fb-icon" style={{ background: "rgba(27, 158, 150, 0.2)", color: "#1B9E96" }}>✓</span>
            <span>Instant Replies</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.0, duration: 0.6 }}
            className="landing-floating-badge landing-floating-badge--2"
          >
            <span className="landing-fb-icon" style={{ background: "rgba(242, 169, 59, 0.2)", color: "#F2A93B" }}>★</span>
            <span>Smart AI</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.6 }}
            className="landing-floating-badge landing-floating-badge--3"
          >
            <span className="landing-fb-icon" style={{ background: "rgba(196, 43, 51, 0.2)", color: "#C42B33" }}>♥</span>
            <span>Happy Customers</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(Hero);
