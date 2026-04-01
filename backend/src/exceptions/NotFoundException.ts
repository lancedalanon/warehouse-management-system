import { BaseException } from './BaseException';

export class NotFoundException extends BaseException {
  constructor(message: string, details?: unknown) {
    super(message, 404, details);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
