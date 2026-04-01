import { FileStorageHandler } from '../FileStorageHandler';
import { LocalStorageDriver } from '@/lib/storage/LocalStorageDriver';

// Mock the LocalStorageDriver so we don't actually touch the filesystem
jest.mock('@/lib/storage/LocalStorageDriver');

describe('FileStorageHandler', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('Driver Factory (Branch Coverage)', () => {
    it('should default to local storage when FILE_STORAGE is not set', async () => {
      delete process.env.FILE_STORAGE;
      const buffer = Buffer.from('test');
      
      await FileStorageHandler.save(buffer, 'test.txt');
      
      // Verify LocalStorageDriver was instantiated and its save method called
      expect(LocalStorageDriver).toHaveBeenCalled();
    });

    it('should throw error for "s3" mode (Not yet implemented)', async () => {
      process.env.FILE_STORAGE = 's3';
      const buffer = Buffer.from('test');
      
      await expect(FileStorageHandler.save(buffer, 'path'))
        .rejects.toThrow('S3 driver not yet implemented');
    });

    it('should throw error for "gcs" mode (Not yet implemented)', async () => {
      process.env.FILE_STORAGE = 'gcs';
      const buffer = Buffer.from('test');
      
      await expect(FileStorageHandler.save(buffer, 'path'))
        .rejects.toThrow('GCS driver not yet implemented');
    });

    it('should throw error for "azure" mode (Not yet implemented)', async () => {
      process.env.FILE_STORAGE = 'azure';
      const buffer = Buffer.from('test');
      
      await expect(FileStorageHandler.save(buffer, 'path'))
        .rejects.toThrow('Azure driver not yet implemented');
    });

    it('should throw error for an unsupported mode', async () => {
      process.env.FILE_STORAGE = 'cloudinary'; // Example of unsupported mode
      const buffer = Buffer.from('test');
      
      await expect(FileStorageHandler.save(buffer, 'path'))
        .rejects.toThrow('Unsupported FILE_STORAGE: cloudinary');
    });
  });

  describe('save() Delegation', () => {
    it('should call the save method of the selected driver', async () => {
      process.env.FILE_STORAGE = 'local';
      const mockSave = jest.fn().mockResolvedValue({ url: 'http://localhost/file.txt' });
      
      // Setup the mock instance
      (LocalStorageDriver as jest.Mock).mockImplementation(() => ({
        save: mockSave
      }));

      const buffer = Buffer.from('hello');
      const result = await FileStorageHandler.save(buffer, 'hello.txt');

      expect(mockSave).toHaveBeenCalledWith(buffer, 'hello.txt');
      expect(result.url).toBe('http://localhost/file.txt');
    });
  });
});