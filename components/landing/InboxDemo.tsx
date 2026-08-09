"use client";

import { motion } from "framer-motion";
import { useState, useMemo, memo } from "react";
import { 
  MessageSquare, 
  Bot, 
  Users, 
  BarChart3, 
  ShoppingCart,
  ArrowRight 
} from "lucide-react";
import Link from "next/link";

const tabs = [
  {
    id: "inbox",
    icon: MessageSquare,
    label: "Smart Inbox",
    title: "All conversations in one place",
    description: "See every WhatsApp conversation, AI-handled and human, in a unified dashboard. Filter by status, assign to team members, and never lose track of a customer.",
    features: ["Real-time message sync", "Team assignment", "Priority inbox", "Search & filter"],
  },
  {
    id: "ai",
    icon: Bot,
    label: "AI Agent",
    title: "Your AI that sounds like you",
    description: "Train your AI on your business data — products, prices, policies, FAQs. It responds in your brand voice, in English and Urdu, handling everything from product questions to order placement.",
    features: ["Custom AI training", "Multi-language support", "Context-aware responses", "Continuous learning"],
  },
  {
    id: "orders",
    icon: ShoppingCart,
    label: "Order Management",
    title: "Orders, automated end-to-end",
    description: "Customers place orders via WhatsApp, and Ittisalo handles the rest — confirmation, tracking updates, and delivery notifications. All visible in your dashboard.",
    features: ["Auto order capture", "Status tracking", "Payment integration", "Delivery updates"],
  },
  {
    id: "team",
    icon: Users,
    label: "Team Collaboration",
    title: "Seamless human handoff",
    description: "When AI detects a complex query, it smoothly hands off to your team with full context. Your agents see the entire conversation history and can jump in instantly.",
    features: ["Smart escalation", "Full context transfer", "Team notes", "SLA tracking"],
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Analytics",
    title: "Insights that drive growth",
    description: "Track response times, customer satisfaction, order volumes, and AI performance. Get actionable insights to improve your business operations.",
    features: ["Performance metrics", "Customer insights", "Revenue tracking", "AI accuracy reports"],
  },
];

function InboxDemo() {
  const [activeTab, setActiveTab] = useState("inbox");
  const active = useMemo(() => tabs.find((t) => t.id === activeTab) || tabs[0], [activeTab]);

  return (
    <section className="landing-section-light" id="platform">
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="landing-section-header"
        >
          <span className="landing-label landing-label--teal">PLATFORM</span>
          <h2 className="landing-section-title">
            A complete platform for{" "}
            <span className="landing-gradient-text-cool">conversational commerce</span>
          </h2>
          <p className="landing-section-subtitle">
            Everything you need to manage customer conversations, automate sales,
            and grow your business — all from one dashboard.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="landing-platform-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`landing-platform-tab ${activeTab === tab.id ? "landing-platform-tab--active" : ""}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="landing-platform-content"
        >
          <div className="landing-platform-info">
            <h3 className="landing-platform-title">{active.title}</h3>
            <p className="landing-platform-desc">{active.description}</p>
            <ul className="landing-platform-features">
              {active.features.map((f) => (
                <li key={f} className="landing-platform-feature">
                  <div className="landing-platform-feature-dot" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/book-demo" className="landing-platform-cta">
              See it in action <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mockup visualization */}
          <div className="landing-platform-mockup">
            <div className="landing-mockup-window">
              <div className="landing-mockup-titlebar">
                <div className="landing-mockup-dots">
                  <span style={{ background: "#ff5f57" }} />
                  <span style={{ background: "#ffbd2e" }} />
                  <span style={{ background: "#28ca41" }} />
                </div>
                <div className="landing-mockup-title">Ittisalo Dashboard</div>
              </div>
              <div className="landing-mockup-body">
                {/* Sidebar mockup */}
                <div className="landing-mockup-sidebar">
                  {["💬", "🤖", "📦", "👥", "📊"].map((emoji, i) => (
                    <div 
                      key={i} 
                      className={`landing-mockup-sidebar-item ${i === tabs.findIndex(t => t.id === activeTab) ? "active" : ""}`}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                {/* Content area */}
                <div className="landing-mockup-content">
                  {activeTab === "inbox" && (
                    <div className="landing-mockup-inbox">
                      {[
                        { name: "Ahmed Khan", msg: "What's the price of XL?", time: "2m", ai: true },
                        { name: "Fatima Shah", msg: "Order #1234 status?", time: "5m", ai: true },
                        { name: "Ali Raza", msg: "I need to speak to someone", time: "12m", ai: false },
                      ].map((chat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className="landing-mockup-chat-item"
                        >
                          <div className="landing-mockup-avatar" style={{ background: ["#C42B33", "#1B9E96", "#6366F1"][i] }}>
                            {chat.name[0]}
                          </div>
                          <div className="landing-mockup-chat-info">
                            <div className="landing-mockup-chat-name">{chat.name}</div>
                            <div className="landing-mockup-chat-msg">{chat.msg}</div>
                          </div>
                          <div className="landing-mockup-chat-meta">
                            <span className="landing-mockup-chat-time">{chat.time}</span>
                            <span className={`landing-mockup-chat-badge ${chat.ai ? "ai" : "human"}`}>
                              {chat.ai ? "AI" : "Human"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {activeTab === "ai" && (
                    <div className="landing-mockup-ai">
                      <div className="landing-mockup-ai-status">
                        <div className="landing-mockup-ai-pulse" />
                        AI Agent Active
                      </div>
                      <div className="landing-mockup-ai-stat">
                        <span>Conversations Today</span><strong>247</strong>
                      </div>
                      <div className="landing-mockup-ai-stat">
                        <span>Resolution Rate</span><strong>94%</strong>
                      </div>
                      <div className="landing-mockup-ai-stat">
                        <span>Avg Response Time</span><strong>1.8s</strong>
                      </div>
                    </div>
                  )}
                  {activeTab === "orders" && (
                    <div className="landing-mockup-orders">
                      {[
                        { id: "#1847", status: "Shipped", amount: "Rs. 3,500", color: "#1B9E96" },
                        { id: "#1846", status: "Processing", amount: "Rs. 1,200", color: "#F2A93B" },
                        { id: "#1845", status: "Delivered", amount: "Rs. 5,800", color: "#6366F1" },
                      ].map((order, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.12 }}
                          className="landing-mockup-order-row"
                        >
                          <span className="landing-mockup-order-id">{order.id}</span>
                          <span className="landing-mockup-order-status" style={{ color: order.color }}>{order.status}</span>
                          <span className="landing-mockup-order-amount">{order.amount}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {activeTab === "team" && (
                    <div className="landing-mockup-team">
                      {["Online", "Online", "Away", "Offline"].map((status, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="landing-mockup-team-member"
                        >
                          <div className="landing-mockup-team-avatar" style={{ background: ["#C42B33", "#1B9E96", "#F2A93B", "#64748B"][i] }}>
                            {["U", "A", "S", "M"][i]}
                          </div>
                          <span className={`landing-mockup-team-status ${status.toLowerCase()}`}>{status}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {activeTab === "analytics" && (
                    <div className="landing-mockup-analytics">
                      <div className="landing-mockup-chart-bars">
                        {[65, 80, 45, 90, 70, 85, 55].map((height, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.08, duration: 0.5 }}
                            className="landing-mockup-chart-bar"
                            style={{ background: `linear-gradient(to top, #C42B33, #E04850)` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(InboxDemo);
