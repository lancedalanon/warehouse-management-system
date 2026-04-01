import { EmailVerifyService } from '../EmailVerifyService';

describe('EmailVerifyService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.EMAIL_VERIFY_SECRET = 'test-secret';
    process.env.EMAIL_VERIFY_EXPIRES = '15m';
    // Freeze time to 2026-01-01 00:00:00
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.useRealTimers();
  });

  describe('Constructor & Expiry Parsing (Branch Coverage)', () => {
    it('should use default values if env vars are missing', () => {
      delete process.env.EMAIL_VERIFY_SECRET;
      delete process.env.EMAIL_VERIFY_EXPIRES;

      const service = new EmailVerifyService();
      const token = service.generate({ email: 'test@test.com' });
      const payload = service.verify(token);

      // Default 15m = 900s. Jan 1 2026 is 1767225600
      expect(payload.exp).toBe(1767225600 + 900);
    });

    const units = [
      { input: '60s', expected: 60 },
      { input: '10m', expected: 600 },
      { input: '1h', expected: 3600 },
      { input: '1d', expected: 86400 },
      { input: 'invalid', expected: 900 }, // hits default case
    ];

    test.each(units)(
      'should parse %s into %i seconds',
      ({ input, expected }) => {
        process.env.EMAIL_VERIFY_EXPIRES = input;
        const service = new EmailVerifyService();
        const token = service.generate({ email: 'a@b.com' });
        const payload = service.verify(token);
        expect(payload.exp).toBe(1767225600 + expected);
      },
    );
  });

  describe('generate() and verify()', () => {
    it('should generate a valid hmac-signed token string', () => {
      const service = new EmailVerifyService();
      const token = service.generate({ email: 'user@example.com' });

      expect(token).toContain('.');
      const [payload] = token.split('.');
      expect(payload).toBeDefined();
    });

    it('should successfully verify a valid token', () => {
      const service = new EmailVerifyService();
      const email = 'verify@me.com';
      const token = service.generate({ email });

      const result = service.verify(token);
      expect(result.email).toBe(email);
    });

    it('should throw error for invalid token format', () => {
      const service = new EmailVerifyService();
      expect(() => service.verify('just-a-string-no-dot')).toThrow(
        'Invalid token format',
      );
    });

    it('should throw error for invalid signature (tampered)', () => {
      const service = new EmailVerifyService();
      const token = service.generate({ email: 'safe@test.com' });
      const [payload, signature] = token.split('.');

      // Tamper with the payload (change one char in base64)
      const tamperedToken = 'A' + payload.substring(1) + '.' + signature;

      expect(() => service.verify(tamperedToken)).toThrow(
        'Invalid token signature',
      );
    });

    it('should throw error for expired tokens', () => {
      const service = new EmailVerifyService();
      const token = service.generate({ email: 'old@test.com' });

      // Fast forward time by 20 minutes (exceeding default 15m)
      jest.advanceTimersByTime(20 * 60 * 1000);

      expect(() => service.verify(token)).toThrow('Token expired');
    });
  });
});
