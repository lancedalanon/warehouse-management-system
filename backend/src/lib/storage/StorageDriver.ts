export interface StorageDriver {
  save(
    buffer: Buffer,
    relativePath: string,
  ): Promise<{
    path: string;
    size: number;
    url: string;
  }>;
}
