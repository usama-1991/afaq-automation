"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { from: "customer" | "bot"; text: string; delay: number };

type Scene = {
  label: string;
  accent: string;
  messages: Msg[];
};

const scenes: Scene[] = [
  {
    label: "Fashion Store",
    accent: "#C42B33",
    messages: [
      { from: "customer", text: "How much is the lawn suit? Do you have it in medium?", delay: 0 },
      { from: "bot", text: "It's Rs. 3,200. Yes, medium is currently in stock. Which color would you like?", delay: 1000 },
      { from: "customer", text: "Do you have it in maroon?", delay: 1600 },
      { from: "bot", text: "Yes, maroon is available! Would you like me to place the order for you? 🛍️", delay: 1200 },
      { from: "customer", text: "Yes, COD please", delay: 1400 },
      { from: "bot", text: "Order confirmed ✅ Maroon lawn suit (M), Rs. 3,200 COD. You'll receive a tracking update soon!", delay: 1200 },
    ],
  },
  {
    label: "Restaurant",
    accent: "#D98E1F",
    messages: [
      { from: "customer", text: "Hi! Is the tandoori chicken available right now?", delay: 0 },
      { from: "bot", text: "Yes, absolutely! Full chicken is Rs. 950, half is Rs. 550. Would you like to add anything else?", delay: 1000 },
      { from: "customer", text: "2 chicken rolls and 1 full tandoori please", delay: 1500 },
      { from: "bot", text: "Got it! Your order: 2 Chicken Rolls + 1 Full Tandoori = Rs. 1,550. Delivery in ~35 mins. Confirm?", delay: 1200 },
      { from: "customer", text: "Confirmed! 👍", delay: 1300 },
      { from: "bot", text: "Order placed ✅ Your food will arrive in 35 minutes. Enjoy your meal! 🍗", delay: 1100 },
    ],
  },
  {
    label: "Clinic",
    accent: "#1B9E96",
    messages: [
      { from: "customer", text: "I'd like to book an appointment with Dr. Ahmed for tomorrow", delay: 0 },
      { from: "bot", text: "Dr. Ahmed has two slots available tomorrow: 5:00 PM or 7:30 PM. Which works better for you?", delay: 1000 },
      { from: "customer", text: "7:30 PM please", delay: 1400 },
      { from: "bot", text: "Booked ✅ Token #14, Dr. Ahmed, Tomorrow 7:30 PM. You'll get a reminder 1 hour before your appointment.", delay: 1200 },
    ],
  },
];

