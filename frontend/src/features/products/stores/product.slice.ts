import { createSlice } from '@reduxjs/toolkit';
import type { ProductsState } from './product.types';
import {
  getProductsThunk,
  getProductThunk,
  createProductThunk,
  updateProductThunk,
  deleteProductThunk,
  addReceivedThunk,
} from './product.thunks';

const initialState: ProductsState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    create: 'idle',
    update: 'idle',
    delete: 'idle',
  },
  error: {},
  singleProduct: undefined,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET PRODUCTS */
      .addCase(getProductsThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getProductsThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.meta = action.payload.meta;
        if (action.payload.meta.page === 1) {
          state.items = action.payload.data;
        } else {
          state.items = [...state.items, ...action.payload.data];
        }
        state.meta = action.payload.meta;
      })
      .addCase(getProductsThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET PRODUCT (single) */
      .addCase(getProductThunk.fulfilled, (state, action) => {
        state.singleProduct = action.payload;
        // optionally update the item if it exists in items
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      /* CREATE */
      .addCase(createProductThunk.pending, (state) => {
        state.status.create = 'loading';
        state.error.create = undefined;
      })
      .addCase(createProductThunk.fulfilled, (state, action) => {
        state.status.create = 'success';
        // Insert only if on first page (UI handles page param)
        if (state.meta?.page === 1) {
          state.items.unshift(action.payload);
          state.items = state.items.slice(0, state.meta.limit); // keep page size
        }
      })
      .addCase(createProductThunk.rejected, (state, action) => {
        state.status.create = 'error';
        state.error.create = action.payload;
      })

      /* UPDATE */
      .addCase(updateProductThunk.pending, (state) => {
        state.status.update = 'loading';
        state.error.update = undefined;
      })
      .addCase(updateProductThunk.fulfilled, (state, action) => {
        state.status.update = 'success';
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateProductThunk.rejected, (state, action) => {
        state.status.update = 'error';
        state.error.update = action.payload;
      })

      /* DELETE */
      .addCase(deleteProductThunk.pending, (state) => {
        state.status.delete = 'loading';
        state.error.delete = undefined;
      })
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.status.delete = 'success';
        state.items = state.items.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.status.delete = 'error';
        state.error.delete = action.payload;
      })

      /* ADD RECEIVED */
      .addCase(addReceivedThunk.pending, (state) => {
        state.status.update = 'loading';
        state.error.update = undefined;
      })
      .addCase(addReceivedThunk.fulfilled, (state, action) => {
        state.status.update = 'success';
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(addReceivedThunk.rejected, (state, action) => {
        state.status.update = 'error';
        state.error.update = action.payload;
      });
  },
});

export const { clearProductsState } = productsSlice.actions;
export {
  getProductsThunk,
  deleteProductThunk,
  createProductThunk,
  updateProductThunk,
  getProductThunk,
  addReceivedThunk,
};
export default productsSlice.reducer;
