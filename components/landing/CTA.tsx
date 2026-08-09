"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTA() {
  return (
    <section id="demo" className="landing-cta-section">
      {/* Complex gradient background */}
      <div className="landing-cta-bg" />
      <div className="landing-cta-grid" />
      
      {/* Center glow */}
      <div className="landing-cta-glow" />

      <div className="landing-container" style={{ position: "relative", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="landing-cta-badge">
            <span className="landing-cta-badge-dot" />
            <span>Ready to transform your business</span>
          </div>

          <h2 className="landing-cta-title">
            Send it a message.{" "}
            <span className="landing-gradient-text-cool">
              See what your customers
            </span>{" "}
            would see.
          </h2>

          <p className="landing-cta-desc">
            We&apos;ll set up a live sandbox on your own number in one call — no
            commitment, no card required. See Ittisalo handle real conversations
            on your WhatsApp.
          </p>

          <div className="landing-cta-buttons">
            <Link href="/book-demo" className="landing-btn-primary-large">
              <span>Book Your Live Demo</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust indicators */}
          <div className="landing-cta-trust">
            {[
              "No credit card required",
              "Free setup consultation",
              "Live in under 30 minutes",
            ].map((text) => (
              <div key={text} className="landing-cta-trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {text}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
