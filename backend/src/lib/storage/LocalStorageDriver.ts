import fs from 'fs';
import path from 'path';
import { StorageDriver } from './StorageDriver';

export class LocalStorageDriver implements StorageDriver {
  private basePath = path.join(process.cwd(), 'storage');
  private publicUrl = process.env.FILE_PUBLIC_URL || '/storage';

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async save(buffer: Buffer, relativePath: string) {
    this.ensureDir(this.basePath);

    const fullPath = path.join(this.basePath, relativePath);
    this.ensureDir(path.dirname(fullPath));

    fs.writeFileSync(fullPath, buffer);

    return {
      path: fullPath,
      size: buffer.length,
      url: `${this.publicUrl.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`,
    };
  }
}
