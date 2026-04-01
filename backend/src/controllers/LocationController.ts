import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetLocationsService } from '@/services/locations/GetLocationsService';
import { GetLocationService } from '@/services/locations/GetLocationService';
import { CreateLocationService } from '@/services/locations/CreateLocationService';
import { UpdateLocationService } from '@/services/locations/UpdateLocationService';
import { DeleteLocationService } from '@/services/locations/DeleteLocationService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class LocationController extends BaseController {
  constructor(
    @inject(GetLocationsService)
    private readonly getLocationsService: GetLocationsService,
    @inject(GetLocationService)
    private readonly getLocationService: GetLocationService,
    @inject(CreateLocationService)
    private readonly createLocationService: CreateLocationService,
    @inject(UpdateLocationService)
    private readonly updateLocationService: UpdateLocationService,
    @inject(DeleteLocationService)
    private readonly deleteLocationService: DeleteLocationService,
  ) {
    super();
    this.getLocations = this.getLocations.bind(this);
    this.getLocation = this.getLocation.bind(this);
    this.createLocation = this.createLocation.bind(this);
    this.updateLocation = this.updateLocation.bind(this);
    this.deleteLocation = this.deleteLocation.bind(this);
  }

  async getLocations(req: Request, res: Response) {
    const result = await this.getLocationsService.handle(req);
    ResponseHandler.success(
      res,
      'Locations retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getLocation(req: Request, res: Response) {
    const result = await this.getLocationService.handle(Number(req.params.id));
    ResponseHandler.success(res, 'Location retrieved successfully', result);
  }

  async createLocation(req: Request, res: Response) {
    const result = await this.createLocationService.handle(req.body, req.user);

    ResponseHandler.success(
      res,
      'Location created successfully',
      result,
      null,
      201,
    );
  }

  async updateLocation(req: Request, res: Response) {
    const result = await this.updateLocationService.handle(
      Number(req.params.id),
      req.body,
      req.user,
    );
    ResponseHandler.success(res, 'Location updated successfully', result);
  }

  async deleteLocation(req: Request, res: Response) {
    const result = await this.deleteLocationService.handle(
      Number(req.params.id),
      req.user,
    );
    ResponseHandler.success(res, 'Location deleted successfully', result);
  }
}
