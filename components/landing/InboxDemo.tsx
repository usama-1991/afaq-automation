"use client";

import { motion } from "framer-motion";
import { Bot, User, ShoppingCart, Clock, MessageSquare } from "lucide-react";

const conversations = [
  {
    name: "Sarah Ahmed",
    avatar: "SA",
    avatarColor: "#C42B33",
    lastMessage: "Yes, please place the order!",
    time: "2 min ago",
    status: "ai",
    unread: 0,
    orderTag: "Order #1247",
  },
  {
    name: "Ali Hassan",
    avatar: "AH",
    avatarColor: "#1B9E96",
    lastMessage: "What time slots are available tomorrow?",
    time: "5 min ago",
    status: "ai",
    unread: 1,
    orderTag: null,
  },
  {
    name: "Fatima Khan",
    avatar: "FK",
    avatarColor: "#D98E1F",
    lastMessage: "I need to speak with a manager",
    time: "8 min ago",
    status: "human",
    unread: 2,
    orderTag: null,
  },
  {
    name: "Usman Malik",
    avatar: "UM",
    avatarColor: "#6366F1",
    lastMessage: "Thanks! Got the confirmation 👍",
    time: "15 min ago",
    status: "resolved",
    unread: 0,
    orderTag: "Order #1246",
  },
];

const chatMessages = [
  { from: "customer", text: "Hi! I'd like to order the blue kurta in size L" },
  { from: "bot", text: "Great choice! The Blue Embroidered Kurta in Large is Rs. 2,800 and currently in stock. Would you like to proceed?" },
  { from: "customer", text: "Yes, please place the order!" },
  { from: "bot", text: "Order confirmed ✅\n\n📦 Blue Embroidered Kurta (L)\n💰 Rs. 2,800 — COD\n📍 Delivering to your saved address\n\nYou'll receive tracking details shortly!" },
];

export default function InboxDemo() {
  return (
    <section className="relative landing-section overflow-hidden">
      <div className="bg-mesh absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
            Smart Inbox
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
            See every conversation,{" "}
            <span className="text-ink/40">let AI handle the rest.</span>
          </h2>
          <p className="mt-4 text-balance text-ink/50 text-lg">
            A unified dashboard where you can monitor AI-handled conversations, take over when needed, and track orders — all in one place.
          </p>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inbox-mockup mx-auto max-w-5xl"
        >
          {/* Dashboard Header */}
          <div className="flex items-center justify-between border-b border-ink/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.4 8.6L20 12L13.4 15.4L12 22L10.6 15.4L4 12L10.6 8.6L12 2Z" fill="#C42B33" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-ink">Ittisalo Dashboard</span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-teal/8 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-teal animate-pulse-soft" />
                <span className="text-[11px] font-semibold text-teal">AI Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink/40">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>4 conversations</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
            {/* Conversation List */}
            <div className="border-b lg:border-b-0 lg:border-r border-ink/[0.06]">
              <div className="p-3">
                <div className="rounded-lg bg-ink/[0.03] px-3 py-2 text-xs text-ink/30">
                  Search conversations...
                </div>
              </div>
              <div className="divide-y divide-ink/[0.04]">
                {conversations.map((c, i) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-ink/[0.02] ${
                      i === 0 ? "bg-maroon/[0.03]" : ""
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink truncate">{c.name}</span>
                        <span className="text-[10px] text-ink/35 flex-shrink-0">{c.time}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/45 truncate">{c.lastMessage}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {c.status === "ai" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal/8 px-2 py-0.5 text-[9px] font-semibold text-teal">
                            <Bot className="h-2.5 w-2.5" /> AI Handled
                          </span>
                        )}
                        {c.status === "human" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-saffron/10 px-2 py-0.5 text-[9px] font-semibold text-saffron-dark">
                            <User className="h-2.5 w-2.5" /> Needs Human
                          </span>
                        )}
                        {c.status === "resolved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.04] px-2 py-0.5 text-[9px] font-semibold text-ink/35">
                            ✓ Resolved
                          </span>
                        )}
                        {c.orderTag && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-maroon/[0.06] px-2 py-0.5 text-[9px] font-semibold text-maroon">
                            <ShoppingCart className="h-2.5 w-2.5" /> {c.orderTag}
                          </span>
                        )}
                        {c.unread > 0 && (
                          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-maroon text-[8px] font-bold text-white">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat View */}
            <div className="flex flex-col" style={{ minHeight: "380px" }}>
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon text-xs font-bold text-white">
                    SA
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Sarah Ahmed</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-ink/30" />
                      <p className="text-[11px] text-ink/40">Last active 2 min ago</p>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <button className="rounded-lg border border-ink/10 px-3 py-1.5 text-[11px] font-semibold text-ink/60 transition-colors hover:bg-ink/[0.03]">
                    Take Over
                  </button>
                  <button className="rounded-lg bg-ink/[0.03] px-3 py-1.5 text-[11px] font-semibold text-ink/60 transition-colors hover:bg-ink/[0.06]">
                    View Order
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-3 p-5 overflow-y-auto">
                {chatMessages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={`flex ${m.from === "customer" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                        m.from === "customer"
                          ? "rounded-tl-sm bg-ink/[0.04] text-ink"
                          : "rounded-tr-sm bg-maroon/[0.08] text-ink"
                      }`}
                    >
                      {m.from === "bot" && (
                        <div className="mb-1 flex items-center gap-1">
                          <Bot className="h-3 w-3 text-maroon" />
                          <span className="text-[10px] font-semibold text-maroon">Ittisalo AI</span>
                        </div>
                      )}
                      <span className="whitespace-pre-line">{m.text}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
