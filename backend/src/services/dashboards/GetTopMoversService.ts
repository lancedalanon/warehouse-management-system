import { injectable } from 'tsyringe';
import { AppDataSource } from '@/data-source';
import { getDateRangeBounds } from '@/utils/DateRangeHelper';
import { TopMover } from '@/types/services/dashboard/top-mover.types';
import { DateRange } from '@/types/services/dashboard/dashboard.types';
import { Request } from 'express';

@injectable()
export class GetTopMoversService {
  async handle(req: Request): Promise<TopMover[]> {
    const dateRangeParam = (req.query as { dateRange?: string }).dateRange;

    const dateRange: DateRange =
      dateRangeParam === 'today' ||
      dateRangeParam === 'weekly' ||
      dateRangeParam === 'monthly' ||
      dateRangeParam === 'yearly'
        ? dateRangeParam
        : 'weekly';

    // Get start/end dates
    const { startDate, endDate } = getDateRangeBounds(dateRange);

    // Run query
    const rows: Array<{
      id: number;
      name: string;
      sku: string;
      inbound: string;
      outbound: string;
      activity: string;
    }> = await AppDataSource.query(
      `
        SELECT
          p.id,
          p.name,
          p.sku,

          -- Inbound: to_state IN ('received', 'stored', 'reserved', 'transferred')
          COALESCE(SUM(CASE
            WHEN m.to_state IN ('received', 'stored', 'reserved', 'transferred')
            THEN m.quantity
            ELSE 0
          END), 0) AS inbound,

          -- Outbound: to_state IN ('shipped', 'written-off')
          COALESCE(SUM(CASE
            WHEN m.to_state IN ('shipped', 'written-off')
            THEN m.quantity
            ELSE 0
          END), 0) AS outbound,

          -- Activity: total of all movements regardless of state
          COALESCE(SUM(m.quantity), 0) AS activity

        FROM inventory_movements m

          -- Join inventory (for resolving product via inventory path)
          LEFT JOIN inventories inv
            ON inv.id = m.inventory_id
            AND inv.deleted_at IS NULL

          -- Join product: prefer direct product_id on movement, fall back to inventory's product_id
          LEFT JOIN products p
            ON p.id = COALESCE(m.product_id, inv.product_id)
            AND p.deleted_at IS NULL

          LEFT JOIN locations fl
            ON fl.id = m.from_location_id

          LEFT JOIN locations tl
            ON tl.id = m.to_location_id
            AND tl.deleted_at IS NULL

        WHERE m.created_at BETWEEN $1 AND $2
          AND m.deleted_at IS NULL
          AND p.id IS NOT NULL  -- exclude movements where product cannot be resolved from either path

        GROUP BY
          p.id,
          p.name,
          p.sku

        ORDER BY activity DESC
      `,
      [startDate, endDate],
    );

    // Map to TopMover
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      inbound: Number(row.inbound),
      outbound: Number(row.outbound),
      activity: Number(row.activity),
      net: Number(row.inbound) - Number(row.outbound),
      netPositive: Number(row.inbound) - Number(row.outbound) > 0,
      netNegative: Number(row.inbound) - Number(row.outbound) < 0,
      netZero: Number(row.inbound) - Number(row.outbound) === 0,
      activityHigh: Number(row.activity) > 100,
      activityMedium: Number(row.activity) > 50 && Number(row.activity) <= 100,
      activityLow: Number(row.activity) <= 50,
    }));
  }
}
