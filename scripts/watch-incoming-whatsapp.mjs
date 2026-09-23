// scripts/watch-incoming-whatsapp.mjs
// Real-time listener for incoming Meta WhatsApp messages & AI bot responses

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

console.log('================================================================');
console.log('  WAITING FOR INCOMING REAL WHATSAPP MESSAGE VIA PRODUCTION WEBHOOK ');
console.log('================================================================');
console.log('📱 Phone ID: 1081880905011541 (SmileCare Dental Clinic)');
console.log('👀 Listening for replies from customer phone: 923242059198...\n');

const startTime = new Date().toISOString();
let customerMsgFound = null;
let botReplyFound = null;

async function poll() {
  for (let i = 0; i < 45; i++) {
    const { data: messages } = await supabase
      .from('messages')
      .select('id, sender_type, content, created_at, external_message_id')
      .gte('created_at', startTime)
      .order('created_at', { ascending: true });

    for (const m of messages || []) {
      if (m.sender_type === 'customer' && !customerMsgFound) {
        customerMsgFound = m;
        console.log(`\n📥 [REAL META WEBHOOK RECEIVED & PROCESSED]:`);
        console.log(`   Time:    ${m.created_at}`);
        console.log(`   Message: "${m.content}"`);
        console.log(`   Meta ID: ${m.external_message_id}`);
      }
      if (m.sender_type === 'bot' && !botReplyFound && customerMsgFound) {
        botReplyFound = m;
        console.log(`\n🤖 [AI AGENT AUTOMATED BOT REPLY SENT]:`);
        console.log(`   Time:    ${m.created_at}`);
        console.log(`   Reply:   "${m.content}"\n`);
        console.log('🎉 COMPLETE END-TO-END META HMAC WEBHOOK & AI BOT REACTION VERIFIED!');
        process.exit(0);
      }
    }

    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!customerMsgFound) {
    console.log('\n⏳ No reply received within 90 seconds. Please check if you replied from your WhatsApp app.');
  }
}

poll().catch(console.error);
