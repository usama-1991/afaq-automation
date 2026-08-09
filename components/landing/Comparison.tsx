"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { X, Check, ArrowRight } from "lucide-react";

const withoutItems = [
  "Missed messages after hours",
  "Slow response times frustrate customers",
  "Manual order tracking via notes",
  "Forgetting appointment reminders",
  "No visibility into customer data",
  "Team confusion on who replied",
];

const withItems = [
  "Every message answered instantly, 24/7",
  "< 3 second AI response time",
  "Automated order management & tracking",
  "Smart appointment booking with reminders",
  "Full analytics dashboard & insights",
  "Shared inbox with clear assignment",
];

function Comparison() {
  return (
    <section className="landing-section-dark" id="comparison">
      <div className="landing-dark-grid" />
      <div className="landing-container" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--amber">THE DIFFERENCE</span>
          <h2 className="landing-section-title" style={{ color: "white" }}>
            Before Ittisalo vs.{" "}
            <span className="landing-gradient-text-warm">After Ittisalo</span>
          </h2>
        </motion.div>

        <div className="landing-comparison-grid">
          {/* Without */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="landing-comparison-card landing-comparison-card--without"
          >
            <div className="landing-comparison-header landing-comparison-header--without">
              <X size={18} />
              <span>Without Ittisalo</span>
            </div>
            <ul className="landing-comparison-list">
              {withoutItems.map((item) => (
                <li key={item} className="landing-comparison-item">
                  <div className="landing-comparison-icon landing-comparison-icon--red">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="landing-comparison-card landing-comparison-card--with"
          >
            <div className="landing-comparison-header landing-comparison-header--with">
              <Check size={18} />
              <span>With Ittisalo</span>
            </div>
            <ul className="landing-comparison-list">
              {withItems.map((item) => (
                <li key={item} className="landing-comparison-item">
                  <div className="landing-comparison-icon landing-comparison-icon--green">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/923360479649"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-comparison-cta"
            >
              Start Today <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default memo(Comparison);
