import admin from 'firebase-admin';

// Initialize Firebase Admin (Only initialize if credentials are provided in env)
// Typically, FIREBASE_SERVICE_ACCOUNT is a JSON string or path to a JSON file.
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('[FCM] Firebase Admin initialized.');
    }
  } else {
    console.log('[FCM] Skipping initialization: No FIREBASE_SERVICE_ACCOUNT_JSON provided.');
  }
} catch (error) {
  console.error('[FCM] Error initializing Firebase Admin:', error.message);
}

/**
 * Send a push notification to specific tenant admin devices.
 * 
 * @param {object} supabase - Supabase client
 * @param {string} tenantId - The tenant's UUID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export async function sendTenantNotification(supabase, tenantId, title, body, data = {}) {
  if (!admin.apps.length) {
    console.log(`[FCM] Cannot send notification (Firebase not initialized). Title: ${title}`);
    return;
  }

  try {
    // Get users for this tenant
    const { data: users, error } = await supabase
      .from('users')
      .select('fcm_tokens')
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    // Aggregate all tokens from all users in the tenant
    let allTokens = [];
    users.forEach(user => {
      if (Array.isArray(user.fcm_tokens)) {
        allTokens.push(...user.fcm_tokens);
      }
    });

    // Remove duplicates and empty strings
    allTokens = [...new Set(allTokens.filter(t => t))];

    if (allTokens.length === 0) {
      console.log(`[FCM] No tokens found for tenant ${tenantId}. Notification skipped.`);
      return;
    }

    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens: allTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`[FCM] Sent notification to ${response.successCount} devices (Tenant: ${tenantId}). Failures: ${response.failureCount}`);
    
    // Optional: Handle failures (remove invalid tokens from DB)
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`[FCM] Token failure: ${allTokens[idx]} - Error: ${resp.error}`);
        }
      });
    }

  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
  }
}
