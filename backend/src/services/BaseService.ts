export interface BaseService {
  handle(...args: readonly unknown[]): Promise<unknown>;
}
