// scripts/connect-wa-number.mjs
// Easily connect your 1 real Meta test WhatsApp phone number ID to any of the 6 niche tenants!

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { TEST_NICHES } from './seed-test-tenants.mjs';

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

const targetNiche = process.argv[2]?.toLowerCase();
const realPhoneId = process.argv[3];

if (!targetNiche || !realPhoneId) {
  console.log('\n📱 WhatsApp Test Number Switcher for Ittisalo');
  console.log('================================================================');
  console.log('Usage:   node scripts/connect-wa-number.mjs <niche> <phone_number_id>');
  console.log('Example: node scripts/connect-wa-number.mjs restaurant 105938209384912');
  console.log('\nAvailable Niches: restaurant, dental, realestate, ecommerce, salon, clinic\n');
  process.exit(0);
}

const nicheObj = TEST_NICHES.find(n => n.niche === targetNiche);
if (!nicheObj) {
  console.error(`❌ Invalid niche "${targetNiche}". Choose from: restaurant, dental, realestate, ecommerce, salon, clinic.`);
  process.exit(1);
}

async function switchWhatsAppNumber() {
  console.log(`🔗 Connecting real Meta WhatsApp Phone ID (${realPhoneId}) to [${nicheObj.niche.toUpperCase()}]: ${nicheObj.name}...`);

  // 1. Update Tenants Table
  const { error: tenantErr } = await supabase
    .from('tenants')
    .update({ wa_phone_number_id: realPhoneId })
    .eq('id', nicheObj.id);

  if (tenantErr) {
    console.error(`❌ Failed to update tenant: ${tenantErr.message}`);
    process.exit(1);
  }

  // 2. Update Integrations Table
  await supabase.from('integrations').delete().eq('tenant_id', nicheObj.id).eq('platform', 'whatsapp');
  const { error: intErr } = await supabase
    .from('integrations')
    .insert({
      tenant_id: nicheObj.id,
      platform: 'whatsapp',
      external_account_id: realPhoneId,
      credentials: { phone_number_id: realPhoneId }
    });

  if (intErr) {
    console.error(`❌ Failed to update integration: ${intErr.message}`);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log(`🎉 SUCCESS! Your real Meta test number is now active for [${nicheObj.niche.toUpperCase()}]`);
  console.log('================================================================');
  console.log(`Tenant Name:      ${nicheObj.name}`);
  console.log(`Phone Number ID:  ${realPhoneId}`);
  console.log(`Knowledge Base:   ${nicheObj.kb.length} articles pre-loaded`);
  console.log(`Products/Menu:    ${nicheObj.products.length} items pre-loaded`);
  console.log('\n📲 You can now send WhatsApp messages from your real phone to test this niche live!\n');
}

switchWhatsAppNumber().catch(err => {
  console.error('Fatal Switch Error:', err);
  process.exit(1);
});
