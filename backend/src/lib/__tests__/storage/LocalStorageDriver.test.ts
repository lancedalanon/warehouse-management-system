import { LocalStorageDriver } from '@/lib/storage/LocalStorageDriver';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('LocalStorageDriver', () => {
  const mockedFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create directories and save the file', async () => {
    process.env.FILE_PUBLIC_URL = '/storage';
    mockedFs.existsSync.mockReturnValue(false);

    const driver = new LocalStorageDriver();
    const buffer = Buffer.from('test-content');
    const relativePath = 'uploads/file.txt';

    const result = await driver.save(buffer, relativePath);

    const expectedBase = path.join(process.cwd(), 'storage');
    const expectedFullPath = path.join(expectedBase, relativePath);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expectedBase, {
      recursive: true,
    });

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
      path.dirname(expectedFullPath),
      { recursive: true }
    );

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expectedFullPath,
      buffer
    );

    expect(result).toEqual({
      path: expectedFullPath,
      size: buffer.length,
      url: `/storage/${relativePath}`,
    });
  });

  it('should not recreate directories if they exist', async () => {
    process.env.FILE_PUBLIC_URL = '/storage';
    mockedFs.existsSync.mockReturnValue(true);

    const driver = new LocalStorageDriver();
    const buffer = Buffer.from('data');
    const relativePath = 'files/test.txt';

    await driver.save(buffer, relativePath);

    expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });

  it('should normalize URL when publicUrl has trailing slash and relativePath has leading slash', async () => {
    process.env.FILE_PUBLIC_URL = '/storage/';
    mockedFs.existsSync.mockReturnValue(false);

    const driver = new LocalStorageDriver();
    const buffer = Buffer.from('file');
    const relativePath = '/uploads/image.png';

    const result = await driver.save(buffer, relativePath);

    const expectedBase = path.join(process.cwd(), 'storage');
    const expectedFullPath = path.join(expectedBase, relativePath);

    expect(result.url).toBe('/storage/uploads/image.png');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      expectedFullPath,
      buffer
    );
  });
});