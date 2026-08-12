import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  return (
    <div className="w-full bg-white min-h-screen py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/case-studies" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-mktg-cta)] transition-colors mb-10">
          <ArrowLeft size={16} /> Back to Case Studies
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
            Case Study: {resolvedParams.slug}
          </h1>
          <p className="text-xl text-gray-600">
            How they transformed their business using Ittisalo.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1 space-y-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-[var(--color-mktg-base)] mb-2">Industry</h3>
              <p className="text-gray-600">Local Business</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-[var(--color-mktg-base)] mb-2">Channels</h3>
              <p className="text-gray-600">Instagram, WhatsApp</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-[var(--color-mktg-base)] mb-2">Results</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 30% more bookings</li>
                <li>• 5 hours saved daily</li>
                <li>• 0 missed messages</li>
              </ul>
            </div>
          </div>
          
          <div className="md:col-span-2 prose prose-lg text-gray-600 max-w-none">
            <h2>The Challenge</h2>
            <p>
              Before using Ittisalo, the business was struggling to keep up with the volume of DMs. Customers were waiting hours for a reply, and many bookings were lost to competitors who replied faster.
            </p>
            <h2>The Solution</h2>
            <p>
              They deployed Ittisalo's AI Copilot on Instagram and WhatsApp. The AI was trained on their pricing, services, and availability calendar. It began instantly replying to comments and DMs, qualifying leads, and booking appointments automatically.
            </p>
            <h2>The Results</h2>
            <p>
              Within the first month, they saw a massive increase in appointment bookings simply because they were responding instantly 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
