import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Star, TrendingUp, Clock, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";

type CaseStudyDetail = {
  slug: string;
  company: string;
  vertical: string;
  location: string;
  headline: string;
  metric1: string;
  metric1Label: string;
  metric2: string;
  metric2Label: string;
  metric3: string;
  metric3Label: string;
  clientName: string;
  clientRole: string;
  quote: string;
  image: string;
  challenge: string;
  solution: string;
  results: string[];
  solutionLink: string;
  channelLink: string;
};

const CASE_STUDIES_DATA: Record<string, CaseStudyDetail> = {
  "gourmet-bites-bistro": {
    slug: "gourmet-bites-bistro",
    company: "Gourmet Bites Bistro",
    vertical: "Restaurants & Cafes",
    location: "DHA Phase 6, Karachi",
    headline: "How Gourmet Bites Bistro Automated 240% More WhatsApp Delivery Orders During Peak Rush",
    metric1: "+240%",
    metric1Label: "WhatsApp Orders",
    metric2: "0.4s",
    metric2Label: "AI Reply Time",
    metric3: "Rs. 450K+",
    metric3Label: "Monthly Revenue Gain",
    clientName: "Tariq Farooq",
    clientRole: "Managing Director, Gourmet Bites Bistro",
    quote:
      "Before Ittisalo, Friday night rushes were chaotic. WhatsApp messages sat unread for 45 minutes while customers ordered elsewhere. Now, Ittisalo AI responds in half a second, shares our digital menu, takes delivery details, and books tables. It doubled our delivery sales.",
    image: "/images/solutions/restaurant.jpg",
    challenge:
      "Gourmet Bites Bistro operates a high-footfall dining and delivery outlet in DHA Phase 6, Karachi. During weekend dinner peaks (8 PM - 11 PM), front-desk staff were inundated with phone calls and over 60 WhatsApp messages an hour asking for menu prices, deal availability, and delivery updates. Staff typing errors led to incorrect food dispatches, and delayed replies caused customers to order from competing restaurants.",
    solution:
      "The bistro deployed Ittisalo WhatsApp AI Bot integrated with their official WhatsApp Business API. Ittisalo was trained on the bistro's complete menu, prices, deal bundles, and delivery coverage zones in Karachi (DHA, Clifton, PECHS). The AI instantly presents interactive catalog menus, collects item customizations, calculates totals with delivery fees, and logs orders directly into the kitchen display portal.",
    results: [
      "240% increase in direct WhatsApp delivery orders processed without manual staff intervention",
      "Average AI response speed dropped from 35 minutes down to 0.4 seconds",
      "Zero kitchen dispatch errors recorded over a 60-day period",
      "42 table reservations booked automatically per weekend without double-booking"
    ],
    solutionLink: "/solutions/restaurants",
    channelLink: "/channels/whatsapp"
  },
  "smilecare-dental": {
    slug: "smilecare-dental",
    company: "SmileCare Dental Clinic",
    vertical: "Dental & Healthcare",
    location: "DHA Phase 5, Karachi",
    headline: "Cutting Patient Appointment No-Shows by 68% with Automated WhatsApp Intake",
    metric1: "68%",
    metric1Label: "No-Show Reduction",
    metric2: "100%",
    metric2Label: "24/7 Patient Response",
    metric3: "18 hrs/wk",
    metric3Label: "Staff Hours Saved",
    clientName: "Dr. Fatima Al-Zahra",
    clientRole: "Lead Dental Surgeon & Owner",
    quote:
      "Patients frequently message after 8 PM with dental pain or procedure questions. Ittisalo AI answers them instantly, triages their needs, and books open slots on our calendar. The automated 24-hour reminder texts eliminated our empty slot problem.",
    image: "/images/solutions/clinic.jpg",
    challenge:
      "SmileCare Dental Clinic faced a recurring 25-30% appointment no-show rate due to unconfirmed bookings. Receptionists spent up to 3 hours every afternoon manually calling patients to confirm next-day visits. After-hours inquiries sent via Facebook and WhatsApp were left unanswered until 9 AM the next morning, losing high-value cosmetic and dental implant prospects.",
    solution:
      "SmileCare implemented Ittisalo AI across WhatsApp and Facebook Messenger. The AI was configured with doctor availability calendars, procedure fees (scaling, teeth whitening, root canals), and patient pre-consultation intake forms. Ittisalo greets patients 24/7, locks in open time slots, and sends automated WhatsApp confirmation messages with 1-tap reschedule buttons.",
    results: [
      "68% drop in patient appointment no-shows within the first 30 days of implementation",
      "Over 18 hours per week saved for front-desk reception staff",
      "34% increase in new patient consultations booked after 7 PM clinic closing hours",
      "99.4% patient satisfaction rating on pre-visit intake clarity"
    ],
    solutionLink: "/solutions/clinics",
    channelLink: "/channels/whatsapp"
  },
  "glow-grace-salon": {
    slug: "glow-grace-salon",
    company: "Glow & Grace Studio",
    vertical: "Salons & Beauty Spas",
    location: "Clifton, Karachi",
    headline: "Achieving 94% Booking Deposit Capture Across Instagram DMs & WhatsApp",
    metric1: "94%",
    metric1Label: "Deposit Capture",
    metric2: "120+",
    metric2Label: "Weekly Bookings",
    metric3: "3.8x",
    metric3Label: "Instagram Conversion",
    clientName: "Sobia Malik",
    clientRole: "Founder & Creative Director",
    quote:
      "Instagram DMs are our main booking driver. Girls send photos of hairstyles or hair color at midnight asking 'How much?'. Ittisalo AI responds instantly with stylist pricing and secures a booking deposit. It transformed our business revenue.",
    image: "/images/solutions/salon.jpg",
    challenge:
      "Glow & Grace Studio receives over 150 Instagram DMs daily asking for appointment availability for balayage, HydraFacials, and bridal makeup. Stylists could not respond while servicing clients, resulting in lost bookings to competitor salons. Furthermore, unconfirmed weekend appointments led to empty stylist chairs during prime hours.",
    solution:
      "Glow & Grace connected Ittisalo Instagram Direct & WhatsApp AI. The AI presents visual service menus with estimated durations and prices, checks individual stylist schedules (Senior Stylist vs. Junior Stylist), locks in time slots, and dispatches automated deposit payment links via WhatsApp to guarantee bookings.",
    results: [
      "94% deposit capture rate for high-value weekend salon services",
      "Over 120 client appointments booked automatically each week via Instagram DMs",
      "3.8x higher conversion rate from Instagram story mentions and reel comments",
      "Zero schedule overlaps or double-booked stylist slots"
    ],
    solutionLink: "/solutions/salons",
    channelLink: "/channels/instagram"
  },
  "urban-chic-apparel": {
    slug: "urban-chic-apparel",
    company: "Urban Chic Apparel",
    vertical: "eCommerce & Apparel",
    location: "Lahore / Karachi",
    headline: "Boosting Cash on Delivery (COD) Checkout Conversions by 38% via Instagram Auto-DM",
    metric1: "+38%",
    metric1Label: "COD Conversions",
    metric2: "98%",
    metric2Label: "Address Accuracy",
    metric3: "4.5x",
    metric3Label: "Cart Recovery ROI",
    clientName: "Bilal Mansoor",
    clientRole: "Head of E-Commerce",
    quote:
      "Whenever we post a new lawn or pret collection on Instagram, our comments blow up with 'Price please?'. Ittisalo automatically DMs product checkout links and verifies COD delivery addresses on WhatsApp. Our abandoned cart recovery rate skyrocketed.",
    image: "/images/solutions/ecommerce.jpg",
    challenge:
      "Urban Chic Apparel struggled to manage high-volume social media engagement. Over 500 comments a day flooded their Instagram posts with price inquiries. Social media managers could not reply fast enough, causing high drop-offs. Additionally, unconfirmed Cash on Delivery (COD) orders led to costly courier return shipping fees.",
    solution:
      "Urban Chic integrated Ittisalo Instagram Comment-to-DM automation and WhatsApp order verification. When a user comments on an Instagram post, Ittisalo automatically sends a private DM with the product catalog link. Once an order is placed, Ittisalo sends a WhatsApp confirmation message to verify the customer's phone number and delivery address before courier dispatch.",
    results: [
      "38% increase in completed Cash on Delivery (COD) order checkouts",
      "98% delivery address accuracy, slashing courier return shipping losses",
      "4.5x ROI on automated WhatsApp abandoned cart recovery campaigns",
      "Instant response to 100% of Instagram post comments and story mentions"
    ],
    solutionLink: "/solutions/ecommerce-fashion",
    channelLink: "/channels/instagram"
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = CASE_STUDIES_DATA[resolvedParams.slug];

  if (!data) {
    return {
      title: "Case Study — Ittisalo AI"
    };
  }

  return {
    title: `${data.company} Case Study — Ittisalo AI`,
    description: data.headline.substring(0, 160),
    keywords: [`${data.company} Case Study`, `${data.vertical} AI Automation`, "Ittisalo Customer Story"]
  };
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const data = CASE_STUDIES_DATA[slug];

  if (!data) {
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
            "@type": "Review",
            "itemReviewed": {
              "@type": "SoftwareApplication",
              "name": "Ittisalo Omnichannel AI Inbox"
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5"
            },
            "name": data.headline,
            "author": {
              "@type": "Person",
              "name": data.clientName
            },
            "reviewBody": data.quote
          })
        }}
      />

      {/* Header Banner */}
      <section className="pt-12 pb-16 px-4 bg-gradient-to-b from-[#FFF5F5]/60 via-[#FDFCFB] to-white border-b border-[#EFEBE4]">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8C8285] hover:text-[#C81E3A] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Case Studies Directory
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF5F5] border border-[#FFE8EA] text-[#8B1531] text-xs font-bold">
            <Sparkles size={13} className="text-[#E63946]" /> {data.vertical} • {data.location}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-[#1A1517] leading-[1.15]">
            {data.headline}
          </h1>

          <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#EFEBE4]">
            <div className="bg-white p-4 rounded-2xl border border-[#EFEBE4] text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#C81E3A]">{data.metric1}</div>
              <div className="text-[11px] font-bold text-[#8C8285] uppercase mt-0.5">{data.metric1Label}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EFEBE4] text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1A1517]">{data.metric2}</div>
              <div className="text-[11px] font-bold text-[#8C8285] uppercase mt-0.5">{data.metric2Label}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#EFEBE4] text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981]">{data.metric3}</div>
              <div className="text-[11px] font-bold text-[#8C8285] uppercase mt-0.5">{data.metric3Label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="space-y-12">
          {/* Hero Image */}
          <div className="rounded-3xl overflow-hidden border border-[#EFEBE4] shadow-xl">
            <img src={data.image} alt={data.company} className="w-full h-80 sm:h-96 object-cover" />
          </div>

          {/* Pull Quote Card */}
          <div className="bg-[#240710] text-white p-8 rounded-3xl space-y-4 shadow-xl border border-[#3D0C1A] relative overflow-hidden">
            <div className="text-[#E63946] flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
              <Star size={14} /> Client Verification Quote
            </div>
            <p className="text-lg sm:text-xl font-medium leading-relaxed italic text-gray-100">
              "{data.quote}"
            </p>
            <div className="pt-2 border-t border-[#3D0C1A]">
              <div className="text-sm font-bold text-white">{data.clientName}</div>
              <div className="text-xs text-gray-400">{data.clientRole}</div>
            </div>
          </div>

          {/* Challenge Section */}
          <div className="space-y-4 bg-white p-8 rounded-3xl border border-[#EFEBE4] shadow-sm">
            <h2 className="text-2xl font-bold text-[#1A1517] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E63946]" /> The Challenge
            </h2>
            <p className="text-sm sm:text-base text-[#5C5255] leading-relaxed">
              {data.challenge}
            </p>
          </div>

          {/* Solution Section */}
          <div className="space-y-4 bg-white p-8 rounded-3xl border border-[#EFEBE4] shadow-sm">
            <h2 className="text-2xl font-bold text-[#1A1517] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2563EB]" /> The Ittisalo Solution
            </h2>
            <p className="text-sm sm:text-base text-[#5C5255] leading-relaxed">
              {data.solution}
            </p>
          </div>

          {/* Results Section */}
          <div className="space-y-4 bg-white p-8 rounded-3xl border border-[#EFEBE4] shadow-sm">
            <h2 className="text-2xl font-bold text-[#1A1517] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10B981]" /> Empirical Results & Impact
            </h2>
            <div className="space-y-3 pt-2">
              {data.results.map((res, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-[#FDFCFB] border border-[#EFEBE4] rounded-2xl">
                  <CheckCircle2 size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-[#1A1517] leading-snug">{res}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Links */}
          <div className="pt-8 border-t border-[#EFEBE4] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={data.solutionLink}
                className="px-5 py-2.5 bg-[#FFF5F5] text-[#C81E3A] border border-[#FFE8EA] rounded-xl text-xs font-bold hover:bg-[#FFE8EA]"
              >
                View {data.vertical} Solution →
              </Link>
              <Link
                href={data.channelLink}
                className="px-5 py-2.5 bg-white text-[#1A1517] border border-[#EFEBE4] rounded-xl text-xs font-bold hover:border-[#C81E3A]"
              >
                Channel Mechanics →
              </Link>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #E63946 0%, #C81E3A 50%, #8B1531 100%)" }}
            >
              <Sparkles size={14} /> Get Similar Results For Your Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
