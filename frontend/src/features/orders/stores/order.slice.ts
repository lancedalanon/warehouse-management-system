import { createSlice } from '@reduxjs/toolkit';
import type { OrdersState } from './order.types';
import {
  getOrdersThunk,
  getOrderThunk,
  createOrderThunk,
  updateOrderThunk,
} from './order.thunks';

const initialState: OrdersState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    create: 'idle',
    update: 'idle',
  },
  error: {},
  singleOrder: undefined,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrdersState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET ORDERS */
      .addCase(getOrdersThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getOrdersThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getOrdersThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET ORDER (single) */
      .addCase(getOrderThunk.fulfilled, (state, action) => {
        state.singleOrder = action.payload;

        const index = state.items.findIndex(
          (o) => o.id === action.payload.id,
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      /* CREATE */
      .addCase(createOrderThunk.pending, (state) => {
        state.status.create = 'loading';
        state.error.create = undefined;
      })
      .addCase(createOrderThunk.fulfilled, (state, action) => {
        state.status.create = 'success';

        if (state.meta?.page === 1) {
          state.items.unshift(action.payload);
          state.items = state.items.slice(0, state.meta.limit);
        }
      })
      .addCase(createOrderThunk.rejected, (state, action) => {
        state.status.create = 'error';
        state.error.create = action.payload;
      })

      /* UPDATE */
      .addCase(updateOrderThunk.pending, (state) => {
        state.status.update = 'loading';
        state.error.update = undefined;
      })
      .addCase(updateOrderThunk.fulfilled, (state, action) => {
        state.status.update = 'success';

        const index = state.items.findIndex(
          (o) => o.id === action.payload.id,
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }

        if (state.singleOrder?.id === action.payload.id) {
          state.singleOrder = action.payload;
        }
      })
      .addCase(updateOrderThunk.rejected, (state, action) => {
        state.status.update = 'error';
        state.error.update = action.payload;
      });
  },
});

export const { clearOrdersState } = ordersSlice.actions;

export {
  getOrdersThunk,
  getOrderThunk,
  createOrderThunk,
  updateOrderThunk,
};

export default ordersSlice.reducer;