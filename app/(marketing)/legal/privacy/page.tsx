import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Ittisalo",
  description: "Learn how Ittisalo collects, uses, discloses, and safeguards your information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="w-full bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-200 pb-8 mb-10">
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-[var(--color-mktg-base)] tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Last updated: <span className="text-gray-800 font-semibold">10th August, 2026</span>
          </p>
        </div>

        {/* Content */}
        <div className="text-gray-700 space-y-10 leading-relaxed">
          <div className="space-y-4 text-base sm:text-lg text-gray-600 bg-gray-50/70 border border-gray-200/80 rounded-2xl p-6 sm:p-8">
            <p>
              This Privacy Policy explains how Ittisalo (&quot;Ittisalo,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and safeguards information when you use our website, dashboard, and multi-tenant messaging automation platform (collectively, the &quot;Service&quot;). This policy applies both to businesses that sign up for Ittisalo (&quot;Tenants,&quot; &quot;Customers,&quot; &quot;you&quot;) and to the end customers who message a Tenant&apos;s business through WhatsApp, Instagram, or Messenger (&quot;End Users&quot;).
            </p>
            <p className="font-medium text-gray-800">
              By using the Service, you agree to the collection and use of information as described in this policy.
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              1. Who This Policy Covers
            </h2>
            <p>Ittisalo acts in two roles:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900">As a data controller</strong> for account and billing information relating to our Tenants (the businesses that sign up for Ittisalo).
              </li>
              <li>
                <strong className="text-gray-900">As a data processor</strong> for the conversation and customer data that Tenants collect from their own End Users through connected WhatsApp, Instagram, and Messenger channels. Tenants remain the data controller for that End User data, and are responsible for having a lawful basis to collect and process it, including maintaining their own customer-facing privacy notice.
              </li>
            </ul>
            <p className="text-sm text-gray-600 bg-amber-50/60 border-l-4 border-amber-400 p-4 rounded-r-lg">
              If you are an End User messaging a business that uses Ittisalo, please also refer to that business&apos;s own privacy policy, as they control how your information is used.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 2 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              2. Information We Collect
            </h2>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                2.1 Information Tenants provide directly
              </h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Account details: name, business name, email address, phone number, password (hashed).</li>
                <li>Billing details: billing address, payment method (processed by our third-party payment processor; we do not store full card numbers).</li>
                <li>Business profile data: business category, WhatsApp Business/Instagram/Messenger account details, catalog/product information, knowledge base content uploaded for AI responses.</li>
                <li>Support communications.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                2.2 Information collected automatically
              </h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Log data: IP address, browser type, device information, pages visited, timestamps.</li>
                <li>Usage data: features used, messages processed, API calls, integration activity.</li>
                <li>Cookies and similar technologies on our website and dashboard (see Section 8).</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                2.3 Conversation data (processed on behalf of Tenants)
              </h3>
              <p>When an End User messages a Tenant&apos;s connected WhatsApp, Instagram, or Messenger account, Ittisalo processes:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Message content (text, voice notes, images, and other media sent by the End User or the Tenant&apos;s team).</li>
                <li>Sender identifiers provided by Meta (phone number or platform user ID, profile name).</li>
                <li>Conversation history and context, used to power AI-generated responses and to reconstruct conversation state.</li>
                <li>Order, appointment, or lead information the End User provides during a conversation (e.g., product orders, booking requests, contact details).</li>
              </ul>
              <p className="text-sm text-gray-600">
                This data is stored per-tenant in our database and is used solely to operate the Service for that Tenant, unless otherwise stated in this policy.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">
                2.4 Information from third-party integrations
              </h3>
              <p>
                Where a Tenant connects services such as Shopify, WooCommerce, or a payment provider, we receive data necessary to power those integrations (e.g., product catalogs, order status) strictly to provide the connected functionality.
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              3. How We Use Information
            </h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Provide, operate, and maintain the Service, including AI-generated responses to End User messages.</li>
              <li>Create and manage Tenant accounts and process billing.</li>
              <li>Route, store, and retrieve conversation history to maintain context across messages.</li>
              <li>Generate embeddings and perform semantic search over a Tenant&apos;s knowledge base to power accurate AI responses.</li>
              <li>Detect, prevent, and investigate fraud, abuse, or security incidents (including duplicate-message and fraud-signal detection across Tenants where applicable).</li>
              <li>Send Tenants service-related communications (billing notices, product updates, support responses).</li>
              <li>Improve and develop the Service, including monitoring performance and reliability.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 mt-4">
              We do <strong>not</strong> sell personal data, and we do not use End User conversation data to train third-party foundation models beyond what is required to generate a response to that End User (see Section 4).
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              4. AI Processing and Third-Party Subprocessors
            </h2>
            <p>
              To generate automated responses, Ittisalo sends relevant conversation content to third-party AI providers (currently OpenAI) for processing. These providers process the data under their own data processing terms and do not use API-submitted data to train their models, consistent with their business/API data usage policies at the time of use. We recommend Tenants review the current policies of any AI provider we use, as these may change.
            </p>
            <p>We use the following categories of subprocessors to operate the Service:</p>

            <div className="overflow-x-auto border border-gray-200 rounded-xl my-4">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 font-semibold text-gray-900">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 sm:px-6">Category</th>
                    <th scope="col" className="px-4 py-3.5 sm:px-6">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">Cloud hosting (e.g., Railway)</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600">Application hosting and compute</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">Database (Supabase)</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600">Data storage, authentication, vector search</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">AI provider (OpenAI)</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600">Generating automated message responses, transcription, embeddings</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">Messaging platform (Meta)</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600">Sending/receiving WhatsApp, Instagram, and Messenger messages</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">Payment processor</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600">Billing and subscription payments</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">Workflow/automation infrastructure</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600">Message routing and automation logic</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-500 italic">
              A current list of subprocessors is available on request.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              5. Data Storage, Multi-Tenancy, and Security
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Each Tenant&apos;s data is logically isolated using row-level security and tenant-scoped access controls so that one Tenant cannot access another Tenant&apos;s conversations, contacts, or knowledge base.
              </li>
              <li>API keys, access tokens, and other credentials are encrypted at rest.</li>
              <li>
                We apply reasonable technical and organizational measures to protect data against unauthorized access, alteration, disclosure, or destruction. No system is completely secure, and we cannot guarantee absolute security.
              </li>
              <li>
                Data is hosted with providers that may store data outside your country of residence. By using the Service, you consent to this transfer.
              </li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              6. Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900">Tenant account data</strong> is retained for as long as the account is active, and for a reasonable period afterward to comply with legal, accounting, or billing obligations.
              </li>
              <li>
                <strong className="text-gray-900">Conversation data</strong> is retained for as long as needed to provide the Service (e.g., to maintain conversation context) and per each Tenant&apos;s own configured retention settings, where available.
              </li>
              <li>
                Tenants may request deletion of their account and associated data, subject to legal retention requirements. End Users seeking deletion of their data should contact the business (Tenant) they messaged directly, who may in turn instruct us to delete that data.
              </li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              7. Your Rights
            </h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Request a copy of your data in a portable format.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="pt-2">
              To exercise these rights, contact us at{" "}
              <a href="mailto:Ittisaloai@gmail.com" className="text-[var(--color-mktg-cta)] hover:underline font-semibold">
                Ittisaloai@gmail.com
              </a>
              . If you are an End User of a Tenant&apos;s business, we may need to direct your request to that Tenant, as they control the underlying customer relationship.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              8. Cookies
            </h2>
            <p>
              Our website and dashboard use cookies and similar technologies to keep you logged in, remember preferences, and understand usage patterns. You can control cookies through your browser settings; disabling some cookies may affect functionality.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not directed to individuals under 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, contact us so we can remove it.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              10. International Data Transfers
            </h2>
            <p>
              Ittisalo may process and store data in countries other than your own, including Pakistan and countries where our infrastructure providers operate. We take steps to ensure appropriate safeguards are in place for such transfers where required by law.
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 11 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version with a revised &quot;Last updated&quot; date, and where changes are material, we will provide additional notice (e.g., email or in-app notice).
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* Section 12 */}
          <section className="space-y-4 bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--color-mktg-base)]">
              12. Contact Us
            </h2>
            <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <div className="pt-2 text-gray-800 space-y-1">
              <p className="font-bold text-lg">Ittisalo</p>
              <p>
                Email:{" "}
                <a href="mailto:Ittisaloai@gmail.com" className="text-[var(--color-mktg-cta)] hover:underline font-semibold">
                  Ittisaloai@gmail.com
                </a>
              </p>
              <p>Address: 22nd Lane, Phase 7, DHA , Karachi</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
