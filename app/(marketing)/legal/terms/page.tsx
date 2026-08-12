export default function TermsOfService() {
  return (
    <div className="w-full bg-white min-h-screen py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-[var(--color-mktg-base)] mb-4">Terms of Service</h1>
        <p className="text-gray-500 mb-12">Last updated: October 2024</p>
        
        <div className="prose prose-lg text-gray-600 max-w-none">
          <p>
            Welcome to Ittisalo. By accessing or using our website and services, you agree to be bound by these Terms of Service.
          </p>
          
          <h2>1. Service Description</h2>
          <p>
            Ittisalo provides an AI-powered communication platform that integrates with third-party messaging services including WhatsApp, Instagram, and Facebook Messenger.
          </p>
          
          <h2>2. User Obligations</h2>
          <p>
            You agree not to use the service for any illegal purposes or to conduct any activity that violates the terms of service of the underlying messaging platforms (Meta/Facebook/WhatsApp).
          </p>
          
          <h2>3. Subscriptions and Payments</h2>
          <p>
            Service is billed on a subscription basis. You will be billed in advance on a recurring basis. You may cancel your subscription at any time.
          </p>
          
          <h2>4. Limitation of Liability</h2>
          <p>
            In no event shall Ittisalo be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </div>
      </div>
    </div>
  );
}
