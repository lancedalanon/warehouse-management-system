import { injectable } from 'tsyringe';
import { AppDataSource } from '@/data-source';
import { Request } from 'express';
import { DateRange } from '@/types/services/dashboard/dashboard.types';
import { getDateRangeBounds } from '@/utils/DateRangeHelper';
import { InventoryAging } from '@/types/services/dashboard/inventory-aging.types';

@injectable()
export class GetInventoryAgingService {
  async handle(req: Request): Promise<
    InventoryAging & {
      total: number;
      pct_0_7: number;
      pct_8_30: number;
      pct_31_90: number;
      pct_90_plus: number;
    }
  > {
    const dateRangeParam = (req.query as { dateRange?: string }).dateRange;

    const dateRange: DateRange = [
      'today',
      'weekly',
      'monthly',
      'yearly',
    ].includes(dateRangeParam || '')
      ? (dateRangeParam as DateRange)
      : 'weekly';

    const { endDate } = getDateRangeBounds(dateRange);

    const rows = await AppDataSource.query(
      `
      SELECT
        SUM(CASE WHEN m.created_at >= $1::timestamp - INTERVAL '7 days' THEN m.quantity ELSE 0 END) AS "days_0_7",
        SUM(CASE WHEN m.created_at BETWEEN $1::timestamp - INTERVAL '30 days' AND $1::timestamp - INTERVAL '7 days' THEN m.quantity ELSE 0 END) AS "days_8_30",
        SUM(CASE WHEN m.created_at BETWEEN $1::timestamp - INTERVAL '90 days' AND $1::timestamp - INTERVAL '30 days' THEN m.quantity ELSE 0 END) AS "days_31_90",
        SUM(CASE WHEN m.created_at < $1::timestamp - INTERVAL '90 days' THEN m.quantity ELSE 0 END) AS "days_90_plus"
      FROM inventory_movements m

      -- Join inventory
      LEFT JOIN inventories inv
        ON inv.id = m.inventory_id
        AND inv.deleted_at IS NULL

      -- Join products
      LEFT JOIN products p
        ON p.id = m.product_id
        AND p.deleted_at IS NULL

      -- Join locations
      LEFT JOIN locations fl
        ON fl.id = m.from_location_id
        AND fl.deleted_at IS NULL

      LEFT JOIN locations tl
        ON tl.id = m.to_location_id
        AND tl.deleted_at IS NULL

      WHERE LOWER(m.to_state) IN ('received', 'stored')
        AND m.deleted_at IS NULL
        AND (
          -- RECEIVED: product must exist
          (LOWER(m.to_state) = 'received' AND p.id IS NOT NULL)

          -- STORED: inventory and to_location must exist
          OR (LOWER(m.to_state) = 'stored' AND inv.id IS NOT NULL AND tl.id IS NOT NULL)
        )
    `,
      [endDate],
    );

    const days_0_7 = Number(rows[0].days_0_7 || 0);
    const days_8_30 = Number(rows[0].days_8_30 || 0);
    const days_31_90 = Number(rows[0].days_31_90 || 0);
    const days_90_plus = Number(rows[0].days_90_plus || 0);

    const total = days_0_7 + days_8_30 + days_31_90 + days_90_plus;

    return {
      days_0_7,
      days_8_30,
      days_31_90,
      days_90_plus,
      total,
      pct_0_7: total ? (days_0_7 / total) * 100 : 0,
      pct_8_30: total ? (days_8_30 / total) * 100 : 0,
      pct_31_90: total ? (days_31_90 / total) * 100 : 0,
      pct_90_plus: total ? (days_90_plus / total) * 100 : 0,
    };
  }
}
