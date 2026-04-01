import { BaseException } from './BaseException';

export class ValidationException extends BaseException {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, details);
  }
}
