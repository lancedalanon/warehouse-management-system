import { BaseEmailTemplateService } from './BaseEmailTemplateService';

interface ForgotPasswordInput {
  firstName: string;
  resetUrl: string;
}

interface ForgotPasswordData extends ForgotPasswordInput {
  appName: string;
  appUrl: string;
  year: number;
}

export class ForgotPasswordEmailNotification extends BaseEmailTemplateService<ForgotPasswordData> {
  async send(to: string, data: ForgotPasswordInput) {
    const templateData: ForgotPasswordData = {
      ...data,
      appName: process.env.APP_NAME || 'My App',
      appUrl: process.env.APP_URL || 'https://app.example.com',
      year: new Date().getFullYear(),
    };

    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      templateName: 'forgot-password',
      templateData,
      text: `Hello ${data.firstName},

        We received a request to reset your password for ${process.env.APP_NAME}.

        Use the following link to reset your password: ${data.resetUrl}

        If you did not request a password reset, please ignore this email.`,
    });
  }
}
