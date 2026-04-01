import { createSlice } from '@reduxjs/toolkit';
import { exportDashboardThunk, getDashboardThunk } from './dashboard.thunks';
import type { DashboardState } from './dashboard.types';

const initialState: DashboardState = {
  data: null,
  status: 'idle',
  error: undefined,
  exportUrl: undefined,
  exportStatus: 'idle',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardThunk.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(getDashboardThunk.fulfilled, (state, action) => {
        state.status = 'success';
        state.data = action.payload;
      })
      .addCase(getDashboardThunk.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
      })
      .addCase(exportDashboardThunk.pending, (state) => {
        state.exportStatus = 'loading';
        state.exportUrl = undefined;
        state.error = undefined;
      })
      .addCase(exportDashboardThunk.fulfilled, (state, action) => {
        state.exportStatus = 'success';
        state.exportUrl = action.payload.url;
      })
      .addCase(exportDashboardThunk.rejected, (state, action) => {
        state.exportStatus = 'error';
        state.error = action.payload;
      });
  },
});

export const { clearDashboardState } = dashboardSlice.actions;
export { getDashboardThunk };
export default dashboardSlice.reducer;
