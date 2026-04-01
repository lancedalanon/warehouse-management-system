import { BaseException } from './BaseException';

export class ConflictException extends BaseException {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
