import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of env.split('\n')) {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const [k, ...v] = t.split('=');
    envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
const TENANT_ID = 'a7c6eb88-f161-494e-859a-b7352617db73';

const KB_DOCS = [
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'Ittisalo Platform Overview & Core Features',
    source_url: 'https://www.ittisalo.com/product',
    is_active: true,
    content: `*Ittisalo Overview:*
Ittisalo (app.ittisalo.com) is an AI-powered Omnichannel Customer Support & Sales CRM built specifically for SMBs, online brands, and enterprises. It connects WhatsApp Business, Instagram Direct, Facebook Messenger, and Website Live Chat into a single unified team inbox.

*Key Platform Features:*
1. *Official WhatsApp Cloud API:* Direct Meta integration with 100% Anti-Ban protection. Zero risk of number blocking, zero cold-calling fines. Supports mobile numbers, landlines, and 111-UAN numbers.
2. *24/7 AI Sales & Support Copilot:* Sub-second intelligent deflection that answers inquiries, qualifies leads, takes orders, books appointments, and escalates to human agents. Speaks English, Urdu, and Roman Urdu fluently.
3. *Shared Multi-Agent Team Inbox:* Multiple agents can reply from the same WhatsApp number simultaneously with collision detection, private internal notes, and conversation assignments.
4. *Broadcast Marketing & Campaign Manager:* Send targeted bulk WhatsApp campaigns with Meta-approved templates, rich media (images/videos/catalogues), and interactive CTA buttons with high open rates (>98%).
5. *E-Commerce & CRM Integrations:* Native Shopify and WooCommerce integration for abandoned cart recovery, automated Cash on Delivery (COD) order confirmation, and live shipping status updates. Also supports Zoho and custom Webhooks.
6. *Pre-Trained Industry Solutions:* Ready-made conversational workflows for eCommerce/Retail, Healthcare & Clinics, Real Estate, Restaurants & Cafes, Beauty Salons, and B2B Wholesalers.`
  },
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'Ittisalo Pricing Plans, Packages & Message Quotas (PKR)',
    source_url: 'https://www.ittisalo.com/pricing',
    is_active: true,
    content: `*Ittisalo Monthly Pricing Plans (Pakistan):*

1. *Founder / Starter Plan — PKR 5,000 / month*
- *Target:* Small businesses, solo entrepreneurs, and startups handling up to 1,000 customer inquiries/month.
- *Includes:*
  - Official WhatsApp Business Cloud API + Web Chat Widget
  - 1 Agent Seat
  - 1,000 AI automated conversations / month
  - 24/7 AI Copilot responses
  - Lead capture & contact management
  - Basic analytics dashboard
  - 1-on-1 Onboarding & Free WhatsApp API Setup

2. *Growth Plan — PKR 20,000 / month* (Most Popular)
- *Target:* Growing brands and eCommerce businesses handling 1,000 to 10,000 inquiries/month.
- *Includes:*
  - Omnichannel: WhatsApp + Instagram DMs + Facebook Messenger + Web Chat
  - 5 Agent Seats with shared team inbox
  - 10,000 AI conversations / month
  - Bulk Broadcast Campaign Manager & template scheduler
  - Shopify & WooCommerce automated order confirmation & tracking
  - Smart lead qualification & auto-routing
  - Full analytics & agent performance metrics
  - Priority Support via WhatsApp & email

3. *Enterprise Plan — Custom (Starting from PKR 45,000 / month)*
- *Target:* High-volume businesses, multi-branch clinics, franchises handling 10,000+ chats/month.
- *Includes:*
  - Unlimited WhatsApp numbers & channels
  - Unlimited agent seats & team roles
  - Custom AI model fine-tuning on company catalog & SOPs
  - Custom REST API integrations & Webhooks
  - Dedicated Account Manager & 99.9% Uptime SLA

*Meta Official API Charges:*
The Ittisalo subscription covers the AI engine, team inbox, and software platform. Meta applies standard per-conversation charges for outbound marketing and utility broadcasts (Meta provides the first 1,000 service conversations completely FREE every month).`
  },
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'WhatsApp Official Cloud API, Number Activation & Anti-Ban Security',
    source_url: 'https://www.ittisalo.com/features/whatsapp-api',
    is_active: true,
    content: `*Official Meta WhatsApp Cloud API vs. Unofficial WhatsApp Web:*
- *100% Anti-Ban Guarantee:* Unofficial tools use browser automation/QR scraping that violates WhatsApp Terms of Service, causing permanent number bans. Ittisalo is built on official Meta Cloud API infrastructure, guaranteeing your phone number is 100% secure and will never get banned.
- *Number Compatibility:* You can use any fresh SIM, existing mobile number, landline, or UAN (111-xxx-xxx).
- *Green Tick Verification:* Ittisalo guides businesses through Meta Business Manager verification to apply for the prestigious Green Tick verified badge.
- *Free Migration:* If you are currently using Wati, Interakt, AiSensy, or another BSP, our technical team provides free, zero-downtime migration to Ittisalo.`
  },
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'Consultative Sales Flow & Step-by-Step Lead Qualification',
    source_url: 'https://app.ittisalo.com',
    is_active: true,
    content: `*Consultative Sales Qualification Script for Ittisalo AI:*
When an inbound prospect inquires about Ittisalo on WhatsApp, follow this structured, conversational step-by-step qualification flow:

*Step 1: Friendly Greeting & Industry Inquiry*
Acknowledge the inquiry warmly in 1-2 sentences.
Ask: "To get started, could you please share what type of business or industry you are running?"

*Step 2: Business Name*
Acknowledge their industry with enthusiasm.
Ask: "That's fantastic! Before we move forward, may I know the name of your business?"

*Step 3: Best Email Address*
Acknowledge the business name.
Ask: "To keep our records updated and share the right setup guide and proposal with you, could you please provide your best email address?"

*Step 4: Monthly Inquiry Volume*
Save their email.
Ask: "To help me suggest the best plan for your business, roughly how many customer inquiries do you handle on WhatsApp every month?"

*Step 5: Plan Recommendation & Call-to-Action*
- If volume is up to 1,000 inquiries: Recommend the *Founder Plan (PKR 5,000/month)*.
- If volume is 1,000 to 10,000 inquiries: Recommend the *Growth Plan (PKR 20,000/month)*.
- If volume is 10,000+ or multi-channel: Recommend the *Enterprise Plan*.
Ask: "Would you like me to share our product brochure and setup guide so you can get started, or do you have any specific questions about our features?"

*Step 6: Sharing Brochure & Registration Link*
When the customer asks for brochure, pricing, or registration, share the links clearly:
*Ittisalo Product Brochure:*
https://www.ittisalo.com/images/creatives/ittisalo-brochure.jpg
*Founder Shield Details:*
https://www.ittisalo.com/images/creatives/ittisalo-founder-banner.jpg
*Solutions Overview:*
https://www.ittisalo.com/images/creatives/ittisalo-solutions-spread.jpg
*Get Started / Free Trial:*
https://app.ittisalo.com/register`
  },
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'Integrations & Multi-Channel Support',
    source_url: 'https://www.ittisalo.com/integrations',
    is_active: true,
    content: `*Ittisalo Supported Integrations & Channels:*
- *Channels Supported:* WhatsApp Business Cloud API, Facebook Messenger, Instagram Direct Messages, and Website Live Chat.
- *Shopify & WooCommerce:* Auto-sync products, automate abandoned checkout recovery, send interactive WhatsApp buttons for Cash on Delivery (COD) confirmation, and dispatch automated shipping updates.
- *Webhooks & API:* Connect Ittisalo to any custom CRM, ERP, Google Sheets, or Zapier/Make workflow.
- *Multi-Agent Team Inbox:* Assign conversations to specific agents, categorize conversations with tags, filter by status (open/resolved), and switch between AI and human mode with one click.`
  },
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'Product Brochures, Creatives & Signup Links',
    source_url: 'https://www.ittisalo.com',
    is_active: true,
    content: `*Official Ittisalo Creatives & Links for WhatsApp Sharing:*

- *Product Trifold Brochure (Features & Trust Badges):*
https://www.ittisalo.com/images/creatives/ittisalo-brochure.jpg

- *Founder Shield Promotional Poster (PKR 5,000 Start Today):*
https://www.ittisalo.com/images/creatives/ittisalo-founder-banner.jpg

- *Solutions & Capabilities Overview (Industry Workflows):*
https://www.ittisalo.com/images/creatives/ittisalo-solutions-spread.jpg

- *App Registration / Portal:*
https://app.ittisalo.com/register

- *Website & Pricing:*
https://www.ittisalo.com/pricing

- *Office & Support Hours:*
Monday to Friday, 10:00 AM to 7:00 PM (PKT).
Human Supervisor WhatsApp: +92 310 3604110 / +92 336 0479649
Company: ITTISALO (PRIVATE) LIMITED, DHA Karachi, Pakistan.`
  },
  {
    tenant_id: TENANT_ID,
    kb_type: 'document',
    title: 'Frequently Asked Questions (FAQs) & Objection Handling',
    source_url: 'https://www.ittisalo.com/faq',
    is_active: true,
    content: `*Frequently Asked Questions (FAQs) & Quick Answers:*

*Q: Can I use my existing WhatsApp number?*
A: Yes! You can activate your existing number on the official WhatsApp Cloud API, or use a new mobile SIM, landline, or UAN number.

*Q: Will my number get banned for broadcasting?*
A: Absolutely not! Because Ittisalo uses the official Meta Cloud API with pre-approved Meta message templates, your number is 100% safe, compliant, and will never be banned.

*Q: Can my staff and I use it on multiple devices simultaneously?*
A: Yes! Ittisalo gives your team a shared inbox where multiple agents can respond to customer inquiries from one WhatsApp number simultaneously on desktop or mobile.

*Q: Does the AI speak Urdu or Roman Urdu?*
A: Yes! The Ittisalo AI Copilot understands and speaks English, Urdu, and Roman Urdu fluently and naturally.

*Q: How fast does the AI respond?*
A: The AI responds in under 1 second, ensuring your leads never wait or bounce to a competitor.

*Q: What if the AI cannot answer a question?*
A: The conversation is instantly flagged for human handoff, and an agent from your team can take over seamlessly in the shared inbox.

*Q: How do I sign up or get started?*
A: You can register directly at https://app.ittisalo.com/register or our onboarding team will set up your WhatsApp API within 30 minutes.`
  }
];

