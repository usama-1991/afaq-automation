// scripts/send-real-test-message.mjs
// Sends a real WhatsApp message via Meta Cloud API using decrypted credentials

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '../lib/crypto.ts';

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendTest() {
  const tenantId = '00000000-0000-0000-0000-111111111111';
  const recipientPhone = process.argv[2] || '923242059198';

  const { data: tenant } = await supabase
    .from('tenants')
    .select('wa_phone_number_id, wa_token_enc, business_name')
    .eq('id', tenantId)
    .single();

  if (!tenant || !tenant.wa_phone_number_id || !tenant.wa_token_enc) {
    console.error('Tenant or credentials not found');
    process.exit(1);
  }

  const token = decrypt(tenant.wa_token_enc);
  console.log(`Connecting to Meta Graph API for ${tenant.business_name}...`);
  console.log(`Phone ID: ${tenant.wa_phone_number_id}`);
  console.log(`Sending to: +${recipientPhone}`);

  const res = await fetch(`https://graph.facebook.com/v21.0/${tenant.wa_phone_number_id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'text',
      text: {
        body: '🦷 Hello from SmileCare Dental! Our new Meta HMAC signature security is live. Please reply with any question (e.g. "Do you have scaling?") to test real Meta HMAC webhook delivery!'
      }
    })
  });

  const data = await res.json();
  console.log('\nMeta API Response:', JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log('\n✅ Message successfully dispatched by Meta to WhatsApp!');
    console.log(`Message ID: ${data.messages?.[0]?.id}`);
  } else {
    console.error('\n❌ Meta API Error:', data.error?.message);
  }
}

sendTest().catch(console.error);
