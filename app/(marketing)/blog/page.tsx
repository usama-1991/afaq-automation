import Link from "next/link";
import { ArrowRight, Sparkles, Clock, BookOpen, Tag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Conversational AI Insights — Ittisalo",
  description:
    "Guides, strategies, and industry insights on automating WhatsApp orders, Instagram comment-to-DM funnels, and clinic appointment scheduling in Pakistan & globally.",
  keywords: [
    "WhatsApp Marketing Blog",
    "Instagram DM Automation Guide",
    "Pakistani SMB AI Strategy",
    "Ittisalo Blog"
  ]
};

export const BLOG_POSTS = [
  {
    slug: "new-meta-integration-announcement",
    title: "Ittisalo Unveils Official Meta Tech Partner Integration & WhatsApp Cloud API Embedded Signup",
    excerpt: "Connect your official WhatsApp Business number, Instagram DM inbox, and Facebook Messenger in under 60 seconds with zero API key hassle and verified green-tick compliance.",
    date: "September 15, 2026",
    readTime: "4 min read",
    author: "Usama Ahmed",
    authorRole: "Product Lead at Ittisalo",
    category: "Meta Partner Integration",
    image: "/images/creatives/meta-partner-announcement.jpg"
  },
  {
    slug: "automate-whatsapp-orders-restaurant",
    title: "How to Automate WhatsApp Delivery Orders & Menus for Pakistani Restaurants",
    excerpt: "Discover how top dining spots in Karachi and Lahore handle peak dinner rush DMs, share interactive digital menus, and cut order errors to zero.",
    date: "September 4, 2026",
    readTime: "6 min read",
    author: "Usama Ahmed",
    authorRole: "Product Lead at Ittisalo",
    category: "Restaurant Automation",
    image: "/images/solutions/restaurant.jpg"
  },
  {
    slug: "instagram-comment-to-dm-funnel",
    title: "Why Instagram Comment-to-DM Auto-Replies Are the Highest-Converting Sales Funnel in 2026",
    excerpt: "Stop letting 'Price please?' comments die in your Instagram feed. Turn instant story mentions and reel comments into automated WhatsApp checkouts.",
    date: "August 28, 2026",
    readTime: "5 min read",
    author: "Sobia Malik",
    authorRole: "Growth Strategist",
    category: "eCommerce Growth",
    image: "/images/solutions/ecommerce.jpg"
  },
  {
    slug: "cut-clinic-appointment-no-shows",
    title: "How Dental & Medical Clinics Cut Patient No-Shows by 68% Using Automated WhatsApp Reminders",
    excerpt: "Learn how automated intake questionnaires, slot confirmations, and WhatsApp 24-hr alerts transform clinic front-desk operations and doctor utilization.",
    date: "August 15, 2026",
    readTime: "7 min read",
    author: "Dr. Fatima Al-Zahra",
    authorRole: "Healthcare Workflow Advisor",
    category: "Clinic Workflows",
    image: "/images/solutions/clinic.jpg"
  }
];

export default function BlogIndex() {
  return (
    <div className="w-full bg-[#FDFCFB] min-h-screen">
      {/* Header */}
      <section className="pt-16 pb-20 px-4 text-center bg-gradient-to-b from-[#FFF5F5]/60 to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#FFE8EA] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B1531]">
            <Sparkles size={14} className="text-[#E63946]" /> Conversational Commerce & AI Knowledge Base
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#1A1517] tracking-tight">
            Insights for Modern <span className="bg-gradient-to-r from-[#E63946] via-[#C81E3A] to-[#8B1531] bg-clip-text text-transparent">Conversational Businesses</span>
          </h1>
          <p className="text-lg text-[#5C5255] max-w-xl mx-auto font-medium">
            Actionable strategies, WhatsApp API tutorials, and growth playbooks built specifically for SMB owners.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-3xl border border-[#EFEBE4] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#8B1531]">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-[#8C8285]">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  </div>

                  <h2 className="text-xl font-bold text-[#1A1517] group-hover:text-[#C81E3A] transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-sm text-[#5C5255] leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-[#EFEBE4] mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1517]">By {post.author}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C81E3A] group-hover:translate-x-1 transition-transform">
                  Read Article <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
