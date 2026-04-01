import nodemailer from 'nodemailer';
import { EmailProviderFactory } from '@/lib/email/EmailProviderFactory';
import { BrevoEmailProvider } from '@/lib/email/api/BrevoEmailProvider';
import { mailConfig } from '@/mailer';

jest.mock('nodemailer');
jest.mock('@/lib/email/api/BrevoEmailProvider');

describe('EmailProviderFactory', () => {
  const mockedCreateTransport = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return smtp transporter when deliveryType is smtp', () => {
    const transporterMock = { sendMail: jest.fn() };

    mockedCreateTransport.mockReturnValue(transporterMock);

    mailConfig.deliveryType = 'smtp';
    mailConfig.smtp = {
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      user: 'test-user',
      pass: 'test-pass',
    };

    const result = EmailProviderFactory.resolve();

    expect(mockedCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test-user',
        pass: 'test-pass',
      },
    });

    expect(result).toEqual({
      transporter: transporterMock,
    });
  });

  it('should return Brevo API provider when deliveryType is api and provider is brevo', () => {
    const providerInstance = {};

    (BrevoEmailProvider as jest.Mock).mockImplementation(
      () => providerInstance,
    );

    mailConfig.deliveryType = 'api';
    mailConfig.api = {
      provider: 'brevo',
    };

    const result = EmailProviderFactory.resolve();

    expect(BrevoEmailProvider).toHaveBeenCalled();

    expect(result).toEqual({
      apiProvider: providerInstance,
    });
  });

  it('should throw error for unsupported api provider', () => {
    mailConfig.deliveryType = 'api';
    mailConfig.api = {
      provider: 'unknown-provider' as unknown as 'brevo',
    };

    expect(() => EmailProviderFactory.resolve()).toThrow(
      'Unsupported API provider: unknown-provider',
    );
  });

  it('should throw error for unsupported delivery type', () => {
    mailConfig.deliveryType = 'invalid' as unknown as 'smtp';

    expect(() => EmailProviderFactory.resolve()).toThrow(
      'Unsupported mail delivery type: invalid',
    );
  });
});
