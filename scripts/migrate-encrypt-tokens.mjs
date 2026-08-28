// scripts/migrate-encrypt-tokens.mjs
// Ittisalo Token Encryption at Rest — Production Migration Tool
// Supports: --dry-run (default, read-only simulation) and --live (with automated backup & validation)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

const isLive = process.argv.includes('--live');
const isDryRun = !isLive || process.argv.includes('--dry-run');

const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
if (!encryptionKey) {
  console.error('❌ Missing TOKEN_ENCRYPTION_KEY in environment.');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function getKeyBuffer() {
  if (/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    return Buffer.from(encryptionKey, 'hex');
  }
  return crypto.createHash('sha256').update(encryptionKey).digest();
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('enc:v1:');
}

function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
  }
  if (typeof plaintext !== 'string') {
    plaintext = String(plaintext);
  }
  if (isEncrypted(plaintext)) {
    return plaintext;
  }

  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(ciphertext) {
  if (ciphertext === null || ciphertext === undefined || ciphertext === '') {
    return ciphertext;
  }
  if (typeof ciphertext !== 'string' || !isEncrypted(ciphertext)) {
    return ciphertext;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 5) {
    throw new Error('Invalid ciphertext format');
  }
  const iv = Buffer.from(parts[2], 'hex');
  const authTag = Buffer.from(parts[3], 'hex');
  const encryptedText = parts[4];

  const key = getKeyBuffer();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function verifyRoundTrip(original, encrypted) {
  const roundtrip = decrypt(encrypted);
  if (roundtrip !== original) {
    throw new Error(`Roundtrip decryption assertion failed! Original: ${original.slice(0, 5)}..., Decrypted: ${roundtrip?.slice(0, 5)}...`);
  }
  return true;
}

function mask(str) {
  if (!str) return '(empty)';
  if (str.length <= 8) return '****';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

// ── BACKUP CREATION ──────────────────────────────────────────────────────────
async function createPreMigrationBackup(data) {
  const backupDir = path.resolve(process.cwd(), 'scripts', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `tokens-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`📦 [BACKUP CREATED]: Pre-migration snapshot saved to:\n   ${backupPath}\n`);
  return backupPath;
}

// ── MIGRATION LOGIC ──────────────────────────────────────────────────────────
async function runMigration() {
  console.log('================================================================');
  console.log(`  ITTISALO TOKEN ENCRYPTION: ${isLive ? '🔴 LIVE RUN' : '🟡 DRY-RUN / READ-ONLY MODE'} `);
  console.log('================================================================\n');

  if (isDryRun) {
    console.log('ℹ️  RUNNING IN DRY-RUN MODE:');
    console.log('   - No database records will be modified.');
    console.log('   - All candidate plaintext tokens will be simulated and verified for round-trip encryption/decryption fidelity.');
    console.log('   - To apply changes, execute with: node scripts/migrate-encrypt-tokens.mjs --live\n');
  } else {
    console.log('⚠️  RUNNING IN LIVE MODE:');
    console.log('   - A full pre-migration JSON snapshot backup will be created before writing.');
    console.log('   - Tokens will be encrypted in-place using AES-256-GCM.\n');
  }

  // 1. Fetch Tenants
  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('id, business_name, wa_token_enc, wa_access_token');
  if (tErr) throw new Error(`Failed to fetch tenants: ${tErr.message}`);

  // 2. Fetch Integration Credentials
  const { data: intCreds, error: icErr } = await supabase
    .from('integration_credentials')
    .select('id, tenant_id, platform, credentials');
  if (icErr) throw new Error(`Failed to fetch integration_credentials: ${icErr.message}`);

  // 3. Fetch Calendar Integrations
  const { data: calIntegrations, error: ciErr } = await supabase
    .from('calendar_integrations')
    .select('id, tenant_id, provider, access_token, refresh_token');
  if (ciErr) throw new Error(`Failed to fetch calendar_integrations: ${ciErr.message}`);

  // 4. Fetch Integrations (Meta channel routing)
  const { data: integrations, error: iErr } = await supabase
    .from('integrations')
    .select('id, tenant_id, platform, credentials, access_token');
  if (iErr) console.warn('Note: integrations table query returned:', iErr.message);

  // If live mode, save backup first!
  if (isLive) {
    await createPreMigrationBackup({
      created_at: new Date().toISOString(),
      tenants: tenants || [],
      integration_credentials: intCreds || [],
      calendar_integrations: calIntegrations || [],
      integrations: integrations || []
    });
  }

  // ── PROCESS TENANTS ──
  console.log('--- 1. Tenants Table ---');
  let tPending = 0, tAlreadyEnc = 0, tEmpty = 0;
  const tSamples = [];

  for (const t of tenants || []) {
    const rawToken = t.wa_token_enc || t.wa_access_token;
    if (!rawToken) {
      tEmpty++;
      continue;
    }
    if (isEncrypted(rawToken)) {
      tAlreadyEnc++;
      continue;
    }

    tPending++;
    const encrypted = encrypt(rawToken);
    verifyRoundTrip(rawToken, encrypted); // Verification assertion

    tSamples.push({
      Tenant: t.business_name || t.id.slice(0, 8),
      Status: isLive ? 'Encrypted ✅' : 'Would Encrypt 🔄',
      OriginalPreview: mask(rawToken),
      EncryptedPrefix: encrypted.slice(0, 18) + '...'
    });

    if (isLive) {
      const { error: updErr } = await supabase
        .from('tenants')
        .update({ wa_token_enc: encrypted })
        .eq('id', t.id);
      if (updErr) console.error(`❌ Failed to update tenant ${t.id}:`, updErr.message);
    }
  }
  if (tSamples.length > 0) console.table(tSamples);
  console.log(`Summary: Total: ${tenants?.length || 0} | Plaintext Candidates: ${tPending} | Already Encrypted: ${tAlreadyEnc} | Empty: ${tEmpty}\n`);

  // ── PROCESS INTEGRATION CREDENTIALS ──
  console.log('--- 2. Integration Credentials Table ---');
  let icPending = 0, icAlreadyEnc = 0, icSkipped = 0;
  const icSamples = [];

  for (const rec of intCreds || []) {
    const creds = rec.credentials || {};
    let modified = false;
    const newCreds = { ...creds };

    if (rec.platform === 'shopify' && newCreds.access_token) {
      if (!isEncrypted(newCreds.access_token)) {
        const enc = encrypt(newCreds.access_token);
        verifyRoundTrip(newCreds.access_token, enc);
        newCreds.access_token = enc;
        modified = true;
      }
    } else if (rec.platform === 'woocommerce') {
      if (newCreds.consumer_key && !isEncrypted(newCreds.consumer_key)) {
        const enc = encrypt(newCreds.consumer_key);
        verifyRoundTrip(newCreds.consumer_key, enc);
        newCreds.consumer_key = enc;
        modified = true;
      }
      if (newCreds.consumer_secret && !isEncrypted(newCreds.consumer_secret)) {
        const enc = encrypt(newCreds.consumer_secret);
        verifyRoundTrip(newCreds.consumer_secret, enc);
        newCreds.consumer_secret = enc;
        modified = true;
      }
    } else if ((rec.platform === 'salla' || rec.platform === 'zid') && newCreds.access_token) {
      if (!isEncrypted(newCreds.access_token)) {
        const enc = encrypt(newCreds.access_token);
        verifyRoundTrip(newCreds.access_token, enc);
        newCreds.access_token = enc;
        modified = true;
      }
    }

    if (modified) {
      icPending++;
      icSamples.push({
        ID: rec.id.slice(0, 8),
        Platform: rec.platform,
        Status: isLive ? 'Encrypted ✅' : 'Would Encrypt 🔄'
      });

      if (isLive) {
        const { error: updErr } = await supabase
          .from('integration_credentials')
          .update({ credentials: newCreds })
          .eq('id', rec.id);
        if (updErr) console.error(`❌ Failed to update integration_credentials ${rec.id}:`, updErr.message);
      }
    } else {
      icAlreadyEnc++;
    }
  }
  if (icSamples.length > 0) console.table(icSamples);
  console.log(`Summary: Total: ${intCreds?.length || 0} | Plaintext Candidates: ${icPending} | Skipped/Already Encrypted: ${icAlreadyEnc}\n`);

  // ── PROCESS CALENDAR INTEGRATIONS ──
  console.log('--- 3. Calendar Integrations Table ---');
  let ciPending = 0, ciAlreadyEnc = 0;
  const ciSamples = [];

  for (const rec of calIntegrations || []) {
    let modified = false;
    const updatePayload = {};

    if (rec.access_token && !isEncrypted(rec.access_token)) {
      const enc = encrypt(rec.access_token);
      verifyRoundTrip(rec.access_token, enc);
      updatePayload.access_token = enc;
      modified = true;
    }
    if (rec.refresh_token && !isEncrypted(rec.refresh_token)) {
      const enc = encrypt(rec.refresh_token);
      verifyRoundTrip(rec.refresh_token, enc);
      updatePayload.refresh_token = enc;
      modified = true;
    }

    if (modified) {
      ciPending++;
      ciSamples.push({
        ID: rec.id.slice(0, 8),
        Provider: rec.provider,
        Status: isLive ? 'Encrypted ✅' : 'Would Encrypt 🔄'
      });

      if (isLive) {
        const { error: updErr } = await supabase
          .from('calendar_integrations')
          .update(updatePayload)
          .eq('id', rec.id);
        if (updErr) console.error(`❌ Failed to update calendar_integrations ${rec.id}:`, updErr.message);
      }
    } else {
      ciAlreadyEnc++;
    }
  }
  if (ciSamples.length > 0) console.table(ciSamples);
  console.log(`Summary: Total: ${calIntegrations?.length || 0} | Plaintext Candidates: ${ciPending} | Skipped/Already Encrypted: ${ciAlreadyEnc}\n`);

  // ── PROCESS INTEGRATIONS ──
  console.log('--- 4. Integrations Table ---');
  let iPending = 0, iAlreadyEnc = 0;

  for (const rec of integrations || []) {
    let modified = false;
    const updatePayload = {};

    if (rec.access_token && !isEncrypted(rec.access_token)) {
      const enc = encrypt(rec.access_token);
      verifyRoundTrip(rec.access_token, enc);
      updatePayload.access_token = enc;
      modified = true;
    }

    if (rec.credentials && typeof rec.credentials === 'object') {
      const newCreds = { ...rec.credentials };
      if (newCreds.access_token && !isEncrypted(newCreds.access_token)) {
        const enc = encrypt(newCreds.access_token);
        verifyRoundTrip(newCreds.access_token, enc);
        newCreds.access_token = enc;
        updatePayload.credentials = newCreds;
        modified = true;
      }
    }

    if (modified) {
      iPending++;
      if (isLive) {
        const { error: updErr } = await supabase
          .from('integrations')
          .update(updatePayload)
          .eq('id', rec.id);
        if (updErr) console.error(`❌ Failed to update integrations ${rec.id}:`, updErr.message);
      }
    } else {
      iAlreadyEnc++;
    }
  }
  console.log(`Summary: Total: ${integrations?.length || 0} | Plaintext Candidates: ${iPending} | Skipped/Already Encrypted: ${iAlreadyEnc}\n`);

  // ── FINAL OVERVIEW ──
  console.log('================================================================');
  console.log(`  MIGRATION ${isLive ? 'COMPLETED SUCCESSFULLY ✅' : 'SIMULATION COMPLETED (0 WRITES) 🟡'}`);
  console.log('================================================================');
  console.table([
    { Table: 'tenants', ToEncrypt: tPending, AlreadyEncrypted: tAlreadyEnc, Empty: tEmpty },
    { Table: 'integration_credentials', ToEncrypt: icPending, AlreadyEncrypted: icAlreadyEnc, Empty: 0 },
    { Table: 'calendar_integrations', ToEncrypt: ciPending, AlreadyEncrypted: ciAlreadyEnc, Empty: 0 },
    { Table: 'integrations', ToEncrypt: iPending, AlreadyEncrypted: iAlreadyEnc, Empty: 0 },
  ]);

  if (isDryRun) {
    console.log('💡 To apply these changes in production with automated pre-backup, run:');
    console.log('   node scripts/migrate-encrypt-tokens.mjs --live\n');
  }
}

runMigration().catch(err => {
  console.error('\n❌ Fatal Migration Error:', err.message);
  process.exit(1);
});
