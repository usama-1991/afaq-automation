import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  return (
    <div className="w-full bg-white min-h-screen py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--color-mktg-cta)] transition-colors mb-10">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-bold text-[var(--color-mktg-cta)] uppercase tracking-wider">Guide</span>
          <span className="text-sm text-gray-400">October 12, 2024</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-8">
          Post: {resolvedParams.slug}
        </h1>
        
        <div className="prose prose-lg text-gray-600 max-w-none">
          <p className="lead text-xl text-gray-500 mb-8">
            This is a placeholder for the blog post content. In a production environment, this would be fetched from a CMS like Sanity, Contentful, or local markdown files.
          </p>
          <h2>Introduction</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <h2>The Solution</h2>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>
    </div>
  );
}
