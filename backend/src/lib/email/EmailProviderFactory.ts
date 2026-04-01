import nodemailer, { Transporter } from 'nodemailer';
import { BrevoEmailProvider } from './api/BrevoEmailProvider';
import { BaseEmailApiProvider } from './api/BaseEmailApiProvider';
import { mailConfig } from '@/mailer';

export interface MailTransporterResult {
  transporter?: Transporter;
  apiProvider?: BaseEmailApiProvider;
}

export class EmailProviderFactory {
  static resolve(): MailTransporterResult {
    if (mailConfig.deliveryType === 'smtp') {
      const { host, port, secure, user, pass } = mailConfig.smtp!;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      return { transporter };
    }

    if (mailConfig.deliveryType === 'api') {
      const providerName = mailConfig.api!.provider;
      let apiProvider: BaseEmailApiProvider;

      switch (providerName) {
        case 'brevo':
          apiProvider = new BrevoEmailProvider();
          break;
        // Provide more API based email service providers here as needed
        default:
          throw new Error(`Unsupported API provider: ${providerName}`);
      }

      return { apiProvider };
    }

    throw new Error(
      `Unsupported mail delivery type: ${mailConfig.deliveryType}`,
    );
  }
}
