export const Role = {
  SUPERADMIN: 'superadmin',
  WAREHOUSE_MANAGER: 'warehouse-manager',
  INVENTORY_STAFF: 'inventory-staff',
  AUDITOR: 'auditor',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
