import { injectable } from 'tsyringe';
import { AppDataSource } from '@/data-source';
import { WarehouseRisk } from '@/types/services/dashboard/warehouse-risk.types';
import { NetStock } from '@/types/services/dashboard/net-stock.types';

@injectable()
export class GetWarehouseRiskService {
  constructor() {}

  async handle(netStock: NetStock): Promise<WarehouseRisk> {
    const writtenOff = await AppDataSource.query(
      `
        SELECT COUNT(*) AS count
        FROM inventory_movements m

        -- Join inventory
        LEFT JOIN inventories inv
          ON inv.id = m.inventory_id
          AND inv.deleted_at IS NULL

        -- Join product
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

        WHERE LOWER(m.to_state) = 'written-off'
          AND m.deleted_at IS NULL
          AND (
            -- WRITTEN-OFF: from_state external product must exist
            (LOWER(m.from_state) = 'external' AND p.id IS NOT NULL)

            -- WRITTEN-OFF: from_state not external inventory + from_location must exist
            OR (LOWER(m.from_state) <> 'external' AND inv.id IS NOT NULL AND fl.id IS NOT NULL)
          )
      `,
    );

    return {
      hasWrittenOff: Number(writtenOff[0].count) > 0,
      noOutbound: netStock.outbound === 0,
      inventoryGrowing: netStock.inbound > netStock.outbound,
    };
  }
}
