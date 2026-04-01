import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { Request } from 'express';
import {
  DashboardData,
  DateRange,
  RawMovementRow,
  RecentMovement,
} from '@/types/services/dashboard/dashboard.types';
import { InventoryStatuses } from '@/enums/InventoryStatus';
import { Repository } from 'typeorm';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { getDateRangeBounds } from '@/utils/DateRangeHelper';

const RANGE_SQL = {
  today: { part: 'day', interval: '1 day', format: 'YYYY-MM-DD' },
  weekly: { part: 'day', interval: '1 day', format: 'YYYY-MM-DD' },
  monthly: { part: 'week', interval: '1 week', format: '"Week "WW, Mon' },
  yearly: { part: 'month', interval: '1 month', format: 'Mon YYYY' },
} as const;

@injectable()
export class GetDashboardDataService implements BaseService {
  constructor(
    @inject('InventoryMovementRepository')
    private readonly inventoryMovementRepo: Repository<InventoryMovement>
  ) {}

  async handle(req: Request): Promise<DashboardData> {
    const raw = (req.query as { dateRange?: string }).dateRange;

    const dateRange: DateRange =
      raw === 'today' ||
      raw === 'weekly' ||
      raw === 'monthly' ||
      raw === 'yearly'
        ? raw
        : 'weekly';

    const { startDate, endDate } = getDateRangeBounds(dateRange);

    const inventoryStatuses = await this.getInventoryMovementStats(
      this.inventoryMovementRepo,
      startDate,
      endDate,
    );
    const recentMovements = await this.getRecentMovements(
      this.inventoryMovementRepo,
      startDate,
      dateRange,
    );

    return { inventoryStatuses, recentMovements };
  }

  private async getInventoryMovementStats(
    movementRepo: Repository<InventoryMovement>,
    startDate: Date,
    endDate: Date = new Date(),
  ) {
    const query = `
      SELECT
          LOWER(m.to_state) AS type,
          COUNT(m.id) AS frequency
      FROM inventory_movements m

      LEFT JOIN inventories inv
          ON inv.id = m.inventory_id
          AND inv.deleted_at IS NULL

      LEFT JOIN products p
        ON (
            (inv.id IS NOT NULL AND p.id = inv.product_id)
            OR
            (inv.id IS NULL AND p.id = m.product_id)
          )
        AND p.deleted_at IS NULL

      LEFT JOIN locations fl
          ON fl.id = m.from_location_id

      LEFT JOIN locations tl
          ON tl.id = m.to_location_id
          AND tl.deleted_at IS NULL

      WHERE
          m.created_at BETWEEN $1 AND $2
          AND m.deleted_at IS NULL
          AND (
              -- RECEIVED: product must exist
              (LOWER(m.to_state) = 'received' AND p.id IS NOT NULL)

              -- STORED: inventory and to_location must exist
              OR (LOWER(m.to_state) = 'stored' AND inv.id IS NOT NULL AND tl.id IS NOT NULL)

              -- RESERVED: inventory must exist
              OR (LOWER(m.to_state) = 'reserved' AND inv.id IS NOT NULL AND tl.id IS NOT NULL)

              -- SHIPPED & WRITTEN_OFF: inventory and from_location must exist
              OR (
                  LOWER(m.to_state) IN ('shipped', 'written-off')
                  AND inv.id IS NOT NULL
                  AND fl.id IS NOT NULL
              )

              -- TRANSFER: inventory and both locations must exist
              OR (
                  LOWER(m.to_state) = 'transferred'
                  AND inv.id IS NOT NULL
                  AND tl.id IS NOT NULL
              )
          )

      GROUP BY LOWER(m.to_state)
    `;

    const statusMovements = (await movementRepo.query(query, [
      startDate,
      endDate,
    ])) as { type: string; frequency: string }[];

    return InventoryStatuses.filter(
      (status) => status.toLowerCase() !== 'external',
    ).map((status: string) => {
      const match = statusMovements.find(
        (m) => m.type === status.toLowerCase(),
      );
      const label = status.charAt(0).toUpperCase() + status.slice(1);

      return {
        type: label,
        count: match ? Number(match.frequency) : 0,
      };
    });
  }

