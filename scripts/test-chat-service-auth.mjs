// scripts/test-chat-service-auth.mjs
// Automated verification of internal service auth on POST /send

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

const internalKey = process.env.INTERNAL_SERVICE_KEY || 'defe7bbd448f89db7a6ac12a1cc473e64c8d5643a82445fc790631b2370c68b3';
const targetUrl = process.argv[2] || 'https://chat.ittisalo.com/send';

console.log('================================================================');
console.log('      CHAT-SERVICE POST /SEND INTERNAL AUTH TEST SUITE          ');
console.log('================================================================');
console.log(`Target URL: ${targetUrl}`);
console.log(`Expected Key: ${internalKey.slice(0, 6)}...${internalKey.slice(-6)}\n`);

async function runTests() {
  const results = [];

  // Test 1: Missing Auth Header
  try {
    console.log('Test 1: Sending request without x-internal-api-key header...');
    const res1 = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: 'test-id' })
    });
    const pass = res1.status === 401;
    results.push({
      Scenario: '1. Missing Header',
      ExpectedStatus: 401,
      ActualStatus: res1.status,
      Result: pass ? 'PASS ✅' : 'FAIL ❌'
    });
  } catch (err) {
    results.push({ Scenario: '1. Missing Header', Error: err.message });
  }

  // Test 2: Invalid / Wrong Key
  try {
    console.log('Test 2: Sending request with invalid x-internal-api-key...');
    const res2 = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': 'wrong_service_key_999'
      },
      body: JSON.stringify({ message_id: 'test-id' })
    });
    const pass = res2.status === 401;
    results.push({
      Scenario: '2. Invalid Key',
      ExpectedStatus: 401,
      ActualStatus: res2.status,
      Result: pass ? 'PASS ✅' : 'FAIL ❌'
    });
  } catch (err) {
    results.push({ Scenario: '2. Invalid Key', Error: err.message });
  }

  // Test 3: Valid Internal Service Key
  try {
    console.log('Test 3: Sending request with valid x-internal-api-key...');
    const res3 = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': internalKey
      },
      body: JSON.stringify({ message_id: 'test-id' })
    });
    // With valid key, it should pass auth. It will return 404/400 because 'test-id' is a dummy message_id, but NOT 401!
    const pass = res3.status !== 401;
    results.push({
      Scenario: '3. Valid Service Key',
      ExpectedStatus: 'Non-401 (Auth Passed)',
      ActualStatus: res3.status,
      Result: pass ? 'PASS ✅ (Auth Passed)' : 'FAIL ❌ (Auth Rejected)'
    });
  } catch (err) {
    results.push({ Scenario: '3. Valid Service Key', Error: err.message });
  }

  console.log('\n================================================================');
  console.log('                     TEST SUITE RESULTS                         ');
  console.log('================================================================');
  console.table(results);
}

runTests().catch(console.error);
