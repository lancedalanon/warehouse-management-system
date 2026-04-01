import { BaseException } from './BaseException';

export class BadRequestException extends BaseException {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}
