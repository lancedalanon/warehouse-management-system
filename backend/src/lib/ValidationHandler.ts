import { ValidationException } from '@/exceptions/ValidationException';

type FieldError = { field: string; message: string };

export class ValidationHandler {
  /**
   * Throws a field-aware validation exception
   * @param errors array of field errors to throw
   */
  constructor(errors: FieldError[] | FieldError) {
    // normalize single object into array
    const normalizedErrors = Array.isArray(errors) ? errors : [errors];

    throw new ValidationException('Validation failed', normalizedErrors);
  }
}
