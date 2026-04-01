import { createSlice } from '@reduxjs/toolkit';
import type { RolesState } from './role.types';
import { getRolesThunk, getRoleThunk } from '@/features/roles/stores/role.thunk';

const initialState: RolesState = {
  items: [],
  meta: null,
  status: { fetch: 'idle' },
  error: {},
  singleRole: undefined,
};

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearRolesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET ROLES */
      .addCase(getRolesThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getRolesThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.meta = action.payload.meta;
        if (action.payload.meta.page === 1) {
          state.items = action.payload.data;
        } else {
          state.items = [...state.items, ...action.payload.data];
        }
      })
      .addCase(getRolesThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET SINGLE ROLE */
      .addCase(getRoleThunk.fulfilled, (state, action) => {
        state.singleRole = action.payload;
        const index = state.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export const { clearRolesState } = rolesSlice.actions;
export { getRolesThunk, getRoleThunk };
export default rolesSlice.reducer;
