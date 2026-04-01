import { BaseService } from '@/services/BaseService';
import { injectable } from 'tsyringe';

@injectable()
export class GetStatusService implements BaseService {
  async handle() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
