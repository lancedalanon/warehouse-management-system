import { injectable } from 'tsyringe';
import { AppDataSource } from '@/data-source';
import { Request } from 'express';
import { DateRange } from '@/types/services/dashboard/dashboard.types';
import { getDateRangeBounds } from '@/utils/DateRangeHelper';
import { StockVelocity } from '@/types/services/dashboard/stock-velocity.types';

@injectable()
export class GetStockVelocityService {
  async handle(req: Request): Promise<StockVelocity> {
    const raw = (req.query as { dateRange?: string }).dateRange;
    const dateRange: DateRange =
      raw === 'today' ||
      raw === 'weekly' ||
      raw === 'monthly' ||
      raw === 'yearly'
        ? raw
        : 'weekly';

    const { startDate, endDate } = getDateRangeBounds(dateRange);

    const msPerDay = 1000 * 60 * 60 * 24;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize both to midnight so we count calendar days, not hours
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // +1 because date ranges are inclusive
    const days = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1,
    );

    const result = await AppDataSource.query(
      `
        SELECT
          SUM(CASE
            WHEN LOWER(m.to_state) IN ('received', 'stored')
                AND (
                  (LOWER(m.to_state) = 'received' AND p.id IS NOT NULL)
                  OR (LOWER(m.to_state) = 'stored' AND inv.id IS NOT NULL AND tl.id IS NOT NULL)
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

    const inbound = Number(result[0].inbound || 0);
    const outbound = Number(result[0].outbound || 0);

    const avgInboundPerDayRounded = Math.round((inbound / days) * 100) / 100;
    const avgOutboundPerDayRounded = Math.round((outbound / days) * 100) / 100;

    return {
      avgInboundPerDay: avgInboundPerDayRounded,
      avgOutboundPerDay: avgOutboundPerDayRounded,
      stockGrowth: inbound - outbound,
    };
  }
}