const NEW_AGENT_PROMPT = `You are the Ittisalo Sales & Support Consultant on WhatsApp and omnichannel channels. Your goal is to guide inbound prospects consultatively and lead them to sign up at app.ittisalo.com/register.

--- CONVERSATIONAL STYLE & RULES ---
1. EXTREME BREVITY: Keep all replies very concise (2-3 sentences max). Never dump long walls of text or bullet dumps.
2. CONSULTATIVE FLOW: Qualify the prospect ONE question at a time:
   - Step 1: Warm greeting -> Ask their business type / industry.
   - Step 2: Acknowledge industry -> Ask their business name.
   - Step 3: Acknowledge business -> Ask their best email address.
   - Step 4: Acknowledge email -> Ask their monthly WhatsApp inquiry volume.
   - Step 5: Recommend the best plan based on volume:
     * Up to 1,000 inquiries/mo: Founder Plan (PKR 5,000/month).
     * 1,000 to 10,000 inquiries/mo: Growth Plan (PKR 20,000/month).
     * 10,000+ inquiries/mo: Enterprise Plan.
     Offer to share the brochure or answer questions.
3. SHARING BROCHURE & LINKS: When asked for brochure, pricing, or registration, share the raw clickable URLs:
   *Ittisalo Product Brochure:*
   https://www.ittisalo.com/images/creatives/ittisalo-brochure.jpg
   *Founder Plan Details:*
   https://www.ittisalo.com/images/creatives/ittisalo-founder-banner.jpg
   *Get Started:*
   https://app.ittisalo.com/register
4. LANGUAGE ADAPTATION: If the customer writes in English, reply in warm English. If the customer writes in Urdu or Roman Urdu (e.g., "mujhe details chahiye"), reply naturally in Roman Urdu.
5. OBJECTION HANDLING: Always highlight: Official Meta Cloud API (100% Anti-Ban), 24/7 AI deflection, Shared Multi-Agent Inbox, and Shopify/WooCommerce integrations.
6. HUMAN HANDOFF: If a customer requests human help or supervisor contact, provide WhatsApp +92 310 3604110 / +92 336 0479649.`;

