import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export default function CaseStudiesIndex() {
  const studies = [
    {
      company: "Bella Salon",
      industry: "Beauty & Wellness",
      headline: "How Bella Salon booked 30% more appointments using Instagram Automation",
      metric: "30%",
      metricLabel: "Increase in bookings",
      slug: "bella-salon",
    },
    {
      company: "Fresh Eats Delivery",
      industry: "Restaurant",
      headline: "Handling 500+ daily WhatsApp orders without hiring extra staff",
      metric: "0",
      metricLabel: "Extra staff hired",
      slug: "fresh-eats",
    },
    {
      company: "Urban Realty",
      industry: "Real Estate",
      headline: "Qualifying 1,000s of Facebook leads automatically",
      metric: "5x",
      metricLabel: "Faster response time",
      slug: "urban-realty",
    }
  ];

  return (
    <div className="w-full bg-[var(--color-mktg-bg)] min-h-screen py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-4 text-center">
          Customer Stories
        </h1>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          See how businesses around the world use Ittisalo to automate conversations and grow revenue.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studies.map((study) => (
            <Link key={study.slug} href={`/case-studies/${study.slug}`} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col">
              <div className="h-48 bg-gray-100 relative">
                {/* Image placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-400 font-display font-bold text-2xl opacity-50">{study.company}</span>
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="text-xs font-bold text-[var(--color-mktg-cta)] uppercase tracking-wider mb-3">
                  {study.industry}
                </div>
                <h2 className="text-xl font-bold text-[var(--color-mktg-base)] mb-6 group-hover:text-[var(--color-mktg-cta)] transition-colors">
                  {study.headline}
                </h2>
                
                <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[var(--color-mktg-base)]">{study.metric}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{study.metricLabel}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[var(--color-mktg-cta)]">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
