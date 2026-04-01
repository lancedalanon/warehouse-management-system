import axios from 'axios';
import { BaseEmailApiProvider } from '@/lib/email/api/BaseEmailApiProvider';
import { SendEmailParams } from '@/lib/EmailNotificationService';

export class BrevoEmailProvider implements BaseEmailApiProvider {
  async send(params: SendEmailParams): Promise<void> {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.APP_NAME,
          email: process.env.MAIL_USER,
        },
        to: [
          {
            email: params.to,
          },
        ],
        subject: params.subject,
        textContent: params.text,
        htmlContent: params.html,
      },
      {
        headers: {
          'api-key': process.env.MAIL_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  }
}
