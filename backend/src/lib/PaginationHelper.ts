export class PaginationHelper<T> {
  private page: number;
  private limit: number;
  private totalCount: number;
  private data: T[];

  constructor(
    data: T[],
    totalCount: number,
    page: number = 1,
    limit: number = 10,
  ) {
    this.data = data;
    this.totalCount = totalCount;
    this.page = Math.max(1, page);
    this.limit = Math.max(1, limit);
  }

  private buildMeta() {
    const totalPages = Math.max(1, Math.ceil(this.totalCount / this.limit));
    const currentPage = Math.min(this.page, totalPages);
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    return {
      page: currentPage,
      limit: this.limit,
      totalCount: this.totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? currentPage + 1 : null,
      prevPage: hasPrevPage ? currentPage - 1 : null,
      offset: (currentPage - 1) * this.limit,
    };
  }

  public getResult() {
    return {
      data: this.data,
      meta: this.buildMeta(),
    };
  }
}
