import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFLICT = 'CONFLICT',
}

interface ResponseMeta {
  [key: string]: unknown;
}

export class ResponseHandler {
  static success(
    res: Response,
    message: string,
    data: unknown = null,
    meta: ResponseMeta | null = null,
    statusCode: number = 200,
  ) {
    const requestId = res?.locals?.req?.requestId ?? uuidv4();

    res.status(statusCode).json({
      success: true,
      status: 'SUCCESS',
      message,
      data,
      meta,
      error: null,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res: Response,
    message: string,
    error: unknown = null,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
  ) {
    const requestId = res?.locals?.req?.requestId ?? uuidv4();

    res.status(statusCode).json({
      success: false,
      status: code,
      message,
      data: null,
      meta: null,
      error,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  static notFound(
    res: Response,
    message = 'Resource not found',
    error: unknown = null,
  ) {
    this.error(res, message, error, ErrorCode.NOT_FOUND, 404);
  }

  static badRequest(
    res: Response,
    message = 'Bad request',
    error: unknown = null,
  ) {
    this.error(res, message, error, ErrorCode.BAD_REQUEST, 400);
  }

  static validationError(
    res: Response,
    message = 'Validation failed',
    error: unknown = null,
  ) {
    this.error(res, message, error, ErrorCode.VALIDATION_ERROR, 422);
  }

  static unauthorized(
    res: Response,
    message = 'Unauthorized',
    error: unknown = null,
  ) {
    this.error(res, message, error, ErrorCode.UNAUTHORIZED, 401);
  }

  static forbidden(
    res: Response,
    message = 'Forbidden',
    error: unknown = null,
  ) {
    this.error(res, message, error, ErrorCode.FORBIDDEN, 403);
  }

  static conflict(res: Response, message = 'Conflict', error: unknown = null) {
    this.error(res, message, error, ErrorCode.CONFLICT, 409);
  }

  static internalError(
    res: Response,
    message = 'Internal server error',
    error: unknown = null,
  ) {
    this.error(res, message, error, ErrorCode.INTERNAL_ERROR, 500);
  }
}
