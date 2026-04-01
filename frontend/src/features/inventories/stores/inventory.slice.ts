import { createSlice } from '@reduxjs/toolkit';
import type { InventoriesState } from './inventory.types';
import {
  getInventoriesThunk,
  getInventoryThunk,
  createInventoryThunk,
  updateInventoryThunk,
  deleteInventoryThunk,
} from './inventory.thunks';

const initialState: InventoriesState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    create: 'idle',
    update: 'idle',
    delete: 'idle',
  },
  error: {},
  singleInventory: undefined,
};

const inventoriesSlice = createSlice({
  name: 'inventories',
  initialState,
  reducers: {
    clearInventoriesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET INVENTORIES */
      .addCase(getInventoriesThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getInventoriesThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getInventoriesThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET INVENTORY (single) */
      .addCase(getInventoryThunk.fulfilled, (state, action) => {
        state.singleInventory = action.payload;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      /* CREATE */
      .addCase(createInventoryThunk.pending, (state) => {
        state.status.create = 'loading';
        state.error.create = undefined;
      })
      .addCase(createInventoryThunk.fulfilled, (state, action) => {
        state.status.create = 'success';
        if (state.meta?.page === 1) {
          state.items.unshift(action.payload);
          state.items = state.items.slice(0, state.meta.limit);
        }
      })
      .addCase(createInventoryThunk.rejected, (state, action) => {
        state.status.create = 'error';
        state.error.create = action.payload;
      })

      /* UPDATE */
      .addCase(updateInventoryThunk.pending, (state) => {
        state.status.update = 'loading';
        state.error.update = undefined;
      })
      .addCase(updateInventoryThunk.fulfilled, (state, action) => {
        state.status.update = 'success';
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateInventoryThunk.rejected, (state, action) => {
        state.status.update = 'error';
        state.error.update = action.payload;
      })

      /* DELETE */
      .addCase(deleteInventoryThunk.pending, (state) => {
        state.status.delete = 'loading';
        state.error.delete = undefined;
      })
      .addCase(deleteInventoryThunk.fulfilled, (state, action) => {
        state.status.delete = 'success';
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteInventoryThunk.rejected, (state, action) => {
        state.status.delete = 'error';
        state.error.delete = action.payload;
      });
  },
});

export const { clearInventoriesState } = inventoriesSlice.actions;
export {
  getInventoriesThunk,
  getInventoryThunk,
  createInventoryThunk,
  updateInventoryThunk,
  deleteInventoryThunk,
};
export default inventoriesSlice.reducer;
