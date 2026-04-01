import { Response } from 'express';
import { ResponseHandler, ErrorCode } from '../ResponseHandler';

// Mock uuid to have a predictable ID in tests
jest.mock('uuid', () => ({ v4: () => 'mocked-uuid-123' }));

describe('ResponseHandler', () => {
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      locals: {}, // Starting with empty locals
    };
    
    // Freeze time for consistent timestamps
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('success()', () => {
    it('should return a 200 success response with custom requestId from locals', () => {
      mockResponse.locals = { req: { requestId: 'custom-id' } };
      
      ResponseHandler.success(mockResponse as Response, 'Great success', { id: 1 });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        status: 'SUCCESS',
        message: 'Great success',
        data: { id: 1 },
        meta: null,
        error: null,
        requestId: 'custom-id',
        timestamp: '2026-01-01T00:00:00.000Z',
      });
    });

    it('should generate a uuid if requestId is missing in locals (Branch Coverage)', () => {
      // res.locals is empty, so it should use the mocked uuidv4()
      ResponseHandler.success(mockResponse as Response, 'Generated ID');

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        requestId: 'mocked-uuid-123'
      }));
    });
  });

  describe('Error static methods', () => {
    // We can test one thoroughly and the rest briefly to ensure they map correctly
    it('should handle internalError correctly', () => {
      ResponseHandler.internalError(mockResponse as Response, 'Server boom', { detail: 'stack trace' });

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        status: ErrorCode.INTERNAL_ERROR,
        message: 'Server boom',
        error: { detail: 'stack trace' }
      }));
    });

    it('should handle notFound correctly', () => {
      ResponseHandler.notFound(mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: ErrorCode.NOT_FOUND }));
    });

    it('should handle badRequest correctly', () => {
      ResponseHandler.badRequest(mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: ErrorCode.BAD_REQUEST }));
    });

    it('should handle validationError correctly', () => {
      ResponseHandler.validationError(mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: ErrorCode.VALIDATION_ERROR }));
    });

    it('should handle unauthorized correctly', () => {
      ResponseHandler.unauthorized(mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: ErrorCode.UNAUTHORIZED }));
    });

    it('should handle forbidden correctly', () => {
      ResponseHandler.forbidden(mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: ErrorCode.FORBIDDEN }));
    });

    it('should handle conflict correctly', () => {
      ResponseHandler.conflict(mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: ErrorCode.CONFLICT }));
    });
  });
});