/**
 * Ittisalo Webhook Service — Meta WhatsApp Flows Cryptographic Decryption & Encryption
 */

import crypto from 'crypto';

export function decryptFlowRequest(
  encryptedFlowDataB64,
  encryptedAesKeyB64,
  initialVectorB64,
  privateKeyPem
) {
  const encryptedAesKey = Buffer.from(encryptedAesKeyB64, 'base64');
  let decryptedAesKey;

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
    decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1',
      },
      encryptedAesKey
    );
  }

  const initialVector = Buffer.from(initialVectorB64, 'base64');
  const encryptedFlowDataWithTag = Buffer.from(encryptedFlowDataB64, 'base64');

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

export function encryptFlowResponse(
  responsePayload,
  aesKey,
  initialVector
) {
  const responseIv = Buffer.from(initialVector);
  responseIv[0] ^= 1;

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, responseIv);
  const jsonStr = JSON.stringify(responsePayload);

  const ciphertext = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedPayload = Buffer.concat([ciphertext, authTag]);
  return encryptedPayload.toString('base64');
}
