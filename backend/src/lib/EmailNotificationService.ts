import {
  EmailProviderFactory,
  MailTransporterResult,
} from '@/lib/email/EmailProviderFactory';
import { Transporter } from 'nodemailer';
import { BaseEmailApiProvider } from '@/lib/email/api/BaseEmailApiProvider';
import { mailConfig } from '@/mailer';

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailNotificationService {
  private transporter: Transporter | null = null;
  private apiProvider: BaseEmailApiProvider | null = null;

  constructor() {
    const result: MailTransporterResult = EmailProviderFactory.resolve();
    this.transporter = result.transporter ?? null;
    this.apiProvider = result.apiProvider ?? null;
  }

  async send(params: SendEmailParams): Promise<void> {
    try {
      if (this.transporter) {
        // SMTP
        await this.transporter.sendMail({
          from: mailConfig.smtp?.from ?? mailConfig.smtp?.user,
          ...params,
        });
      } else if (this.apiProvider) {
        // API
        await this.apiProvider.send(params);
      } else {
        throw new Error('No valid mail provider resolved');
      }
    } catch (err) {
      throw new Error('Mailer failed: ' + (err as Error).message);
    }
  }
}
