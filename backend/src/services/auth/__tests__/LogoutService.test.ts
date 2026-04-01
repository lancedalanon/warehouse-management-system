import 'reflect-metadata';
import { Repository } from 'typeorm';
import { RefreshToken } from '@/entities/RefreshToken';
import { LogoutService } from '../LogoutService';
import { RefreshTokenManager } from '@/lib/RefreshTokenManager';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { container } from 'tsyringe';

jest.mock('@/lib/RefreshTokenManager');

describe('LogoutService', () => {
  let refreshTokenRepo: Partial<Repository<RefreshToken>>;
  let service: LogoutService;

  const mockRefreshToken = {
    id: 1,
    userId: 1,
    tokenHash: 'hashed-refresh-token',
    isRevoked: false,
    revokedAt: null,
  } as RefreshToken;

  beforeEach(() => {
    refreshTokenRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    // Register the mock repo in the container
    container.registerInstance('RefreshTokenRepository', refreshTokenRepo);

    // Resolve service from container
    service = container.resolve(LogoutService);

    jest.clearAllMocks();
  });

  it('should throw NotFoundException if refresh token is missing', async () => {
    await expect(service.handle('')).rejects.toThrow(NotFoundException);
    await expect(service.handle('')).rejects.toThrow('Refresh token not provided');
  });

  it('should return message if refresh token does not exist', async () => {
    (RefreshTokenManager.fingerprint as jest.Mock).mockReturnValue('hashed-refresh-token');
    (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.handle('some-token');

    expect(RefreshTokenManager.fingerprint).toHaveBeenCalledWith('some-token');
    expect(refreshTokenRepo.findOne).toHaveBeenCalledWith({
      where: { tokenHash: 'hashed-refresh-token', isRevoked: false },
    });
    expect(result).toEqual({ message: 'No refresh token provided' });
  });

  it('should revoke refresh token successfully', async () => {
    (RefreshTokenManager.fingerprint as jest.Mock).mockReturnValue('hashed-refresh-token');
    (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(mockRefreshToken);
    (refreshTokenRepo.save as jest.Mock).mockResolvedValue({ ...mockRefreshToken, isRevoked: true });

    const result = await service.handle('some-token');

    expect(RefreshTokenManager.fingerprint).toHaveBeenCalledWith('some-token');
    expect(refreshTokenRepo.findOne).toHaveBeenCalledWith({
      where: { tokenHash: 'hashed-refresh-token', isRevoked: false },
    });
    expect(refreshTokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ ...mockRefreshToken, isRevoked: true })
    );
    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});