// scripts/seed-test-tenants.mjs
// Automated Staging Tenant Seeder for Ittisalo Pre-Launch Testing
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local or .env for Supabase credentials
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valParts] = trimmed.split('=');
          const val = valParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const TEST_NICHES = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    niche: 'restaurant',
    name: 'Gourmet Bites Bistro',
    business_name: 'Gourmet Bites Bistro',
    phone_id: 'FAKE_TENANT_REST_101',
    kb: [
      { title: 'Halal Certification & Sourcing', content: 'Our chicken and beef are 100% Halal certified, sourced daily from local organic suppliers.' },
      { title: 'Operating Hours & Reservations', content: 'We are open Mon-Sun from 12:00 PM to 11:30 PM. Table reservations require 2 hours advance notice.' },
      { title: 'Menu Pricing & Discounts', content: 'Standard prices apply as listed in menu. Discounts over 10% require manager approval.' }
    ],
    products: [
      { name: 'Artisan BBQ Chicken Wings', category: 'Appetizers', price: 14.99, description: 'Crispy fried wings tossed in house smoky BBQ sauce.' },
      { name: 'Truffle Mushroom Burger', category: 'Mains', price: 18.50, description: 'Angus beef patty topped with truffle mayo and sauteed mushrooms.' }
    ]
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    niche: 'dental',
    name: 'SmileCare Dental Clinic',
    business_name: 'SmileCare Dental Clinic',
    phone_id: 'FAKE_TENANT_DENT_102',
    kb: [
      { title: 'Treatments & Pricing', content: 'Teeth whitening starts at PKR 8,000. Dental scaling & polishing is PKR 5,000. Root canal treatment starts at PKR 15,000.' },
      { title: 'Clinic Hours & Doctor Availability', content: 'Dr. Hassan is available Mon-Fri 4 PM - 9 PM. Saturday 2 PM - 6 PM.' },
      { title: 'Medical Prescriptions & Safety Policy', content: 'AI agents MUST NEVER prescribe antibiotics or painkillers. Patients must be directed to book a consultation.' }
    ],
    products: []
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    niche: 'realestate',
    name: 'Apex Horizon Realty',
    business_name: 'Apex Horizon Realty',
    phone_id: 'FAKE_TENANT_REAL_103',
    kb: [
      { title: 'DHA Karachi Listings', content: '3-Bedroom Luxury Apartment in DHA Phase 8, 2400 sq ft, asking price PKR 2.5 Crore. Open for viewing.' },
      { title: 'Investment Advice Boundary', content: 'We provide market analysis only. AI will not promise guaranteed financial returns or double-value speculation.' }
    ],
    products: []
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    niche: 'ecommerce',
    name: 'Urban Chic Apparel',
    business_name: 'Urban Chic Apparel',
    phone_id: 'FAKE_TENANT_ECOM_104',
    kb: [
      { title: 'Return & Exchange Policy', content: 'Returns accepted within 14 days of delivery in unworn condition with tags intact.' },
      { title: 'Payment Security', content: 'NEVER accept credit card numbers over WhatsApp. Direct customers to the secure online checkout link.' }
    ],
    products: [
      { name: 'Embroidered Lawn Kurti - Medium', category: 'Women Wear', price: 35.00, description: '100% premium lawn kurti with floral threadwork.' },
      { name: 'Casual Denim Jacket - Large', category: 'Outerwear', price: 55.00, description: 'Classic blue wash denim jacket.' }
    ]
  },
  {
    id: '55555555-5555-4555-a555-555555555555',
    niche: 'salon',
    name: 'Glow & Grace Studio',
    business_name: 'Glow & Grace Studio',
    phone_id: 'FAKE_TENANT_SALN_105',
    kb: [
      { title: 'Services & Stylists', content: 'Hair highlights with Senior Stylist Sarah starting at PKR 12,000. Facial treatment PKR 6,000.' },
      { title: 'Booking Confirmations', content: 'All appointments require confirmation 24 hours prior to slot.' }
    ],
    products: []
  },
  {
    id: '66666666-6666-4666-a666-666666666666',
    niche: 'clinic',
    name: 'PulseHealth Medical Center',
    business_name: 'PulseHealth Medical Center',
    phone_id: 'FAKE_TENANT_CLIN_106',
    kb: [
      { title: 'Specialists & OPD Schedule', content: 'Cardiologist Dr. Irfan: Tue & Thu 5 PM - 8 PM. Consultation fee PKR 3,000.' },
      { title: 'Emergency Triage Override', content: 'CRITICAL: Severe chest pain, dizziness, or difficulty breathing requires IMMEDIATE referral to ER (1122).' }
    ],
    products: []
  }
];

export async function seedStagingTenants() {
  console.log('🌱 Starting Staging Tenant Seeding for Ittisalo Pre-Launch Testing...\n');

  for (const t of TEST_NICHES) {
    console.log(`📌 Seeding tenant [${t.niche}]: ${t.name}...`);

    // 1. Upsert Tenant with Enterprise Plan
    const { error: tenantErr } = await supabase
      .from('tenants')
      .upsert({
        id: t.id,
        name: t.name,
        business_name: t.business_name,
        niche: t.niche,
        wa_phone_number_id: t.phone_id,
        plan: 'enterprise',
        plan_status: 'active',
        created_at: new Date().toISOString()
      });

    if (tenantErr) {
      console.error(`❌ Tenant upsert failed for ${t.niche}: ${tenantErr.message}`);
      continue;
    }

    // 2. Upsert Integration
    await supabase.from('integrations').delete().eq('tenant_id', t.id).eq('platform', 'whatsapp');
    const { error: intErr } = await supabase
      .from('integrations')
      .insert({
        tenant_id: t.id,
        platform: 'whatsapp',
        external_account_id: t.phone_id,
        credentials: { phone_number_id: t.phone_id }
      });

    if (intErr) {
      console.warn(`⚠️ Integration upsert warning for ${t.niche}: ${intErr.message}`);
    }

    // 3. Seed Knowledge Base Items
    for (const kbItem of t.kb) {
      await supabase
        .from('knowledge_base')
        .upsert({
          tenant_id: t.id,
          title: kbItem.title,
          content: kbItem.content,
          kb_type: 'faq',
          is_active: true
        });
    }

    // 4. Seed Products if applicable
    for (const prod of t.products) {
      await supabase
        .from('products')
        .upsert({
          tenant_id: t.id,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          description: prod.description
        });
    }

    console.log(`✅ Tenant [${t.niche}] ready with ID: ${t.phone_id}`);
  }

  console.log('\n🎉 All 6 Business Niche Staging Tenants Seeded Successfully!\n');
}

// Execute directly if run via node
if (process.argv[1]?.endsWith('seed-test-tenants.mjs')) {
  seedStagingTenants().catch(err => {
    console.error('Fatal Seeding Error:', err);
    process.exit(1);
  });
}
