import { EmailNotificationService } from '../EmailNotificationService';
import { EmailProviderFactory } from '@/lib/email/EmailProviderFactory';
import { mailConfig } from '@/mailer';

// Mock the Factory and the Config
jest.mock('@/lib/email/EmailProviderFactory');
jest.mock('@/mailer', () => ({
  mailConfig: {
    smtp: { from: 'noreply@test.com', user: 'test-user' },
  },
}));

describe('EmailNotificationService', () => {
  const mockParams = {
    to: 'user@example.com',
    subject: 'Test Subject',
    text: 'Hello world',
    html: '<h1>Hello world</h1>',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor logic', () => {
    it('should resolve transporter from factory', () => {
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: { sendMail: jest.fn() },
        apiProvider: null,
      });

      const service = new EmailNotificationService();

      expect(EmailProviderFactory.resolve).toHaveBeenCalled();

      expect(service['transporter']).toBeDefined();
      expect(service['apiProvider']).toBeNull();
    });

    it('should resolve apiProvider from factory', () => {
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: null,
        apiProvider: { send: jest.fn() },
      });

      const service = new EmailNotificationService();

      expect(EmailProviderFactory.resolve).toHaveBeenCalled();
      expect(service['transporter']).toBeNull();
      expect(service['apiProvider']).toBeDefined();
    });
  });

  describe('send() functionality', () => {
    it('should send via SMTP transporter if available', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: '123' });
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: { sendMail: mockSendMail },
        apiProvider: null,
      });

      const service = new EmailNotificationService();
      await service.send(mockParams);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: mailConfig.smtp?.from,
        ...mockParams,
      });
    });

    it('should send via API provider if transporter is null', async () => {
      const mockApiSend = jest.fn().mockResolvedValue(true);
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: null,
        apiProvider: { send: mockApiSend },
      });

      const service = new EmailNotificationService();
      await service.send(mockParams);

      expect(mockApiSend).toHaveBeenCalledWith(mockParams);
    });

    it('should throw "No valid mail provider" if both are null', async () => {
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: null,
        apiProvider: null,
      });

      const service = new EmailNotificationService();
      await expect(service.send(mockParams)).rejects.toThrow(
        'Mailer failed: No valid mail provider resolved',
      );
    });

    it('should wrap and re-throw errors from the providers', async () => {
      const errorMsg = 'Connection timed out';
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: {
          sendMail: jest.fn().mockRejectedValue(new Error(errorMsg)),
        },
        apiProvider: null,
      });

      const service = new EmailNotificationService();
      await expect(service.send(mockParams)).rejects.toThrow(
        `Mailer failed: ${errorMsg}`,
      );
    });
  });

  describe('mailConfig Fallbacks (Branch Coverage)', () => {
    it('should fallback to smtp.user if smtp.from is missing', async () => {
      // Temporarily modify the mock for this specific test
      const originalFrom = mailConfig.smtp?.from;
      if (mailConfig.smtp) mailConfig.smtp.from = undefined;

      const mockSendMail = jest.fn().mockResolvedValue(true);
      (EmailProviderFactory.resolve as jest.Mock).mockReturnValue({
        transporter: { sendMail: mockSendMail },
        apiProvider: null,
      });

      const service = new EmailNotificationService();
      await service.send(mockParams);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test-user',
        }),
      );

      // Cleanup
      if (mailConfig.smtp) mailConfig.smtp.from = originalFrom;
    });
  });
});
