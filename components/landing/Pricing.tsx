"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "4,999",
    period: "/month",
    description: "Perfect for small shops just getting started with AI automation.",
    features: [
      "1 WhatsApp number",
      "500 AI conversations / month",
      "Product catalogue training",
      "Order taking",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Growth",
    price: "12,999",
    period: "/month",
    description: "For growing businesses that need full AI automation and team support.",
    features: [
      "2 WhatsApp numbers",
      "2,000 AI conversations / month",
      "Advanced AI training",
      "Order & appointment management",
      "Human handoff & shared inbox",
      "Lead qualification",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Free Trial",
    featured: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For larger businesses needing custom integrations and unlimited scale.",
    features: [
      "Unlimited WhatsApp numbers",
      "Unlimited AI conversations",
      "Custom AI personality",
      "API integrations",
      "Multi-team inbox",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom SLA",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative landing-section overflow-hidden">
      <div className="bg-dot-pattern absolute inset-0 opacity-20" />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-saffron/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-saffron-dark">
            Pricing
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-balance text-ink/50 text-lg">
            Start with a free trial. No credit card required. Upgrade or cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`pricing-card relative ${
                plan.featured
                  ? "featured scale-[1.02] lg:scale-105"
                  : "bg-white border border-ink/[0.06] shadow-sm hover:shadow-lg"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-maroon to-maroon-light px-4 py-1 text-[11px] font-bold text-white shadow-lg shadow-maroon/20">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-semibold ${plan.featured ? "text-white" : "text-ink"}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${plan.featured ? "text-white/50" : "text-ink/45"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                {plan.price !== "Custom" && (
                  <span className={`text-sm ${plan.featured ? "text-white/50" : "text-ink/40"}`}>Rs.</span>
                )}
                <span className={`text-4xl font-bold tracking-tight ${plan.featured ? "text-white" : "text-ink"}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-sm ${plan.featured ? "text-white/50" : "text-ink/40"}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      plan.featured ? "bg-teal/20" : "bg-teal/10"
                    }`}>
                      <Check className="h-3 w-3 text-teal" strokeWidth={3} />
                    </div>
                    <span className={`text-sm ${plan.featured ? "text-white/70" : "text-ink/55"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="https://app.ittisalo.com/onboarding"
                className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
                  plan.featured
                    ? "bg-white text-ink hover:bg-white/90 shadow-lg"
                    : "btn-primary"
                }`}
              >
                <span className="relative z-10">{plan.cta}</span>
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 text-center text-sm text-ink/35"
        >
          All prices in PKR. Prices are subject to change. 14-day free trial on all plans.
        </motion.p>
      </div>
    </section>
  );
}
