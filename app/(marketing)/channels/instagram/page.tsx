import Link from "next/link";
import { MessageCircle, Heart, Share2, ArrowRight } from "lucide-react";

export default function InstagramChannel() {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <section className="pt-24 pb-16 px-4 bg-[var(--color-mktg-bg)]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 text-[var(--color-mktg-ig)] text-sm font-semibold mb-6">
              <MessageCircle size={16} />
              Instagram Integration
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-mktg-base)] mb-6">
              Convert followers into customers instantly
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Turn story replies, post comments, and DMs into sales opportunities. The AI handles the engagement while you focus on content.
            </p>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-[var(--color-mktg-cta)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
              Start Automating
            </Link>
          </div>
          
          <div className="bg-black rounded-3xl p-6 border border-gray-800 shadow-2xl relative max-w-sm mx-auto w-full">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-[2px]">
                  <div className="w-full h-full bg-black rounded-full border-2 border-black flex items-center justify-center text-[10px] text-white font-bold">IB</div>
                </div>
                <div className="text-white font-semibold text-sm">ittisalo.boutique</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-gray-400 text-center mb-4">
                Replied to your story
              </div>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-[#3797F0] text-white p-3 rounded-2xl rounded-tr-none text-sm w-5/6">
                    Is the store open on Sundays?
                  </div>
                </div>
                <div className="flex">
                  <div className="bg-gray-800 text-white p-3 rounded-2xl rounded-tl-none text-sm w-5/6 border border-gray-700">
                    Yes! We are open from 10 AM to 6 PM on Sundays. Let me know if you need directions! ✨
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#3797F0] text-white p-3 rounded-2xl rounded-tr-none text-sm w-5/6">
                    Perfect, see you tomorrow!
                  </div>
                </div>
                <div className="flex justify-end">
                  <Heart size={16} className="text-red-500 fill-red-500 mr-2 mt-1" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
              <div className="flex-1 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-sm text-gray-500">Message...</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-center mb-16">Specifically built for Instagram</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[var(--color-mktg-ig)] mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Comment to DM</h3>
            <p className="text-gray-600">Tell your followers to comment "LINK" on a post, and the AI will instantly send them a DM with the product details.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[var(--color-mktg-ig)] mb-4">
              <Share2 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Story Mentions</h3>
            <p className="text-gray-600">Automatically thank customers when they mention you in their stories, building loyalty without the manual effort.</p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[var(--color-mktg-ig)] mb-4">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Engagement</h3>
            <p className="text-gray-600">The AI handles routine DMs about sizing, shipping, and hours so you can focus on building your brand.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
