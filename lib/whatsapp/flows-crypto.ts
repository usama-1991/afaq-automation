/**
 * Ittisalo — Meta WhatsApp Flows Cryptographic Decryption & Encryption
 * 
 * Complies with Meta WhatsApp Flows Data Exchange protocol v3.0:
 * - RSA-OAEP private key decryption of the AES-128 key.
 * - AES-128-GCM decryption of incoming flow data.
 * - AES-128-GCM encryption of outgoing dynamic response payload.
 */

import crypto from 'crypto';

export interface DecryptedFlowRequest {
  decryptedData: any;
  aesKey: Buffer;
  initialVector: Buffer;
}

/**
 * Decrypts an incoming Meta WhatsApp Flow Data Exchange request
 */
export function decryptFlowRequest(
  encryptedFlowDataB64: string,
  encryptedAesKeyB64: string,
  initialVectorB64: string,
  privateKeyPem: string
): DecryptedFlowRequest {
  // 1. Decrypt the AES key using our RSA private key (RSA-OAEP with SHA-256)
  const encryptedAesKey = Buffer.from(encryptedAesKeyB64, 'base64');
  let decryptedAesKey: Buffer;

  try {
    decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedAesKey
    );
  } catch {
    // Fallback to SHA-1 padding if SHA-256 fails (older Meta flow versions)
    decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1',
      },
      encryptedAesKey
    );
  }

  // 2. Prepare AES-GCM decipher
  const initialVector = Buffer.from(initialVectorB64, 'base64');
  const encryptedFlowDataWithTag = Buffer.from(encryptedFlowDataB64, 'base64');

  // Last 16 bytes is the GCM Auth Tag
  const authTagLength = 16;
  const ciphertext = encryptedFlowDataWithTag.subarray(0, encryptedFlowDataWithTag.length - authTagLength);
  const authTag = encryptedFlowDataWithTag.subarray(encryptedFlowDataWithTag.length - authTagLength);

  const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVector);
  decipher.setAuthTag(authTag);

  const decryptedJsonStr = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  const decryptedData = JSON.parse(decryptedJsonStr);

  return {
    decryptedData,
    aesKey: decryptedAesKey,
    initialVector,
  };
}

/**
 * Encrypts an outgoing dynamic response payload back to Meta WhatsApp Flows
 */
export function encryptFlowResponse(
  responsePayload: any,
  aesKey: Buffer,
  initialVector: Buffer
): string {
  // Flip the first bit of the IV to produce a distinct IV for the response as specified by Meta
  const responseIv = Buffer.from(initialVector);
  responseIv[0] ^= 1;

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, responseIv);
  const jsonStr = JSON.stringify(responsePayload);

  const ciphertext = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine ciphertext + 16-byte auth tag
  const encryptedPayload = Buffer.concat([ciphertext, authTag]);
  return encryptedPayload.toString('base64');
}
