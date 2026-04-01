import { BaseEmailTemplateService } from './BaseEmailTemplateService';

interface RequestInvitationTemplateData {
  appName: string;
  appUrl: string;
  year: number;
}

export class RequestInvitationSentEmailNotification extends BaseEmailTemplateService<RequestInvitationTemplateData> {
  async send(to: string) {
    const templateData: RequestInvitationTemplateData = {
      appName: process.env.APP_NAME || 'My App',
      appUrl: process.env.APP_URL || 'https://app.example.com',
      year: new Date().getFullYear(),
    };

    await this.sendEmail({
      to,
      subject: 'We received your request!',
      templateName: 'request-invitation',
      templateData,
      text: `Hello,

        We have received your request to join ${process.env.APP_NAME}. Your request is pending approval by an administrator.

        You will receive another email once it is approved.

        Thank you for your patience!`,
    });
  }
}
