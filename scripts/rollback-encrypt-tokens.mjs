// scripts/rollback-encrypt-tokens.mjs
// Rollback Tool: Restores plaintext tokens from pre-migration backup or decrypts in-place

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

function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string' || !isEncrypted(ciphertext)) {
    return ciphertext;
  }
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 5) return ciphertext;
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encryptedText = parts[4];

    const key = getKeyBuffer();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed for ciphertext:', err.message);
    return ciphertext;
  }
}

async function rollback() {
  console.log('================================================================');
  console.log(`  ITTISALO TOKEN ROLLBACK: ${isLive ? '🔴 LIVE ROLLBACK' : '🟡 DRY-RUN ROLLBACK'} `);
  console.log('================================================================\n');

  // Check if a backup file is provided or find the latest
  const backupDir = path.resolve(process.cwd(), 'scripts', 'backups');
  let backupFile = null;

  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('tokens-backup-') && f.endsWith('.json'));
    if (files.length > 0) {
      files.sort().reverse();
      backupFile = path.join(backupDir, files[0]);
    }
  }

  if (backupFile && fs.existsSync(backupFile)) {
    console.log(`📂 Found backup snapshot: ${path.basename(backupFile)}`);
    console.log(`   Restoring original plaintext tokens from snapshot...\n`);
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // 1. Restore Tenants
    for (const t of backupData.tenants || []) {
      console.log(`[Tenants] Restoring tenant: ${t.business_name || t.id}`);
      if (isLive) {
        await supabase
          .from('tenants')
          .update({ wa_token_enc: t.wa_token_enc || null })
          .eq('id', t.id);
      }
    }

    // 2. Restore Integration Credentials
    for (const ic of backupData.integration_credentials || []) {
      console.log(`[IntegrationCredentials] Restoring credentials: ${ic.platform} (${ic.id})`);
      if (isLive) {
        await supabase
          .from('integration_credentials')
          .update({ credentials: ic.credentials })
          .eq('id', ic.id);
      }
    }

    // 3. Restore Calendar Integrations
    for (const ci of backupData.calendar_integrations || []) {
      console.log(`[CalendarIntegrations] Restoring provider: ${ci.provider} (${ci.id})`);
      if (isLive) {
        await supabase
          .from('calendar_integrations')
          .update({ access_token: ci.access_token, refresh_token: ci.refresh_token })
          .eq('id', ci.id);
      }
    }

    console.log(`\n🎉 Rollback from snapshot completed (${isLive ? 'LIVE' : 'SIMULATION'})!`);
  } else {
    console.log('ℹ️  No backup file found. Decrypting all encrypted tokens directly in-place from the database...\n');
    
    // In-place decryption fallback
    const { data: tenants } = await supabase.from('tenants').select('id, wa_token_enc');
    for (const t of tenants || []) {
      if (isEncrypted(t.wa_token_enc)) {
        const decrypted = decrypt(t.wa_token_enc);
        console.log(`[Tenants] Decrypting token for ID: ${t.id}`);
        if (isLive) {
          await supabase.from('tenants').update({ wa_token_enc: decrypted }).eq('id', t.id);
        }
      }
    }

    console.log(`\n🎉 In-place decryption rollback completed (${isLive ? 'LIVE' : 'SIMULATION'})!`);
  }
}

rollback().catch(err => {
  console.error('\n❌ Fatal Rollback Error:', err.message);
  process.exit(1);
});
