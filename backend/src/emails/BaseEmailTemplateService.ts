import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import {
  EmailNotificationService,
  SendEmailParams,
} from '@/lib/EmailNotificationService';

export interface TemplateEmailParams<T> {
  to: string;
  subject: string;
  templateName: string;
  templateData: T;
  text?: string; // optional plain-text fallback
}

export abstract class BaseEmailTemplateService<T> {
  protected emailService: EmailNotificationService;

  constructor() {
    this.emailService = new EmailNotificationService();
  }

  protected async compileTemplate(
    templateName: string,
    data: T,
  ): Promise<string> {
    const templatePath = path.resolve(
      __dirname,
      '..',
      'templates/emails',
      `${templateName}.hbs`,
    );
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    return template(data);
  }

  protected async sendEmail(params: TemplateEmailParams<T>): Promise<void> {
    const html = await this.compileTemplate(
      params.templateName,
      params.templateData,
    );

    const sendParams: SendEmailParams = {
      to: params.to,
      subject: params.subject,
      text: params.text || '', // fallback
      html,
    };

    await this.emailService.send(sendParams);
  }
}
