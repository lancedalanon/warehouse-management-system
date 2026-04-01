import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetInventoriesService } from '@/services/inventories/GetInventoriesService';
import { GetInventoryService } from '@/services/inventories/GetInventoryService';
import { CreateInventoryService } from '@/services/inventories/CreateInventoryService';
import { UpdateInventoryService } from '@/services/inventories/UpdateInventoryService';
import { DeleteInventoryService } from '@/services/inventories/DeleteInventoryService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class InventoryController extends BaseController {
  constructor(
    @inject(GetInventoriesService)
    private readonly getInventoriesService: GetInventoriesService,
    @inject(GetInventoryService)
    private readonly getInventoryService: GetInventoryService,
    @inject(CreateInventoryService)
    private readonly createInventoryService: CreateInventoryService,
    @inject(UpdateInventoryService)
    private readonly updateInventoryService: UpdateInventoryService,
    @inject(DeleteInventoryService)
    private readonly deleteInventoryService: DeleteInventoryService,
  ) {
    super();
    this.getInventories = this.getInventories.bind(this);
    this.getInventory = this.getInventory.bind(this);
    this.createInventory = this.createInventory.bind(this);
    this.updateInventory = this.updateInventory.bind(this);
    this.deleteInventory = this.deleteInventory.bind(this);
  }

  async getInventories(req: Request, res: Response) {
    const result = await this.getInventoriesService.handle(req);
    ResponseHandler.success(
      res,
      'Inventories retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getInventory(req: Request, res: Response) {
    const result = await this.getInventoryService.handle(Number(req.params.id));
    ResponseHandler.success(res, 'Inventory retrieved successfully', result);
  }

  async createInventory(req: Request, res: Response) {
    const result = await this.createInventoryService.handle(req.body, req.user);

    ResponseHandler.success(
      res,
      'Inventory created successfully',
      result,
      null,
      201,
    );
  }

  async updateInventory(req: Request, res: Response) {
    const result = await this.updateInventoryService.handle(
      Number(req.params.id),
      req.body,
      req.user,
    );
    ResponseHandler.success(res, 'Inventory updated successfully', result);
  }

  async deleteInventory(req: Request, res: Response) {
    const result = await this.deleteInventoryService.handle(
      Number(req.params.id),
      req.user,
    );
    ResponseHandler.success(res, 'Inventory deleted successfully', result);
  }
}
