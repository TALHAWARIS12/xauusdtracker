import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { verifyPaystackWebhook } from '../lib/paystack';

describe('Paystack Helper Library', () => {
  const secretKey = 'sk_test_mock_secret_key_12345';

  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = secretKey;
  });

  describe('verifyPaystackWebhook', () => {
    it('returns true when HMAC signature matches raw body', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'pay_123' } });
      const signature = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');

      const isValid = verifyPaystackWebhook(payload, signature);
      expect(isValid).toBe(true);
    });

    it('returns false when signature does not match', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'pay_123' } });
      const invalidSignature = 'invalid_signature_hex_hash_digest_123456';

      const isValid = verifyPaystackWebhook(payload, invalidSignature);
      expect(isValid).toBe(false);
    });

    it('returns false when signature is null or empty', () => {
      const payload = JSON.stringify({ event: 'charge.success' });
      expect(verifyPaystackWebhook(payload, null)).toBe(false);
      expect(verifyPaystackWebhook(payload, '')).toBe(false);
    });
  });
});

