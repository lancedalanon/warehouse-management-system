import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetUsersService } from '@/services/users/GetUsersService';
import { GetUserService } from '@/services/users/GetUserService';
import { CreateUserService } from '@/services/users/CreateUserService';
import { UpdateUserService } from '@/services/users/UpdateUserService';
import { DeleteUserService } from '@/services/users/DeleteUserService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(GetUsersService) private readonly getUsersService: GetUsersService,
    @inject(GetUserService) private readonly getUserService: GetUserService,
    @inject(CreateUserService)
    private readonly createUserService: CreateUserService,
    @inject(UpdateUserService)
    private readonly updateUserService: UpdateUserService,
    @inject(DeleteUserService)
    private readonly deleteUserService: DeleteUserService,
  ) {
    super();
    this.getUsers = this.getUsers.bind(this);
    this.getUser = this.getUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
  }

  async getUsers(req: Request, res: Response) {
    const result = await this.getUsersService.handle(req);

    ResponseHandler.success(
      res,
      'Users retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getUser(req: Request, res: Response) {
    const result = await this.getUserService.handle(Number(req.params.id));
    ResponseHandler.success(res, 'User retrieved successfully', result);
  }

  async createUser(req: Request, res: Response) {
    const result = await this.createUserService.handle(req.body, req.user);

    ResponseHandler.success(
      res,
      'User created successfully',
      result,
      null,
      201,
    );
  }

  async updateUser(req: Request, res: Response) {
    const result = await this.updateUserService.handle(
      Number(req.params.id),
      req.body,
      req.user,
    );
    ResponseHandler.success(res, 'User updated successfully', result);
  }

  async deleteUser(req: Request, res: Response) {
    await this.deleteUserService.handle(Number(req.params.id), req.user);

    ResponseHandler.success(res, 'User deleted successfully');
  }
}
