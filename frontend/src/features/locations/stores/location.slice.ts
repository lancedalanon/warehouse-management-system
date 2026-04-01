import { createSlice } from '@reduxjs/toolkit';
import type { LocationsState } from './location.types';
import {
  getLocationsThunk,
  getLocationThunk,
  createLocationThunk,
  updateLocationThunk,
  deleteLocationThunk,
} from './location.thunks';

const initialState: LocationsState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    create: 'idle',
    update: 'idle',
    delete: 'idle',
  },
  error: {},
  singleLocation: undefined,
};

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearLocationsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET LOCATIONS */
      .addCase(getLocationsThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getLocationsThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getLocationsThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET LOCATION (single) */
      .addCase(getLocationThunk.fulfilled, (state, action) => {
        state.singleLocation = action.payload;
        const index = state.items.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      /* CREATE */
      .addCase(createLocationThunk.pending, (state) => {
        state.status.create = 'loading';
        state.error.create = undefined;
      })
      .addCase(createLocationThunk.fulfilled, (state, action) => {
        state.status.create = 'success';
        if (state.meta?.page === 1) {
          state.items.unshift(action.payload);
          state.items = state.items.slice(0, state.meta.limit);
        }
      })
      .addCase(createLocationThunk.rejected, (state, action) => {
        state.status.create = 'error';
        state.error.create = action.payload;
      })

      /* UPDATE */
      .addCase(updateLocationThunk.pending, (state) => {
        state.status.update = 'loading';
        state.error.update = undefined;
      })
      .addCase(updateLocationThunk.fulfilled, (state, action) => {
        state.status.update = 'success';
        const index = state.items.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateLocationThunk.rejected, (state, action) => {
        state.status.update = 'error';
        state.error.update = action.payload;
      })

      /* DELETE */
      .addCase(deleteLocationThunk.pending, (state) => {
        state.status.delete = 'loading';
        state.error.delete = undefined;
      })
      .addCase(deleteLocationThunk.fulfilled, (state, action) => {
        state.status.delete = 'success';
        state.items = state.items.filter((l) => l.id !== action.payload);
      })
      .addCase(deleteLocationThunk.rejected, (state, action) => {
        state.status.delete = 'error';
        state.error.delete = action.payload;
      });
  },
});

export const { clearLocationsState } = locationsSlice.actions;
export {
  getLocationsThunk,
  getLocationThunk,
  createLocationThunk,
  updateLocationThunk,
  deleteLocationThunk,
};
export default locationsSlice.reducer;
