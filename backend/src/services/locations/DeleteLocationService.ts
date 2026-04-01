import { Repository } from 'typeorm';
import { Location } from '@/entities/Location';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class DeleteLocationService implements BaseService {
  constructor(
    @inject('LocationRepository')
    private readonly locationRepo: Repository<Location>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(id: number, user?: JwtUserPayload): Promise<Location> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }

    await this.locationRepo.softRemove(location);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'LOCATION_DELETED',
      description: `Location deleted with code ${location.code}`,
      auditableType: 'Location',
      auditableId: location.id,
      userId: user?.sub,
      oldValues: { ...location },
    });

    return location;
  }
}
