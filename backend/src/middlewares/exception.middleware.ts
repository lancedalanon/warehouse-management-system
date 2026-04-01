import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { QueryFailedError } from 'typeorm';
import { BaseException } from '@/exceptions/BaseException';
import { ValidationException } from '@/exceptions/ValidationException';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { ForbiddenException } from '@/exceptions/ForbiddenException';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import { ZodError, ZodIssue } from 'zod';
import { NotFoundException } from '@/exceptions/NotFoundException';

export function globalExceptionHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    const details = err.issues.map((e: ZodIssue) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return ResponseHandler.validationError(res, 'Validation failed', details);
  }

  if (err instanceof BaseException) {
    if (err instanceof ValidationException)
      return ResponseHandler.validationError(res, err.message, err.details);
    if (err instanceof UnauthorizedException)
      return ResponseHandler.unauthorized(res, err.message, err);
    if (err instanceof ForbiddenException)
      return ResponseHandler.forbidden(res, err.message, err);
    if (err instanceof NotFoundException)
      return ResponseHandler.notFound(res, err.message, err);
    if (err instanceof ConflictException)
      return ResponseHandler.conflict(res, err.message, err);
    if (err instanceof BadRequestException)
      return ResponseHandler.badRequest(res, err.message, err);

    // Fallback BaseException
    return ResponseHandler.internalError(res, err.message, err);
  }

  // TypeORM QueryFailedError
  if (err instanceof QueryFailedError) {
    return ResponseHandler.badRequest(res, 'Database query failed', err);
  }

  // Unknown errors 500
  return ResponseHandler.internalError(
    res,
    'Internal server error',
    err instanceof Error ? err.message : err,
  );
}
