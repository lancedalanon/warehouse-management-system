import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetRolesService } from '@/services/roles/GetRolesService';
import { GetRoleService } from '@/services/roles/GetRoleService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class RoleController extends BaseController {
  constructor(
    @inject(GetRolesService)
    private readonly getRolesService: GetRolesService,
    @inject(GetRoleService)
    private readonly getRoleService: GetRoleService,
  ) {
    super();
    this.getRoles = this.getRoles.bind(this);
    this.getRole = this.getRole.bind(this);
  }

  async getRoles(req: Request, res: Response) {
    const result = await this.getRolesService.handle(req);

    ResponseHandler.success(
      res,
      'Roles retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getRole(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await this.getRoleService.handle(id);

    ResponseHandler.success(res, 'Role retrieved successfully', result);
  }
}