  private async getRecentMovements(
    movementRepo: Repository<InventoryMovement>,
    startDate: Date,
    dateRange: DateRange,
  ): Promise<RecentMovement[]> {
    let { part, interval, format: dateFormat } = RANGE_SQL[dateRange];

    switch (dateRange) {
      case 'yearly':
        interval = '1 month';
        part = 'month';
        dateFormat = 'Mon YYYY';
        break;
      case 'monthly':
        interval = '1 week';
        part = 'week';
        dateFormat = '"Week "WW, Mon';
        break;
      default:
        interval = '1 day';
        part = 'day';
        dateFormat = 'YYYY-MM-DD';
        break;
    }

    const adjustedStartDate = new Date(startDate);
    if (dateRange === 'today') {
      adjustedStartDate.setDate(adjustedStartDate.getDate() - 2);
    }

    const query = `
      WITH timeline AS (
        SELECT generate_series(
          DATE_TRUNC('${part}', $1::timestamp),
          DATE_TRUNC('${part}', NOW()),
          '${interval}'::interval
        ) AS bucket
      )
      SELECT 
        TO_CHAR(t.bucket, '${dateFormat}') AS "dateKey",
        t.bucket AS "sortDate",
        COALESCE(COUNT(m.id) FILTER (WHERE LOWER(m.to_state) = 'received' AND p.id IS NOT NULL), 0) AS received,
        COALESCE(COUNT(m.id) FILTER (WHERE LOWER(m.to_state) = 'stored' AND inv.id IS NOT NULL AND tl.id IS NOT NULL), 0) AS stored,
        COALESCE(COUNT(m.id) FILTER (WHERE LOWER(m.to_state) = 'reserved' AND inv.id IS NOT NULL AND tl.id IS NOT NULL), 0) AS reserved,
        COALESCE(COUNT(m.id) FILTER (WHERE LOWER(m.to_state) = 'written-off' AND inv.id IS NOT NULL AND fl.id IS NOT NULL), 0) AS "writtenOff",
        COALESCE(COUNT(m.id) FILTER (WHERE LOWER(m.to_state) = 'shipped' AND inv.id IS NOT NULL AND fl.id IS NOT NULL), 0) AS shipped,
        COALESCE(COUNT(m.id) FILTER (WHERE LOWER(m.to_state) = 'transferred' AND inv.id IS NOT NULL AND fl.id IS NOT NULL AND tl.id IS NOT NULL), 0) AS transferred
      FROM timeline t

      LEFT JOIN inventory_movements m
        ON DATE_TRUNC('${part}', m.created_at) = t.bucket
        AND m.deleted_at IS NULL

      -- Join inventory (used in stored, reserved, shipped, written-off, transfer)
      LEFT JOIN inventories inv
        ON inv.id = m.inventory_id
        AND inv.deleted_at IS NULL

      -- Join product (used in received)
      LEFT JOIN products p
        ON p.id = m.product_id
        AND p.deleted_at IS NULL

      -- Join from_location (used in shipped, written-off, transfer)
      LEFT JOIN locations fl
        ON fl.id = m.from_location_id

      -- Join to_location (used in stored, reserved, transfer)
      LEFT JOIN locations tl
        ON tl.id = m.to_location_id
        AND tl.deleted_at IS NULL

      GROUP BY t.bucket
      ORDER BY t.bucket ASC
    `;

    const rawMovements = (await movementRepo.query(query, [
      adjustedStartDate,
    ])) as RawMovementRow[];

    return rawMovements.map((row: RawMovementRow) => ({
      date: row.dateKey,
      received: Number(row.received),
      stored: Number(row.stored),
      reserved: Number(row.reserved),
      writtenOff: Number(row.writtenOff),
      shipped: Number(row.shipped),
      transferred: Number(row.transferred),
    }));
  }
}