export default function PhoneMock() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePos({ x: x * 8, y: y * 6 });
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Auto-play conversation
  useEffect(() => {
    setVisibleCount(0);
    setShowTyping(false);
    const scene = scenes[sceneIndex];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 600;

    scene.messages.forEach((m, i) => {
      cumulative += m.delay;
      // Show typing before bot messages
      if (m.from === "bot") {
        timers.push(setTimeout(() => setShowTyping(true), cumulative - 600));
        timers.push(setTimeout(() => {
          setShowTyping(false);
          setVisibleCount(i + 1);
        }, cumulative));
      } else {
        timers.push(setTimeout(() => setVisibleCount(i + 1), cumulative));
      }
    });

    const holdThenNext = setTimeout(() => {
      setSceneIndex((s) => (s + 1) % scenes.length);
    }, cumulative + 3000);
    timers.push(holdThenNext);

    return () => timers.forEach(clearTimeout);
  }, [sceneIndex]);

  const scene = scenes[sceneIndex];

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-[380px]">
      {/* Floating UI Cards - showing AI capabilities */}
      <motion.div
        className="absolute -left-16 top-8 hidden lg:block"
        animate={{
          x: mousePos.x * -1.5,
          y: mousePos.y * -1.5 + Math.sin(Date.now() / 2000) * 3,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <div className="glass-card rounded-2xl px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B9E96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink">Order Confirmed</p>
              <p className="text-[10px] text-ink/50">Rs. 3,200 — COD</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -right-20 top-24 hidden lg:block"
        animate={{
          x: mousePos.x * 1.2,
          y: mousePos.y * 1.2,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 25 }}
      >
        <div className="glass-card rounded-2xl px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D98E1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink">Appointment Booked</p>
              <p className="text-[10px] text-ink/50">Tomorrow, 7:30 PM</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -left-12 bottom-32 hidden lg:block"
        animate={{
          x: mousePos.x * -0.8,
          y: mousePos.y * -0.8,
        }}
        transition={{ type: "spring", stiffness: 90, damping: 28 }}
      >
        <div className="glass-card rounded-2xl px-4 py-3 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-maroon/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C42B33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-ink">3 Active Chats</p>
              <p className="text-[10px] text-ink/50">All handled by AI</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification badge */}
      <motion.div
        className="absolute -right-10 bottom-44 hidden lg:block"
        animate={{
          x: mousePos.x * 1,
          y: mousePos.y * 1,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <div className="status-badge status-online shadow-lg">
          Online 24/7
        </div>
      </motion.div>

      {/* Phone Frame */}
      <motion.div
        style={{
          transform: `perspective(1200px) rotateY(${mousePos.x * 0.8}deg) rotateX(${mousePos.y * -0.5}deg)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <div className="rounded-[2.75rem] border-[6px] border-ink bg-ink p-2 shadow-[0_25px_80px_rgba(14,22,41,0.25)]">
          {/* Notch */}
          <div className="mx-auto mb-1 h-6 w-28 rounded-b-2xl bg-ink" />

          <div className="relative overflow-hidden rounded-[2.2rem] bg-[#ECE5DD]" style={{ height: "540px" }}>
            {/* WhatsApp Header */}
            <div className="flex items-center gap-3 bg-ink px-4 py-3">
              <div className="flex h-2 w-2 items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white transition-colors duration-500"
                style={{ backgroundColor: scene.accent }}
              >
                {scene.label[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-paper">
                  {scene.label} · Ittisalo AI
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse-soft" />
                  <p className="text-[11px] text-paper/50">online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
              </div>
            </div>

            {/* AI Badge */}
            <div className="flex justify-center py-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C42B33" strokeWidth="2.5">
                  <path d="M12 2L13.4 8.6L20 12L13.4 15.4L12 22L10.6 15.4L4 12L10.6 8.6L12 2Z" />
                </svg>
                <span className="text-[10px] font-semibold text-ink/60">Powered by Ittisalo AI</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex h-[400px] flex-col justify-end gap-2 px-3 pb-4">
              <AnimatePresence mode="popLayout">
                {scene.messages.slice(0, visibleCount).map((m, i) => (
                  <motion.div
                    key={`${sceneIndex}-${i}`}
                    initial={{ opacity: 0, y: 14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug shadow-sm ${
                      m.from === "customer"
                        ? "self-start rounded-tl-sm bg-white text-ink"
                        : "self-end rounded-tr-sm text-white"
                    }`}
                    style={
                      m.from === "bot" ? { backgroundColor: scene.accent } : undefined
                    }
                  >
                    {m.text}
                    <span className="mt-0.5 block text-right text-[9px] opacity-50">
                      {m.from === "bot" ? "Ittisalo AI" : ""} {`${10 + Math.floor(i / 2)}:${15 + i * 2}`}
                    </span>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {showTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="self-end max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3 text-white"
                    style={{ backgroundColor: scene.accent }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-[#F0F0F0] px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-ink/40">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <div className="flex-1 rounded-full bg-white px-4 py-2 text-xs text-ink/30">
                Type a message...
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scene Indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {scenes.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setSceneIndex(i)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-500"
            style={{
              backgroundColor: i === sceneIndex ? `${s.accent}15` : "transparent",
              color: i === sceneIndex ? s.accent : "rgba(14,22,41,0.35)",
              border: i === sceneIndex ? `1px solid ${s.accent}30` : "1px solid transparent",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i === sceneIndex ? s.accent : "rgba(14,22,41,0.2)",
                transform: i === sceneIndex ? "scale(1.2)" : "scale(1)",
              }}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