async function seed() {
  console.log('Seeding Ittisalo Knowledge Base...');

  // 1. Update tenant ai_language to 'en'
  const { error: tErr } = await supabase.from('tenants')
    .update({
      ai_language: 'en',
      niche: 'general',
      business_name: 'Ittisalo'
    })
    .eq('id', TENANT_ID);
  console.log('Updated tenant ai_language & niche:', tErr || 'Success');

  // 2. Update agent prompt
  const { error: agErr } = await supabase.from('agents')
    .update({
      name: 'Ittisalo Sales Consultant',
      prompt: NEW_AGENT_PROMPT,
      is_active: true
    })
    .eq('tenant_id', TENANT_ID);
  console.log('Updated agent prompt:', agErr || 'Success');

  // 3. Delete old/redundant scraped website entries if any, or insert new ones
  for (const doc of KB_DOCS) {
    const { data: existing } = await supabase.from('knowledge_base')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('title', doc.title)
      .maybeSingle();

    if (existing) {
      const { error: uErr } = await supabase.from('knowledge_base')
        .update({
          content: doc.content,
          kb_type: doc.kb_type,
          source_url: doc.source_url,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      console.log(`Updated KB: ${doc.title} (${uErr || 'OK'})`);
    } else {
      const { error: iErr } = await supabase.from('knowledge_base')
        .insert(doc);
      console.log(`Inserted KB: ${doc.title} (${iErr || 'OK'})`);
    }
  }

  // 4. Verify all active KB items for tenant
  const { data: allKb } = await supabase.from('knowledge_base')
    .select('id, title, is_active')
    .eq('tenant_id', TENANT_ID);
  console.log('Total KB items now for Ittisalo:', allKb?.length);

  process.exit(0);
}

seed();
