export interface InventoryAging {
  days_0_7: number;
  days_8_30: number;
  days_31_90: number;
  days_90_plus: number;
}

export interface InventoryAgingWithPercentages extends InventoryAging {
  total: number;
  pct_0_7: number;
  pct_8_30: number;
  pct_31_90: number;
  pct_90_plus: number;
}
