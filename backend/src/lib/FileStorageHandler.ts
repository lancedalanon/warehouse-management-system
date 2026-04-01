import { LocalStorageDriver } from '@/lib/storage/LocalStorageDriver';
import { StorageDriver } from './storage/StorageDriver';

/**
 * FileStorageHandler is a unified interface for saving files
 * to different storage backends (local filesystem, S3, GCP, Azure, etc.).
 *
 * By default, it uses the "local" storage driver which saves files
 * inside the `storage/` folder of your project.
 *
 * To use other drivers (AWS S3, GCP, Azure), set `process.env.FILE_STORAGE`
 * to `s3`, `gcs`, or `azure` respectively, and provide the required credentials.
 *
 * Example environment variable for local storage (default):
 * ```
 * FILE_STORAGE=local
 * ```
 *
 * Example environment variables for S3 storage:
 * ```
 * FILE_STORAGE=s3
 * AWS_ACCESS_KEY_ID=<your_access_key>
 * AWS_SECRET_ACCESS_KEY=<your_secret_key>
 * AWS_DEFAULT_REGION=us-east-1
 * AWS_BUCKET=<bucket_name>
 * FILE_PUBLIC_URL=https://<bucket_url>
 * ```
 *
 * Usage:
 * ```ts
 * import { FileStorageHandler } from '@/lib/storage/FileStorageHandler';
 * import fs from 'fs';
 *
 * const buffer = fs.readFileSync('report.pdf');
 * const saved = await FileStorageHandler.save(buffer, 'reports/warehouse-weekly.pdf');
 * console.log(saved.url); // Accessible URL of the file
 * ```
 */
export class FileStorageHandler {
  /**
   * Returns the appropriate StorageDriver instance based on the current FILE_STORAGE mode.
   * Supports: 'local', 's3', 'gcs', 'azure'.
   *
   * @throws {Error} If the FILE_STORAGE mode is not supported or not implemented
   */
  private static driver(): StorageDriver {
    const mode = process.env.FILE_STORAGE || 'local';

    switch (mode) {
      case 'local':
        return new LocalStorageDriver();

      case 's3':
        throw new Error('S3 driver not yet implemented');

      case 'gcs':
        throw new Error('GCS driver not yet implemented');

      case 'azure':
        throw new Error('Azure driver not yet implemented');

      default:
        throw new Error(`Unsupported FILE_STORAGE: ${mode}`);
    }
  }

  /**
   * Saves a file buffer to the selected storage backend.
   *
   * @param buffer - The file content as a Buffer
   * @param path - The relative path where the file will be stored
   *               Example: 'reports/warehouse-weekly.pdf'
   * @returns Promise resolving to an object containing:
   *   - path: Full path on the storage backend
   *   - size: Size of the file in bytes
   *   - url: Publicly accessible URL to the file (if supported)
   */
  static async save(buffer: Buffer, path: string) {
    return this.driver().save(buffer, path);
  }
}
