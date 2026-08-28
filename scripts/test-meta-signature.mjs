// scripts/test-meta-signature.mjs
// Automated verification test for Meta X-Hub-Signature-256 HMAC authentication

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

const appSecret = process.env.META_APP_SECRET || '8f9a2b8617f939e9490c84e713aed4ea';
const targetUrl = process.argv[2] || 'http://localhost:3003/webhook';

console.log('================================================================');
console.log('    META WEBHOOK X-HUB-SIGNATURE-256 VERIFICATION TEST SUITE    ');
console.log('================================================================');
console.log(`Target URL: ${targetUrl}`);
console.log(`Using Secret: ${appSecret.slice(0, 4)}...${appSecret.slice(-4)}\n`);

const testPayload = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'TEST_ACCOUNT',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '15550001111', phone_number_id: 'TEST_ID' },
        contacts: [{ profile: { name: 'Signature Test' }, wa_id: '923000000000' }],
        messages: [{ from: '923000000000', id: 'wamid.sig_test_' + Date.now(), text: { body: 'Ping' }, type: 'text' }]
      }
    }]
  }]
});

// Generate signatures
const validSigHex = crypto.createHmac('sha256', appSecret).update(testPayload).digest('hex');
const validHeader = `sha256=${validSigHex}`;
const tamperedHeader = `sha256=0000000000000000000000000000000000000000000000000000000000000000`;

async function run() {
  const results = [];

  // Test 1: Unsigned Request
  try {
    console.log('Test 1: Sending Unsigned Request (Missing X-Hub-Signature-256)...');
    const res1 = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: testPayload
    });
    const pass = res1.status === 401;
    results.push({
      Scenario: '1. Unsigned Request (Missing Header)',
      ExpectedStatus: 401,
      ActualStatus: res1.status,
      Result: pass ? 'PASS ✅' : 'FAIL ❌'
    });
  } catch (err) {
    results.push({ Scenario: '1. Unsigned Request', Error: err.message });
  }

  // Test 2: Tampered Signature
  try {
    console.log('Test 2: Sending Request with Tampered / Invalid Signature...');
    const res2 = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': tamperedHeader
      },
      body: testPayload
    });
    const pass = res2.status === 401;
    results.push({
      Scenario: '2. Tampered / Invalid Signature',
      ExpectedStatus: 401,
      ActualStatus: res2.status,
      Result: pass ? 'PASS ✅' : 'FAIL ❌'
    });
  } catch (err) {
    results.push({ Scenario: '2. Tampered Signature', Error: err.message });
  }

  // Test 3: Correctly-Signed Request
  try {
    console.log('Test 3: Sending Request with Valid HMAC-SHA256 Signature...');
    const res3 = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': validHeader
      },
      body: testPayload
    });
    const pass = res3.status === 200;
    results.push({
      Scenario: '3. Valid HMAC-SHA256 Signature',
      ExpectedStatus: 200,
      ActualStatus: res3.status,
      Result: pass ? 'PASS ✅' : 'FAIL ❌'
    });
  } catch (err) {
    results.push({ Scenario: '3. Valid Signature', Error: err.message });
  }

  console.log('\n================================================================');
  console.log('                     TEST SUITE RESULTS                         ');
  console.log('================================================================');
  console.table(results);
}

run().catch(e => console.error(e));
