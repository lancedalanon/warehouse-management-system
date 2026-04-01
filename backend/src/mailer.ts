import dotenv from 'dotenv';

dotenv.config();

export type MailDeliveryType = 'smtp' | 'api';
export type MailApiProviderType = 'brevo';

export interface MailConfig {
  deliveryType: MailDeliveryType;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from?: string;
  };
  api?: {
    provider: MailApiProviderType;
    apiKey?: string;
    from?: string;
  };
}

export const mailConfig: MailConfig = {
  deliveryType: (process.env.MAIL_DELIVERY_TYPE as MailDeliveryType) || 'smtp',
  smtp: {
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM,
  },
  api: {
    provider: (process.env.MAIL_PROVIDER as MailApiProviderType) || '',
    apiKey: process.env.MAIL_API_KEY,
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
  },
};
