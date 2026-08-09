"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { Check, ArrowRight, Sparkles, Building2, Rocket } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    tagline: "For small businesses getting started",
    icon: Rocket,
    features: [
      "1 WhatsApp number",
      "AI-powered conversations",
      "Product catalogue training",
      "Order taking & tracking",
      "Basic analytics dashboard",
      "Email support",
    ],
    ctaText: "Book a Demo",
    ctaHref: "/book-demo",
    featured: false,
  },
  {
    name: "Growth",
    tagline: "For growing businesses that need full power",
    icon: Sparkles,
    badge: "Most Popular",
    features: [
      "Multiple WhatsApp numbers",
      "Advanced AI training",
      "Order & appointment management",
      "Human handoff & shared inbox",
      "Lead qualification",
      "Campaign manager",
      "Full analytics dashboard",
      "Priority support",
    ],
    ctaText: "Book a Demo",
    ctaHref: "/book-demo",
    featured: true,
  },
  {
    name: "Enterprise",
    tagline: "For large teams with custom needs",
    icon: Building2,
    features: [
      "Unlimited WhatsApp numbers",
      "Unlimited AI conversations",
      "Custom AI personality & voice",
      "API integrations",
      "Multi-team inbox",
      "Advanced analytics & reports",
      "Dedicated account manager",
      "Custom SLA",
    ],
    ctaText: "Contact Us",
    ctaHref: "https://wa.me/923360479649",
    featured: false,
    external: true,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="landing-section-light">
      <div className="landing-dot-pattern" />
      <div className="landing-container" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--amber">PLANS</span>
          <h2 className="landing-section-title">
            Choose the right plan for{" "}
            <span className="landing-gradient-text-warm">your business</span>
          </h2>
          <p className="landing-section-subtitle">
            Get started with a personalized demo. Our team will help you pick the
            perfect plan and get you live in under 30 minutes.
          </p>
        </motion.div>

        <div className="landing-pricing-grid">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`landing-pricing-card ${plan.featured ? "landing-pricing-card--featured" : ""}`}
            >
              {plan.badge && (
                <div className="landing-pricing-badge">{plan.badge}</div>
              )}

              <div className="landing-pricing-header">
                <div className={`landing-pricing-icon ${plan.featured ? "landing-pricing-icon--featured" : ""}`}>
                  <plan.icon size={22} />
                </div>
                <h3 className="landing-pricing-name">{plan.name}</h3>
                <p className="landing-pricing-tagline">{plan.tagline}</p>
              </div>

              <div className="landing-pricing-divider" />

              <ul className="landing-pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature} className="landing-pricing-feature">
                    <div className={`landing-pricing-check ${plan.featured ? "landing-pricing-check--featured" : ""}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.external ? (
                <a
                  href={plan.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`landing-pricing-cta ${plan.featured ? "landing-pricing-cta--featured" : ""}`}
                >
                  {plan.ctaText}
                  <ArrowRight size={14} />
                </a>
              ) : (
                <Link
                  href={plan.ctaHref}
                  className={`landing-pricing-cta ${plan.featured ? "landing-pricing-cta--featured" : ""}`}
                >
                  {plan.ctaText}
                  <ArrowRight size={14} />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="landing-pricing-note"
        >
          All plans include a free setup consultation. No credit card required to get started.
        </motion.p>
      </div>
    </section>
  );
}

export default memo(Pricing);
