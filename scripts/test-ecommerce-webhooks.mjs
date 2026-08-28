// scripts/test-ecommerce-webhooks.mjs
// Test harness to simulate WooCommerce and Shopify webhook signature verification & missing-secret alerts

import crypto from 'crypto';

const TEST_TENANT_ID = '656c1083-4b51-4e8d-b957-94568edc4da4'; // ZEMS Wholesale
const BASE_URL = 'http://localhost:3000';

async function testMissingSecret() {
  console.log('Testing WooCommerce webhook with unconfigured secret (ZEMS Wholesale)...');
  const payload = JSON.stringify({ id: 999999, status: 'processing', total: '100.00' });
  const dummySignature = 'sha256=dummy';

  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/woocommerce?tenant_id=${TEST_TENANT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wc-webhook-event': 'created',
        'x-wc-webhook-signature': dummySignature
      },
      body: payload
    });

    console.log('Status code:', res.status);
    const json = await res.json();
    console.log('Response body:', json);
  } catch (err) {
    console.log('Local server offline (skipping live HTTP test):', err.message);
  }
}

testMissingSecret();
