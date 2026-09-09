import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles, Clock, AlertTriangle, Check, ShieldCheck, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

type VerticalData = {
  title: string;
  badge: string;
  headline: string;
  description: string;
  image: string;
  caseStudySlug: string;
  caseStudyName: string;
  caseStudyMetric: string;
  painPoints: { problem: string; impact: string }[];
  dayInTheLife: {
    before: string;
    after: string;
  };
  benefits: string[];
  example: {
    customer: string;
    ai: string;
    actionBadge: string;
  };
  relatedChannels: { name: string; href: string }[];
};

const SOLUTIONS_DATA: Record<string, VerticalData> = {
  restaurants: {
    title: "AI for Restaurants, Cafes & Cloud Kitchens",
    badge: "Food & Beverage Workflow",
    headline: "Eliminate Order Mix-Ups and Missed Peak-Hour Orders Over WhatsApp & DMs",
    description:
      "When dinner rush hits, your staff can't manually answer 40 WhatsApp messages asking for menus, prices, and delivery updates. Ittisalo AI presents digital menus, records item customizations, calculates totals with delivery fees, and routes orders directly to your kitchen queue.",
    image: "/images/solutions/restaurant.jpg",
    caseStudySlug: "gourmet-bites-bistro",
    caseStudyName: "Gourmet Bites Bistro (DHA Karachi)",
    caseStudyMetric: "+240% Direct Order Revenue",
    painPoints: [
      {
        problem: "Order Mix-Ups Over DM",
        impact: "Manual typing errors during peak hours cause incorrect food dispatches and angry customer reviews."
      },
      {
        problem: "Unanswered Midnight & Delivery Queries",
        impact: "Customers message for late-night delivery or menu PDF links and order from competitors if delayed 5 minutes."
      },
      {
        problem: "Table Reservation Chaos",
        impact: "Double-booked tables or lost handwritten reservations lead to awkward walk-in experiences."
      }
    ],
    dayInTheLife: {
      before:
        "7:30 PM Friday: Phone is ringing, WhatsApp has 28 unread messages asking for prices, and staff are shouting orders to the cook while customers walk out.",
      after:
        "7:30 PM Friday: Ittisalo AI auto-replies to all 28 WhatsApp messages in 0.4 seconds, sends digital menus, collects delivery addresses, reserves 4 tables, and logs orders into the kitchen portal."
    },
    benefits: [
      "Interactive digital WhatsApp menu with category filters (Burgers, Steaks, Drinks, Desserts)",
      "Automated order total calculation with tax & area delivery fees",
      "Instant WhatsApp table reservation booking synced with restaurant seating chart",
      "Automated Cash on Delivery (COD) confirmation & order tracking links"
    ],
    example: {
      customer: "Hi! Can I order 2 Charcoal Grilled Burgers for delivery to DHA Phase 6 Karachi tonight?",
      ai: "Assalam-o-Alaikum! 2 Charcoal Grilled Burgers + Fries combo is Rs. 1,850 + Rs. 150 delivery fee (Total: Rs. 2,000). Should I dispatch to DHA Phase 6 via COD?",
      actionBadge: "Kitchen Order #GB-9401 Dispatched"
    },
    relatedChannels: [
      { name: "WhatsApp Business API", href: "/channels/whatsapp" },
      { name: "Instagram DMs", href: "/channels/instagram" }
    ]
  },
  clinics: {
    title: "AI for Dental & Medical Clinics",
    badge: "Healthcare & Intake Workflow",
    headline: "Capture 24/7 Patient Appointment Bookings and Cut No-Shows by 68%",
    description:
      "Patients wake up with toothaches or search for doctor availability late at night. Ittisalo AI triages inquiries, shares treatment fees, checks doctor calendars, and sends automated WhatsApp intake reminders that prevent costly appointment no-shows.",
    image: "/images/solutions/clinic.jpg",
    caseStudySlug: "smilecare-dental",
    caseStudyName: "SmileCare Dental Clinic (Karachi)",
    caseStudyMetric: "68% Drop in Patient No-Shows",
    painPoints: [
      {
        problem: "After-Hours Appointment Requests Lost",
        impact: "Patients messaging after 7 PM clinic closing don't get answers until next morning, by which time they've booked elsewhere."
      },
      {
        problem: "High Patient No-Show Rates",
        impact: "Unconfirmed appointments waste valuable doctor slots and revenue."
      },
      {
        problem: "Repetitive Pricing & Service FAQ Strain",
        impact: "Receptionists spend hours answering 'What is the cost of teeth whitening?' instead of attending in-clinic patients."
      }
    ],
    dayInTheLife: {
      before:
        "Front desk receptionist is overwhelmed answering phone calls, handling in-person check-ins, and forgetting to call 15 patients to confirm tomorrow's appointments.",
      after:
        "Ittisalo AI answers patient inquiries 24/7 on WhatsApp, books open calendar slots, collects pre-visit symptoms, and sends automated 24-hour reminder texts."
    },
    benefits: [
      "24/7 calendar slot booking for consultations and procedures",
      "Automated pre-appointment patient intake & symptom questionnaires",
      "Instant answers on consultation fees, doctor credentials, and clinic location pins",
      "WhatsApp & SMS appointment reminder alerts with 1-click confirmation buttons"
    ],
    example: {
      customer: "Hi! Do you have an opening for a dental scaling & consultation with Dr. Fatima tomorrow morning?",
      ai: "Hello! Dr. Fatima has open slots tomorrow Thursday at 11:00 AM and 12:30 PM. Consultation fee is Rs. 1,500. Which time works best for you?",
      actionBadge: "Appointment Confirmed (Thu 11:00 AM)"
    },
    relatedChannels: [
      { name: "WhatsApp Business API", href: "/channels/whatsapp" },
      { name: "Facebook Messenger", href: "/channels/messenger" }
    ]
  },
  "ecommerce-fashion": {
    title: "AI for eCommerce, Apparel & Fashion Brands",
    badge: "eCommerce Retail Workflow",
    headline: "Turn Instagram Story Mentions and DM Inquiries into Instant Catalog Sales",
    description:
      "When you launch a new collection, hundreds of Instagram comments ask 'Price please?' and 'Is Medium available?'. Ittisalo automatically DMs product checkout links, confirms Cash on Delivery (COD) addresses, and recovers abandoned carts on WhatsApp.",
    image: "/images/solutions/ecommerce.jpg",
    caseStudySlug: "urban-chic-apparel",
    caseStudyName: "Urban Chic Apparel (Lahore / Karachi)",
    caseStudyMetric: "+38% COD Order Conversions",
    painPoints: [
      {
        problem: "Unanswered 'DM Price' Post Comments",
        impact: "Delayed DM replies lose impulse buyers to faster online competitors."
      },
      {
        problem: "High Fake / Unconfirmed COD Returns",
        impact: "Dispatching unverified Cash on Delivery orders leads to expensive courier return shipping fees."
      },
      {
        problem: "Abandoned Shopping Carts",
        impact: "Shoppers add items to cart on mobile but forget to complete checkout without a friendly reminder."
      }
    ],
    dayInTheLife: {
      before:
        "New lawn collection drops on Instagram. 400 comments flooded with 'Price?'. 2 social media managers manually send copy-pasted DMs until 2 AM.",
      after:
        "Ittisalo AI detects every comment and DM, instantly sends size availability and direct WhatsApp buy links, and verifies COD shipping addresses automatically."
    },
    benefits: [
      "Comment-to-DM automated sales funnel for Instagram reels & posts",
      "Automated WhatsApp Cash on Delivery (COD) phone verification",
      "Abandoned cart recovery sequences sent via WhatsApp with discount coupons",
      "Real-time courier dispatch status and tracking links"
    ],
    example: {
      customer: "Is the Maroon Embroidered Kurti in size Large in stock for delivery to Islamabad?",
      ai: "Assalam-o-Alaikum! Yes! 3 pieces left in Size Large (Rs. 4,500). Cash on Delivery available with 2-day dispatch to Islamabad. Click below to place order!",
      actionBadge: "WhatsApp Checkout Link Sent"
    },
    relatedChannels: [
      { name: "Instagram DMs", href: "/channels/instagram" },
      { name: "WhatsApp Business API", href: "/channels/whatsapp" }
    ]
  },
  "real-estate": {
    title: "AI for Real Estate Agencies & Developers",
    badge: "Property Lead Qualification",
    headline: "Pre-Qualify Meta Ad Leads and Book Property Site Visits 24/7",
    description:
      "Meta Click-to-WhatsApp and Messenger ads generate hundreds of property inquiries. Ittisalo AI asks qualifying questions (Budget, Location, Timeline), dispatches PDF brochures, and schedules site viewings for your top sales agents.",
    image: "/images/solutions/real-estate.jpg",
    caseStudySlug: "apex-horizon-realty",
    caseStudyName: "Apex Horizon Realty (DHA Phase 8)",
    caseStudyMetric: "4.2x Faster Lead Contact",
    painPoints: [
      {
        problem: "Slow Lead Response from Ad Campaigns",
        impact: "Leads generated from Facebook ads cold-off if not contacted within 5 minutes."
      },
      {
        problem: "Unqualified Buyer Time Wasting",
        impact: "Agents spend hours showing properties to buyers without confirmed budget or intent."
      },
      {
        problem: "Lost Property PDF Brochures",
        impact: "Manual emailing or messaging property details results in lost buyer follow-ups."
      }
    ],
    dayInTheLife: {
      before:
        "Marketing team spends $1,000 on Facebook Lead Ads over the weekend. Leads sit in CSV spreadsheet until Monday morning when 70% no longer remember opting in.",
      after:
        "Ittisalo AI greets every lead in real time on Messenger or WhatsApp, collects budget/location criteria, sends PDF property decks, and schedules Saturday site viewings."
    },
    benefits: [
      "Instant lead response for Click-to-WhatsApp & Messenger ad campaigns",
      "Automated lead scoring and budget pre-qualification questionnaires",
      "Instant PDF brochure and floor plan document dispatch in chat",
      "Automated site visit appointment booking for real estate consultants"
    ],
    example: {
      customer: "I saw your ad for 3-Bedroom Luxury Apartments in DHA Phase 8. What is the down payment?",
      ai: "Assalam-o-Alaikum! Down payment is 25% (Rs. 70 Lacs) with a 3-year installment plan. I've sent the complete floor plan PDF! Would you like to view the model apartment this Saturday?",
      actionBadge: "Property Deck Sent & Visit Booked"
    },
    relatedChannels: [
      { name: "Facebook Messenger", href: "/channels/messenger" },
      { name: "WhatsApp Business API", href: "/channels/whatsapp" }
    ]
  },
  salons: {
    title: "AI for Salons, Beauty Studios & Spas",
    badge: "Salon Booking & Reminders",
    headline: "Eliminate No-Shows and Fill Stylist Calendars Over Instagram DMs",
    description:
      "Clients want to book haircuts, hair coloring, and bridal makeup over Instagram DMs late at night. Ittisalo AI shares your service menu with prices, books open slots per stylist, and collects booking deposits automatically.",
    image: "/images/solutions/salon.jpg",
    caseStudySlug: "glow-grace-salon",
    caseStudyName: "Glow & Grace Studio (Clifton Karachi)",
    caseStudyMetric: "94% Deposit Capture Rate",
    painPoints: [
      {
        problem: "Stylist Slot Double-Booking & Confusion",
        impact: "Manual scheduling on paper notebooks causes overlaps and unhappy clients."
      },
      {
        problem: "Last-Minute Cancellations & Empty Chairs",
        impact: "Unconfirmed appointments lead to lost revenue during prime weekend salon hours."
      },
      {
        problem: "Repetitive Price & Stylist Inquiries",
        impact: "Answering 'How much is balayage?' on Instagram DMs takes staff away from servicing clients."
      }
    ],
    dayInTheLife: {
      before:
        "Salon manager is washing a client's hair while trying to type Instagram DM replies to 10 girls asking for Saturday makeup slots.",
      after:
        "Ittisalo AI presents the full salon service menu, checks senior stylist calendar availability, locks in slots, and sends automated WhatsApp booking confirmations."
    },
    benefits: [
      "Interactive visual service menu with pricing & duration estimates",
      "Stylist-specific calendar availability booking",
      "Automated deposit payment link dispatch to lock in appointments",
      "WhatsApp reminder alerts with 1-tap reschedule or cancellation"
    ],
    example: {
      customer: "Hi! Do you have an opening for HydraFacial and Blowdry tomorrow at 3 PM with Sarah?",
      ai: "Hello! Yes, Sarah is available tomorrow at 3:00 PM for HydraFacial + Blowdry (Rs. 6,500 total). Should I reserve this slot under your name?",
      actionBadge: "Salon Booking Confirmed (3:00 PM)"
    },
    relatedChannels: [
      { name: "Instagram DMs", href: "/channels/instagram" },
      { name: "WhatsApp Business API", href: "/channels/whatsapp" }
    ]
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = SOLUTIONS_DATA[resolvedParams.vertical];

  if (!data) {
    return {
      title: "Vertical Solutions — Ittisalo AI"
    };
  }

  return {
    title: `${data.title} — Ittisalo Omnichannel AI`,
    description: data.description.substring(0, 160),
    keywords: [`${data.title} Pakistan`, "Ittisalo Solution", "WhatsApp Automation SaaS"]
  };
}

export default async function SolutionPage({ params }: { params: Promise<{ vertical: string }> }) {
  const resolvedParams = await params;
  const vertical = resolvedParams.vertical;
  const data = SOLUTIONS_DATA[vertical];

  if (!data) {
    notFound();
  }

  return (
    <div className="w-full bg-[#FDFCFB] min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-20 px-4 bg-gradient-to-b from-[#FFF5F5]/60 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF5F5] border border-[#FFE8EA] text-[#8B1531] text-xs sm:text-sm font-bold shadow-sm">
              <Sparkles size={16} className="text-[#E63946]" /> {data.badge}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1517] leading-[1.15]">
              {data.headline}
            </h1>

            <p className="text-base sm:text-lg text-[#5C5255] font-medium leading-relaxed">
              {data.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-[#E63946]/20 transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
              >
                <Sparkles size={18} /> Schedule Customized Demo
              </Link>
              <Link
                href={`/case-studies/${data.caseStudySlug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-base text-[#C81E3A] bg-[#FFF5F5] border border-[#FFE8EA] hover:bg-[#FFE8EA] transition-colors"
              >
                Read Case Study ({data.caseStudyMetric}) <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-[#EFEBE4] shadow-2xl bg-white relative">
              <img src={data.image} alt={data.title} className="w-full h-64 sm:h-72 object-cover" />
              <div className="p-6 space-y-4 bg-white">
                <div className="text-xs font-bold text-[#8C8285] uppercase tracking-wider">
                  Live Conversational Bot Flow
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-gray-100 p-3 rounded-xl text-[#1A1517] font-medium max-w-[90%]">
                    {data.example.customer}
                  </div>
                  <div className="bg-[#FFF5F5] border border-[#FFE8EA] p-3 rounded-xl text-[#1A1517] font-medium max-w-[90%] ml-auto space-y-2">
                    <p>{data.example.ai}</p>
                    <div className="pt-1">
                      <span className="bg-[#10B981] text-white px-2.5 py-1 rounded font-bold text-[10px]">
                        ✓ {data.example.actionBadge}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-white border-b border-[#EFEBE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 bg-red-50 text-[#C81E3A] px-3.5 py-1 rounded-full text-xs font-bold">
              <AlertTriangle size={14} /> The Cost of Slow DM Replies
            </div>
            <h2 className="text-3xl font-display font-extrabold text-[#1A1517]">
              Key operational pain points we solve for {data.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.painPoints.map((pt, i) => (
              <div key={i} className="bg-[#FDFCFB] border border-[#EFEBE4] rounded-3xl p-8 space-y-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F5] border border-[#FFE8EA] flex items-center justify-center text-[#C81E3A] font-bold">
                  0{i + 1}
                </div>
                <h3 className="text-lg font-bold text-[#1A1517]">{pt.problem}</h3>
                <p className="text-sm text-[#5C5255] leading-relaxed">{pt.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Day in the Life Comparison */}
      <section className="py-20 bg-[#240710] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#3D0C1A] border border-[#5C162A] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#E63946]">
              <Clock size={14} /> Transformation Scenario
            </div>
            <h2 className="text-3xl font-display font-extrabold">
              A Day in the Life: Before vs. After Ittisalo AI
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#3D0C1A] border border-[#5C162A] p-8 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle size={16} /> BEFORE ITTISALO (Manual Stress)
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                "{data.dayInTheLife.before}"
              </p>
            </div>

            <div className="bg-[#3D0C1A] border border-[#10B981]/40 p-8 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-[#10B981] font-bold text-sm">
                <CheckCircle2 size={16} /> AFTER ITTISALO (Automated Growth)
              </div>
              <p className="text-sm text-gray-200 leading-relaxed font-medium">
                "{data.dayInTheLife.after}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits List */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-display font-extrabold text-[#1A1517] text-center mb-12">
            Built-in capabilities for {data.title}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-3 p-5 bg-[#FDFCFB] border border-[#EFEBE4] rounded-2xl">
                <CheckCircle2 size={20} className="text-[#10B981] shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-[#1A1517] leading-snug">{b}</span>
              </div>
            ))}
          </div>

          {/* Mini Case Study Callout */}
          <div className="mt-12 bg-[#FFF5F5] border border-[#FFE8EA] p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs font-extrabold text-[#C81E3A] uppercase tracking-wider mb-1">
                Verified Vertical Impact
              </div>
              <div className="text-xl font-bold text-[#1A1517]">{data.caseStudyName}</div>
              <div className="text-sm font-semibold text-[#5C5255]">Achieved {data.caseStudyMetric} within 30 days.</div>
            </div>
            <Link
              href={`/case-studies/${data.caseStudySlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#240710] text-white text-sm font-bold shadow-md hover:bg-[#3D0C1A] transition-colors shrink-0"
            >
              Read Case Study <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
