import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

const SOLUTIONS_DATA = {
  restaurants: {
    title: "AI for Restaurants & Cafes",
    headline: "Take orders and reservations automatically.",
    description: "Stop missing out on orders during rush hour. Ittisalo handles your WhatsApp and Instagram DMs, showcasing your menu, taking delivery orders, and booking tables.",
    benefits: [
      "Interactive digital menus within WhatsApp",
      "Automated table reservations synced with your calendar",
      "Direct integration with delivery dispatch systems",
      "Answer FAQs about dietary restrictions and hours"
    ],
    example: {
      customer: "Can I get a table for 2 tonight at 8?",
      ai: "Yes! I've booked a table for 2 at 8:00 PM under your name. See you tonight! 🍽️"
    }
  },
  clinics: {
    title: "AI for Medical & Dental Clinics",
    headline: "Automate patient bookings securely.",
    description: "Reduce no-shows and front-desk workload. Patients can book appointments, reschedule, and get answers to common questions 24/7 on WhatsApp.",
    benefits: [
      "Secure appointment scheduling and reminders",
      "Automated pre-consultation questionnaires",
      "Answer FAQs about insurance and services",
      "Strict data privacy standards"
    ],
    example: {
      customer: "Do you accept BlueCross insurance for teeth whitening?",
      ai: "Yes, we accept BlueCross! Teeth whitening is partially covered. Would you like to schedule a consultation this week?"
    }
  },
  "ecommerce-fashion": {
    title: "AI for eCommerce & Fashion",
    headline: "Turn social media engagement into sales.",
    description: "When a follower comments on an Instagram post, Ittisalo automatically DMs them the product link. Handle sizing questions and track orders instantly.",
    benefits: [
      "Comment-to-DM automated sales funnels",
      "Abandoned cart recovery via WhatsApp",
      "Instant order tracking updates",
      "Personalized product recommendations"
    ],
    example: {
      customer: "Is this jacket true to size?",
      ai: "Yes, it fits true to size! If you prefer a looser fit, we recommend sizing up. We currently have sizes S, M, and L in stock."
    }
  },
  "real-estate": {
    title: "AI for Real Estate",
    headline: "Qualify leads and schedule viewings.",
    description: "Capture leads from Facebook Ads directly into Messenger or WhatsApp. The AI qualifies their budget and timeline before handing them to an agent.",
    benefits: [
      "Automated lead qualification (Budget, Timeline, Preferences)",
      "Instant property brochure delivery",
      "Automated viewing scheduling",
      "Follow-up drip campaigns on WhatsApp"
    ],
    example: {
      customer: "I'm interested in the downtown apartments.",
      ai: "Great! Our downtown units start at $2,500/mo. Are you looking to move in the next 30 days, or later?"
    }
  },
  salons: {
    title: "AI for Salons & Spas",
    headline: "Fill your calendar without lifting a finger.",
    description: "Let clients book haircuts, manicures, and massages via Instagram DMs and WhatsApp while your staff focuses on providing great service.",
    benefits: [
      "Visual service menus and pricing",
      "Real-time calendar booking",
      "Automated appointment reminders",
      "Re-engagement messages for past clients"
    ],
    example: {
      customer: "Do you have any openings for a balayage tomorrow?",
      ai: "We have one spot left tomorrow at 2:00 PM with Jessica! Shall I lock that in for you?"
    }
  }
};

export default async function SolutionPage({ params }: { params: Promise<{ vertical: string }> }) {
  const resolvedParams = await params;
  const vertical = resolvedParams.vertical;
  const data = SOLUTIONS_DATA[vertical as keyof typeof SOLUTIONS_DATA];

  if (!data) {
    notFound();
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <section className="pt-24 pb-16 px-4 bg-[var(--color-mktg-bg)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[var(--color-mktg-cta)] font-bold tracking-wide uppercase text-sm mb-4">
              {data.title}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
              {data.headline}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {data.description}
            </p>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
              Get Started <ArrowRight size={20} />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
            <h3 className="text-xl font-bold mb-6 text-[var(--color-mktg-base)]">Live Example</h3>
            <div className="space-y-4">
              <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm">
                {data.example.customer}
              </div>
              <div className="flex justify-end">
                <div className="bg-[var(--color-mktg-cta)] text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-md shadow-orange-500/20">
                  {data.example.ai}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Key Benefits</h2>
        <div className="space-y-6">
          {data.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <CheckCircle2 size={24} className="text-[var(--color-mktg-cta)] shrink-0" />
              <span className="text-lg text-gray-700 font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
