export default function Footer() {
  return (
    <footer className="relative border-t border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
                <rect width="30" height="30" rx="8" fill="#FAF6EF" />
                <path
                  d="M15 6L16.8 13.2L24 15L16.8 16.8L15 24L13.2 16.8L6 15L13.2 13.2L15 6Z"
                  fill="#B8262F"
                />
              </svg>
              <span className="font-display text-lg font-semibold">
                Ittisalo
              </span>
            </div>
            <p className="mt-3 max-w-xs font-body text-sm text-paper/50">
              WhatsApp, answered by AI, run by you. Built in Karachi for
              shops across Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-paper/40">
                Product
              </p>
              <ul className="mt-4 space-y-2.5 font-body text-sm text-paper/70">
                <li><a href="#verticals" className="hover:text-paper">Who it&apos;s for</a></li>
                <li><a href="#how" className="hover:text-paper">How it works</a></li>
                <li><a href="#features" className="hover:text-paper">Features</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-paper/40">
                Company
              </p>
              <ul className="mt-4 space-y-2.5 font-body text-sm text-paper/70">
                <li><a href="mailto:admin@ittisalo.io" className="hover:text-paper">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-paper/40">
                Portal
              </p>
              <ul className="mt-4 space-y-2.5 font-body text-sm text-paper/70">
                <li><a href="https://app.ittisalo.com/login" className="hover:text-paper">Login</a></li>
                <li><a href="https://app.ittisalo.com/onboarding" className="hover:text-paper">Book a demo</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="jaan-border-thin mt-12 rounded-full" />
        <p className="mt-6 font-mono text-xs text-paper/35">
          © {new Date().getFullYear()} Ittisalo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
