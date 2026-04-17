import { supabaseAdmin } from '@/lib/supabase-admin';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send an FCM push notification to all registered devices of a user.
 *
 * Requires:
 *  - A `device_tokens` table in Supabase with columns: id, user_id, token, platform, created_at
 *  - GOOGLE_FCM_SERVER_KEY env var (legacy HTTP API) OR a Firebase service account for v1 API
 *
 * This uses the FCM HTTP v1 API via Google OAuth2 access token.
 * Set env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
  // 1. Get all device tokens for this user
  const { data: tokens, error } = await supabaseAdmin
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch device tokens:', error);
    return { success: false, error };
  }

  if (!tokens || tokens.length === 0) {
    console.log(`No device tokens found for user ${userId}`);
    return { success: true, sent: 0 };
  }

  const projectId = process.env.GOOGLE_PROJECT_ID;
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  // Get access token
  const accessToken = await getAccessToken();

  let sent = 0;
  const failed: string[] = [];

  for (const { token } of tokens) {
    try {
      const message = {
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
          android: {
            priority: 'high' as const,
            notification: {
              sound: 'default',
              channel_id: 'orders',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      };

      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      });

      if (res.ok) {
        sent++;
      } else {
        const errBody = await res.text();
        console.error(`FCM send failed for token ${token.slice(0, 10)}...:`, errBody);

        // Remove invalid tokens (NOT_FOUND or UNREGISTERED)
        if (errBody.includes('NOT_FOUND') || errBody.includes('UNREGISTERED')) {
          await supabaseAdmin.from('device_tokens').delete().eq('token', token);
          console.log(`Removed stale device token: ${token.slice(0, 10)}...`);
        }

        failed.push(token.slice(0, 10));
      }
    } catch (err) {
      console.error(`Error sending to token ${token.slice(0, 10)}...:`, err);
      failed.push(token.slice(0, 10));
    }
  }

  console.log(`FCM push: ${sent} sent, ${failed.length} failed for user ${userId}`);
  return { success: true, sent, failed: failed.length };
}

/**
 * Get a Google OAuth2 access token using service account credentials.
 * Uses the JWT grant flow to exchange for an access token.
 */
async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const scope = 'https://www.googleapis.com/auth/firebase.messaging';

  if (!email || !privateKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars');
  }

  // Build JWT
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsignedToken = `${encode(header)}.${encode(claims)}`;

  // Sign with the private key
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(privateKey, 'base64url');

  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get access token: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}
