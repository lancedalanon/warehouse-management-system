import { Repository } from 'typeorm';
import { Location } from '@/entities/Location';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  CreateLocationDTO,
  CreateLocationSchema,
} from '@/schemas/locations/CreateLocationSchema';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class CreateLocationService implements BaseService {
  constructor(
    @inject('LocationRepository')
    private readonly locationRepo: Repository<Location>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(
    data: CreateLocationDTO,
    user?: JwtUserPayload,
  ): Promise<Location> {
    const parsedData = await CreateLocationSchema.parseAsync(data);

    // Check for code uniqueness
    const existing = await this.locationRepo.findOne({
      where: { code: parsedData.code },
      withDeleted: true,
    });

    if (existing) {
      throw new ValidationHandler({
        field: 'code',
        message: 'Location code was already assigned to another location',
      });
    }

    // Create location
    const location = this.locationRepo.create({
      code: parsedData.code,
      name: parsedData.name,
      type: parsedData.type,
      capacity: parsedData.capacity ?? null,
    });

    const savedLocation = await this.locationRepo.save(location);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'LOCATION_CREATED',
      description: `Location created with code ${savedLocation.code}`,
      auditableType: 'Location',
      auditableId: savedLocation.id,
      userId: user?.sub,
      oldValues: null,
      newValues: { ...savedLocation },
    });

    return savedLocation;
  }
}
