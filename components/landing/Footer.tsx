export default function Footer() {
  return (
    <footer className="relative border-t border-ink/[0.06] bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill="#FAF6EF" />
                <path
                  d="M16 7L17.6 13.4L24 16L17.6 18.6L16 25L14.4 18.6L8 16L14.4 13.4L16 7Z"
                  fill="#C42B33"
                />
              </svg>
              <span className="text-lg font-semibold">
                Ittisalo
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-paper/40">
              AI-powered WhatsApp customer communication, built in Karachi for
              businesses across Pakistan.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="status-badge status-online text-[10px]">AI Online</span>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-paper/30 mb-4">
                Product
              </p>
              <ul className="space-y-3 text-sm text-paper/55">
                <li><a href="#verticals" className="transition-colors hover:text-paper">Who It&apos;s For</a></li>
                <li><a href="#how" className="transition-colors hover:text-paper">How It Works</a></li>
                <li><a href="#features" className="transition-colors hover:text-paper">Features</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-paper">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-paper/30 mb-4">
                Company
              </p>
              <ul className="space-y-3 text-sm text-paper/55">
                <li><a href="mailto:admin@ittisalo.io" className="transition-colors hover:text-paper">Contact</a></li>
                <li><a href="/privacy" className="transition-colors hover:text-paper">Privacy Policy</a></li>
                <li><a href="/terms" className="transition-colors hover:text-paper">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-paper/30 mb-4">
                Portal
              </p>
              <ul className="space-y-3 text-sm text-paper/55">
                <li><a href="https://app.ittisalo.com/login" className="transition-colors hover:text-paper">Login</a></li>
                <li><a href="https://app.ittisalo.com/onboarding" className="transition-colors hover:text-paper">Book a Demo</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="jaan-border-thin mt-14 rounded-full" />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-paper/25">
            © {new Date().getFullYear()} Ittisalo. All rights reserved.
          </p>
          <p className="text-xs text-paper/25">
            Made with ❤️ in Karachi, Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
