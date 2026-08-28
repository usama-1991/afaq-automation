import crypto from 'crypto';

/**
 * Derives a 32-byte (256-bit) buffer from the TOKEN_ENCRYPTION_KEY env var.
 */
function getKeyBuffer() {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is missing.');
  }
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Checks if a string has already been encrypted with the enc:v1 format.
 */
export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('enc:v1:');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Idempotent: If the input is already encrypted, returns it untouched.
 */
export function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext;
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

/**
 * Decrypts an AES-256-GCM ciphertext string.
 * Fail-safe: If the input is not encrypted (e.g. legacy plaintext), returns it as-is.
 */
export function decrypt(ciphertext) {
  if (ciphertext === null || ciphertext === undefined || ciphertext === '') {
    return ciphertext;
  }
  if (typeof ciphertext !== 'string' || !isEncrypted(ciphertext)) {
    return ciphertext;
  }

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 5) {
      return ciphertext;
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
  } catch (err) {
    console.error('Decryption failed for ciphertext:', err.message);
    return ciphertext;
  }
}
