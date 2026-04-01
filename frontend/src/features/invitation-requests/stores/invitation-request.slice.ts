import { createSlice } from '@reduxjs/toolkit';
import type { InvitationRequestsState } from './invitation-request.types';
import {
  declineInvitationRequestThunk,
  getInvitationRequestsThunk,
  getInvitationRequestThunk,
} from './invitation-request.thunks';

const initialState: InvitationRequestsState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    decline: 'idle',
  },
  error: {},
  singleInvitationRequest: undefined,
};

const invitationRequestsSlice = createSlice({
  name: 'invitationRequests',
  initialState,
  reducers: {
    clearInvitationRequestsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET INVITATION REQUESTS */
      .addCase(getInvitationRequestsThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getInvitationRequestsThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.meta = action.payload.meta;
        if (action.payload.meta.page === 1) {
          state.items = action.payload.data;
        } else {
          state.items = [...state.items, ...action.payload.data];
        }
      })
      .addCase(getInvitationRequestsThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload;
      })

      /* GET SINGLE INVITATION REQUEST */
      .addCase(getInvitationRequestThunk.fulfilled, (state, action) => {
        state.singleInvitationRequest = action.payload;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      /* DECLINE INVITATION REQUEST */
      .addCase(declineInvitationRequestThunk.pending, (state) => {
        state.status.decline = 'loading';
        state.error.decline = undefined;
      })
      .addCase(declineInvitationRequestThunk.fulfilled, (state, action) => {
        state.status.decline = 'success';
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(declineInvitationRequestThunk.rejected, (state, action) => {
        state.status.decline = 'error';
        state.error.decline = action.payload;
      });
  },
});

export const { clearInvitationRequestsState } = invitationRequestsSlice.actions;
export { getInvitationRequestsThunk, getInvitationRequestThunk };
export default invitationRequestsSlice.reducer;
