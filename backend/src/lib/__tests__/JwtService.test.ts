import { JwtService } from '../JwtService';
import jwt from 'jsonwebtoken';

describe('JwtService', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.useRealTimers();
  });

  describe('Constructor (Branch Coverage)', () => {
    it('should use environment variables when provided', () => {
      process.env.JWT_ACCESS_TOKEN_SECRET = 'env-secret';
      process.env.JWT_ACCESS_TOKEN_EXPIRES = '1h';

      const service = new JwtService();

      // We check private properties indirectly via the generate method
      const result = service.generate({ id: 1 });
      const expectedExpiry = new Date('2026-01-01T01:00:00Z'); // +1 hour

      expect(result.expiredAt).toEqual(expectedExpiry);
    });

    it('should use default values when env vars are missing', () => {
      delete process.env.JWT_ACCESS_TOKEN_SECRET;
      delete process.env.JWT_ACCESS_TOKEN_EXPIRES;

      const service = new JwtService();
      const result = service.generate({ id: 1 });

      // Default is 15m
      const expectedExpiry = new Date('2026-01-01T00:15:00Z');
      expect(result.expiredAt).toEqual(expectedExpiry);
    });
  });

  describe('generate()', () => {
    it('should return a signed token and a Date object', () => {
      const service = new JwtService();
      const payload = { sub: 'user123' };
      const result = service.generate(payload);

      expect(typeof result.token).toBe('string');
      expect(result.expiredAt).toBeInstanceOf(Date);

      // Verify the token actually contains our payload
      const decoded = jwt.decode(result.token) as jwt.JwtPayload;
      expect(decoded.sub).toBe('user123');
    });
  });

  describe('verify()', () => {
    it('should return the payload for a valid token', () => {
      const service = new JwtService();
      const payload = { email: 'test@example.com' };
      const { token } = service.generate(payload);

      const verified = service.verify<{ email: string }>(token);
      expect(verified.email).toBe('test@example.com');
    });

    it('should throw an error for an invalid token', () => {
      const service = new JwtService();
      expect(() => service.verify('not-a-real-token')).toThrow();
    });
  });
});
