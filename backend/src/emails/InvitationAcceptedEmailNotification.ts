import { BaseEmailTemplateService } from './BaseEmailTemplateService';

interface InvitationAcceptedInput {
  firstName: string;
  email: string;
  password: string;
  loginUrl: string;
}

interface InvitationAcceptedData extends InvitationAcceptedInput {
  appName: string;
  appUrl: string;
  year: number;
}

export class InvitationAcceptedEmailNotification extends BaseEmailTemplateService<InvitationAcceptedData> {
  async send(to: string, data: InvitationAcceptedInput) {
    const templateData: InvitationAcceptedData = {
      ...data,
      appName: process.env.APP_NAME || 'My App',
      appUrl: process.env.APP_URL || 'https://app.example.com',
      year: new Date().getFullYear(),
    };

    await this.sendEmail({
      to,
      subject: 'Your Invitation Has Been Accepted!',
      templateName: 'invitation-accepted',
      templateData,
      text: `Hello ${data.firstName},

        Your invitation has been accepted! You can now access your account.

        Login credentials:
        Email: ${data.email}
        Temporary Password: ${data.password}

        This is a temporary password. Please reset your password after logging in:
        ${data.loginUrl}

        If you did not expect this email, please contact support.`,
    });
  }
}
