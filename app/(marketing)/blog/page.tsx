import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BlogIndex() {
  const posts = [
    {
      title: "How to automate WhatsApp orders for your restaurant",
      excerpt: "Learn how to set up an AI copilot to handle menu inquiries, take orders, and send payment links.",
      date: "October 12, 2024",
      slug: "automate-whatsapp-orders-restaurant",
      category: "Guides"
    },
    {
      title: "Why Instagram comment-to-DM is the highest converting funnel",
      excerpt: "Stop losing leads in the comments section. Instantly deliver value to their DMs.",
      date: "October 5, 2024",
      slug: "instagram-comment-to-dm-funnel",
      category: "Strategy"
    },
    {
      title: "Announcing our new Meta integration",
      excerpt: "We've deepened our partnership with Meta to bring you even faster response times.",
      date: "September 28, 2024",
      slug: "new-meta-integration-announcement",
      category: "Product Updates"
    }
  ];

  return (
    <div className="w-full bg-[var(--color-mktg-bg)] min-h-screen py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-4 text-center">
          The Ittisalo Blog
        </h1>
        <p className="text-xl text-gray-600 text-center mb-16">
          Insights, guides, and updates on AI automation for local businesses.
        </p>

        <div className="grid gap-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-bold text-[var(--color-mktg-cta)] uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full">{post.category}</span>
                  <span className="text-sm text-gray-400">{post.date}</span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-mktg-base)] mb-2 group-hover:text-[var(--color-mktg-cta)] transition-colors">{post.title}</h2>
                <p className="text-gray-600">{post.excerpt}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-mktg-cta)] group-hover:text-white transition-colors">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
