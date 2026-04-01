import { PaginationHelper } from '../PaginationHelper';

describe('PaginationHelper', () => {
  const mockData = [{ id: 1 }, { id: 2 }];

  describe('Constructor and Guard Logic', () => {
    it('should use default values for page and limit', () => {
      const helper = new PaginationHelper(mockData, 20);
      const { meta } = helper.getResult();

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
    });

    it('should prevent page and limit from being less than 1 (Math.max)', () => {
      const helper = new PaginationHelper(mockData, 20, 0, -5);
      const { meta } = helper.getResult();

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(1);
    });
  });

  describe('Pagination Calculation Logic', () => {
    it('should correctly calculate middle page state (hasPrev and hasNext)', () => {
      // Total 30, limit 10 = 3 pages. We are on page 2.
      const helper = new PaginationHelper(mockData, 30, 2, 10);
      const { meta } = helper.getResult();

      expect(meta.totalPages).toBe(3);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);
      expect(meta.nextPage).toBe(3);
      expect(meta.prevPage).toBe(1);
      expect(meta.offset).toBe(10);
    });

    it('should handle the first page (no prevPage)', () => {
      const helper = new PaginationHelper(mockData, 30, 1, 10);
      const { meta } = helper.getResult();

      expect(meta.hasPrevPage).toBe(false);
      expect(meta.prevPage).toBeNull();
      expect(meta.hasNextPage).toBe(true);
      expect(meta.nextPage).toBe(2);
    });

    it('should handle the last page (no nextPage)', () => {
      const helper = new PaginationHelper(mockData, 30, 3, 10);
      const { meta } = helper.getResult();

      expect(meta.hasNextPage).toBe(false);
      expect(meta.nextPage).toBeNull();
      expect(meta.hasPrevPage).toBe(true);
      expect(meta.prevPage).toBe(2);
    });

    it('should cap currentPage at totalPages (Math.min)', () => {
      // Asking for page 10 when only 2 pages exist
      const helper = new PaginationHelper(mockData, 20, 10, 10);
      const { meta } = helper.getResult();

      expect(meta.page).toBe(2);
      expect(meta.totalPages).toBe(2);
      expect(meta.hasNextPage).toBe(false);
    });

    it('should ensure totalPages is at least 1 even if totalCount is 0', () => {
      const helper = new PaginationHelper([], 0, 1, 10);
      const { meta } = helper.getResult();

      expect(meta.totalPages).toBe(1);
      expect(meta.page).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should return the original data array', () => {
      const helper = new PaginationHelper(mockData, 2);
      const result = helper.getResult();
      expect(result.data).toEqual(mockData);
    });
  });
});
