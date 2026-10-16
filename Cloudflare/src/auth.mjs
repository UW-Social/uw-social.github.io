import { createRemoteJWKSet, jwtVerify } from 'jose';

const firebaseKeys = createRemoteJWKSet(new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
));

export async function verifyFirebaseToken(token, projectId, keys = firebaseKeys) {
  if (!projectId) throw new Error('Firebase project is not configured');
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ['RS256'],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    requiredClaims: ['exp', 'iat', 'sub', 'auth_time'],
  });
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128 ||
      typeof payload.iat !== 'number' || payload.iat > now ||
      typeof payload.auth_time !== 'number' || payload.auth_time > now ||
      payload.firebase?.sign_in_provider === 'anonymous') {
    throw new Error('Invalid Firebase user');
  }
  return payload.sub;
}
