import { Repository } from 'typeorm';
import { Location } from '@/entities/Location';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class GetLocationService implements BaseService {
  constructor(
    @inject('LocationRepository')
    private readonly locationRepo: Repository<Location>,
  ) {}

  async handle(id: number): Promise<Location> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location)
      throw new NotFoundException(`Location with id ${id} not found`);

    return location;
  }
}
