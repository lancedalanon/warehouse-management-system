import { RefreshTokenManager } from '../RefreshTokenManager';
import { GenerateRefreshTokenParams } from '@/types/lib/refresh-token-management.types';
import crypto from 'crypto';

describe('RefreshTokenManager', () => {
  const ORIGINAL_ENV = process.env;

  // Helper to create valid params with correct types (userId as number)
  const createParams = (overrides: Partial<GenerateRefreshTokenParams> = {}): GenerateRefreshTokenParams => ({
    userId: 1, 
    ipAddress: '127.0.0.1',
    userAgent: 'jest-test',
    ...overrides,
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    // Set valid defaults for most tests
    process.env.JWT_REFRESH_TOKEN_SECRET = 'super-secret-key';
    process.env.JWT_REFRESH_TOKEN_EXPIRES = '7d';
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.useRealTimers();
  });

  describe('Secret and Expiry Branch Coverage', () => {
    it('should throw error if JWT_REFRESH_TOKEN_SECRET is missing', () => {
      delete process.env.JWT_REFRESH_TOKEN_SECRET;
      // Accessing any method that uses .secret (like fingerprint)
      expect(() => RefreshTokenManager.fingerprint('test')).toThrow('JWT_REFRESH_TOKEN_SECRET not set');
    });

    it('should throw error if JWT_REFRESH_TOKEN_EXPIRES is missing', () => {
      delete process.env.JWT_REFRESH_TOKEN_EXPIRES;
      expect(() => RefreshTokenManager.generate(createParams())).toThrow('JWT_REFRESH_TOKEN_EXPIRES not set');
    });

    it('should throw error if JWT_REFRESH_TOKEN_EXPIRES format is invalid (Regex mismatch)', () => {
      process.env.JWT_REFRESH_TOKEN_EXPIRES = 'abc'; // No numbers
      expect(() => RefreshTokenManager.generate(createParams())).toThrow('Invalid JWT_REFRESH_TOKEN_EXPIRES format');
    });

    it('should correctly parse minutes (m) unit', () => {
      process.env.JWT_REFRESH_TOKEN_EXPIRES = '30m';
      const result = RefreshTokenManager.generate(createParams());
      const expectedTime = new Date('2026-01-01').getTime() + (30 * 60 * 1000);
      expect(result.expiredAt.getTime()).toBe(expectedTime);
    });

    it('should correctly parse hours (h) unit', () => {
      process.env.JWT_REFRESH_TOKEN_EXPIRES = '2h';
      const result = RefreshTokenManager.generate(createParams());
      const expectedTime = new Date('2026-01-01').getTime() + (2 * 60 * 60 * 1000);
      expect(result.expiredAt.getTime()).toBe(expectedTime);
    });
  });

  describe('Decryption Logic', () => {
    it('should correctly decrypt a valid encrypted token', () => {
      const text = 'test-token-payload';
      const secretKey = 'super-secret-key';
      process.env.JWT_REFRESH_TOKEN_SECRET = secretKey;

      // Manually create an AES-GCM payload to verify decrypt() logic
      const iv = crypto.randomBytes(12);
      const secret = crypto.createHash('sha256').update(secretKey).digest();
      const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
      
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      // Class expects: IV (12) + AuthTag (16) + Data
      const combined = Buffer.concat([iv, authTag, encrypted]).toString('base64');
      
      const decrypted = RefreshTokenManager.decrypt(combined);
      expect(decrypted).toBe(text);
    });
  });

  describe('Static fingerprint', () => {
    it('should generate a consistent hmac', () => {
      const token = 'xyz';
      const h1 = RefreshTokenManager.fingerprint(token);
      const h2 = RefreshTokenManager.fingerprint(token);
      expect(h1).toBe(h2);
      expect(h1).toHaveLength(64); // sha256 hex length
    });
  });
});