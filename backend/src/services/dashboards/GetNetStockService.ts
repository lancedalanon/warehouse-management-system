import { injectable } from 'tsyringe';
import { AppDataSource } from '@/data-source';
import { BaseService } from '@/services/BaseService';
import { Request } from 'express';
import { DateRange } from '@/types/services/dashboard/dashboard.types';
import { getDateRangeBounds } from '@/utils/DateRangeHelper';

@injectable()
export class GetNetStockService implements BaseService {
  async handle(req: Request) {
    const raw = (req.query as { dateRange?: string }).dateRange;
    const dateRange: DateRange =
      raw === 'today' ||
      raw === 'weekly' ||
      raw === 'monthly' ||
      raw === 'yearly'
        ? raw
        : 'weekly';

    const { startDate, endDate } = getDateRangeBounds(dateRange);

    const result = await AppDataSource.query(
      `
      SELECT
        SUM(CASE
          WHEN LOWER(m.to_state) IN ('received')
              AND (
                LOWER(m.to_state) = 'received' AND p.id IS NOT NULL
              )
          THEN m.quantity
          ELSE 0
        END) AS inbound,

        SUM(CASE
          WHEN LOWER(m.to_state) IN ('shipped', 'written-off')
              AND inv.id IS NOT NULL AND fl.id IS NOT NULL
          THEN m.quantity
          ELSE 0
        END) AS outbound

      FROM inventory_movements m

      -- Join inventory
      LEFT JOIN inventories inv
        ON inv.id = m.inventory_id
        AND inv.deleted_at IS NULL

      -- Join product
      LEFT JOIN products p
        ON (
            (inv.id IS NOT NULL AND p.id = inv.product_id)
            OR
            (inv.id IS NULL AND p.id = m.product_id)
          )
        AND p.deleted_at IS NULL

      -- Join locations
      LEFT JOIN locations fl
        ON fl.id = m.from_location_id
        AND fl.deleted_at IS NULL

      LEFT JOIN locations tl
        ON tl.id = m.to_location_id
        AND tl.deleted_at IS NULL

      WHERE m.created_at BETWEEN $1 AND $2
        AND m.deleted_at IS NULL
    `,
      [startDate, endDate],
    );

    const inbound = Number(result[0]?.inbound || 0);
    const outbound = Number(result[0]?.outbound || 0);

    return {
      inbound,
      outbound,
      netStock: inbound - outbound,
    };
  }
}
