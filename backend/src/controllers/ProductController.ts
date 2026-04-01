import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetProductsService } from '@/services/products/GetProductsService';
import { GetProductService } from '@/services/products/GetProductService';
import { CreateProductService } from '@/services/products/CreateProductService';
import { UpdateProductService } from '@/services/products/UpdateProductService';
import { DeleteProductService } from '@/services/products/DeleteProductService';
import { AddReceivedQuantityService } from '@/services/products/AddReceivedQuantityService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class ProductController extends BaseController {
  constructor(
    @inject(GetProductsService)
    private readonly getProductsService: GetProductsService,
    @inject(GetProductService)
    private readonly getProductService: GetProductService,
    @inject(CreateProductService)
    private readonly createProductService: CreateProductService,
    @inject(UpdateProductService)
    private readonly updateProductService: UpdateProductService,
    @inject(DeleteProductService)
    private readonly deleteProductService: DeleteProductService,
    @inject(AddReceivedQuantityService)
    private readonly addReceivedQuantityService: AddReceivedQuantityService,
  ) {
    super();
    this.getProducts = this.getProducts.bind(this);
    this.getProduct = this.getProduct.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.addReceivedQuantity = this.addReceivedQuantity.bind(this);
  }

  async getProducts(req: Request, res: Response) {
    const result = await this.getProductsService.handle(req);

    ResponseHandler.success(
      res,
      'Products retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getProduct(req: Request, res: Response) {
    const result = await this.getProductService.handle(Number(req.params.id));

    ResponseHandler.success(res, 'Product retrieved successfully', result);
  }

  async createProduct(req: Request, res: Response) {
    const result = await this.createProductService.handle(req.body, req.user);

    ResponseHandler.success(
      res,
      'Product created successfully',
      result,
      null,
      201,
    );
  }

  async updateProduct(req: Request, res: Response) {
    const result = await this.updateProductService.handle(
      Number(req.params.id),
      req.body,
      req.user,
    );

    ResponseHandler.success(res, 'Product updated successfully', result);
  }

  async deleteProduct(req: Request, res: Response) {
    await this.deleteProductService.handle(Number(req.params.id), req.user);

    ResponseHandler.success(res, 'Product deleted successfully');
  }

  async addReceivedQuantity(req: Request, res: Response) {
    const result = await this.addReceivedQuantityService.handle(
      Number(req.params.id),
      req.body,
      req.user,
    );

    ResponseHandler.success(res, 'Inventory received successfully', result);
  }
}
