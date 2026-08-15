import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Ittisalo",
  description: "Read the Terms of Service governing access to and use of Ittisalo's website, dashboard, APIs, and services.",
};

export default function TermsOfService() {
  return (
    <div className="w-full bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-200 pb-8 mb-10">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-[var(--color-mktg-base)] tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Last updated: <span className="text-gray-800 font-semibold">10th August, 2026</span>
          </p>
        </div>

        {/* Content */}
        <div className="text-gray-700 space-y-10 leading-relaxed">
          <div className="space-y-4 text-base sm:text-lg text-gray-600 bg-gray-50/70 border border-gray-200/80 rounded-2xl p-6 sm:p-8">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern access to and use of Ittisalo&apos;s website, dashboard, APIs, and related services (collectively, the &quot;Service&quot;), operated by Ittisalo (&quot;Ittisalo,&quot; &quot;we,&quot; &quot;us,&quot; &quot;our&quot;). By creating an account or using the Service, you (&quot;Customer,&quot; &quot;Tenant,&quot; &quot;you&quot;) agree to be bound by these Terms. If you are agreeing on behalf of a business, you represent that you have authority to bind that business.
            </p>
            <p className="font-semibold text-gray-900">
              If you do not agree to these Terms, do not use the Service.
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              1. The Service
            </h2>
            <p>
              Ittisalo is a multi-tenant SaaS platform that connects to a Tenant&apos;s WhatsApp, Instagram, and/or Messenger business accounts to provide AI-powered automated messaging, order and appointment handling, knowledge-base-driven responses, and related automation features.
            </p>
            <p>
              Ittisalo relies on third-party platforms (including Meta&apos;s WhatsApp Business, Instagram, and Messenger APIs, and AI providers such as OpenAI) to deliver the Service. Availability, features, and pricing of the Service may depend on the continued availability of these third-party platforms, and Ittisalo is not responsible for outages, policy changes, or restrictions imposed by such third parties.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              2. Eligibility and Accounts
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old and able to form a binding contract to use the Service.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</li>
              <li>You must provide accurate, current information when registering and keep it up to date.</li>
              <li>
                You are responsible for ensuring your business has the legal right to message the End Users you contact through the Service, and that you comply with Meta&apos;s WhatsApp Business Messaging Policy, Instagram Platform Policy, and Messenger Platform Policy, as applicable.
              </li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              3. Subscription, Fees, and Payment
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access to certain features requires a paid subscription plan, as described on our pricing page or in your order form.</li>
              <li>Fees are billed in advance on a recurring basis (monthly or annually, as selected) and are non-refundable except as required by law or expressly stated otherwise.</li>
              <li>We may change our fees with at least [30] days&apos; notice before the change takes effect for existing subscriptions.</li>
              <li>Failure to pay fees when due may result in suspension or termination of your access to the Service.</li>
              <li>You are responsible for any taxes associated with your use of the Service, other than taxes on Ittisalo&apos;s net income.</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              4. Acceptable Use
            </h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Send unsolicited, spam, or messages to individuals who have not opted in, in violation of applicable messaging platform policies or law.</li>
              <li>Transmit content that is unlawful, defamatory, obscene, harassing, deceptive, or that infringes the intellectual property or privacy rights of others.</li>
              <li>Attempt to gain unauthorized access to another Tenant&apos;s account, data, or conversations.</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service, except as permitted by law.</li>
              <li>Use the Service to build a competing product or to scrape or resell access to the Service without authorization.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service, including through excessive automated requests.</li>
              <li>Upload malicious code or attempt to breach the security or authentication measures of the Service.</li>
            </ul>
            <p className="text-sm text-gray-600 bg-red-50/70 border-l-4 border-red-500 p-4 rounded-r-lg">
              We may suspend or terminate accounts that violate this section, with or without notice, particularly where required to comply with Meta&apos;s platform policies.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              5. Tenant Data and Responsibilities
            </h2>
            <div className="space-y-3">
              <p>
                <strong className="text-gray-900">Ownership.</strong> As between you and Ittisalo, you retain ownership of the data you upload to the Service and the conversation data collected from your End Users through the Service (&quot;Tenant Data&quot;).
              </p>
              <p>
                <strong className="text-gray-900">License to us.</strong> You grant Ittisalo a license to host, process, transmit, and use Tenant Data solely to provide, maintain, and improve the Service, including generating AI responses on your behalf.
              </p>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Your responsibilities. You are solely responsible for:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Obtaining any consents required from your End Users to collect, process, and store their data, and to message them via WhatsApp, Instagram, or Messenger.</li>
                  <li>Maintaining your own privacy policy and terms governing your relationship with your End Users.</li>
                  <li>The accuracy of any knowledge base, product catalog, or automated response content you configure.</li>
                  <li>Reviewing AI-generated responses sent through your account, understanding that AI-generated content may occasionally be inaccurate or inappropriate, and configuring human takeover/escalation where needed.</li>
                  <li>Complying with all applicable data protection, consumer protection, and e-commerce laws relevant to your business and jurisdiction.</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              6. AI-Generated Content Disclaimer
            </h2>
            <p>The Service uses third-party AI models to generate automated responses to End User messages. AI-generated content:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>May contain errors, omissions, or inaccuracies.</li>
              <li>Is generated based on the knowledge base, instructions, and data you configure, and its quality depends on that configuration.</li>
              <li>Should not be relied upon for medical, legal, financial, or other professional advice communicated to End Users without appropriate human review.</li>
            </ul>
            <p>
              You are responsible for reviewing how AI responses are used in your business and for any consequences arising from End User reliance on AI-generated content sent through your account.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              7. Third-Party Services
            </h2>
            <p>
              The Service integrates with third-party platforms, including but not limited to Meta (WhatsApp, Instagram, Messenger), OpenAI, Shopify, WooCommerce, and payment processors. Your use of these integrations is subject to the respective third party&apos;s own terms and policies. Ittisalo is not responsible for the acts, omissions, availability, or policies of third-party providers, including suspension or termination of your messaging channels by Meta.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              8. Intellectual Property
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Service, including its software, design, branding, and underlying technology, is owned by Ittisalo and its licensors and is protected by intellectual property laws.</li>
              <li>These Terms do not grant you any rights to Ittisalo&apos;s trademarks, logos, or branding without our prior written consent.</li>
              <li>Feedback you provide about the Service may be used by us without restriction or obligation to you.</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              9. Confidentiality
            </h2>
            <p>
              Each party agrees to protect the other&apos;s confidential information disclosed in connection with the Service using at least the same degree of care it uses for its own confidential information, and not to disclose it to third parties except as necessary to perform its obligations or as required by law.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              10. Service Availability
            </h2>
            <p>
              We aim to keep the Service available and reliable but do not guarantee uninterrupted or error-free operation. The Service may be unavailable due to maintenance, updates, or factors outside our control, including outages or policy changes by Meta, OpenAI, or our infrastructure providers.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 11 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              11. Warranties and Disclaimers
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm sm:text-base font-medium text-gray-800 uppercase tracking-wide">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AI-GENERATED OUTPUT WILL BE ACCURATE OR SUITABLE FOR YOUR PURPOSES.
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 12 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              12. Limitation of Liability
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm sm:text-base font-medium text-gray-800 uppercase tracking-wide">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ITTISALO AND ITS OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE [SIX (6)] MONTHS PRECEDING THE CLAIM.
            </div>
            <p className="text-sm text-gray-600">
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 13 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              13. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold Ittisalo harmless from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising from: (a) your use of the Service in violation of these Terms or applicable law; (b) Tenant Data you upload or process through the Service; (c) your violation of any third-party rights, including End User privacy rights or messaging platform policies.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 14 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              14. Term and Termination
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>These Terms remain in effect for as long as you use the Service.</li>
              <li>You may cancel your subscription at any time through your account settings or by contacting us; cancellation takes effect at the end of the current billing period unless otherwise stated.</li>
              <li>We may suspend or terminate your access to the Service if you breach these Terms, fail to pay fees when due, or if required to do so by a third-party platform (e.g., Meta) whose policies you have violated.</li>
              <li>Upon termination, your right to use the Service ceases immediately. We may retain or delete Tenant Data in accordance with our Privacy Policy and applicable law.</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 15 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              15. Changes to the Service or Terms
            </h2>
            <p>
              We may modify the Service or these Terms at any time. Material changes to these Terms will be communicated via email or in-app notice at least [14] days before taking effect. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 16 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              16. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms are governed by the laws of [Pakistan / your chosen jurisdiction], without regard to conflict-of-law principles. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of [City, Country], unless otherwise required by applicable law.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 17 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              17. General
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900">Entire Agreement.</strong> These Terms, together with our Privacy Policy and any order form, constitute the entire agreement between you and Ittisalo regarding the Service.
              </li>
              <li>
                <strong className="text-gray-900">Severability.</strong> If any provision is found unenforceable, the remaining provisions remain in full effect.
              </li>
              <li>
                <strong className="text-gray-900">No Waiver.</strong> Our failure to enforce any right or provision is not a waiver of that right.
              </li>
              <li>
                <strong className="text-gray-900">Assignment.</strong> You may not assign these Terms without our prior written consent; we may assign these Terms in connection with a merger, acquisition, or sale of assets.
              </li>
              <li>
                <strong className="text-gray-900">Force Majeure.</strong> We are not liable for delays or failures due to causes beyond our reasonable control.
              </li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 18 */}
          <section className="space-y-4 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              18. Contact Us
            </h2>
            <p>For questions about these Terms, contact us at:</p>
            <div className="pt-2 text-gray-800 space-y-1">
              <p className="font-bold text-lg">Ittisalo</p>
              <p>
                Email:{" "}
                <a href="mailto:Ittisaloai@gmail.com" className="text-[var(--color-mktg-cta)] hover:underline font-semibold">
                  Ittisaloai@gmail.com
                </a>
              </p>
              <p>Address: 22nd Lane, Phase 7, DHA, Karachi.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
