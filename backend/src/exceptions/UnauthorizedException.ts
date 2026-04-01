import { BaseException } from './BaseException';

export class UnauthorizedException extends BaseException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
