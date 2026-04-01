import 'reflect-metadata';
import { GetStatusService } from '../GetStatusService';

describe('GetStatusService', () => {
  let service: GetStatusService;

  beforeEach(() => {
    service = new GetStatusService();
  });

  it('should return status ok with a timestamp', async () => {
    const result = await service.handle();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();

    // Validate ISO format
    const date = new Date(result.timestamp);
    expect(date.toISOString()).toBe(result.timestamp);
  });
});
