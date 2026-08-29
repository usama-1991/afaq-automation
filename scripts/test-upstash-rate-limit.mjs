// scripts/test-upstash-rate-limit.mjs
// Test Upstash Redis sliding window enforcement

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

async function runTest() {
  const { Redis } = await import('@upstash/redis');
  const { Ratelimit } = await import('@upstash/ratelimit');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '10 s'),
    prefix: 'ittisalo_verify_test',
  });

  const testKey = 'unit_test_' + Date.now();
  console.log('Testing Upstash Redis rate limit enforcement (2 req / 10s)...');

  const r1 = await ratelimit.limit(testKey);
  console.log('Request 1:', r1.success ? 'ACCEPTED ✅' : 'THROTTLED ❌', `(remaining: ${r1.remaining})`);

  const r2 = await ratelimit.limit(testKey);
  console.log('Request 2:', r2.success ? 'ACCEPTED ✅' : 'THROTTLED ❌', `(remaining: ${r2.remaining})`);

  const r3 = await ratelimit.limit(testKey);
  console.log('Request 3:', r3.success ? 'ACCEPTED ❌ (Expected throttle)' : 'THROTTLED 429 ✅', `(remaining: ${r3.remaining})`);

  if (r1.success && r2.success && !r3.success) {
    console.log('\n🎉 Upstash Redis sliding-window rate limiting is fully functional and enforcing correctly!');
  } else {
    console.error('\n❌ Unexpected rate limit result');
  }
}

runTest().catch(console.error);
