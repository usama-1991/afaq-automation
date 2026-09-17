import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, User, Sparkles, CheckCircle2, Bookmark, Share2 } from "lucide-react";
import type { Metadata } from "next";

type PostDetail = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  summary: string;
  image: string;
  diagram?: {
    image: string;
    title: string;
    caption: string;
  };
  sections: {
    heading: string;
    body: string;
    bulletPoints?: string[];
  }[];
  relatedSlugs: string[];
};

const BLOG_ARTICLES: Record<string, PostDetail> = {
  "new-meta-integration-announcement": {
    slug: "new-meta-integration-announcement",
    title: "Ittisalo Unveils Official Meta Tech Partner Integration & WhatsApp Cloud API Embedded Signup 2.0",
    category: "Meta Partner Integration",
    date: "September 15, 2026",
    readTime: "4 min read",
    author: "Usama Ahmed",
    authorRole: "Product Lead at Ittisalo",
    summary:
      "Connect your official WhatsApp Business number, Instagram DM inbox, and Facebook Messenger in under 60 seconds with zero API key hassle, verified green-tick compliance, and enterprise-grade SLA.",
    image: "/images/creatives/meta-partner-announcement.jpg",
    diagram: {
      image: "/images/creatives/meta-embedded-signup-flow.jpg",
      title: "The 3-Step Meta Embedded Signup 2.0 Workflow",
      caption: "Businesses connect directly through Meta's verified OAuth modal without leaving the Ittisalo dashboard."
    },
    sections: [
      {
        heading: "Eliminating the Risks of Unofficial WhatsApp Gateways",
        body: "For years, businesses attempting to automate customer communications were forced to rely on unofficial QR-code scrapers and third-party phone bridges. These gateways carried massive risks: sudden number bans, missed messages during server reboots, inability to get the official WhatsApp Green Tick, and severe compliance violations under Meta policies. With Ittisalo's official Meta Tech Partner integration, businesses connect directly to Meta's Cloud API hosted on Meta infrastructure.",
        bulletPoints: [
          "Zero risk of phone number blocking or disconnection during broadcasts",
          "Official Green Tick verification eligibility directly through Meta Business Manager",
          "Sub-second message delivery latency and 99.99% enterprise uptime SLA",
          "End-to-end encryption compliant with international data protection standards"
        ]
      },
      {
        heading: "Meta Embedded Signup 2.0: Live in Under 60 Seconds",
        body: "Previously, setting up the WhatsApp Business API required registering a developer app, generating permanent access tokens, configuring webhook endpoints, and waiting days for manual review. Ittisalo now embeds Meta's native onboarding dialogue right inside your Settings. With a single click, business owners log in to Facebook, select their Business Manager, verify their phone number via SMS/voice code, and immediately start receiving live customer chats.",
        bulletPoints: [
          "No developer keys, tokens, or webhook configuration needed",
          "Bring your existing business phone number or onboard a brand-new virtual line",
          "Instant synchronization of business profiles, logos, catalog menus, and hours"
        ]
      },
      {
        heading: "Omnichannel Synergy: WhatsApp, Instagram & Messenger Unified",
        body: "Customer journeys don't stop at WhatsApp. When a follower comments on your Instagram reel or sends a private DM on Facebook, Ittisalo's Meta Graph API integration detects intent and triggers instant contextual AI responses. Customers can browse your catalog, confirm delivery addresses, or transition seamlessly into WhatsApp checkout with their cart preserved.",
        bulletPoints: [
          "Automated comment-to-DM funnels that convert reel engagement into sales",
          "Story mention auto-responders with personalized discount vouchers",
          "Unified multi-agent team inbox handling WhatsApp, IG, Messenger, and Web Chat"
        ]
      },
      {
        heading: "Start Scaling Conversational Commerce Today",
        body: "Whether you operate a restaurant handling dinner rush orders, a fashion brand managing lawn collection drops, or a clinic scheduling doctor appointments, Ittisalo's Meta integration gives your team the enterprise foundation needed to scale without hiring dozens of support reps."
      }
    ],
    relatedSlugs: ["automate-whatsapp-orders-restaurant", "instagram-comment-to-dm-funnel"]
  },
  "automate-whatsapp-orders-restaurant": {
    slug: "automate-whatsapp-orders-restaurant",
    title: "How to Automate WhatsApp Delivery Orders & Menus for Pakistani Restaurants",
    category: "Restaurant Automation",
    date: "September 4, 2026",
    readTime: "6 min read",
    author: "Usama Ahmed",
    authorRole: "Product Lead at Ittisalo",
    summary:
      "A complete operational guide for restaurant owners in Karachi and Lahore looking to eliminate phone chaos, publish digital WhatsApp menus, and process automated Cash on Delivery orders.",
    image: "/images/solutions/restaurant.jpg",
    sections: [
      {
        heading: "The Peak Dinner Rush Bottleneck in Restaurant Messaging",
        body: "Between 8:00 PM and 10:30 PM on weekend nights, a typical high-demand restaurant in DHA or Gulberg receives upwards of 70 WhatsApp messages an hour. When staff are busy assembling food parcels and serving walk-in diners, WhatsApp notifications go unanswered. Customers wait 20 minutes for a menu PDF, get frustrated, and order from a competing restaurant on foodpanda."
      },
      {
        heading: "Step 1: Connecting the Official WhatsApp Business API",
        body: "Unlike standard WhatsApp Business app numbers that get rate-limited or banned, the official WhatsApp Business API allows multi-agent logins and automated bot flows. Ittisalo connects directly to Meta's Cloud API, giving your restaurant an official green tick verification and instant response capability.",
        bulletPoints: [
          "No risk of phone number disconnection during marketing broadcasts",
          "Multi-staff access with role-based order tagging",
          "Direct integration with kitchen receipt printing webhooks"
        ]
      },
      {
        heading: "Step 2: Designing Interactive WhatsApp Catalog Menus",
        body: "Sending heavy 15MB PDF menus is slow and cumbersome on mobile networks. Ittisalo replaces PDFs with native WhatsApp list messages and interactive catalog buttons. Customers can tap 'Burgers', select deal combos, specify spice levels or extra toppings, and view their calculated bill in real time."
      },
      {
        heading: "Step 3: Automated Address & Cash on Delivery (COD) Confirmation",
        body: "Before an order is pushed to your kitchen, Ittisalo AI confirms the customer's delivery block, phone number, and Cash on Delivery payment amount. Once confirmed, the system generates an automated tracking code sent via WhatsApp."
      }
    ],
    relatedSlugs: ["instagram-comment-to-dm-funnel", "cut-clinic-appointment-no-shows"]
  },
  "instagram-comment-to-dm-funnel": {
    slug: "instagram-comment-to-dm-funnel",
    title: "Why Instagram Comment-to-DM Auto-Replies Are the Highest-Converting Sales Funnel in 2026",
    category: "eCommerce Growth",
    date: "August 28, 2026",
    readTime: "5 min read",
    author: "Sobia Malik",
    authorRole: "Growth Strategist at Ittisalo",
    summary:
      "How fashion brands, salon studios, and online boutiques convert Instagram reel engagement into instant high-margin sales over WhatsApp.",
    image: "/images/solutions/ecommerce.jpg",
    sections: [
      {
        heading: "The High Cost of Unanswered Instagram Comments",
        body: "You drop a stunning new lawn or pret collection reel on Instagram. Within 2 hours, 300 comments ask 'Price please?' or 'Is Size M available?'. Manually DMing each buyer takes hours, by which time buyer impulse has cooled down."
      },
      {
        heading: "How Comment-to-DM Triggering Works",
        body: "With Ittisalo Meta Graph API integration, any post comment containing keywords like 'price', 'link', 'buy', or 'info' triggers an automated private DM sent straight to the user's Instagram inbox within 2 seconds."
      },
      {
        heading: "Transitioning Instagram Followers to WhatsApp Checkout",
        body: "Inside the automated Instagram DM, Ittisalo provides a 1-click button that transfers the buyer to WhatsApp with their chosen item pre-loaded in the cart. This yields a 3.8x higher checkout completion rate compared to sending users to a slow website link."
      }
    ],
    relatedSlugs: ["automate-whatsapp-orders-restaurant", "cut-clinic-appointment-no-shows"]
  },
  "cut-clinic-appointment-no-shows": {
    slug: "cut-clinic-appointment-no-shows",
    title: "How Dental & Medical Clinics Cut Patient No-Shows by 68% Using Automated WhatsApp Reminders",
    category: "Clinic Workflows",
    date: "August 15, 2026",
    readTime: "7 min read",
    author: "Dr. Fatima Al-Zahra",
    authorRole: "Healthcare Workflow Advisor",
    summary:
      "A step-by-step strategy for medical centers and dental clinics to automate patient scheduling, pre-consultation intake forms, and confirmation alerts.",
    image: "/images/solutions/clinic.jpg",
    sections: [
      {
        heading: "The Financial Drain of Empty Clinic Doctor Slots",
        body: "In dental and specialty clinics, an unconfirmed appointment represents lost revenue that cannot be recovered. When patients forget their appointment time or reschedule at the last minute without notice, expensive medical staff sit idle."
      },
      {
        heading: "Automating 24-Hour WhatsApp Confirmation Alerts",
        body: "Instead of phone calls that go to voicemail, Ittisalo sends an automated WhatsApp message 24 hours prior to the appointment with two interactive buttons: [Confirm Attendance] or [Reschedule Slot]. If a patient clicks Reschedule, the slot is immediately opened for waitlisted patients."
      }
    ],
    relatedSlugs: ["automate-whatsapp-orders-restaurant", "instagram-comment-to-dm-funnel"]
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = BLOG_ARTICLES[resolvedParams.slug];

  if (!data) {
    return {
      title: "Blog Article — Ittisalo AI"
    };
  }

  return {
    title: `${data.title} — Ittisalo Blog`,
    description: data.summary.substring(0, 160),
    keywords: [data.category, "Ittisalo Blog", "WhatsApp Automation Guide"]
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const post = BLOG_ARTICLES[slug];

  if (!post) {
    notFound();
  }

  return (
    <div className="w-full bg-[#FDFCFB] min-h-screen">
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.summary,
            "image": post.image,
            "datePublished": post.date,
            "author": {
              "@type": "Person",
              "name": post.author,
              "jobTitle": post.authorRole
            },
            "publisher": {
              "@type": "Organization",
              "name": "Ittisalo (Private) Limited",
              "logo": "https://ittisalo.com/logo.png"
            }
          })
        }}
      />

      {/* Article Header */}
      <section className="pt-12 pb-16 px-4 bg-gradient-to-b from-[#FFF5F5]/60 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8C8285] hover:text-[#C81E3A] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Blog Articles
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="bg-[#FFF5F5] border border-[#FFE8EA] text-[#8B1531] px-3 py-1 rounded-full font-bold">
              {post.category}
            </span>
            <span className="text-[#8C8285]">•</span>
            <span className="text-[#8C8285]">{post.date}</span>
            <span className="text-[#8C8285]">•</span>
            <span className="text-[#8C8285] flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1517] leading-[1.18]">
            {post.title}
          </h1>

          <p className="text-lg text-[#5C5255] font-medium leading-relaxed">
            {post.summary}
          </p>

          {/* Author Byline */}
          <div className="pt-4 border-t border-[#EFEBE4] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#240710] text-white flex items-center justify-center font-bold text-sm">
              <User size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A1517]">{post.author}</div>
              <div className="text-xs font-medium text-[#8C8285]">{post.authorRole}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 px-4 max-w-4xl mx-auto space-y-12">
        <div className="rounded-3xl overflow-hidden border border-[#EFEBE4] shadow-xl">
          <img src={post.image} alt={post.title} className="w-full h-80 sm:h-96 object-cover" />
        </div>

        <div className="prose prose-lg max-w-none text-[#1A1517] space-y-8">
          {post.sections.map((sec, idx) => (
            <div key={idx} className="space-y-8">
              <div className="space-y-4 bg-white p-8 rounded-3xl border border-[#EFEBE4] shadow-sm">
                <h2 className="text-2xl font-bold text-[#1A1517] leading-snug">
                  {sec.heading}
                </h2>
                <p className="text-base text-[#5C5255] leading-relaxed font-normal">
                  {sec.body}
                </p>
                {sec.bulletPoints && (
                  <div className="space-y-2 pt-2">
                    {sec.bulletPoints.map((bp, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm font-bold text-[#1A1517]">
                        <CheckCircle2 size={16} className="text-[#10B981] shrink-0 mt-1" />
                        <span>{bp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {post.diagram && idx === 1 && (
                <div className="rounded-3xl overflow-hidden border border-[#EFEBE4] bg-white p-5 sm:p-7 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-bold text-[#1A1517] flex items-center gap-2">
                      <Sparkles size={18} className="text-[#E63946]" />
                      <span>{post.diagram.title}</span>
                    </div>
                    <span className="text-xs font-bold text-[#10B981] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      Official Meta Cloud API
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                    <img src={post.diagram.image} alt={post.diagram.title} className="w-full object-cover" />
                  </div>
                  <p className="text-xs text-[#8C8285] text-center font-medium">
                    {post.diagram.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Demo & Newsletter CTA Box */}
        <div className="bg-[#240710] text-white p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden border border-[#3D0C1A]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E63946]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 bg-[#3D0C1A] border border-[#5C162A] px-3.5 py-1 rounded-full text-xs font-bold text-[#E63946]">
            <Sparkles size={14} /> Ready to Automate Your Business?
          </div>

          <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            See Ittisalo AI in Action on Your Business Channels
          </h3>

          <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
            Schedule a 1-on-1 demo with our Karachi team. We will ingest your menu or service catalog and show you a live working AI bot in under 15 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
            >
              <Sparkles size={16} /> Book Live Demo & Free Setup
            </Link>
            <Link
              href="/product"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#3D0C1A] hover:bg-[#5C162A] border border-[#5C162A]"
            >
              Explore Platform Features <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Related Posts Block */}
        <div className="pt-12 border-t border-[#EFEBE4] space-y-6">
          <h3 className="text-xl font-bold text-[#1A1517]">Related Articles & Guides</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {post.relatedSlugs.map((rSlug) => {
              const relPost = BLOG_ARTICLES[rSlug];
              if (!relPost) return null;
              return (
                <Link
                  key={relPost.slug}
                  href={`/blog/${relPost.slug}`}
                  className="p-5 bg-white border border-[#EFEBE4] rounded-2xl space-y-2 hover:border-[#C81E3A] transition-colors block"
                >
                  <div className="text-[10px] font-bold text-[#C81E3A] uppercase tracking-wider">
                    {relPost.category}
                  </div>
                  <div className="text-sm font-bold text-[#1A1517] leading-snug">{relPost.title}</div>
                  <div className="text-xs text-[#8C8285] flex items-center gap-1 pt-1">
                    <Clock size={12} /> {relPost.readTime}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
