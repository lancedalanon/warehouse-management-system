import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetInventoryMovementsService } from '@/services/inventory-movements/GetInventoryMovementsService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class InventoryMovementController extends BaseController {
  constructor(
    @inject(GetInventoryMovementsService)
    private readonly getInventoryMovementsService: GetInventoryMovementsService,
  ) {
    super();
    this.getInventoryMovements = this.getInventoryMovements.bind(this);
  }

  async getInventoryMovements(req: Request, res: Response) {
    const result = await this.getInventoryMovementsService.handle(req);

    ResponseHandler.success(
      res,
      'Inventory movements retrieved successfully',
      result.data,
      result.meta,
    );
  }
}
