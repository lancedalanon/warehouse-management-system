import { BaseEmailTemplateService } from './BaseEmailTemplateService';

interface VerifyEmailInput {
  firstName: string;
  verifyUrl: string;
}

interface VerifyEmailData extends VerifyEmailInput {
  appName: string;
  appUrl: string;
  year: number;
}

export class VerifyEmailNotification extends BaseEmailTemplateService<VerifyEmailData> {
  async send(to: string, data: VerifyEmailInput) {
    const templateData: VerifyEmailData = {
      ...data,
      appName: process.env.APP_NAME || 'My App',
      appUrl: process.env.APP_URL || 'https://app.example.com',
      year: new Date().getFullYear(),
    };

    await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      templateName: 'verify-email',
      templateData,
      text: `Hello ${data.firstName},

        Thank you for creating an account with ${process.env.APP_NAME}.

        Please verify your email by clicking the link below:
        ${data.verifyUrl}

        If you did not create an account, you can ignore this email.`,
    });
  }
}
