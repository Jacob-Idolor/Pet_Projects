import crypto from 'crypto';

const DEFAULT_FEATURES = {
  free: new Set(['quotes', 'watch-basic', 'pl']),
  trial: new Set(['quotes', 'watch-pro', 'analysis', 'earnings', 'pl', 'ai']),
  pro: new Set(['quotes', 'watch-pro', 'analysis', 'earnings', 'pl', 'ai']),
  enterprise: new Set(['quotes', 'watch-pro', 'analysis', 'earnings', 'pl', 'ai', 'webhooks'])
};

export function tierFeatures(tier = 'free') {
  return DEFAULT_FEATURES[tier] || DEFAULT_FEATURES.free;
}

export function formatTier(tier, expiresAt) {
  if (!tier) return 'Free';
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  if (!expiresAt) return label;
  return `${label} (expires ${new Date(expiresAt).toISOString().slice(0, 10)})`;
}

export function verifyLicense(licenseKey, guildId, secret = process.env.LICENSE_SECRET) {
  if (!secret) {
    return { valid: false, reason: 'Missing LICENSE_SECRET env var', tier: 'free' };
  }
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, reason: 'No key supplied', tier: 'free' };
  }

  try {
    const [payloadB64, signature] = licenseKey.split('.');
    if (!payloadB64 || !signature) {
      return { valid: false, reason: 'Malformed license key', tier: 'free' };
    }
    const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expectedBuf.length) {
      return { valid: false, reason: 'Signature mismatch', tier: 'free' };
    }
    if (!crypto.timingSafeEqual(expectedBuf, sigBuf)) {
      return { valid: false, reason: 'Signature mismatch', tier: 'free' };
    }
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (!payload.tier) {
      return { valid: false, reason: 'Missing tier in license payload', tier: 'free' };
    }
    if (payload.guildId && guildId && payload.guildId !== guildId) {
      return { valid: false, reason: 'License bound to another server', tier: 'free' };
    }
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      return { valid: false, reason: 'License expired', tier: 'free', expiresAt: payload.expiresAt };
    }
    return {
      valid: true,
      tier: payload.tier,
      expiresAt: payload.expiresAt || null,
      seats: payload.seats || 1,
      payload
    };
  } catch (err) {
    return { valid: false, reason: 'Invalid license format', tier: 'free' };
  }
}

export function generateLicense({ tier = 'pro', guildId = null, expiresAt = null }, secret = process.env.LICENSE_SECRET) {
  if (!secret) throw new Error('Missing LICENSE_SECRET');
  const payload = { tier, guildId, expiresAt };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}
