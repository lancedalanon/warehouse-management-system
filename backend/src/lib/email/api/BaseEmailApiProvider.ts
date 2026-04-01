import { SendEmailParams } from '@/lib/EmailNotificationService';

export interface BaseEmailApiProvider {
  send(params: SendEmailParams): Promise<void>;
}
