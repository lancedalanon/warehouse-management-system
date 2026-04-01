import { Repository, Not } from 'typeorm';
import { Location } from '@/entities/Location';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  UpdateLocationDTO,
  UpdateLocationSchema,
} from '@/schemas/locations/UpdateLocationSchema';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class UpdateLocationService implements BaseService {
  constructor(
    @inject('LocationRepository')
    private readonly locationRepo: Repository<Location>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(
    id: number,
    data: UpdateLocationDTO,
    user?: JwtUserPayload,
  ): Promise<Location> {
    const parsedData = await UpdateLocationSchema.parseAsync(data);

    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }

    const prevLocation = JSON.parse(JSON.stringify(location));

    // Check for code uniqueness if code is being updated
    if (parsedData.code && parsedData.code !== location.code) {
      const existing = await this.locationRepo.findOne({
        where: {
          code: parsedData.code,
          id: Not(location.id),
        },
        withDeleted: true,
      });

      if (existing) {
        throw new ValidationHandler(
          { field: 'code', message: 'Location code was already assigned to another location'},
        );
      }
    }

    // Update location
    location.code = parsedData.code;
    location.name = parsedData.name;
    location.type = parsedData.type;
    location.capacity = parsedData.capacity ?? null;

    const savedLocation = await this.locationRepo.save(location);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'LOCATION_UPDATED',
      description: `Location updated with code ${location.code}`,
      auditableType: 'Location',
      auditableId: location.id,
      userId: user?.sub,
      oldValues: prevLocation,
      newValues: { ...parsedData },
    });

    return savedLocation;
  }
}
