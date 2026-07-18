"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { from: "customer" | "bot"; text: string; delay: number };

type Scene = {
  label: string;
  accent: string;
  messages: Msg[];
};

const scenes: Scene[] = [
  {
    label: "Restaurant",
    accent: "#B8262F",
    messages: [
      { from: "customer", text: "Assalam o alaikum, aap ka tandoori chicken available hai?", delay: 0 },
      { from: "bot", text: "Ji bilkul! Full chicken Rs. 950, half Rs. 550. Roll bhi banwana hai?", delay: 900 },
      { from: "customer", text: "2 roll aur 1 full chicken", delay: 1500 },
      { from: "bot", text: "Order confirm ✅ Total Rs. 1,250. Delivery in 35 min to your saved address.", delay: 1200 },
    ],
  },
  {
    label: "Clinic",
    accent: "#1B7F79",
    messages: [
      { from: "customer", text: "Dr. Ahmed se appointment chahiye, kal ke liye", delay: 0 },
      { from: "bot", text: "Kal available slots: 5:00 PM ya 7:30 PM. Konsa theek rahega?", delay: 900 },
      { from: "customer", text: "7:30 PM please", delay: 1400 },
      { from: "bot", text: "Booked ✅ Token #14, Dr. Ahmed, 7:30 PM. Reminder milega 1 ghanta pehle.", delay: 1200 },
    ],
  },
  {
    label: "Fashion",
    accent: "#D98E1F",
    messages: [
      { from: "customer", text: "Lawn suit ka price kya hai, medium size mein hai?", delay: 0 },
      { from: "bot", text: "Rs. 3,200 — Medium mein 3 pieces stock mein hain. Color bata dein?", delay: 900 },
      { from: "customer", text: "Maroon wala bhej dein", delay: 1400 },
      { from: "bot", text: "Reserved for you ✅ COD ya online payment — kya prefer karengi?", delay: 1200 },
    ],
  },
];

export default function PhoneMock() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const scene = scenes[sceneIndex];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 500;
    scene.messages.forEach((m, i) => {
      cumulative += m.delay;
      timers.push(
        setTimeout(() => setVisibleCount(i + 1), cumulative)
      );
    });
    const holdThenNext = setTimeout(() => {
      setSceneIndex((s) => (s + 1) % scenes.length);
    }, cumulative + 2600);
    timers.push(holdThenNext);
    return () => timers.forEach(clearTimeout);
  }, [sceneIndex]);

  const scene = scenes[sceneIndex];

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* floating marigold-inspired ornaments — a nod to garlanded shop-front signage */}
      <div
        className="absolute -left-8 top-10 h-5 w-5 rounded-full bg-saffron animate-float"
        style={{ ["--rot" as string]: "12deg" }}
      />
      <div
        className="absolute -right-6 top-32 h-3.5 w-3.5 rounded-full bg-teal animate-float"
        style={{ ["--rot" as string]: "-8deg", animationDelay: "1.2s" }}
      />
      <div
        className="absolute -left-4 bottom-24 h-4 w-4 rounded-full bg-maroon animate-float"
        style={{ ["--rot" as string]: "6deg", animationDelay: "2.4s" }}
      />

      <div className="rounded-[2.75rem] border-[6px] border-ink bg-ink p-2 shadow-2xl shadow-ink/30">
        <div className="jaan-border rounded-t-[2.2rem]" />
        <div className="relative h-[520px] overflow-hidden rounded-b-[2.2rem] bg-[#E9E1D3]">
          {/* header */}
          <div className="flex items-center gap-3 bg-ink px-4 py-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-ink transition-colors duration-500"
              style={{ backgroundColor: scene.accent }}
            >
              {scene.label[0]}
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-paper">
                {scene.label} · Ittisalo AI
              </p>
              <p className="font-mono text-[11px] text-paper/50">online</p>
            </div>
          </div>

          {/* messages */}
          <div className="flex h-[420px] flex-col justify-end gap-2 px-4 pb-4 pt-3">
            <AnimatePresence mode="popLayout">
              {scene.messages.slice(0, visibleCount).map((m, i) => (
                <motion.div
                  key={`${sceneIndex}-${i}`}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 font-body text-[13px] leading-snug shadow-sm ${
                    m.from === "customer"
                      ? "self-start rounded-tl-sm bg-white text-ink"
                      : "self-end rounded-tr-sm text-white"
                  }`}
                  style={
                    m.from === "bot" ? { backgroundColor: scene.accent } : undefined
                  }
                >
                  {m.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="jaan-border-thin absolute bottom-0 left-0 right-0" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5">
        {scenes.map((s, i) => (
          <span
            key={s.label}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === sceneIndex ? "22px" : "6px",
              backgroundColor: i === sceneIndex ? s.accent : "#0E162933",
            }}
          />
        ))}
      </div>
    </div>
  );
}
