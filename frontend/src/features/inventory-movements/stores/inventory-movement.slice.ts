import { createSlice } from '@reduxjs/toolkit';
import type { InventoryMovement } from '@/features/inventory-movements/types/inventory-movement.types';
import { getInventoryMovementsThunk, getInventoryMovementThunk } from './inventory-movement.thunks';

export interface InventoryMovementsState {
  items: InventoryMovement[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
  } | null;
  status: {
    fetch: 'idle' | 'loading' | 'success' | 'error';
    single: 'idle' | 'loading' | 'success' | 'error';
  };
  error: {
    fetch?: string;
    single?: string;
  };
  singleMovement?: InventoryMovement;
}

const initialState: InventoryMovementsState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    single: 'idle',
  },
  error: {},
  singleMovement: undefined,
};

const inventoryMovementsSlice = createSlice({
  name: 'inventoryMovements',
  initialState,
  reducers: {
    clearInventoryMovementsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET INVENTORY MOVEMENTS (LIST) */
      .addCase(getInventoryMovementsThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getInventoryMovementsThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getInventoryMovementsThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET INVENTORY MOVEMENT (SINGLE) */
      .addCase(getInventoryMovementThunk.pending, (state) => {
        state.status.single = 'loading';
        state.error.single = undefined;
      })
      .addCase(getInventoryMovementThunk.fulfilled, (state, action) => {
        state.status.single = 'success';
        state.singleMovement = action.payload;

        const index = state.items.findIndex((m) => m.id === action.payload.id);

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(getInventoryMovementThunk.rejected, (state, action) => {
        state.status.single = 'error';
        state.error.single = action.payload;
      });
  },
});

export const { clearInventoryMovementsState } = inventoryMovementsSlice.actions;

export { getInventoryMovementsThunk, getInventoryMovementThunk };

export default inventoryMovementsSlice.reducer;
